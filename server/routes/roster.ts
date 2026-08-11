import { Router } from "express";
import { 
  requireSession, 
  getClaimByDiscordId, 
  getClaimByCharacterId, 
  setClaim, 
  releaseClaimByCharacterId, 
  listClaims, 
  getFarmLinks, 
  addFarmLink, 
  getFarmLinkById, 
  deleteFarmLink 
} from "../db";

export const rosterRouter = Router();

// --- CLAIMS ---

// Get all claims
rosterRouter.get("/claims", async (req, res) => {
  const claims = await listClaims();
  res.json({ claims });
});

// Claim a character
rosterRouter.post("/claims", async (req, res) => {
  const session = await requireSession(req);
  if (!session) {
    return res.status(401).json({ error: "You must be logged in to claim a character." });
  }

  const { characterId } = req.body;
  if (!characterId) {
    return res.status(400).json({ error: "characterId is required." });
  }

  // Check if character is already claimed
  const existingClaim = await getClaimByCharacterId(characterId);
  if (existingClaim && existingClaim !== session.discordId) {
    return res.status(403).json({ error: "This character is already claimed by another user." });
  }

  // Check if user already claimed a character
  const userClaim = await getClaimByDiscordId(session.discordId);
  if (userClaim && userClaim !== characterId) {
    return res.status(400).json({ error: "You have already claimed a different character. Release it first." });
  }

  await setClaim(session.discordId, characterId);
  res.json({ ok: true, characterId });
});

// Release a claim
rosterRouter.delete("/claims/:characterId", async (req, res) => {
  const session = await requireSession(req);
  if (!session) {
    return res.status(401).json({ error: "You must be logged in to release a claim." });
  }

  const { characterId } = req.params;
  const currentClaim = await getClaimByCharacterId(characterId);
  
  if (currentClaim !== session.discordId) {
    return res.status(403).json({ error: "You can only release your own claimed character." });
  }

  await releaseClaimByCharacterId(characterId);
  res.json({ ok: true });
});


// --- FARMS ---

// Get farms for a specific character
rosterRouter.get("/farms/:characterId", async (req, res) => {
  const { characterId } = req.params;
  const farms = await getFarmLinks(characterId);
  res.json({ farms });
});

// Add a farm account
rosterRouter.post("/farms", async (req, res) => {
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
});

// Delete a farm account
rosterRouter.delete("/farms/:farmId", async (req, res) => {
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
    return res.status(403).json({ error: "You can only remove farm accounts linked to your claimed character." });
  }

  await deleteFarmLink(req.params.farmId);
  res.json({ ok: true });
});