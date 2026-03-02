import sql from "mssql";
import type {
  Category, InsertCategory,
  Tile, InsertTile, TileWithCategory,
  UserTile,
  AdminUser,
} from "@shared/schema";
import type { IStorage } from "./storage";

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

let pool: sql.ConnectionPool | null = null;

async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(getConnectionString());
  }
  return pool;
}

export class AzureSqlStorage implements IStorage {
  async initializeSchema(): Promise<void> {
    const db = await getPool();
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'categories')
      CREATE TABLE categories (
        id NVARCHAR(255) PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        icon NVARCHAR(255) NOT NULL DEFAULT 'Folder',
        color NVARCHAR(50) NOT NULL DEFAULT '#3B82F6',
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE()
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tiles')
      CREATE TABLE tiles (
        id NVARCHAR(255) PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        url NVARCHAR(2048) NOT NULL,
        icon NVARCHAR(255) NOT NULL DEFAULT 'Globe',
        color NVARCHAR(50) NOT NULL DEFAULT '#3B82F6',
        category_id NVARCHAR(255) NULL REFERENCES categories(id) ON DELETE SET NULL,
        is_global BIT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        open_in_new_tab BIT NOT NULL DEFAULT 1,
        image_url NVARCHAR(2048) NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_tiles')
      CREATE TABLE user_tiles (
        id NVARCHAR(255) PRIMARY KEY DEFAULT NEWID(),
        user_id NVARCHAR(255) NOT NULL,
        tile_id NVARCHAR(255) NOT NULL REFERENCES tiles(id) ON DELETE CASCADE,
        pinned BIT NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'admin_users')
      CREATE TABLE admin_users (
        id NVARCHAR(255) PRIMARY KEY DEFAULT NEWID(),
        user_id NVARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME2 DEFAULT GETUTCDATE()
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      CREATE TABLE users (
        id NVARCHAR(255) PRIMARY KEY,
        email NVARCHAR(255) NULL,
        first_name NVARCHAR(255) NULL,
        last_name NVARCHAR(255) NULL,
        profile_image_url NVARCHAR(2048) NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
      );

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sessions')
      CREATE TABLE sessions (
        sid NVARCHAR(255) PRIMARY KEY,
        sess NVARCHAR(MAX) NOT NULL,
        expire DATETIME2 NOT NULL
      );
    `);

    if (!(await this.hasIndex("idx_user_tiles_user"))) {
      await db.request().query(`CREATE INDEX idx_user_tiles_user ON user_tiles(user_id)`);
    }
    if (!(await this.hasIndex("idx_user_tiles_tile"))) {
      await db.request().query(`CREATE INDEX idx_user_tiles_tile ON user_tiles(tile_id)`);
    }
  }

  private async hasIndex(name: string): Promise<boolean> {
    const db = await getPool();
    const result = await db.request()
      .input("name", sql.NVarChar, name)
      .query(`SELECT 1 FROM sys.indexes WHERE name = @name`);
    return result.recordset.length > 0;
  }

  private mapCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    };
  }

  private mapTile(row: any): Tile {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      icon: row.icon,
      color: row.color,
      categoryId: row.category_id,
      isGlobal: !!row.is_global,
      sortOrder: row.sort_order,
      openInNewTab: !!row.open_in_new_tab,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapUserTile(row: any): UserTile {
    return {
      id: row.id,
      userId: row.user_id,
      tileId: row.tile_id,
      pinned: !!row.pinned,
      sortOrder: row.sort_order,
    };
  }

  async getCategories(): Promise<Category[]> {
    const db = await getPool();
    const result = await db.request().query(`SELECT * FROM categories ORDER BY sort_order ASC`);
    return result.recordset.map(this.mapCategory);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const db = await getPool();
    const result = await db.request()
      .input("id", sql.NVarChar, id)
      .query(`SELECT * FROM categories WHERE id = @id`);
    return result.recordset.length > 0 ? this.mapCategory(result.recordset[0]) : undefined;
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const db = await getPool();
    const id = crypto.randomUUID();
    await db.request()
      .input("id", sql.NVarChar, id)
      .input("name", sql.NVarChar, data.name)
      .input("description", sql.NVarChar, data.description || null)
      .input("icon", sql.NVarChar, data.icon || "Folder")
      .input("color", sql.NVarChar, data.color || "#3B82F6")
      .input("sortOrder", sql.Int, data.sortOrder || 0)
      .query(`INSERT INTO categories (id, name, description, icon, color, sort_order) VALUES (@id, @name, @description, @icon, @color, @sortOrder)`);
    return (await this.getCategoryById(id))!;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const db = await getPool();
    const sets: string[] = [];
    const request = db.request().input("id", sql.NVarChar, id);

    if (data.name !== undefined) { sets.push("name = @name"); request.input("name", sql.NVarChar, data.name); }
    if (data.description !== undefined) { sets.push("description = @description"); request.input("description", sql.NVarChar, data.description); }
    if (data.icon !== undefined) { sets.push("icon = @icon"); request.input("icon", sql.NVarChar, data.icon); }
    if (data.color !== undefined) { sets.push("color = @color"); request.input("color", sql.NVarChar, data.color); }
    if (data.sortOrder !== undefined) { sets.push("sort_order = @sortOrder"); request.input("sortOrder", sql.Int, data.sortOrder); }

    if (sets.length === 0) return this.getCategoryById(id);
    await request.query(`UPDATE categories SET ${sets.join(", ")} WHERE id = @id`);
    return this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await getPool();
    await db.request().input("id", sql.NVarChar, id).query(`DELETE FROM categories WHERE id = @id`);
  }

  async getTiles(): Promise<TileWithCategory[]> {
    const db = await getPool();
    const result = await db.request().query(`
      SELECT t.*, c.name AS cat_name, c.description AS cat_description, c.icon AS cat_icon, c.color AS cat_color, c.sort_order AS cat_sort_order, c.created_at AS cat_created_at
      FROM tiles t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.sort_order ASC
    `);
    return result.recordset.map((row: any) => ({
      ...this.mapTile(row),
      category: row.cat_name ? {
        id: row.category_id,
        name: row.cat_name,
        description: row.cat_description,
        icon: row.cat_icon,
        color: row.cat_color,
        sortOrder: row.cat_sort_order,
        createdAt: row.cat_created_at,
      } : null,
    }));
  }

  async getTileById(id: string): Promise<Tile | undefined> {
    const db = await getPool();
    const result = await db.request()
      .input("id", sql.NVarChar, id)
      .query(`SELECT * FROM tiles WHERE id = @id`);
    return result.recordset.length > 0 ? this.mapTile(result.recordset[0]) : undefined;
  }

  async createTile(data: InsertTile): Promise<Tile> {
    const db = await getPool();
    const id = crypto.randomUUID();
    await db.request()
      .input("id", sql.NVarChar, id)
      .input("title", sql.NVarChar, data.title)
      .input("description", sql.NVarChar, data.description || null)
      .input("url", sql.NVarChar, data.url)
      .input("icon", sql.NVarChar, data.icon || "Globe")
      .input("color", sql.NVarChar, data.color || "#3B82F6")
      .input("categoryId", sql.NVarChar, data.categoryId || null)
      .input("isGlobal", sql.Bit, data.isGlobal === false ? 0 : 1)
      .input("sortOrder", sql.Int, data.sortOrder || 0)
      .input("openInNewTab", sql.Bit, data.openInNewTab === false ? 0 : 1)
      .input("imageUrl", sql.NVarChar, data.imageUrl || null)
      .query(`INSERT INTO tiles (id, title, description, url, icon, color, category_id, is_global, sort_order, open_in_new_tab, image_url) VALUES (@id, @title, @description, @url, @icon, @color, @categoryId, @isGlobal, @sortOrder, @openInNewTab, @imageUrl)`);
    return (await this.getTileById(id))!;
  }

  async updateTile(id: string, data: Partial<InsertTile>): Promise<Tile | undefined> {
    const db = await getPool();
    const sets: string[] = ["updated_at = GETUTCDATE()"];
    const request = db.request().input("id", sql.NVarChar, id);

    if (data.title !== undefined) { sets.push("title = @title"); request.input("title", sql.NVarChar, data.title); }
    if (data.description !== undefined) { sets.push("description = @description"); request.input("description", sql.NVarChar, data.description); }
    if (data.url !== undefined) { sets.push("url = @url"); request.input("url", sql.NVarChar, data.url); }
    if (data.icon !== undefined) { sets.push("icon = @icon"); request.input("icon", sql.NVarChar, data.icon); }
    if (data.color !== undefined) { sets.push("color = @color"); request.input("color", sql.NVarChar, data.color); }
    if (data.categoryId !== undefined) { sets.push("category_id = @categoryId"); request.input("categoryId", sql.NVarChar, data.categoryId); }
    if (data.isGlobal !== undefined) { sets.push("is_global = @isGlobal"); request.input("isGlobal", sql.Bit, data.isGlobal ? 1 : 0); }
    if (data.sortOrder !== undefined) { sets.push("sort_order = @sortOrder"); request.input("sortOrder", sql.Int, data.sortOrder); }
    if (data.openInNewTab !== undefined) { sets.push("open_in_new_tab = @openInNewTab"); request.input("openInNewTab", sql.Bit, data.openInNewTab ? 1 : 0); }
    if (data.imageUrl !== undefined) { sets.push("image_url = @imageUrl"); request.input("imageUrl", sql.NVarChar, data.imageUrl); }

    await request.query(`UPDATE tiles SET ${sets.join(", ")} WHERE id = @id`);
    return this.getTileById(id);
  }

  async deleteTile(id: string): Promise<void> {
    const db = await getPool();
    await db.request().input("id", sql.NVarChar, id).query(`DELETE FROM tiles WHERE id = @id`);
  }

  async getUserTiles(userId: string): Promise<UserTile[]> {
    const db = await getPool();
    const result = await db.request()
      .input("userId", sql.NVarChar, userId)
      .query(`SELECT * FROM user_tiles WHERE user_id = @userId ORDER BY sort_order ASC`);
    return result.recordset.map(this.mapUserTile);
  }

  async setUserTile(userId: string, tileId: string, pinned: boolean): Promise<UserTile> {
    const db = await getPool();
    const existing = await db.request()
      .input("userId", sql.NVarChar, userId)
      .input("tileId", sql.NVarChar, tileId)
      .query(`SELECT * FROM user_tiles WHERE user_id = @userId AND tile_id = @tileId`);

    if (existing.recordset.length > 0) {
      await db.request()
        .input("userId", sql.NVarChar, userId)
        .input("tileId", sql.NVarChar, tileId)
        .input("pinned", sql.Bit, pinned ? 1 : 0)
        .query(`UPDATE user_tiles SET pinned = @pinned WHERE user_id = @userId AND tile_id = @tileId`);
      return this.mapUserTile({ ...existing.recordset[0], pinned });
    }

    const id = crypto.randomUUID();
    await db.request()
      .input("id", sql.NVarChar, id)
      .input("userId", sql.NVarChar, userId)
      .input("tileId", sql.NVarChar, tileId)
      .input("pinned", sql.Bit, pinned ? 1 : 0)
      .query(`INSERT INTO user_tiles (id, user_id, tile_id, pinned) VALUES (@id, @userId, @tileId, @pinned)`);

    const result = await db.request()
      .input("id", sql.NVarChar, id)
      .query(`SELECT * FROM user_tiles WHERE id = @id`);
    return this.mapUserTile(result.recordset[0]);
  }

  async removeUserTile(userId: string, tileId: string): Promise<void> {
    const db = await getPool();
    await db.request()
      .input("userId", sql.NVarChar, userId)
      .input("tileId", sql.NVarChar, tileId)
      .query(`DELETE FROM user_tiles WHERE user_id = @userId AND tile_id = @tileId`);
  }

  async isAdmin(userId: string): Promise<boolean> {
    const db = await getPool();
    const result = await db.request()
      .input("userId", sql.NVarChar, userId)
      .query(`SELECT 1 FROM admin_users WHERE user_id = @userId`);
    return result.recordset.length > 0;
  }

  async hasAnyAdmin(): Promise<boolean> {
    const db = await getPool();
    const result = await db.request().query(`SELECT TOP 1 1 FROM admin_users`);
    return result.recordset.length > 0;
  }

  async makeAdmin(userId: string): Promise<AdminUser> {
    const db = await getPool();
    const existing = await db.request()
      .input("userId", sql.NVarChar, userId)
      .query(`SELECT * FROM admin_users WHERE user_id = @userId`);

    if (existing.recordset.length > 0) {
      return { id: existing.recordset[0].id, userId: existing.recordset[0].user_id, createdAt: existing.recordset[0].created_at };
    }

    const id = crypto.randomUUID();
    await db.request()
      .input("id", sql.NVarChar, id)
      .input("userId", sql.NVarChar, userId)
      .query(`INSERT INTO admin_users (id, user_id) VALUES (@id, @userId)`);

    return { id, userId, createdAt: new Date() };
  }

  async seedData(): Promise<void> {
    const db = await getPool();
    const existing = await db.request().query(`SELECT COUNT(*) AS cnt FROM categories`);
    if (existing.recordset[0].cnt > 0) return;

    const catId = crypto.randomUUID();
    await db.request()
      .input("id", sql.NVarChar, catId)
      .input("name", sql.NVarChar, "Finance")
      .input("description", sql.NVarChar, "Financial management tools")
      .input("icon", sql.NVarChar, "Calculator")
      .input("color", sql.NVarChar, "#22C55E")
      .query(`INSERT INTO categories (id, name, description, icon, color, sort_order) VALUES (@id, @name, @description, @icon, @color, 0)`);

    const tileId = crypto.randomUUID();
    await db.request()
      .input("id", sql.NVarChar, tileId)
      .input("title", sql.NVarChar, "Finance Hub")
      .input("description", sql.NVarChar, "Central finance portal for reporting, budgets, and financial operations")
      .input("url", sql.NVarChar, "https://financehub-c2bna3f0hphvgqbj.australiaeast-01.azurewebsites.net/")
      .input("icon", sql.NVarChar, "/financehub-logo.ico")
      .input("color", sql.NVarChar, "#22C55E")
      .input("categoryId", sql.NVarChar, catId)
      .query(`INSERT INTO tiles (id, title, description, url, icon, color, category_id, is_global, sort_order) VALUES (@id, @title, @description, @url, @icon, @color, @categoryId, 1, 0)`);
  }
}
