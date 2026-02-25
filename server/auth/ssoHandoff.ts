import jwt from "jsonwebtoken";
import type { Express, RequestHandler } from "express";

const SSO_HANDOFF_SECRET = process.env.SSO_HANDOFF_SECRET || "";

interface HandoffPayload {
  oid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

export function registerSsoHandoffRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.post("/api/sso-token", isAuthenticated, (req: any, res) => {
    if (!SSO_HANDOFF_SECRET) {
      return res.status(500).json({ message: "SSO handoff not configured" });
    }

    const { targetUrl } = req.body;
    if (!targetUrl) {
      return res.status(400).json({ message: "targetUrl is required" });
    }

    const user = req.user;
    if (!user?.oid) {
      return res.status(401).json({ message: "User not authenticated with Entra ID" });
    }

    const payload: HandoffPayload = {
      oid: user.oid,
      email: user.email || "",
      displayName: user.displayName || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    };

    const token = jwt.sign(payload, SSO_HANDOFF_SECRET, {
      expiresIn: "5m",
      issuer: "launchpad",
      audience: new URL(targetUrl).origin,
    });

    res.json({ token });
  });
}

export function validateSsoHandoffToken(token: string, expectedAudience: string): HandoffPayload | null {
  if (!SSO_HANDOFF_SECRET) return null;

  try {
    const payload = jwt.verify(token, SSO_HANDOFF_SECRET, {
      issuer: "launchpad",
      audience: expectedAudience,
    }) as HandoffPayload;

    return payload;
  } catch {
    return null;
  }
}
