import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY || "mock-key";

const isThirdParty = apiKey.startsWith("sk-or-");
const baseURL = isThirdParty ? "https://openrouter.ai/api/v1" : undefined;

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  defaultHeaders: isThirdParty ? {
    "HTTP-Referer": "https://github.com/yourusername/opspilot-v2",
    "X-Title": "OpsPilot Enterprise Console",
  } : undefined
});

export async function analyzeImage(imageBuffer: Buffer): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this infrastructure diagram or log snippet in detail." },
            {
              type: "image_url",
              image_url: {
                url: "data:image/jpeg;base64," + imageBuffer.toString("base64")
              }
            }
          ]
        }
      ]
    });
    return response.choices[0]?.message?.content || "No description generated.";
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Image Analysis Error:", error);
    return "Failed to analyze image: " + errorMessage;
  }
}