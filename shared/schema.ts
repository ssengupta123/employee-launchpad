import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("Folder"),
  color: text("color").notNull().default("#3B82F6"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tiles = pgTable("tiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  icon: text("icon").notNull().default("Globe"),
  color: text("color").notNull().default("#3B82F6"),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "set null" }),
  isGlobal: boolean("is_global").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  openInNewTab: boolean("open_in_new_tab").notNull().default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userTiles = pgTable("user_tiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tileId: varchar("tile_id").notNull().references(() => tiles.id, { onDelete: "cascade" }),
  pinned: boolean("pinned").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("idx_user_tiles_user").on(table.userId),
  index("idx_user_tiles_tile").on(table.tileId),
]);

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  tiles: many(tiles),
}));

export const tilesRelations = relations(tiles, ({ one, many }) => ({
  category: one(categories, { fields: [tiles.categoryId], references: [categories.id] }),
  userTiles: many(userTiles),
}));

export const userTilesRelations = relations(userTiles, ({ one }) => ({
  tile: one(tiles, { fields: [userTiles.tileId], references: [tiles.id] }),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertTileSchema = createInsertSchema(tiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserTileSchema = createInsertSchema(userTiles).omit({ id: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true });

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Tile = typeof tiles.$inferSelect;
export type InsertTile = z.infer<typeof insertTileSchema>;
export type UserTile = typeof userTiles.$inferSelect;
export type InsertUserTile = z.infer<typeof insertUserTileSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type TileWithCategory = Tile & { category?: Category | null };
