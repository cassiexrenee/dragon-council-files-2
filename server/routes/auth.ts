import { Router } from "express";
import { createSession, getSession, deleteSession } from "../db";

export const authRouter = Router();

// Helper to get App Base URL for callbacks
function getAppBaseUrl(req: any): string {
  const appUrl = process.env.APP_URL;
  if (appUrl && appUrl !== "MY_APP_URL" && appUrl.startsWith("http")) {
    return appUrl.replace(/\/$/, "");
  }
  const host = req.headers.host || "localhost:3000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}

// 1. Generate Discord OAuth URL
authRouter.get("/discord/url", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId || clientId === "YOUR_DISCORD_CLIENT_ID") {
    return res.status(500).json({ error: "Discord Client ID not configured." });
  }

  const redirectUri = encodeURIComponent(`${getAppBaseUrl(req)}/api/auth/discord/callback`);
  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
  res.json({ url });
});

// 2. Handle Discord Callback
authRouter.get("/discord/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send("No code provided by Discord.");
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${getAppBaseUrl(req)}/api/auth/discord/callback`;

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange code: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userResponse.ok) throw new Error("Failed to fetch user data from Discord.");

    const userData = await userResponse.json();
    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : undefined;

    const user = {
      id: userData.id,
      username: userData.username,
      avatarUrl
    };

    const sessionId = await createSession(user.id, user.username, user.avatarUrl);

    res.cookie("dc_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    const successHtml = `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
            window.close();
          </script>
        </body>
      </html>
    `;
    res.send(successHtml);
  } catch (error) {
    console.error("Discord OAuth Error:", error);
    res.status(500).send("Authentication failed. Please close this window and try again.");
  }
});

// 3. Get Current Session
authRouter.get("/session", async (req, res) => {
  const sessionId = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("dc_session="))
    ?.split("=")[1];

  if (!sessionId) return res.json({ user: null });

  const session = await getSession(sessionId);
  if (!session) return res.json({ user: null });

  res.json({
    user: {
      id: session.discordId,
      username: session.username,
      avatarUrl: session.avatarUrl
    }
  });
});

// 4. Logout
authRouter.post("/logout", async (req, res) => {
  const sessionId = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("dc_session="))
    ?.split("=")[1];

  if (sessionId) {
    await deleteSession(sessionId);
  }
  
  res.clearCookie("dc_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });
  res.json({ ok: true });
});