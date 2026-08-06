"use client";

import { useState } from "react";
import type { Telemetry, WorkspaceTab } from "./types";

interface WorkspacePanelsProps {
  activeTab: Exclude<WorkspaceTab, "chat">;
  telemetry: Telemetry;
}

function statusClasses(status: "nominal" | "warning" | "critical") {
  if (status === "nominal") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }
  if (status === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }
  return "border-rose-500/20 bg-rose-500/10 text-rose-400";
}

function MetricsPanel({ telemetry }: { telemetry: Telemetry }) {
  const metrics = [
    { name: "CPU utilization", value: telemetry.cpu, unit: "%", status: "nominal" as const },
    { name: "Memory allocation", value: telemetry.memory, unit: "%", status: "warning" as const },
    { name: "API latency", value: 120, unit: "ms", status: "nominal" as const },
    { name: "Database pool", value: 92, unit: "%", status: "critical" as const },
  ];

  return (
    <section aria-labelledby="metrics-heading" className="h-full overflow-y-auto">
      <div className="mb-4">
        <h2 id="metrics-heading" className="text-base font-semibold text-white">
          Simulated metrics
        </h2>
        <p className="text-xs text-slate-500">Generated in the browser for UI demonstration only.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <article key={metric.name} className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#1a2e4a] bg-[#0b1329] p-5 shadow-md sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs uppercase text-slate-400">{metric.name}</span>
              <span className={`rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusClasses(metric.status)}`}>
                {metric.status}
              </span>
            </div>
            <div className="font-mono text-4xl font-extrabold text-white">
              {metric.value}
              <span className="ml-1 text-lg text-slate-400">{metric.unit}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SecurityPanel() {
  const [logs, setLogs] = useState([
    "[DEMO-001] Started a simulated CIS benchmark review.",
    "[DEMO-002] Example finding: public SSH ingress on worker-04.",
    "[DEMO-003] Suggested remediation: restrict the security-group CIDR.",
  ]);

  return (
    <section aria-labelledby="security-heading" className="flex h-full flex-col rounded-2xl border border-[#1a2e4a] bg-[#0b1329] p-4 shadow-md sm:p-6">
      <div className="mb-4">
        <h2 id="security-heading" className="text-base font-semibold text-white">
          Security audit simulation
        </h2>
        <p className="text-xs text-slate-500">No network scan or cloud action is performed.</p>
      </div>
      <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-[#1a2e4a] bg-[#02050c] p-4 font-mono text-xs text-cyan-300">
        {logs.map((log, index) => (
          <div key={`${index}-${log}`}>
            <span className="text-indigo-400" aria-hidden="true">&gt;&gt;</span> {log}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          setLogs((current) => [
            ...current,
            `[DEMO-${String(current.length + 1).padStart(3, "0")}] Simulated scan completed; review example controls manually.`,
          ])
        }
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:from-cyan-500 hover:to-indigo-500"
      >
        Run simulated audit
      </button>
    </section>
  );
}

function DiagnosticsPanel() {
  const [diagnostic, setDiagnostic] = useState<{ file: string; result: string } | null>(null);

  function simulate(file: string) {
    setDiagnostic({
      file,
      result:
        "[OK] Example DNS records match the sample VPC configuration.\n[WARN] Example socket reuse count is above the demo threshold.\n[NEXT] Review keep-alive settings before making a real change.",
    });
  }

  return (
    <section aria-labelledby="diagnostics-heading" className="flex h-full flex-col overflow-y-auto rounded-2xl border border-[#1a2e4a] bg-[#0b1329] p-4 shadow-md sm:p-6">
      <div>
        <h2 id="diagnostics-heading" className="text-base font-semibold text-white">
          File diagnostics simulation
        </h2>
        <p className="text-xs text-slate-500">Choose a bundled scenario; no file is uploaded or parsed.</p>
      </div>

      <div className="mt-4 rounded-xl border-2 border-dashed border-[#1a2e4a] bg-[#02050c]/60 p-6 text-center">
        <span className="mb-2 block text-3xl" aria-hidden="true">📄</span>
        <p className="mb-3 text-xs font-semibold text-slate-300">Sample cloud diagnostics</p>
        <div className="flex flex-wrap justify-center gap-2">
          {["ingress-nginx.log", "vpc-egress-route.json"].map((file) => (
            <button
              key={file}
              type="button"
              onClick={() => simulate(file)}
              className="rounded border border-[#1a2e4a] bg-[#050b18] px-3 py-1.5 text-[10px] font-bold transition hover:border-cyan-500/40"
            >
              {file}
            </button>
          ))}
        </div>
      </div>

      {diagnostic && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-[#1a2e4a] bg-[#02050c] p-4 font-mono text-[11px] leading-relaxed text-cyan-300">
          <div className="mb-2 border-b border-[#1a2e4a] pb-1.5 font-bold text-slate-400">
            Simulated output: {diagnostic.file}
          </div>
          {diagnostic.result}
        </div>
      )}

      <button
        type="button"
        onClick={() => setDiagnostic(null)}
        disabled={!diagnostic}
        className="mt-auto w-full rounded-xl border border-[#1a2e4a] bg-[#050b18] py-3 text-xs font-bold uppercase tracking-widest text-slate-400 transition hover:border-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Reset simulation
      </button>
    </section>
  );
}

export function WorkspacePanels({ activeTab, telemetry }: WorkspacePanelsProps) {
  if (activeTab === "metrics") return <MetricsPanel telemetry={telemetry} />;
  if (activeTab === "security") return <SecurityPanel />;
  return <DiagnosticsPanel />;
}
