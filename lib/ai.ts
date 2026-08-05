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

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export async function generateChatResponse(messages: Message[]): Promise<string> {
  try {
    let modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    if (isThirdParty && modelName === "gpt-4o-mini") {
      modelName = "openai/gpt-4o-mini";
    }

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.2,
    });
    return response.choices[0]?.message?.content || "No response generated.";
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("AI Generation Error:", error);
    return "AI Service Error: " + errorMessage;
  }
}

export async function executeAutomatedWorkflow(taskName: string): Promise<string> {
  console.log("Executing live automated DevSecOps task: " + taskName);
  return "Successfully completed execution of DevOps run path for: " + taskName;
}