import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── helpers ──────────────────────────────────────────────────────────────────
function parseJson<T>(val: string, fallback: T): T {
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function serializeCase(c: schema.Case) {
  return {
    ...c,
    reports: parseJson<string[]>(c.reports, []),
    violations: parseJson<string[]>(c.violations, []),
    appealSteps: parseJson<string[]>(c.appealSteps, []),
  };
}

// ── auth middleware ───────────────────────────────────────────────────────────
const INVITE_CODE = process.env.INVITE_CODE ?? "steampanel2024";

// ── app ───────────────────────────────────────────────────────────────────────
const app = new Hono()
  .basePath("api")
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ status: "ok" }, 200))

  // Auth
  .post("/auth/login", async (c) => {
    const { code } = await c.req.json<{ code: string }>();
    if (code !== INVITE_CODE) {
      return c.json({ error: "Invalid invite code" }, 401);
    }
    return c.json({ success: true }, 200);
  })

  // Steam profile proxy
  .get("/steam/profile", async (c) => {
    const steamId = c.req.query("steamId");
    const apiKey = process.env.STEAM_API_KEY;
    if (!steamId) return c.json({ error: "steamId required" }, 400);
    if (!apiKey) return c.json({ error: "Steam API key not configured" }, 500);

    try {
      const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
      const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=false`;
      const levelUrl = `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`;

      const [summaryRes, gamesRes, levelRes] = await Promise.all([
        fetch(summaryUrl),
        fetch(gamesUrl),
        fetch(levelUrl),
      ]);

      const summaryData = await summaryRes.json() as any;
      const gamesData = await gamesRes.json() as any;
      const levelData = await levelRes.json() as any;

      const player = summaryData?.response?.players?.[0];
      if (!player) return c.json({ error: "Steam profile not found" }, 404);

      return c.json({
        steamId: player.steamid,
        displayName: player.personaname,
        avatar: player.avatarfull,
        profileUrl: player.profileurl,
        accountCreated: player.timecreated ?? 0,
        level: levelData?.response?.player_level ?? 0,
        gamesCount: gamesData?.response?.game_count ?? 0,
      }, 200);
    } catch (e) {
      return c.json({ error: "Failed to fetch Steam profile" }, 500);
    }
  })

  // Cases — create
  .post("/cases", async (c) => {
    const body = await c.req.json<{
      steamId: string;
      displayName: string;
      avatar: string;
      profileUrl: string;
      level: number;
      gamesCount: number;
      accountCreated: number;
      tidioKey: string;
      reports: string[];
      violations: string[];
      appealSteps: string[];
    }>();

    const id = nanoid(12);
    const [newCase] = await db
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
    const all = await db.select().from(schema.cases).orderBy(schema.cases.createdAt);
    return c.json({ cases: all.map(serializeCase) }, 200);
  })

  // Cases — get single
  .get("/cases/:id", async (c) => {
    const id = c.req.param("id");
    const [found] = await db.select().from(schema.cases).where(eq(schema.cases.id, id));
    if (!found) return c.json({ error: "Case not found" }, 404);
    return c.json({ case: serializeCase(found) }, 200);
  })

  // Cases — update
  .patch("/cases/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<{
      tidioKey: string;
      reports: string[];
      violations: string[];
      appealSteps: string[];
      status: string;
      displayName: string;
      level: number;
      gamesCount: number;
    }>>();

    const updateData: Partial<schema.InsertCase> = {
      updatedAt: new Date(),
    };

    if (body.tidioKey !== undefined) updateData.tidioKey = body.tidioKey;
    if (body.reports !== undefined) updateData.reports = JSON.stringify(body.reports);
    if (body.violations !== undefined) updateData.violations = JSON.stringify(body.violations);
    if (body.appealSteps !== undefined) updateData.appealSteps = JSON.stringify(body.appealSteps);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.gamesCount !== undefined) updateData.gamesCount = body.gamesCount;

    const [updated] = await db
      .update(schema.cases)
      .set(updateData)
      .where(eq(schema.cases.id, id))
      .returning();

    if (!updated) return c.json({ error: "Case not found" }, 404);
    return c.json({ case: serializeCase(updated) }, 200);
  })

  // Cases — delete
  .delete("/cases/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(schema.cases).where(eq(schema.cases.id, id));
    return c.json({ success: true }, 200);
  });

export type AppType = typeof app;
export default app;
