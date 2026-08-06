export const CHAT_LIMITS = {
  maxMessages: 20,
  maxContentLength: 4_000,
  maxTotalContentLength: 16_000,
  maxRequestBytes: 64_000,
} as const;

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export class ChatValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ChatValidationError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseChatRequest(payload: unknown): ChatMessage[] {
  if (!isRecord(payload) || !Array.isArray(payload.messages)) {
    throw new ChatValidationError("The request must include a messages array.");
  }

  if (payload.messages.length === 0) {
    throw new ChatValidationError("At least one message is required.");
  }

  if (payload.messages.length > CHAT_LIMITS.maxMessages) {
    throw new ChatValidationError(
      `A maximum of ${CHAT_LIMITS.maxMessages} messages is allowed.`,
      413,
    );
  }

  let totalContentLength = 0;
  const messages = payload.messages.map((value, index): ChatMessage => {
    if (!isRecord(value)) {
      throw new ChatValidationError(`Message ${index + 1} must be an object.`);
    }

    if (value.role !== "user" && value.role !== "assistant") {
      throw new ChatValidationError(
        `Message ${index + 1} has an unsupported role.`,
      );
    }

    if (typeof value.content !== "string") {
      throw new ChatValidationError(
        `Message ${index + 1} content must be a string.`,
      );
    }

    const content = value.content.trim();
    if (content.length === 0) {
      throw new ChatValidationError(
        `Message ${index + 1} content cannot be empty.`,
      );
    }

    if (content.length > CHAT_LIMITS.maxContentLength) {
      throw new ChatValidationError(
        `Each message is limited to ${CHAT_LIMITS.maxContentLength} characters.`,
        413,
      );
    }

    totalContentLength += content.length;
    return { role: value.role, content };
  });

  if (totalContentLength > CHAT_LIMITS.maxTotalContentLength) {
    throw new ChatValidationError("The conversation is too large.", 413);
  }

  if (messages.at(-1)?.role !== "user") {
    throw new ChatValidationError("The final message must be from the user.");
  }

  return messages;
}
