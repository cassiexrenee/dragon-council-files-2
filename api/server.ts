import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
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
} from "./db";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // CORS — required since the frontend (Vercel) and this API (Render) run on
  // different origins. `credentials: true` + an explicit origin (not "*")
  // are both required for the session cookie to be sent cross-origin.
  const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin/non-browser requests (no Origin header) and any
        // configured frontend origin(s).
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
      credentials: true
    })
  );

  app.use(express.json());

  // Helper to dynamically get the accurate application base URL
  function getAppBaseUrl(req: express.Request): string {
    const appUrl = process.env.APP_URL;
    if (appUrl && appUrl !== "MY_APP_URL" && appUrl.startsWith("http")) {
      return appUrl.replace(/\/$/, "");
    }

    const xForwardedHost = req.headers["x-forwarded-host"];
    const xForwardedProto = req.headers["x-forwarded-proto"];
    if (xForwardedHost) {
      const proto = xForwardedProto || "https";
      return `${proto}://${xForwardedHost}`;
    }

    const referer = req.headers.referer;
    if (referer) {
      try {
        return new URL(referer).origin;
      } catch (_) {}
    }

    const host = req.headers.host || "localhost:3000";
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    return `${protocol}://${host}`;
  }

  // --- Session cookie helpers -----------------------------------------
  const SESSION_COOKIE = "dc_session";

  function parseCookies(req: express.Request): Record<string, string> {
    const header = req.headers.cookie;
    const cookies: Record<string, string> = {};
    if (!header) return cookies;
    header.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return;
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      if (key) {
        try {
          cookies[key] = decodeURIComponent(val);
        } catch (_) {
          cookies[key] = val;
        }
      }
    });
    return cookies;
  }

  function setSessionCookie(req: express.Request, res: express.Response, token: string) {
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    // Cross-origin (Vercel frontend <-> Render backend) requires SameSite=None,
    // which browsers only accept alongside Secure. Local http dev falls back
    // to Lax since None without Secure is rejected by browsers.
    const sameSite = isSecure ? "None" : "Lax";
    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=${sameSite}${isSecure ? "; Secure" : ""}`
    );
  }

  function clearSessionCookie(req: express.Request, res: express.Response) {
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
    const sameSite = isSecure ? "None" : "Lax";
    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}${isSecure ? "; Secure" : ""}`
    );
  }

  async function requireSession(req: express.Request): Promise<Awaited<ReturnType<typeof getSession>>> {
    const cookies = parseCookies(req);
    return getSession(cookies[SESSION_COOKIE]);
  }

  // API Route for Gemini Kingdom Brief Generation
  app.post("/api/ai/kingdom-brief", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const { season, totalPlayers, totalPower, totalMerits, topFighters, riskCount, recentWarLogs } = req.body;

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are the High Command Strategic AI Advisor for Dragon Council, an elite Call of Dragons alliance governance system.
Generate a prestigious, executive "Kingdom Intelligence Brief" for alliance leaders (R5/R4 officers) based on this current telemetry:

- Active Season: ${season || "S3"}
- Roster Size: ${totalPlayers || 0} Lords
- Aggregate Power: ${totalPower || "0M"}
- Seasonal Merits: ${totalMerits || "0M"}
- Top Fighter Vanguards: ${JSON.stringify(topFighters || [])}
- Accounts Requiring Officer Review / Risk: ${riskCount || 0}
- Recent Campaign War Events: ${JSON.stringify(recentWarLogs || [])}

Please structure your response into 4 distinct sections with clear headings:
1. Executive Strategic Assessment (High-level state of alliance military power and readiness)
2. Vanguard Combat Highlights (Acknowledging top merit drivers and frontline rally leads)
3. Vulnerabilities & Roster Risks (Addressing burnout, power deficits, or non-compliance)
4. Tactical Orders for Officers (3 actionable recommendations for R5/R4 council)

Tone: Prestigious, authoritative, arcane-gothic yet highly analytical ("Royal Council Archive" style).
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ brief: response.text });
    } catch (err) {
      console.error("Gemini brief generation error:", err);
      res.status(500).json({ error: "Failed to generate Kingdom Intelligence Brief: " + (err as Error).message });
    }
  });

  // API Route for Discord URL
  app.get("/api/auth/discord/url", (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({ error: "DISCORD_CLIENT_ID is not configured. Please add it to your environment variables." });
    }
    
    const baseUri = getAppBaseUrl(req);
    const redirectUri = `${baseUri}/auth/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify email",
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // API Callback Route for Discord redirect
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("No code provided by Discord OAuth.");
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).send("Discord OAuth is not fully configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in the environment variables.");
    }

    try {
      const baseUri = getAppBaseUrl(req);
      const redirectUri = `${baseUri}/auth/callback`;

      // Exchange authorization code for access token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        return res.status(400).send(`Failed to exchange token: ${errorText}`);
      }

      const tokenData = (await tokenResponse.json()) as { access_token: string };

      // Fetch user profile from Discord
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("Fetch user profile failed:", errorText);
        return res.status(400).send(`Failed to fetch user profile: ${errorText}`);
      }

      const userData = (await userResponse.json()) as {
        id: string;
        username: string;
        discriminator: string;
        avatar: string | null;
        email?: string;
      };

      const avatarUrl = userData.avatar
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || "0") % 5}.png`;

      // Create a real server-side session tied to this Discord identity, so
      // protected actions (like linking a farm account) can be enforced
      // server-side rather than trusted from the client alone.
      const { token } = await createSession({
        discordId: userData.id,
        username: userData.username,
        email: userData.email,
        avatarUrl
      });
      setSessionCookie(req, res, token);

      // Return popup completion page with postMessage
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Discord Authentication Successful</title>
            <style>
              body {
                background: #110B1E;
                color: #C0C0C0;
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .spinner {
                border: 4px solid rgba(255, 255, 255, 0.1);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border-left-color: #5865F2;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h2 {
                margin: 0 0 10px 0;
                color: #FFFFFF;
                letter-spacing: 0.05em;
              }
              p {
                font-size: 0.9rem;
                opacity: 0.8;
                max-width: 300px;
                line-height: 1.4;
              }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>Council Entry Permitted</h2>
            <p>Your discord identity has been authenticated. Merging credentials...</p>
            <script>
              const userData = ${JSON.stringify({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                avatarUrl: avatarUrl,
              })};
              
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: userData 
                }, '*');
                window.close();
              } else {
                window.location.href = ${JSON.stringify(allowedOrigins[0] || "/")};
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth flow error:", error);
      res.status(500).send(`Internal Server Error during Discord OAuth: ${(error as Error).message}`);
    }
  });

  // ---------------------------------------------------------------------
  // Alliance state sync (players/snapshots/overrides/notes/settings/imports)
  // ---------------------------------------------------------------------
  app.get("/api/state", async (req, res) => {
    try {
      const state = await getAppState();
      res.json({ state });
    } catch (err) {
      console.error("Failed to load alliance state:", err);
      res.status(500).json({ error: "Failed to load alliance state." });
    }
  });

  app.put("/api/state", async (req, res) => {
    try {
      await saveAppState(req.body);
      res.json({ ok: true });
    } catch (err) {
      console.error("Failed to save alliance state:", err);
      res.status(500).json({ error: "Failed to save alliance state." });
    }
  });

  // ---------------------------------------------------------------------
  // Session / identity
  // ---------------------------------------------------------------------
  app.get("/api/auth/session", async (req, res) => {
    try {
      const session = await requireSession(req);
      if (!session) {
        return res.json({ user: null, claimedCharacterId: null });
      }
      const claimedCharacterId = await getClaimByDiscordId(session.discordId);
      res.json({
        user: {
          id: session.discordId,
          username: session.username,
          email: session.email,
          avatarUrl: session.avatarUrl
        },
        claimedCharacterId
      });
    } catch (err) {
      console.error("Failed to load session:", err);
      res.status(500).json({ error: "Failed to load session." });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const cookies = parseCookies(req);
      await deleteSession(cookies[SESSION_COOKIE]);
      clearSessionCookie(req, res);
      res.json({ ok: true });
    } catch (err) {
      console.error("Failed to log out:", err);
      res.status(500).json({ error: "Failed to log out." });
    }
  });

  // ---------------------------------------------------------------------
  // Character claims — ties a Discord identity to one alliance character,
  // so downstream writes (farm linking) can be enforced server-side.
  // ---------------------------------------------------------------------
  app.post("/api/auth/claim", async (req, res) => {
    try {
      const session = await requireSession(req);
      if (!session) {
        return res.status(401).json({ error: "You must be logged in with Discord to claim a character." });
      }

      const { characterId } = req.body;
      if (!characterId || typeof characterId !== "string") {
        return res.status(400).json({ error: "characterId is required." });
      }

      const existingOwner = await getClaimByCharacterId(characterId);
      if (existingOwner && existingOwner !== session.discordId) {
        return res.status(409).json({
          error: "This character has already been claimed by another member. Ask an officer to reset it in Settings if this is a mistake."
        });
      }

      await setClaim(session.discordId, characterId);
      res.json({ ok: true, claimedCharacterId: characterId });
    } catch (err) {
      console.error("Failed to claim character:", err);
      res.status(500).json({ error: "Failed to claim character." });
    }
  });

  // Officer-facing: view all current claims
  app.get("/api/auth/claims", async (req, res) => {
    try {
      res.json({ claims: await listClaims() });
    } catch (err) {
      console.error("Failed to load claims:", err);
      res.status(500).json({ error: "Failed to load claims." });
    }
  });

  // Officer-facing: release a claim so it can be re-claimed by someone else
  app.delete("/api/auth/claims/:characterId", async (req, res) => {
    try {
      await releaseClaimByCharacterId(req.params.characterId);
      res.json({ ok: true });
    } catch (err) {
      console.error("Failed to release claim:", err);
      res.status(500).json({ error: "Failed to release claim." });
    }
  });

  // ---------------------------------------------------------------------
  // Farm account linking — reads are open (consistent with the rest of the
  // dashboard), writes require a session whose claimed character matches
  // the character being modified.
  // ---------------------------------------------------------------------
  app.get("/api/farms/:playerId", async (req, res) => {
    try {
      res.json({ farms: await getFarmLinks(req.params.playerId) });
    } catch (err) {
      console.error("Failed to load farm links:", err);
      res.status(500).json({ error: "Failed to load farm links." });
    }
  });

  app.post("/api/farms", async (req, res) => {
    try {
      const session = await requireSession(req);
      if (!session) {
        return res.status(401).json({ error: "You must be logged in with Discord to link a farm account." });
      }

      const { characterId, farmName, farmPower } = req.body;
      if (!characterId || !farmName || typeof farmName !== "string" || !farmName.trim()) {
        return res.status(400).json({ error: "characterId and farmName are required." });
      }

      const claimedCharacterId = await getClaimByDiscordId(session.discordId);
      if (claimedCharacterId !== characterId) {
        return res.status(403).json({ error: "You can only link farm accounts to your own claimed character." });
      }

      const farm = await addFarmLink(characterId, farmName.trim(), Number(farmPower) || 0);
      res.json({ ok: true, farm });
    } catch (err) {
      console.error("Failed to link farm account:", err);
      res.status(500).json({ error: "Failed to link farm account." });
    }
  });

  app.delete("/api/farms/:farmId", async (req, res) => {
    try {
      const session = await requireSession(req);
      if (!session) {
        return res.status(401).json({ error: "You must be logged in with Discord to remove a farm account." });
      }

      const farm = await getFarmLinkById(req.params.farmId);
      if (!farm) {
        return res.status(404).json({ error: "Farm link not found." });
      }

      const claimedCharacterId = await getClaimByDiscordId(session.discordId);
      if (claimedCharacterId !== farm.mainPlayerId) {
        return res.status(403).json({ error: "You can only remove farm accounts linked to your own claimed character." });
      }

      await deleteFarmLink(req.params.farmId);
      res.json({ ok: true });
    } catch (err) {
      console.error("Failed to remove farm account:", err);
      res.status(500).json({ error: "Failed to remove farm account." });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // If a frontend build exists alongside this server (e.g. local
    // `npm run build` / `npm start`), serve it. On Render, only the API is
    // typically deployed — the frontend is served separately by Vercel — so
    // this is skipped gracefully when dist/index.html isn't present.
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(indexPath);
      });
    } else {
      app.get("/", (req, res) => {
        res.json({ status: "ok", message: "Dragon Council API is running." });
      });
    }
  }

  await initDb();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
