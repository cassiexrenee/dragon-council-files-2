import { Pool } from "pg";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Postgres storage (designed for Neon), used when this server runs on Render.
//
// Mirrors the previous SQLite module's shape and behavior. The core alliance
// data (players, snapshots, overrides, notes, settings, import sessions) is
// still stored as a single JSONB blob — it mirrors the shape the frontend
// already manages as one cohesive bundle. Auth-sensitive data (sessions,
// character claims, farm links) gets real tables with real constraints,
// since that's the surface members can write to directly.
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Set it to your Neon Postgres connection string (see .env.example)."
  );
}

const connectionString = process.env.DATABASE_URL || "";
const isLocalDb = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? false : { rejectUnauthorized: false }
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data JSONB NOT NULL,
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
      character_id TEXT NOT NULL UNIQUE,
      claimed_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farm_links (
      id TEXT PRIMARY KEY,
      main_player_id TEXT NOT NULL,
      farm_name TEXT NOT NULL,
      farm_power INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_farm_links_main_player ON farm_links(main_player_id);
  `);
}

// --- Alliance state blob -----------------------------------------------

export async function getAppState(): Promise<any | null> {
  const result = await pool.query("SELECT data FROM app_state WHERE id = 1");
  return result.rows[0]?.data ?? null;
}

export async function saveAppState(state: unknown): Promise<void> {
  await pool.query(
    `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, $2)
     ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = $2`,
    [state, new Date().toISOString()]
  );
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
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await pool.query(
    `INSERT INTO sessions (token, discord_id, username, email, avatar_url, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [token, user.discordId, user.username, user.email || null, user.avatarUrl || null, now.toISOString(), expiresAt.toISOString()]
  );
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function getSession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const result = await pool.query("SELECT * FROM sessions WHERE token = $1", [token]);
  const row = result.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    return null;
  }
  return {
    discordId: row.discord_id,
    username: row.username,
    email: row.email || undefined,
    avatarUrl: row.avatar_url || undefined
  };
}

export async function deleteSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
}

// --- Player claims (which Discord identity "owns" which alliance character) ---

export async function getClaimByDiscordId(discordId: string): Promise<string | null> {
  const result = await pool.query("SELECT character_id FROM player_claims WHERE discord_id = $1", [discordId]);
  return result.rows[0]?.character_id ?? null;
}

export async function getClaimByCharacterId(characterId: string): Promise<string | null> {
  const result = await pool.query("SELECT discord_id FROM player_claims WHERE character_id = $1", [characterId]);
  return result.rows[0]?.discord_id ?? null;
}

export async function setClaim(discordId: string, characterId: string): Promise<void> {
  await pool.query(
    `INSERT INTO player_claims (discord_id, character_id, claimed_at) VALUES ($1, $2, $3)
     ON CONFLICT (discord_id) DO UPDATE SET character_id = $2, claimed_at = $3`,
    [discordId, characterId, new Date().toISOString()]
  );
}

export async function releaseClaimByCharacterId(characterId: string): Promise<void> {
  await pool.query("DELETE FROM player_claims WHERE character_id = $1", [characterId]);
}

export async function listClaims(): Promise<{ discordId: string; characterId: string; claimedAt: string }[]> {
  const result = await pool.query("SELECT * FROM player_claims ORDER BY claimed_at DESC");
  return result.rows.map((r) => ({ discordId: r.discord_id, characterId: r.character_id, claimedAt: r.claimed_at }));
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
  const result = await pool.query("SELECT * FROM farm_links WHERE main_player_id = $1 ORDER BY created_at ASC", [mainPlayerId]);
  return result.rows.map((r) => ({
    id: r.id,
    mainPlayerId: r.main_player_id,
    farmName: r.farm_name,
    farmPower: r.farm_power,
    createdAt: r.created_at
  }));
}

export async function addFarmLink(mainPlayerId: string, farmName: string, farmPower: number): Promise<FarmLink> {
  const id = `farm_${crypto.randomBytes(8).toString("hex")}`;
  const createdAt = new Date().toISOString();
  await pool.query(
    `INSERT INTO farm_links (id, main_player_id, farm_name, farm_power, created_at) VALUES ($1, $2, $3, $4, $5)`,
    [id, mainPlayerId, farmName, farmPower, createdAt]
  );
  return { id, mainPlayerId, farmName, farmPower, createdAt };
}

export async function getFarmLinkById(id: string): Promise<FarmLink | null> {
  const result = await pool.query("SELECT * FROM farm_links WHERE id = $1", [id]);
  const r = result.rows[0];
  if (!r) return null;
  return { id: r.id, mainPlayerId: r.main_player_id, farmName: r.farm_name, farmPower: r.farm_power, createdAt: r.created_at };
}

export async function deleteFarmLink(id: string): Promise<void> {
  await pool.query("DELETE FROM farm_links WHERE id = $1", [id]);
}

export default pool;
