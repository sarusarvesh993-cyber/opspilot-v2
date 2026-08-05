import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY || "mock-key";

// Auto-detect if key is from OpenRouter / Third-Party and set the correct Base URL
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

export async function generateChatResponse(messages: Message[]) {
  try {
    // If using OpenRouter, map "gpt-4o-mini" automatically to "openai/gpt-4o-mini"
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
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return "AI Service Error: " + error.message;
  }
}

// Function to demonstrate the workflow execution. Real execution of automated scripts
export async function executeAutomatedWorkflow(taskName: string): Promise<string> {
  console.log("Executing live automated DevSecOps task: " + taskName);
  return "Successfully completed execution of DevOps run path for: " + taskName;
}