import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertTileSchema, insertCategorySchema } from "@shared/schema";

function isAzure(): boolean {
  return !!(process.env.AZURE_SQL_CONNECTION_STRING || process.env.AZURE_SQL_SERVER);
}

const azureBypassAuth: RequestHandler = (req, res, next) => {
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  let isAuthenticated: RequestHandler;

  if (isAzure()) {
    console.log("Azure environment detected — skipping Replit Auth");
    app.set("trust proxy", 1);
    app.use(session({
      secret: process.env.SESSION_SECRET || "azure-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
    }));
    isAuthenticated = azureBypassAuth;
  } else {
    const auth = await import("./replit_integrations/auth/index.js");
    await auth.setupAuth(app);
    auth.registerAuthRoutes(app);
    isAuthenticated = auth.isAuthenticated;
  }

  app.get("/api/tiles", isAuthenticated, async (req: any, res) => {
    try {
      const allTiles = await storage.getTiles();
      const globalTiles = allTiles.filter((t) => t.isGlobal);
      res.json(globalTiles);
    } catch (error) {
      console.error("Error fetching tiles:", error);
      res.status(500).json({ message: "Failed to fetch tiles" });
    }
  });

  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/user-tiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ut = await storage.getUserTiles(userId);
      res.json(ut);
    } catch (error) {
      console.error("Error fetching user tiles:", error);
      res.status(500).json({ message: "Failed to fetch user tiles" });
    }
  });

  app.post("/api/user-tiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tileId, pinned } = req.body;
      if (!tileId) return res.status(400).json({ message: "tileId is required" });
      const ut = await storage.setUserTile(userId, tileId, pinned ?? false);
      res.json(ut);
    } catch (error) {
      console.error("Error setting user tile:", error);
      res.status(500).json({ message: "Failed to set user tile" });
    }
  });

  app.delete("/api/user-tiles/:tileId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeUserTile(userId, req.params.tileId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing user tile:", error);
      res.status(500).json({ message: "Failed to remove user tile" });
    }
  });

  app.get("/api/admin/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let isAdmin = await storage.isAdmin(userId);
      if (!isAdmin) {
        const hasAnyAdmin = await storage.hasAnyAdmin();
        if (!hasAnyAdmin) {
          await storage.makeAdmin(userId);
          isAdmin = true;
          console.log(`First user ${userId} automatically made admin`);
        }
      }
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await storage.isAdmin(userId);
      if (!isAdmin) return res.status(403).json({ message: "Forbidden" });
      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin" });
    }
  };

  app.get("/api/admin/tiles", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const allTiles = await storage.getTiles();
      res.json(allTiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tiles" });
    }
  });

  app.post("/api/admin/tiles", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const parsed = insertTileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid tile data", errors: parsed.error.flatten() });
      const tile = await storage.createTile(parsed.data);
      res.json(tile);
    } catch (error) {
      console.error("Error creating tile:", error);
      res.status(500).json({ message: "Failed to create tile" });
    }
  });

  app.patch("/api/admin/tiles/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const parsed = insertTileSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid tile data", errors: parsed.error.flatten() });
      const tile = await storage.updateTile(req.params.id, parsed.data);
      if (!tile) return res.status(404).json({ message: "Tile not found" });
      res.json(tile);
    } catch (error) {
      console.error("Error updating tile:", error);
      res.status(500).json({ message: "Failed to update tile" });
    }
  });

  app.delete("/api/admin/tiles/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      await storage.deleteTile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tile:", error);
      res.status(500).json({ message: "Failed to delete tile" });
    }
  });

  app.post("/api/admin/categories", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid category data", errors: parsed.error.flatten() });
      const cat = await storage.createCategory(parsed.data);
      res.json(cat);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/admin/categories/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCategorySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid category data", errors: parsed.error.flatten() });
      const cat = await storage.updateCategory(req.params.id, parsed.data);
      if (!cat) return res.status(404).json({ message: "Category not found" });
      res.json(cat);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.post("/api/admin/make-first-admin", isAuthenticated, async (req: any, res) => {
    try {
      const hasAnyAdmin = await storage.hasAnyAdmin();
      if (hasAnyAdmin) {
        return res.status(403).json({ message: "Admin already exists" });
      }
      const userId = req.user.claims.sub;
      const admin = await storage.makeAdmin(userId);
      res.json(admin);
    } catch (error) {
      console.error("Error making admin:", error);
      res.status(500).json({ message: "Failed to make admin" });
    }
  });

  try {
    if (storage.initializeSchema) {
      await storage.initializeSchema();
      console.log("Azure SQL schema initialized");
    }
    await storage.seedData();
    console.log("Seed data loaded");
  } catch (error) {
    console.error("Error seeding data:", error);
  }

  return httpServer;
}
