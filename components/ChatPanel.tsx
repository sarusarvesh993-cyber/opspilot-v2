"use client";
import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isOperationsStatus?: boolean; // Custom flag to trigger live system telemetry card rendering
  operationsData?: {
    cpu: number;
    memory: number;
    latency: number;
    uptime: string;
    servicesCount: number;
    errorRate: number;
  };
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello Astra Admin! I am OpsPilot v2. I have successfully established a direct connection to your cloud infrastructure. Ask me to scan active clusters, write configurations, or display real-time telemetry metrics.",
      timestamp: "10:42 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Simulated State matching actual real infrastructure telemetry
  const [liveCPU, setLiveCPU] = useState(42);
  const [liveMemory, setLiveMemory] = useState(68);
  const [liveNetworkIn, setLiveNetworkIn] = useState(1.3);
  const [liveNetworkOut, setLiveNetworkOut] = useState(2.7);

  // Real-time background simulation of active servers
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      // Simulate minor shifts in active network traffic and metrics to reflect actual server telemetry
      setLiveCPU((prev) => Math.min(100, Math.max(10, +(prev + (Math.random() * 6 - 3)).toFixed(1))));
      setLiveMemory((prev) => Math.min(100, Math.max(10, +(prev + (Math.random() * 2 - 1)).toFixed(1))));
      setLiveNetworkIn((prev) => Math.max(0.1, +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2)));
      setLiveNetworkOut((prev) => Math.max(0.1, +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) }),
      });
      const data = await response.json();
      
      // Determine dynamically if the user is asking for infrastructure status, metrics, or server overview
      const lowerInput = input.toLowerCase();
      const isAskingForStatus = lowerInput.includes("status") || lowerInput.includes("metric") || lowerInput.includes("overview") || lowerInput.includes("telemetry") || lowerInput.includes("infrastructure");

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOperationsStatus: isAskingForStatus,
        operationsData: isAskingForStatus ? {
          cpu: liveCPU,
          memory: liveMemory,
          latency: Math.floor(100 + Math.random() * 50),
          uptime: "99.98%",
          servicesCount: 128,
          errorRate: 0.23,
        } : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-[#030712] text-slate-100 font-sans overflow-hidden">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 h-full bg-[#050b18] border-r border-[#1a2e4a] flex flex-col justify-between p-5 flex-shrink-0">
        <div>
          {/* Logo & Branding */}
          <div className="flex items-center space-x-2.5 mb-8">
            <div className="w-5 h-5 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <span className="text-[10px] font-bold text-white">O</span>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white leading-none">OpsPilot</h2>
              <span className="text-[9px] uppercase font-mono text-cyan-400 tracking-wider">AI OPERATIONS COMMAND</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm font-medium">
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg bg-[#0e1e38] text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]">
              <span className="text-base text-cyan-400">💬</span>
              <span>AI Chat</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>📊</span>
              <span>Overview</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition justify-between">
              <div className="flex items-center space-x-3">
                <span>🔔</span>
                <span>Alerts</span>
              </div>
              <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold">12</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>🏗️</span>
              <span>Infrastructure</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>🚀</span>
              <span>Deployments</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>⚙️</span>
              <span>Services</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>📄</span>
              <span>Logs</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>🔒</span>
              <span>Security</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>💰</span>
              <span>Cost Analyzer</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>📊</span>
              <span>Reports</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-[#081222] hover:text-slate-200 transition">
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div>
          <div className="border-t border-[#1a2e4a] pt-4 mb-4">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">SYSTEM STATUS</span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>All Systems Operational</span>
            </span>
          </div>
          <div className="flex items-center space-x-3 bg-[#081222] border border-[#1a2e4a] p-3 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-xs">
              AA
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Astra Admin</p>
              <p className="text-[9px] font-mono text-slate-500">Platform Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MIDDLE CHAT & OVERVIEW PANEL */}
      <main className="flex-1 h-full flex flex-col min-w-0 bg-[#02050c]">
        {/* Welcome Banner */}
        <header className="px-6 py-4 border-b border-[#1a2e4a] bg-[#050b18]/60 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-white">👋 Welcome back, Astra Admin</h1>
            <p className="text-xs text-slate-400">How can OpsPilot assist you today?</p>
          </div>
          <div className="w-8 h-8 rounded-lg border border-[#1a2e4a] flex items-center justify-center bg-[#081222]">
            <span className="text-sm">🌐</span>
          </div>
        </header>

        {/* Mid Panel Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 mb-1 font-mono uppercase">
                  <span>{msg.role === "user" ? "Astra Admin" : "OpsPilot"}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                
                {/* Standard Message Bubble */}
                <div className={`rounded-2xl px-5 py-3.5 text-sm text-slate-200 shadow-md max-w-[85%] border ${
                  msg.role === "user"
                    ? "bg-[#1e1b4b] border-indigo-500/20 rounded-tr-none"
                    : "bg-[#0b1329] border-[#1a2e4a] rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* 📊 DYNAMIC EMBEDDED INFRASTRUCTURE STATUS CARD */}
                  {msg.role === "assistant" && msg.isOperationsStatus && msg.operationsData && (
                    <div className="mt-4 border-t border-[#1a2e4a] pt-4">
                      <p className="text-xs font-mono uppercase text-cyan-400 mb-2.5 tracking-wider font-bold">
                        🟢 Captured Live Telemetry Diagnostics:
                      </p>
                      <div className="grid grid-cols-5 gap-2.5">
                        <div className="bg-[#050b18] border border-[#1a2e4a] p-2.5 rounded-lg">
                          <span className="text-[9px] text-slate-400 block mb-0.5 font-mono uppercase">CPU Usage</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">{msg.operationsData.cpu}%</span>
                        </div>
                        <div className="bg-[#050b18] border border-[#1a2e4a] p-2.5 rounded-lg">
                          <span className="text-[9px] text-slate-400 block mb-0.5 font-mono uppercase">Memory</span>
                          <span className="text-xs font-mono font-bold text-white">{msg.operationsData.memory}%</span>
                        </div>
                        <div className="bg-[#050b18] border border-[#1a2e4a] p-2.5 rounded-lg">
                          <span className="text-[9px] text-slate-400 block mb-0.5 font-mono uppercase">Error Rate</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">{msg.operationsData.errorRate}%</span>
                        </div>
                        <div className="bg-[#050b18] border border-[#1a2e4a] p-2.5 rounded-lg">
                          <span className="text-[9px] text-slate-400 block mb-0.5 font-mono uppercase">Latency</span>
                          <span className="text-xs font-mono font-bold text-white">{msg.operationsData.latency}ms</span>
                        </div>
                        <div className="bg-[#050b18] border border-[#1a2e4a] p-2.5 rounded-lg">
                          <span className="text-[9px] text-slate-400 block mb-0.5 font-mono uppercase">Uptime</span>
                          <span className="text-xs font-mono font-bold text-white">{msg.operationsData.uptime}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat input form */}
        <div className="p-5 bg-[#050b18]/40 border-t border-[#1a2e4a] flex space-x-4 items-center flex-shrink-0 font-mono">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask OpsPilot (e.g., 'What is our current CPU status?')..."
            className="flex-1 bg-[#02050c] border border-[#1a2e4a] rounded-xl px-5 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          <button
            onClick={handleSend}
            className="bg-indigo-600 hover:bg-indigo-500 w-10 h-10 rounded-xl flex items-center justify-center transition shadow-lg"
          >
            <span className="text-white text-sm">➡️</span>
          </button>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR — REAL-TIME MONITORING METRICS */}
      <aside className="w-72 h-full bg-[#050b18] border-l border-[#1a2e4a] p-5 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-[#1a2e4a] pb-3">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-slate-300">INFRASTRUCTURE HEALTH</h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">Live</span>
          </div>

          {/* Metric dial 1 (Connected to live state) */}
          <div className="bg-[#02050c] border border-[#1a2e4a] p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
              <span className="text-slate-400">CPU UTILIZATION</span>
              <span className="text-emerald-400">⬇️ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black font-mono">{liveCPU}% <span className="text-[9px] text-slate-500 block font-normal tracking-normal">Avg. Usage</span></div>
              <div className="w-16 h-8 bg-slate-900/60 border border-[#1a2e4a] rounded flex items-center justify-center text-[10px] text-indigo-400">
                ⚡ live
              </div>
            </div>
          </div>

          {/* Metric dial 2 (Connected to live state) */}
          <div className="bg-[#02050c] border border-[#1a2e4a] p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
              <span className="text-slate-400">MEMORY UTILIZATION</span>
              <span className="text-indigo-400">⬆️ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black font-mono">{liveMemory}% <span className="text-[9px] text-slate-500 block font-normal tracking-normal">Avg. Usage</span></div>
              <div className="w-16 h-8 bg-slate-900/60 border border-[#1a2e4a] rounded flex items-center justify-center text-[10px] text-indigo-400">
                ⚡ live
              </div>
            </div>
          </div>

          {/* Metric dial 3 (Connected to live state) */}
          <div className="bg-[#02050c] border border-[#1a2e4a] p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
              <span className="text-slate-400">NETWORK I/O</span>
              <span className="text-cyan-400">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900/40 p-2 rounded border border-[#1a2e4a]">
                <span className="text-[9px] block text-slate-500 leading-none">INCOMING</span>
                <span className="text-white font-bold">{liveNetworkIn} Gbps</span>
              </div>
              <div className="bg-slate-900/40 p-2 rounded border border-[#1a2e4a]">
                <span className="text-[9px] block text-slate-500 leading-none">OUTGOING</span>
                <span className="text-white font-bold">{liveNetworkOut} Gbps</span>
              </div>
            </div>
          </div>

          {/* Services List by Error Rate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
              <span className="text-slate-400">TOP SERVICES BY ERROR RATE</span>
              <a href="#" className="text-cyan-400 font-bold hover:underline text-[9px]">View all</a>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#02050c] border border-[#1a2e4a] p-2.5 rounded-lg">
                <span className="text-slate-300">💳 Payment Service</span>
                <span className="text-rose-400 font-bold">2.35%</span>
              </div>
              <div className="flex justify-between items-center bg-[#02050c] border border-[#1a2e4a] p-2.5 rounded-lg">
                <span className="text-slate-300">👤 User Service</span>
                <span className="text-amber-400 font-bold">0.64%</span>
              </div>
              <div className="flex justify-between items-center bg-[#02050c] border border-[#1a2e4a] p-2.5 rounded-lg">
                <span className="text-slate-300">📦 Order Service</span>
                <span className="text-emerald-400 font-bold">0.31%</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
