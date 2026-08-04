# Dragon Council Workspace

An elite alliance decision telemetry, roster governance, and management platform for Call of Dragons.

---

## 🚀 Multi-Platform Deployment Guide

Dragon Council Workspace is engineered with a **hybrid architecture** that runs seamlessly on local dev environments, **Vercel**, **Render**, and **Neon PostgreSQL**.

---

### 1. Database Setup: Neon PostgreSQL (`DATABASE_URL`)

1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy your Connection String (e.g., `postgres://user:password@ep-sample-1234.us-east-2.aws.neon.tech/neondb?sslmode=require`).
3. Set `DATABASE_URL` in your deployment environment variables on Vercel or Render.
4. *Note:* If `DATABASE_URL` is not set, the application automatically falls back to local SQLite (`/data/dragon_council.db`).

---

### 2. Vercel Deployment Guide

1. **Import Repository**: Connect your GitHub repository to [Vercel](https://vercel.com).
2. **Framework Preset**: Select **Vite** (or Other).
3. **Build & Output Settings**:
   - Build Command: `npm run build` (or `bun run build`)
   - Output Directory: `dist`
4. **Environment Variables**:
   - `DATABASE_URL`: Your Neon PostgreSQL Connection String
   - `GEMINI_API_KEY`: Your Gemini API Key
   - `DISCORD_CLIENT_ID`: Your Discord OAuth Application Client ID
   - `DISCORD_CLIENT_SECRET`: Your Discord OAuth Application Client Secret
   - `APP_URL`: `https://<your-project>.vercel.app`
5. **Discord OAuth Redirect URI**:
   Add `https://<your-project>.vercel.app/auth/callback` to Redirects in the Discord Developer Portal under OAuth2.

---

### 3. Render Deployment Guide

1. **Create Web Service**:
   - Connect your repository on [Render](https://render.com).
   - Select **Web Service**.
   - Build Command: `bun run build` (or `npm run build`)
   - Start Command: `bun start` (or `npm start`)
2. **Alternative: Render Blueprint**:
   - Render will automatically detect the included `render.yaml` file for 1-click stack creation.
3. **Environment Variables**:
   - `DATABASE_URL`: Your Neon PostgreSQL Connection String
   - `GEMINI_API_KEY`: Your Gemini API Key
   - `DISCORD_CLIENT_ID`: Your Discord OAuth Application Client ID
   - `DISCORD_CLIENT_SECRET`: Your Discord OAuth Application Client Secret
   - `APP_URL`: `https://<your-app>.onrender.com`
4. **Discord OAuth Redirect URI**:
   Add `https://<your-app>.onrender.com/auth/callback` to Redirects in the Discord Developer Portal under OAuth2.

---

## 🛠 Local Development & Package Manager

This project uses **Bun** (or Node / npm) as its package manager.

### Installation

```bash
bun install
# or
npm install
```

### Development Server

Start the development server with Vite hot-reloading + Express server:

```bash
bun dev
# or
npm run dev
```

### Production Build & Local Start

```bash
bun run build && bun start
# or
npm run build && npm start
```

### Type Checking & Linting

```bash
bun run lint
```

---

## 📊 Feature Modules

- **Decision Telemetry**: Automated merit ratios, power baselines, and role classification models.
- **Roster & Snapshot Ledger**: Historical tracking of player growth, troop telemetry, and member notes.
- **War Logs**: Campaign tracking, frontline breach recording, and diplomatic ledger.
- **Import Manager**: Bulk ingestion for game telemetry exports in CSV and XLSX format.
- **AI Kingdom Briefs**: Gemini-powered executive strategic summary for council leaders.
- **Discord OAuth & Farm Linking**: Identity verification, character claims, and farm account management.
