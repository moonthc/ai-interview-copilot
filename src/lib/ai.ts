import OpenAI from "openai";

export const ai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

export const visionAi = new OpenAI({
  apiKey: process.env.LONGCAT_API_KEY,
  baseURL: process.env.LONGCAT_BASE_URL,
});

export const AI_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
export const AI_VISION_MODEL = process.env.LONGCAT_MODEL || "LongCat-Flash-Omni-2603";