import { NextRequest, NextResponse } from "next/server";
import { AIConfigurationError, generateChatResponse } from "@/lib/ai";
import {
  CHAT_LIMITS,
  ChatValidationError,
  parseChatRequest,
} from "@/lib/chat-validation";
import { consumeRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";

function rateLimitHeaders(result: ReturnType<typeof consumeRateLimit>) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1_000)),
  };
}

export async function POST(request: NextRequest) {
  const rateLimit = consumeRateLimit(getClientIdentifier(request.headers));
  const responseHeaders = rateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          ...responseHeaders,
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const declaredLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > CHAT_LIMITS.maxRequestBytes
    ) {
      throw new ChatValidationError("The request body is too large.", 413);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > CHAT_LIMITS.maxRequestBytes) {
      throw new ChatValidationError("The request body is too large.", 413);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new ChatValidationError("The request body must be valid JSON.");
    }

    const messages = parseChatRequest(payload);
    const response = await generateChatResponse(messages);

    return NextResponse.json({ response }, { headers: responseHeaders });
  } catch (error: unknown) {
    if (error instanceof ChatValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: responseHeaders },
      );
    }

    if (error instanceof AIConfigurationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503, headers: responseHeaders },
      );
    }

    const diagnostic =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { name: "UnknownError" };
    console.error("Chat provider request failed", diagnostic);

    return NextResponse.json(
      { error: "The AI provider is temporarily unavailable." },
      { status: 502, headers: responseHeaders },
    );
  }
}
