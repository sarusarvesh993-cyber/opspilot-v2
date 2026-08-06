"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CHAT_LIMITS } from "@/lib/chat-validation";
import { ChatWorkspace } from "./ChatWorkspace";
import { Navigation } from "./Navigation";
import { TelemetrySidebar } from "./TelemetrySidebar";
import type { DisplayMessage, WorkspaceTab } from "./types";
import { useSimulatedTelemetry } from "./use-simulated-telemetry";
import { WorkspacePanels } from "./WorkspacePanels";

const WELCOME_MESSAGE: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to OpsPilot v2. Ask a DevSecOps question, or explore the clearly labelled simulated metrics, security, and diagnostics workspaces.",
  timestamp: "Demo session",
};

function createMessageId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function timestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractError(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return null;
}

function extractResponse(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "response" in payload &&
    typeof payload.response === "string"
  ) {
    return payload.response;
  }
  return null;
}

export default function ChatPanel() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("chat");
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const telemetry = useSimulatedTelemetry();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMessage: DisplayMessage = {
      id: createMessageId(),
      role: "user",
      content: prompt,
      timestamp: timestamp(),
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const apiMessages = nextMessages
        .slice(-CHAT_LIMITS.maxMessages)
        .map(({ role, content }) => ({ role, content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractError(payload) ?? "The request could not be completed.");
      }

      const content = extractResponse(payload);
      if (!content) {
        throw new Error("The server returned an invalid response.");
      }

      const asksForStatus = /status|metric|overview|telemetry|infrastructure/i.test(prompt);
      const assistantMessage: DisplayMessage = {
        id: createMessageId(),
        role: "assistant",
        content,
        timestamp: timestamp(),
        operationsData: asksForStatus
          ? {
              cpu: telemetry.cpu,
              memory: telemetry.memory,
              latency: Math.floor(100 + Math.random() * 50),
              uptime: "99.98%",
              errorRate: 0.23,
            }
          : undefined,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof DOMException && requestError.name === "AbortError"
          ? "The request timed out. Please try again."
          : requestError instanceof Error
            ? requestError.message
            : "An unexpected error occurred.";
      setError(message);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#030712] text-slate-100">
      <aside className="hidden h-full w-64 flex-shrink-0 flex-col justify-between border-r border-[#1a2e4a] bg-[#050b18] p-5 lg:flex">
        <div>
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-tr from-cyan-500 to-indigo-500 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              O
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-white">OpsPilot</p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-cyan-400">AI operations demo</p>
            </div>
          </div>
          <Navigation activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div>
          <div className="mb-4 border-t border-[#1a2e4a] pt-4">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">Environment</span>
            <span className="flex items-center gap-1.5 text-[11px] text-cyan-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Portfolio demonstration
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#1a2e4a] bg-[#081222] p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">DO</div>
            <div>
              <p className="text-xs font-bold text-slate-200">Demo Operator</p>
              <p className="text-[9px] text-slate-500">Read-only session</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex h-full min-w-0 flex-1 flex-col bg-[#02050c]">
        <header className="flex-shrink-0 border-b border-[#1a2e4a] bg-[#050b18]/70 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-white sm:text-base">OpsPilot v2</h1>
              <p className="text-[11px] text-slate-400 sm:text-xs">AI chat with transparent infrastructure simulations</p>
            </div>
            <a
              href="https://github.com/sarusarvesh993-cyber/opspilot-v2"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#1a2e4a] bg-[#081222] px-3 py-2 text-[10px] text-slate-300 transition hover:border-cyan-500/40 hover:text-white"
            >
              GitHub ↗
            </a>
          </div>
          <div className="mt-3 overflow-x-auto lg:hidden">
            <Navigation activeTab={activeTab} onChange={setActiveTab} compact />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-6">
          {activeTab === "chat" ? (
            <ChatWorkspace
              messages={messages}
              input={input}
              loading={loading}
              error={error}
              messagesEndRef={messagesEndRef}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              onClear={() => {
                setMessages([WELCOME_MESSAGE]);
                setError(null);
              }}
            />
          ) : (
            <WorkspacePanels activeTab={activeTab} telemetry={telemetry} />
          )}
        </div>
      </main>

      <TelemetrySidebar telemetry={telemetry} />
    </div>
  );
}
