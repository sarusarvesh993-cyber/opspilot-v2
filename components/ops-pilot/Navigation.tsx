"use client";

import type { WorkspaceTab } from "./types";

interface NavigationProps {
  activeTab: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
  compact?: boolean;
}

const tabs: Array<{ id: WorkspaceTab; icon: string; label: string }> = [
  { id: "chat", icon: "💬", label: "AI Chat" },
  { id: "metrics", icon: "📊", label: "Metrics" },
  { id: "security", icon: "🛡️", label: "Security" },
  { id: "diagnostics", icon: "📂", label: "Diagnostics" },
];

export function Navigation({ activeTab, onChange, compact = false }: NavigationProps) {
  return (
    <nav
      aria-label="OpsPilot workspaces"
      className={compact ? "flex min-w-max gap-2" : "space-y-1 text-sm font-medium"}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
            className={
              compact
                ? `flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                    active
                      ? "border-cyan-500/30 bg-[#0e1e38] text-cyan-300"
                      : "border-[#1a2e4a] bg-[#050b18] text-slate-400"
                  }`
                : `flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition ${
                    active
                      ? "border-cyan-500/20 bg-[#0e1e38] text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.05)]"
                      : "border-transparent bg-transparent text-slate-400 hover:bg-[#081222] hover:text-slate-200"
                  }`
            }
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
