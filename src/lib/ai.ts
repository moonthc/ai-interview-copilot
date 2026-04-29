import OpenAI from "openai";

export const ai = new OpenAI({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL,
});

export const AI_MODEL = process.env.MIMO_MODEL || "mimo-v2.5-pro";
export const AI_VISION_MODEL = process.env.MIMO_VISION_MODEL || "mimo-v2.5";