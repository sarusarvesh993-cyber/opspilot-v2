import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse, Message } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages parameter" }, { status: 400 });
    }

    const enrichedMessages: Message[] = [
      {
        role: "system",
        content: "You are OpsPilot v2, an elite enterprise AI Copilot for DevSecOps, Infrastructure, and Systems Engineering. You assist with kubernetes, terraform, pipelines, monitoring, and live log diagnostics. Keep your answers highly precise, clean, technical, and structured.",
      },
      ...messages,
    ];

    const aiResponse = await generateChatResponse(enrichedMessages);
    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error("API Chat Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}