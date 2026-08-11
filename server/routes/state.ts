import { Router } from "express";
import { getAppState, saveAppState } from "../db";

export const stateRouter = Router();

stateRouter.get("/", async (req, res) => {
  try {
    const state = await getAppState();
    res.json({ state });
  } catch (error) {
    console.error("Error fetching state:", error);
    res.status(500).json({ error: "Failed to fetch state" });
  }
});

stateRouter.put("/", async (req, res) => {
  try {
    const newState = req.body;
    await saveAppState(newState);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error saving state:", error);
    res.status(500).json({ error: "Failed to save state" });
  }
});