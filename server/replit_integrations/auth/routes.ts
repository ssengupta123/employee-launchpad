import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

function isAzure(): boolean {
  return !!(process.env.AZURE_SQL_CONNECTION_STRING || process.env.AZURE_SQL_SERVER);
}

export function registerAuthRoutes(app: Express): void {
  if (isAzure()) {
    app.get("/api/auth/user", (req, res) => {
      res.json({ id: "azure-user", email: "", firstName: "User", lastName: "", profileImageUrl: "" });
    });
    return;
  }

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
