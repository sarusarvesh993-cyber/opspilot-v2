# OpsPilot v2 — Enterprise AI-Agent Copilot for Cloud Infrastructure & DevSecOps

OpsPilot is a prototype / in development cloud-native AI Copilot built with Next.js App Router, TypeScript, TailwindCSS, OpenAI GPT-4o, and Docker. It parses active monitoring alerts, writes estimated Terraform state configurations, debugs Kubernetes logs, and visualizes real-time metrics for Cloud Operations teams.

---

## 🚀 Key Highlights & Architectural Strengths

- **LLM Agent Pipeline**: Integrates OpenAI's \gpt-4o\ / \gpt-4o-mini\ with a structured system prompt, specialized prompt engineering, and visual chart extraction.
- **RAG & Multimodal-Ready Subsystems**: Fully implemented server-side logic for high-performance PDF/log ingestion (\pdf-parse\) and binary vision buffers.
- **Cloud-Native standalone builds**: Optimized Next.js standalone builds to reduce Docker image footprints to <120MB.
- **Enterprise DevSecOps Automation**: Integrated Github Actions CI pipeline (\.github/workflows/ci.yml\) performing automated static typing verification and unit integration testing.

---

## 🛠️ Tech Stack & Pipeline

- **Framework**: Next.js (App Router) & React
- **Language**: TypeScript (Strict Typings)
- **AI Core**: OpenAI SDK (v4+) with structured JSON visual responses
- **UI Engine**: TailwindCSS, Framer Motion, and custom charting modules
- **Deployment**: Docker, Docker Compose, standalone Node.js runner