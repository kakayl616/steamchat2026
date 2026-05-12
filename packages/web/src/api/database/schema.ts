import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(), // nanoid
  steamId: text("steam_id").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar").notNull().default(""),
  profileUrl: text("profile_url").notNull().default(""),
  level: integer("level").notNull().default(0),
  gamesCount: integer("games_count").notNull().default(0),
  accountCreated: integer("account_created").notNull().default(0), // unix timestamp
  tidioKey: text("tidio_key").notNull().default(""),
  reports: text("reports").notNull().default("[]"), // JSON array
  violations: text("violations").notNull().default("[]"), // JSON array
  appealSteps: text("appeal_steps").notNull().default("[]"), // JSON array
  status: text("status").notNull().default("open"), // "open" | "closed"
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;
