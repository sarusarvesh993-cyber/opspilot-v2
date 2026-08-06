import type { Telemetry } from "./types";

function MetricCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-[#1a2e4a] bg-[#02050c] p-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className={color}>Simulated</span>
      </div>
      <div className="font-mono text-2xl font-black">
        {value}
        <span className="block text-[9px] font-normal tracking-normal text-slate-500">{detail}</span>
      </div>
    </div>
  );
}

export function TelemetrySidebar({ telemetry }: { telemetry: Telemetry }) {
  return (
    <aside className="hidden h-full w-72 flex-shrink-0 flex-col overflow-y-auto border-l border-[#1a2e4a] bg-[#050b18] p-5 2xl:flex">
      <div className="mb-6 flex items-center justify-between border-b border-[#1a2e4a] pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Demo telemetry</h2>
        <span className="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">
          Mock data
        </span>
      </div>

      <div className="space-y-4">
        <MetricCard label="CPU" value={`${telemetry.cpu}%`} detail="Browser-generated utilization" color="text-emerald-400" />
        <MetricCard label="Memory" value={`${telemetry.memory}%`} detail="Browser-generated allocation" color="text-indigo-400" />

        <div className="space-y-3 rounded-xl border border-[#1a2e4a] bg-[#02050c] p-4">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span className="text-slate-400">Network I/O</span>
            <span className="text-cyan-400">Simulated</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="rounded border border-[#1a2e4a] bg-slate-900/40 p-2">
              <span className="block text-[9px] text-slate-500">Incoming</span>
              <span className="font-bold text-white">{telemetry.networkIn} Gbps</span>
            </div>
            <div className="rounded border border-[#1a2e4a] bg-slate-900/40 p-2">
              <span className="block text-[9px] text-slate-500">Outgoing</span>
              <span className="font-bold text-white">{telemetry.networkOut} Gbps</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] leading-relaxed text-amber-200/80">
        Portfolio demo: this panel is not connected to production infrastructure.
      </div>
    </aside>
  );
}
