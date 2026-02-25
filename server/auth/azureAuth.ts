import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { OIDCStrategy } from "passport-azure-ad";

const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || "";
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || "";
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET || "";
const AZURE_AD_REDIRECT_URI = process.env.AZURE_AD_REDIRECT_URI || "";

interface AzureUser {
  oid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

export function setupAzureAuth(app: Express) {
  app.set("trust proxy", 1);

  app.use(session({
    secret: process.env.SESSION_SECRET || "azure-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
      passReqToCallback: false,
    },
    (profile: any, done: any) => {
      const user: AzureUser = {
        oid: profile.oid,
        email: profile._json?.email || profile.upn || profile._json?.preferred_username || "",
        displayName: profile.displayName || "",
        firstName: profile.name?.givenName || profile.displayName?.split(" ")[0] || "",
        lastName: profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ") || "",
      };
      return done(null, user);
    }
  );

  passport.use("azuread-openidconnect", strategy);

  passport.serializeUser((user: any, done) => {
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

  app.post("/api/callback",
    passport.authenticate("azuread-openidconnect", {
      failureRedirect: "/",
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

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
