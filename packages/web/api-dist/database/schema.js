"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cases = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.cases = (0, sqlite_core_1.sqliteTable)("cases", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // nanoid
    steamId: (0, sqlite_core_1.text)("steam_id").notNull(),
    displayName: (0, sqlite_core_1.text)("display_name").notNull(),
    avatar: (0, sqlite_core_1.text)("avatar").notNull().default(""),
    profileUrl: (0, sqlite_core_1.text)("profile_url").notNull().default(""),
    level: (0, sqlite_core_1.integer)("level").notNull().default(0),
    gamesCount: (0, sqlite_core_1.integer)("games_count").notNull().default(0),
    accountCreated: (0, sqlite_core_1.integer)("account_created").notNull().default(0), // unix timestamp
    tidioKey: (0, sqlite_core_1.text)("tidio_key").notNull().default(""),
    reports: (0, sqlite_core_1.text)("reports").notNull().default("[]"), // JSON array
    violations: (0, sqlite_core_1.text)("violations").notNull().default("[]"), // JSON array
    appealSteps: (0, sqlite_core_1.text)("appeal_steps").notNull().default("[]"), // JSON array
    status: (0, sqlite_core_1.text)("status").notNull().default("open"), // "open" | "closed"
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
});
