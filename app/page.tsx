import React from "react";
import ChatPanel from "@/components/ops-pilot/ChatPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 font-sans antialiased overflow-hidden">
      <ChatPanel />
    </main>
  );
}