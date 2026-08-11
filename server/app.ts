import express from "express";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth";
import { stateRouter } from "./routes/state";
import { rosterRouter } from "./routes/roster";
import { aiRouter } from "./routes/ai";

dotenv.config();

export const app = express();

// Middleware
app.use(express.json());

// Apply Routers
app.use("/api/auth", authRouter);
app.use("/api/state", stateRouter);
app.use("/api/roster", rosterRouter); // Use for both /claims and /farms
app.use("/api/ai", aiRouter);

// Basic health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});