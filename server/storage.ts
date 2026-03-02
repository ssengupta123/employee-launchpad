import {
  type Category, type InsertCategory,
  type Tile, type InsertTile, type TileWithCategory,
  type UserTile,
  type AdminUser,
  categories, tiles, userTiles, adminUsers,
} from "@shared/schema";
import { db as maybeDb } from "./db";
import { eq, and, asc } from "drizzle-orm";

export interface IStorage {
  initializeSchema?(): Promise<void>;

  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  getTiles(): Promise<TileWithCategory[]>;
  getTileById(id: string): Promise<Tile | undefined>;
  createTile(data: InsertTile): Promise<Tile>;
  updateTile(id: string, data: Partial<InsertTile>): Promise<Tile | undefined>;
  deleteTile(id: string): Promise<void>;

  getUserTiles(userId: string): Promise<UserTile[]>;
  setUserTile(userId: string, tileId: string, pinned: boolean): Promise<UserTile>;
  removeUserTile(userId: string, tileId: string): Promise<void>;

  isAdmin(userId: string): Promise<boolean>;
  hasAnyAdmin(): Promise<boolean>;
  makeAdmin(userId: string): Promise<AdminUser>;

  seedData(): Promise<void>;
}

function getDb() {
  if (!maybeDb) {
    throw new Error("PostgreSQL database not initialized");
  }
  return maybeDb;
}

export class DatabaseStorage implements IStorage {
  private get db() {
    return getDb();
  }

  async getCategories(): Promise<Category[]> {
    return this.db.select().from(categories).orderBy(asc(categories.sortOrder));
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [cat] = await this.db.select().from(categories).where(eq(categories.id, id));
    return cat;
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [cat] = await this.db.insert(categories).values(data).returning();
    return cat;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [cat] = await this.db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return cat;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }

  async getTiles(): Promise<TileWithCategory[]> {
    const result = await this.db
      .select()
      .from(tiles)
      .leftJoin(categories, eq(tiles.categoryId, categories.id))
      .orderBy(asc(tiles.sortOrder));

    return result.map((r) => ({
      ...r.tiles,
      category: r.categories || null,
    }));
  }

  async getTileById(id: string): Promise<Tile | undefined> {
    const [tile] = await this.db.select().from(tiles).where(eq(tiles.id, id));
    return tile;
  }

  async createTile(data: InsertTile): Promise<Tile> {
    const [tile] = await this.db.insert(tiles).values(data).returning();
    return tile;
  }

  async updateTile(id: string, data: Partial<InsertTile>): Promise<Tile | undefined> {
    const [tile] = await this.db
      .update(tiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tiles.id, id))
      .returning();
    return tile;
  }

  async deleteTile(id: string): Promise<void> {
    await this.db.delete(tiles).where(eq(tiles.id, id));
  }

  async getUserTiles(userId: string): Promise<UserTile[]> {
    return this.db.select().from(userTiles).where(eq(userTiles.userId, userId)).orderBy(asc(userTiles.sortOrder));
  }

  async setUserTile(userId: string, tileId: string, pinned: boolean): Promise<UserTile> {
    const existing = await this.db
      .select()
      .from(userTiles)
      .where(and(eq(userTiles.userId, userId), eq(userTiles.tileId, tileId)));

    if (existing.length > 0) {
      const [ut] = await this.db
        .update(userTiles)
        .set({ pinned })
        .where(and(eq(userTiles.userId, userId), eq(userTiles.tileId, tileId)))
        .returning();
      return ut;
    }

    const [ut] = await this.db.insert(userTiles).values({ userId, tileId, pinned }).returning();
    return ut;
  }

  async removeUserTile(userId: string, tileId: string): Promise<void> {
    await this.db.delete(userTiles).where(and(eq(userTiles.userId, userId), eq(userTiles.tileId, tileId)));
  }

  async isAdmin(userId: string): Promise<boolean> {
    const [admin] = await this.db.select().from(adminUsers).where(eq(adminUsers.userId, userId));
    return !!admin;
  }

  async hasAnyAdmin(): Promise<boolean> {
    const admins = await this.db.select().from(adminUsers).limit(1);
    return admins.length > 0;
  }

  async makeAdmin(userId: string): Promise<AdminUser> {
    const existing = await this.db.select().from(adminUsers).where(eq(adminUsers.userId, userId));
    if (existing.length > 0) return existing[0];
    const [admin] = await this.db.insert(adminUsers).values({ userId }).returning();
    return admin;
  }

  async seedData(): Promise<void> {
    const existingCategories = await this.db.select().from(categories);
    if (existingCategories.length > 0) return;

    const [finance] = await this.db.insert(categories).values({
      name: "Finance",
      description: "Financial management tools",
      icon: "Calculator",
      color: "#22C55E",
      sortOrder: 0,
    }).returning();

    await this.db.insert(tiles).values([
      {
        title: "Finance Hub",
        description: "Central finance portal for reporting, budgets, and financial operations",
        url: "https://financehub-c2bna3f0hphvgqbj.australiaeast-01.azurewebsites.net/",
        icon: "/financehub-logo.ico",
        color: "#22C55E",
        categoryId: finance.id,
        isGlobal: true,
        sortOrder: 0,
      },
    ]);
  }
}

import { AzureSqlStorage } from "./azureSqlStorage";

function createStorage(): IStorage {
  if (process.env.AZURE_SQL_CONNECTION_STRING || process.env.AZURE_SQL_SERVER) {
    console.log("Using Azure SQL Database");
    return new AzureSqlStorage();
  }
  console.log("Using PostgreSQL Database");
  return new DatabaseStorage();
}

export const storage = createStorage();
