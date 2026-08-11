import pg from "pg";
import fs from "fs";
import path from "path";
import crypto from "crypto";

let Database: any = null;

// ---------------------------------------------------------------------------
// Hybrid Persistence Layer (Neon PostgreSQL + SQLite Fallback)
//
// Automatically detects Neon PostgreSQL via DATABASE_URL / NEON_DATABASE_URL /
// POSTGRES_URL environment variables. If a PostgreSQL connection string is
// present (e.g. on Vercel or Render with Neon DB), queries are routed to Neon.
// If absent, falls back to a local SQLite database for zero-config local / dev use.
// ---------------------------------------------------------------------------

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

let isPostgres = false;
let pgPool: pg.Pool | null = null;
let sqliteDb: any | null = null;

if (dbUrl) {
  isPostgres = true;
  pgPool = new pg.Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false }
  });
} else {
  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Database = require("better-sqlite3");
  } catch (error) {
    throw new Error("better-sqlite3 is required for SQLite fallback. Install it or set DATABASE_URL/NEON_DATABASE_URL/POSTGRES_URL.");
  }

  sqliteDb = new Database(path.join(DATA_DIR, "dragon_council.db"));
  sqliteDb.pragma("journal_mode = WAL");
}

let initPromise: Promise<void> | null = null;

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (isPostgres && pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS app_state (
            id INT PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
          );

          CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            discord_id TEXT NOT NULL,
            username TEXT NOT NULL,
            email TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL
          );

          CREATE TABLE IF NOT EXISTS player_claims (
            discord_id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            claimed_at TIMESTAMPTZ NOT NULL
          );

          CREATE TABLE IF NOT EXISTS farm_links (
            id TEXT PRIMARY KEY,
            main_player_id TEXT NOT NULL,
            farm_name TEXT NOT NULL,
            farm_power BIGINT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_farm_links_main_player ON farm_links(main_player_id);
          CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_character ON player_claims(character_id);
        `);
      } finally {
        client.release();
      }
    } else if (sqliteDb) {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS app_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          discord_id TEXT NOT NULL,
          username TEXT NOT NULL,
          email TEXT,
          avatar_url TEXT,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS player_claims (
          discord_id TEXT PRIMARY KEY,
          character_id TEXT NOT NULL,
          claimed_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS farm_links (
          id TEXT PRIMARY KEY,
          main_player_id TEXT NOT NULL,
          farm_name TEXT NOT NULL,
          farm_power INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_farm_links_main_player ON farm_links(main_player_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_character ON player_claims(character_id);
      `);
    }
  })();
  return initPromise;
}

// Fire init immediately
initDb().catch((err) => console.error("DB Initialization error:", err));

// --- Alliance state blob -----------------------------------------------

export async function getAppState(): Promise<any | null> {
  await initDb();
  if (isPostgres && pgPool) {
    const res = await pgPool.query("SELECT data FROM app_state WHERE id = 1");
    if (!res.rows[0]) return null;
    try {
      return JSON.parse(res.rows[0].data);
    } catch (_) {
      return null;
    }
  } else if (sqliteDb) {
    const row = sqliteDb.prepare("SELECT data FROM app_state WHERE id = 1").get() as { data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data);
    } catch (_) {
      return null;
    }
  }
  return null;
}

export async function saveAppState(state: unknown): Promise<void> {
  await initDb();
  const json = JSON.stringify(state);
  const nowStr = new Date().toISOString();
  if (isPostgres && pgPool) {
    await pgPool.query(
      `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, $2)
       ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [json, nowStr]
    );
  } else if (sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(json, nowStr);
  }
}

// --- Sessions -------------------------------------------------------------

export interface SessionUser {
  discordId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(user: SessionUser): Promise<{ token: string; expiresAt: string }> {
  await initDb();
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  if (isPostgres && pgPool) {
    await pgPool.query(
      `INSERT INTO sessions (token, discord_id, username, email, avatar_url, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [token, user.discordId, user.username, user.email || null, user.avatarUrl || null, now.toISOString(), expiresAt.toISOString()]
    );
  } else if (sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO sessions (token, discord_id, username, email, avatar_url, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(token, user.discordId, user.username, user.email || null, user.avatarUrl || null, now.toISOString(), expiresAt.toISOString());
  }

  return { token, expiresAt: expiresAt.toISOString() };
}

export async function getSession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  await initDb();

  if (isPostgres && pgPool) {
    const res = await pgPool.query("SELECT * FROM sessions WHERE token = $1", [token]);
    const row = res.rows[0];
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await pgPool.query("DELETE FROM sessions WHERE token = $1", [token]);
      return null;
    }
    return {
      discordId: row.discord_id,
      username: row.username,
      email: row.email || undefined,
      avatarUrl: row.avatar_url || undefined
    };
  } else if (sqliteDb) {
    const row = sqliteDb.prepare("SELECT * FROM sessions WHERE token = ?").get(token) as any;
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      sqliteDb.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      return null;
    }
    return {
      discordId: row.discord_id,
      username: row.username,
      email: row.email || undefined,
      avatarUrl: row.avatar_url || undefined
    };
  }
  return null;
}

export async function deleteSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await initDb();
  if (isPostgres && pgPool) {
    await pgPool.query("DELETE FROM sessions WHERE token = $1", [token]);
  } else if (sqliteDb) {
    sqliteDb.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
}

// --- Player claims -----------------------------------------------------------

export async function getClaimByDiscordId(discordId: string): Promise<string | null> {
  await initDb();
  if (isPostgres && pgPool) {
    const res = await pgPool.query("SELECT character_id FROM player_claims WHERE discord_id = $1", [discordId]);
    return res.rows[0] ? res.rows[0].character_id : null;
  } else if (sqliteDb) {
    const row = sqliteDb.prepare("SELECT character_id FROM player_claims WHERE discord_id = ?").get(discordId) as any;
    return row ? row.character_id : null;
  }
  return null;
}

export async function getClaimByCharacterId(characterId: string): Promise<string | null> {
  await initDb();
  if (isPostgres && pgPool) {
    const res = await pgPool.query("SELECT discord_id FROM player_claims WHERE character_id = $1", [characterId]);
    return res.rows[0] ? res.rows[0].discord_id : null;
  } else if (sqliteDb) {
    const row = sqliteDb.prepare("SELECT discord_id FROM player_claims WHERE character_id = ?").get(characterId) as any;
    return row ? row.discord_id : null;
  }
  return null;
}

export async function setClaim(discordId: string, characterId: string): Promise<void> {
  await initDb();
  const nowStr = new Date().toISOString();
  if (isPostgres && pgPool) {
    await pgPool.query(
      `INSERT INTO player_claims (discord_id, character_id, claimed_at) VALUES ($1, $2, $3)
       ON CONFLICT(discord_id) DO UPDATE SET character_id = EXCLUDED.character_id, claimed_at = EXCLUDED.claimed_at`,
      [discordId, characterId, nowStr]
    );
  } else if (sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO player_claims (discord_id, character_id, claimed_at) VALUES (?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET character_id = excluded.character_id, claimed_at = excluded.claimed_at
    `).run(discordId, characterId, nowStr);
  }
}

export async function releaseClaimByCharacterId(characterId: string): Promise<void> {
  await initDb();
  if (isPostgres && pgPool) {
    await pgPool.query("DELETE FROM player_claims WHERE character_id = $1", [characterId]);
  } else if (sqliteDb) {
    sqliteDb.prepare("DELETE FROM player_claims WHERE character_id = ?").run(characterId);
  }
}

export async function listClaims(): Promise<{ discordId: string; characterId: string; claimedAt: string }[]> {
  await initDb();
  if (isPostgres && pgPool) {
    const res = await pgPool.query("SELECT discord_id, character_id, claimed_at FROM player_claims ORDER BY claimed_at DESC");
    return res.rows.map((r) => ({ discordId: r.discord_id, characterId: r.character_id, claimedAt: r.claimed_at }));
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare("SELECT * FROM player_claims ORDER BY claimed_at DESC").all() as any[];
    return rows.map((r) => ({ discordId: r.discord_id, characterId: r.character_id, claimedAt: r.claimed_at }));
  }
  return [];
}

// --- Farm links -------------------------------------------------------------

export interface FarmLink {
  id: string;
  mainPlayerId: string;
  farmName: string;
  farmPower: number;
  createdAt: string;
}

export async function getFarmLinks(mainPlayerId: string): Promise<FarmLink[]> {
  await initDb();
  if (isPostgres && pgPool) {
    const res = await pgPool.query("SELECT * FROM farm_links WHERE main_player_id = $1 ORDER BY created_at ASC", [mainPlayerId]);
    return res.rows.map((r) => ({
      id: r.id,
      mainPlayerId: r.main_player_id,
      farmName: r.farm_name,
      farmPower: Number(r.farm_power),
      createdAt: r.created_at
    }));
  } else if (sqliteDb) {
    const rows = sqliteDb.prepare("SELECT * FROM farm_links WHERE main_player_id = ? ORDER BY created_at ASC").all(mainPlayerId) as any[];
    return rows.map((r) => ({
      id: r.id,
      mainPlayerId: r.main_player_id,
      farmName: r.farm_name,
      farmPower: r.farm_power,
      createdAt: r.created_at
    }));
  }
  return [];
}

export async function addFarmLink(mainPlayerId: string, farmName: string, farmPower: number): Promise<FarmLink> {
  await initDb();
  const id = `farm_${crypto.randomBytes(8).toString("hex")}`;
  const createdAt = new Date().toISOString();

  if (isPostgres && pgPool) {
    await pgPool.query(
      `INSERT INTO farm_links (id, main_player_id, farm_name, farm_power, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, mainPlayerId, farmName, farmPower, createdAt]
    );
  } else if (sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO farm_links (id, main_player_id, farm_name, farm_power, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, mainPlayerId, farmName, farmPower, createdAt);
  }

  return { id, mainPlayerId, farmName, farmPower, createdAt };
}

export async function getFarmLinkById(id: string): Promise<FarmLink | null> {
  await initDb();
  if (isPostgres && pgPool) {
    const res = await pgPool.query("SELECT * FROM farm_links WHERE id = $1", [id]);
    const r = res.rows[0];
    if (!r) return null;
    return { id: r.id, mainPlayerId: r.main_player_id, farmName: r.farm_name, farmPower: Number(r.farm_power), createdAt: r.created_at };
  } else if (sqliteDb) {
    const r = sqliteDb.prepare("SELECT * FROM farm_links WHERE id = ?").get(id) as any;
    if (!r) return null;
    return { id: r.id, mainPlayerId: r.main_player_id, farmName: r.farm_name, farmPower: r.farm_power, createdAt: r.created_at };
  }
  return null;
}

export async function deleteFarmLink(id: string): Promise<void> {
  await initDb();
  if (isPostgres && pgPool) {
    await pgPool.query("DELETE FROM farm_links WHERE id = $1", [id]);
  } else if (sqliteDb) {
    sqliteDb.prepare("DELETE FROM farm_links WHERE id = ?").run(id);
  }
}

export default {
  initDb,
  getAppState,
  saveAppState,
  createSession,
  getSession,
  deleteSession,
  getClaimByDiscordId,
  getClaimByCharacterId,
  setClaim,
  releaseClaimByCharacterId,
  listClaims,
  getFarmLinks,
  addFarmLink,
  getFarmLinkById,
  deleteFarmLink
};

export async function requireSession(req: any) {
  const sessionId = req.headers.cookie
    ?.split("; ")
    .find((row: string) => row.startsWith("dc_session="))
    ?.split("=")[1];

  if (!sessionId) return null;
  return await getSession(sessionId);
}