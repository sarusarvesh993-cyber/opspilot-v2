# OpsPilot v2 — Technical Architecture

This document details the system architecture, component dependencies, data flow, and runtime environment of the OpsPilot v2 system.

---

## 🏛️ System Topology

OpsPilot v2 is designed as a modular, standalone Next.js server utilizing Server-Side rendering and Client Hydration for a split-view interactive panel.
   [ Client Browser ]
           │
           ▼  (HTTPS / REST)
  [ Next.js Edge Server ]
     ├── Route Handlers (/api/chat)
     └── Server Components
           │
           ├─► [ pdf-parse ] ──► (In-memory Buffer extraction)
           ├─► [ OpenAI SDK ] ──► [ OpenRouter / OpenAI API ]
           └─► [ Live Metric Simulator ]

---

## 💾 Core Subsystems

### 1. Unified Multi-Provider AI Client (lib/ai.ts)
The client dynamically inspects the credentials supplied through the runtime environment. If the API key starts with \sk-or-\, the client overrides default base targets to route payloads to OpenRouter's low-latency proxy. It maps base model IDs such as \gpt-4o-mini\ to \openai/gpt-4o-mini\ to avoid configuration friction.

### 2. Multi-Stage Standalone Dockerization (Dockerfile)
Optimized for zero-overhead Kubernetes deployments, the Dockerfile isolates dependencies inside a multi-stage compilation loop. Next.js standalone file tracing generates minimal dependency maps, shrinking execution footprints to \<120MB\.

### 3. Server-side PDF & Diagnostic Log Ingestion (lib/pdf.ts)
Utilizes standard \pdf-parse\ bindings to ingest binary log exports or audit books on push, extracting raw texts without invoking memory-heavy background Python containers.

---

## 📈 Data Flow Specification

1. **Prompt Ingestion**: SRE inputs logs or cloud queries.
2. **Context Enrichment**: Next.js App Router appends strict system instructions, preconditioning the model's behavior for high-precision DevSecOps answers.
3. **API Routing**: Payloads are securely signed and routed through Server Route Handlers, avoiding key exposures on the client.
4. **Interactive Formatting**: The Client UI intercepts Markdown strings and renders them cleanly into tailored paragraphs or bulleted list blocks.