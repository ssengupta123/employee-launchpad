import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { OIDCStrategy } from "passport-azure-ad";
import { AzureSqlSessionStore } from "./azureSqlSessionStore.js";

const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || "";
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || "";
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET || "";
const AZURE_AD_REDIRECT_URI = process.env.AZURE_AD_REDIRECT_URI || "";

function getConnectionString(): string {
  const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;

  const server = process.env.AZURE_SQL_SERVER || "";
  const database = process.env.AZURE_SQL_DATABASE || "";
  const user = process.env.AZURE_SQL_USER || "";
  const password = process.env.AZURE_SQL_PASSWORD || "";
  const port = process.env.AZURE_SQL_PORT || "1433";
  return `Server=${server},${port};Database=${database};User Id=${user};Password=${password};Encrypt=true;TrustServerCertificate=false;`;
}

interface AzureUser {
  oid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

function handleSessionSave(req: any, res: any) {
  req.session.save((saveErr: any) => {
    if (saveErr) {
      console.error("[AzureAuth] Session save error:", saveErr);
    } else {
      console.log("[AzureAuth] Session saved successfully");
    }
    res.redirect("/");
  });
}

export async function setupAzureAuth(app: Express) {
  app.set("trust proxy", 1);

  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

  const store = new AzureSqlSessionStore(getConnectionString());

  app.use(session({
    store,
    secret: process.env.SESSION_SECRET || "azure-session-secret",
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: cookieDomain,
      sameSite: cookieDomain ? "none" as const : "lax" as const,
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  const strategy = new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: AZURE_AD_CLIENT_ID,
      clientSecret: AZURE_AD_CLIENT_SECRET,
      responseType: "code",
      responseMode: "form_post",
      redirectUrl: AZURE_AD_REDIRECT_URI,
      allowHttpForRedirectUrl: false,
      scope: ["openid", "profile", "email"],
      passReqToCallback: true,
      useCookieInsteadOfSession: true,
      cookieEncryptionKeys: [
        { key: (process.env.SESSION_SECRET || "azure-session-secret-key-32ch").padEnd(32, "0").substring(0, 32), iv: "0123456789ab" }
      ],
    },
    (req: any, profile: any, done: any) => {
      const user: AzureUser = {
        oid: profile.oid,
        email: profile._json?.email || profile.upn || profile._json?.preferred_username || "",
        displayName: profile.displayName || "",
        firstName: profile.name?.givenName || profile.displayName?.split(" ")[0] || "",
        lastName: profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ") || "",
      };
      console.log("[AzureAuth] User authenticated:", user.email, "OID:", user.oid);
      return done(null, user);
    }
  );

  passport.use("azuread-openidconnect", strategy);

  passport.serializeUser((user: any, done) => {
    console.log("[AzureAuth] Serializing user:", user.oid);
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  app.get("/api/login", (req, res, next) => {
    passport.authenticate("azuread-openidconnect", {
      prompt: "select_account",
    })(req, res, next);
  });

  app.post("/api/callback", (req, res, next) => {
    passport.authenticate("azuread-openidconnect", (err: any, user: any, info: any) => {
      if (err) {
        console.error("[AzureAuth] Callback error:", err);
        return res.redirect("/?error=auth_error");
      }
      if (!user) {
        console.error("[AzureAuth] Callback failed - no user. Info:", JSON.stringify(info));
        return res.redirect("/?error=auth_failed");
      }
      req.logIn(user, (loginErr: any) => {
        if (loginErr) {
          console.error("[AzureAuth] Login error:", loginErr);
          return res.redirect("/?error=login_error");
        }
        console.log("[AzureAuth] Login successful, session ID:", req.sessionID);
        handleSessionSave(req, res);
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const postLogoutRedirect = encodeURIComponent(
        `${req.protocol}://${req.get("host")}/`
      );
      res.redirect(
        `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${postLogoutRedirect}`
      );
    });
  });
}

export const azureIsAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export function registerAzureAuthRoutes(app: Express) {
  app.get("/api/auth/user", azureIsAuthenticated, (req: any, res) => {
    const user = req.user as AzureUser;
    res.json({
      id: user.oid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: "",
    });
  });
}
