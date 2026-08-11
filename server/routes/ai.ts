import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireSession } from "../db";

export const aiRouter = Router();

// Check if Gemini is configured
aiRouter.get("/status", (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  res.json({ configured: isConfigured });
});

// Generate Intelligence Brief
aiRouter.post("/generate-brief", async (req, res) => {
  // Ensure the user is an authenticated officer
  const session = await requireSession(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized. Officer authentication required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Gemini API key is not configured on the server." });
  }

  const { prompt, telemetryData } = req.body;
  if (!prompt || !telemetryData) {
    return res.status(400).json({ error: "Missing prompt or telemetry data." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct the context-aware prompt
    const systemInstruction = `You are a strategic advisor for a Call of Dragons alliance named 'Dragon Council'. 
    Analyze the provided player telemetry and metrics. Provide actionable, concise, and tactical advice. 
    Focus on compliance targets, role misalignments, and overall war readiness.`;

    const fullPrompt = `
      ${systemInstruction}
      
      Telemetry Data:
      ${JSON.stringify(telemetryData, null, 2)}
      
      Officer Query:
      ${prompt}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate intelligence brief." });
  }
});