"use client";

import type { FormEvent, RefObject } from "react";
import { CHAT_LIMITS } from "@/lib/chat-validation";
import type { DisplayMessage } from "./types";

interface ChatWorkspaceProps {
  messages: DisplayMessage[];
  input: string;
  loading: boolean;
  error: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

function renderMessageContent(text: string) {
  return text.split("\n").map((rawLine, index) => {
    let line = rawLine.trim();
    if (!line) {
      return <div key={`space-${index}`} className="h-2" aria-hidden="true" />;
    }

    line = line
      .replace(/^#{1,6}\s+/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");

    const isBullet = /^[-*]{1,3}\s+/.test(line);
    line = line.replace(/^[-*]{1,3}\s+/, "");

    if (isBullet) {
      return (
        <div key={index} className="flex items-start gap-2 py-1 pl-2">
          <span className="font-bold text-cyan-400" aria-hidden="true">
            •
          </span>
          <span className="text-sm leading-relaxed text-slate-200">{line}</span>
        </div>
      );
    }

    return (
      <p key={index} className="mb-1.5 text-sm leading-relaxed text-slate-200">
        {line}
      </p>
    );
  });
}

function OperationsCard({ message }: { message: DisplayMessage }) {
  const data = message.operationsData;
  if (!data) return null;

  const values = [
    ["CPU", `${data.cpu}%`],
    ["Memory", `${data.memory}%`],
    ["Error rate", `${data.errorRate}%`],
    ["Latency", `${data.latency}ms`],
    ["Uptime", data.uptime],
  ];

  return (
    <div className="mt-4 border-t border-[#1a2e4a] pt-4">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
        Simulated telemetry snapshot
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {values.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#1a2e4a] bg-[#050b18] p-2.5">
            <span className="mb-0.5 block text-[9px] uppercase text-slate-400">
              {label}
            </span>
            <span className="text-xs font-bold text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatWorkspace({
  messages,
  input,
  loading,
  error,
  messagesEndRef,
  onInputChange,
  onSubmit,
  onClear,
}: ChatWorkspaceProps) {
  return (
    <section aria-labelledby="chat-heading" className="flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="chat-heading" className="text-sm font-semibold text-slate-200">
          DevSecOps assistant
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={loading}
          className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear conversation
        </button>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-busy={loading}
        className="flex-1 overflow-y-auto pr-1 sm:pr-2"
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase text-slate-500">
                <span>{message.role === "user" ? "Demo Operator" : "OpsPilot"}</span>
                <span aria-hidden="true">•</span>
                <time>{message.timestamp}</time>
              </div>
              <div
                className={`max-w-[92%] rounded-2xl border px-4 py-3 text-sm shadow-md sm:max-w-[85%] sm:px-5 sm:py-3.5 ${
                  message.role === "user"
                    ? "rounded-tr-none border-indigo-500/20 bg-[#1e1b4b]"
                    : "rounded-tl-none border-[#1a2e4a] bg-[#0b1329]"
                }`}
              >
                {renderMessageContent(message.content)}
                <OperationsCard message={message} />
              </div>
            </article>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              OpsPilot is preparing a response…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-shrink-0 items-center gap-2 rounded-2xl border border-[#1a2e4a] bg-[#050b18]/60 p-2 sm:gap-4 sm:p-4"
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask OpsPilot a DevSecOps question
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          maxLength={CHAT_LIMITS.maxContentLength}
          disabled={loading}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Ask about Kubernetes, Terraform, CI/CD, or incident response…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-[#1a2e4a] bg-[#02050c] px-3 py-3 text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 sm:px-5"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  );
}
