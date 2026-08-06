import { OpenAI } from "openai";
import type { ChatMessage } from "./chat-validation.ts";

const DEFAULT_MODEL = "gpt-4o-mini";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const SYSTEM_PROMPT = `You are OpsPilot v2, a DevSecOps learning assistant.
Help users reason about Kubernetes, Terraform, CI/CD, observability, incident response, and secure infrastructure practices.
Be concise, technical, and structured. Clearly distinguish examples from verified facts.
Never claim that you inspected, changed, deployed, or remediated real infrastructure: this application has no cloud credentials or execution tools.`;

interface AIEnvironment {
  [key: string]: string | undefined;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_MODEL?: string;
  OPENAI_MAX_OUTPUT_TOKENS?: string;
}

export interface AIConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
  maxOutputTokens: number;
  isOpenRouter: boolean;
}

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

function parseMaxOutputTokens(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 900;
  }
  return Math.min(2_000, Math.max(100, parsed));
}

export function resolveAIConfig(env: AIEnvironment): AIConfig {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("replace-")) {
    throw new AIConfigurationError(
      "AI chat is not configured. Set OPENAI_API_KEY on the server.",
    );
  }

  const configuredBaseURL = env.OPENAI_BASE_URL?.trim() || undefined;
  const isOpenRouter =
    apiKey.startsWith("sk-or-") ||
    configuredBaseURL?.includes("openrouter.ai") === true;
  const baseURL = configuredBaseURL || (isOpenRouter ? OPENROUTER_BASE_URL : undefined);

  let model = env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  if (isOpenRouter && model === DEFAULT_MODEL) {
    model = `openai/${DEFAULT_MODEL}`;
  }

  return {
    apiKey,
    baseURL,
    model,
    maxOutputTokens: parseMaxOutputTokens(env.OPENAI_MAX_OUTPUT_TOKENS),
    isOpenRouter,
  };
}

export async function generateChatResponse(
  messages: ChatMessage[],
): Promise<string> {
  const config = resolveAIConfig(process.env);
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    maxRetries: 1,
    timeout: 25_000,
    defaultHeaders: config.isOpenRouter
      ? {
          "HTTP-Referer": "https://github.com/sarusarvesh993-cyber/opspilot-v2",
          "X-Title": "OpsPilot v2",
        }
      : undefined,
  });

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(({ role, content }) => ({ role, content })),
    ],
    temperature: 0.2,
    max_completion_tokens: config.maxOutputTokens,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("The AI provider returned an empty response.");
  }

  return content;
}
