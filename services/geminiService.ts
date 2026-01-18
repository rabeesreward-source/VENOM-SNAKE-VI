
import { GoogleGenAI } from "@google/genai";

export async function getCityNews() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate 5 short, hilarious, satirical 'Vice City' style news headlines for a game called 'Street Life VI'. Use Florida/Miami stereotypes, neon vibes, and GTA humor. Keep them under 10 words. Return as a JSON array of strings.",
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to fetch city news:", error);
    return [
      "Alligator spotted wearing neon sunglasses in mall",
      "Local man tries to pay rent with stolen coins",
      "Pink flamingos staging protest at city hall",
      "New law makes Hawaiian shirts mandatory on Fridays",
      "Speedboats banned for being 'too awesome'"
    ];
  }
}
