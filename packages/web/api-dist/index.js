"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const index_1 = require("./database/index");
const schema = __importStar(require("./database/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const nanoid_1 = require("nanoid");
// ── helpers ──────────────────────────────────────────────────────────────────
function parseJson(val, fallback) {
    try {
        return JSON.parse(val);
    }
    catch {
        return fallback;
    }
}
function serializeCase(c) {
    return {
        ...c,
        reports: parseJson(c.reports, []),
        violations: parseJson(c.violations, []),
        appealSteps: parseJson(c.appealSteps, []),
    };
}
// ── auth middleware ───────────────────────────────────────────────────────────
const INVITE_CODE = process.env.INVITE_CODE ?? "steampanel2024";
// ── app ───────────────────────────────────────────────────────────────────────
const app = new hono_1.Hono()
    .basePath("api")
    .use((0, cors_1.cors)({ origin: (origin) => origin ?? "*", credentials: true }))
    .get("/health", (c) => c.json({ status: "ok" }, 200))
    // Auth
    .post("/auth/login", async (c) => {
    const { code } = await c.req.json();
    if (code !== INVITE_CODE) {
        return c.json({ error: "Invalid invite code" }, 401);
    }
    return c.json({ success: true }, 200);
})
    // Steam profile proxy
    .get("/steam/profile", async (c) => {
    const steamId = c.req.query("steamId");
    const apiKey = process.env.STEAM_API_KEY;
    if (!steamId)
        return c.json({ error: "steamId required" }, 400);
    if (!apiKey)
        return c.json({ error: "Steam API key not configured" }, 500);
    try {
        const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
        const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=false`;
        const levelUrl = `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`;
        const [summaryRes, gamesRes, levelRes] = await Promise.all([
            fetch(summaryUrl),
            fetch(gamesUrl),
            fetch(levelUrl),
        ]);
        const summaryData = await summaryRes.json();
        const gamesData = await gamesRes.json();
        const levelData = await levelRes.json();
        const player = summaryData?.response?.players?.[0];
        if (!player)
            return c.json({ error: "Steam profile not found" }, 404);
        return c.json({
            steamId: player.steamid,
            displayName: player.personaname,
            avatar: player.avatarfull,
            profileUrl: player.profileurl,
            accountCreated: player.timecreated ?? 0,
            level: levelData?.response?.player_level ?? 0,
            gamesCount: gamesData?.response?.game_count ?? 0,
        }, 200);
    }
    catch (e) {
        return c.json({ error: "Failed to fetch Steam profile" }, 500);
    }
})
    // Cases — create
    .post("/cases", async (c) => {
    const body = await c.req.json();
    const id = (0, nanoid_1.nanoid)(12);
    const [newCase] = await index_1.db
        .insert(schema.cases)
        .values({
        id,
        steamId: body.steamId,
        displayName: body.displayName,
        avatar: body.avatar,
        profileUrl: body.profileUrl,
        level: body.level,
        gamesCount: body.gamesCount,
        accountCreated: body.accountCreated,
        tidioKey: body.tidioKey,
        reports: JSON.stringify(body.reports ?? []),
        violations: JSON.stringify(body.violations ?? []),
        appealSteps: JSON.stringify(body.appealSteps ?? []),
        status: "open",
    })
        .returning();
    return c.json({ case: serializeCase(newCase) }, 201);
})
    // Cases — list
    .get("/cases", async (c) => {
    const all = await index_1.db.select().from(schema.cases).orderBy(schema.cases.createdAt);
    return c.json({ cases: all.map(serializeCase) }, 200);
})
    // Cases — get single
    .get("/cases/:id", async (c) => {
    const id = c.req.param("id");
    const [found] = await index_1.db.select().from(schema.cases).where((0, drizzle_orm_1.eq)(schema.cases.id, id));
    if (!found)
        return c.json({ error: "Case not found" }, 404);
    return c.json({ case: serializeCase(found) }, 200);
})
    // Cases — update
    .patch("/cases/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updateData = {
        updatedAt: new Date(),
    };
    if (body.tidioKey !== undefined)
        updateData.tidioKey = body.tidioKey;
    if (body.reports !== undefined)
        updateData.reports = JSON.stringify(body.reports);
    if (body.violations !== undefined)
        updateData.violations = JSON.stringify(body.violations);
    if (body.appealSteps !== undefined)
        updateData.appealSteps = JSON.stringify(body.appealSteps);
    if (body.status !== undefined)
        updateData.status = body.status;
    if (body.displayName !== undefined)
        updateData.displayName = body.displayName;
    if (body.level !== undefined)
        updateData.level = body.level;
    if (body.gamesCount !== undefined)
        updateData.gamesCount = body.gamesCount;
    const [updated] = await index_1.db
        .update(schema.cases)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(schema.cases.id, id))
        .returning();
    if (!updated)
        return c.json({ error: "Case not found" }, 404);
    return c.json({ case: serializeCase(updated) }, 200);
})
    // Cases — delete
    .delete("/cases/:id", async (c) => {
    const id = c.req.param("id");
    await index_1.db.delete(schema.cases).where((0, drizzle_orm_1.eq)(schema.cases.id, id));
    return c.json({ success: true }, 200);
});
exports.default = app;
