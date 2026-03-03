import { getUncachableGitHubClient } from "./server/github.js";
import fs from "node:fs";
import path from "node:path";

const owner = "ssengupta123";
const repo = "employee-launchpad";
const branch = "main";

const IGNORE = new Set([
  ".git", "node_modules", ".cache", ".config", ".local", ".upm",
  "dist", ".replit", "replit.nix", ".breakpoints", "generated-icon.png",
  "uploads", ".DS_Store", "tsconfig.tsbuildinfo"
]);

function walkDir(dir: string, base: string = ""): { path: string; fullPath: string }[] {
  const results: { path: string; fullPath: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, rel));
    } else {
      results.push({ path: rel, fullPath: full });
    }
  }
  return results;
}

async function main() {
  const octokit = await getUncachableGitHubClient();
  
  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
  const latestCommitSha = ref.object.sha;
  console.log("Latest commit on main:", latestCommitSha);
  
  const { data: latestCommit } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
  const baseTreeSha = latestCommit.tree.sha;
  
  const files = walkDir(process.cwd());
  console.log(`Found ${files.length} files to sync`);
  
  const treeItems: any[] = [];
  
  for (const file of files) {
    const isBinary = /\.(png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(file.path);
    
    if (isBinary) {
      const content = fs.readFileSync(file.fullPath);
      const { data: blob } = await octokit.git.createBlob({
        owner, repo,
        content: content.toString("base64"),
        encoding: "base64",
      });
      treeItems.push({ path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha });
    } else {
      const content = fs.readFileSync(file.fullPath, "utf8");
      const { data: blob } = await octokit.git.createBlob({
        owner, repo,
        content,
        encoding: "utf-8",
      });
      treeItems.push({ path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha });
    }
  }
  
  console.log(`Created ${treeItems.length} blobs`);
  
  const { data: newTree } = await octokit.git.createTree({
    owner, repo,
    tree: treeItems,
  });
  console.log("New tree:", newTree.sha);
  
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo,
    message: "Sync: Admin image upload feature, security fixes, and latest changes from Replit",
    tree: newTree.sha,
    parents: [latestCommitSha],
  });
  console.log("New commit:", newCommit.sha);
  
  await octokit.git.updateRef({
    owner, repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });
  console.log("Successfully pushed to GitHub main branch!");
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
