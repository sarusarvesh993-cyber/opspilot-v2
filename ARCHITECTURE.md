# OpsPilot v2 architecture

## Scope

OpsPilot v2 is a portfolio application with two deliberately separate capabilities:

1. A real server-side integration with an OpenAI-compatible chat provider.
2. Browser-only operations simulations used to demonstrate dashboard interaction.

It is not a cloud control plane and has no Kubernetes, Terraform, CI/CD, or monitoring credentials.

## Runtime topology

```text
┌──────────────────────── Browser ────────────────────────┐
│ React dashboard                                         │
│ ├─ AI chat client ───────────────┐                      │
│ └─ simulated telemetry/workspaces│ (no network access)  │
└──────────────────────────────────┼──────────────────────┘
                                   │ HTTPS / JSON
                                   ▼
┌──────────────────── Next.js Node.js server ─────────────┐
│ POST /api/chat                                          │
│  1. best-effort per-instance rate limit                 │
│  2. request-size and JSON validation                    │
│  3. role/content/conversation validation                │
│  4. server-owned system policy                          │
│  5. bounded OpenAI SDK request with timeout             │
│  6. safe response or normalized error                   │
└──────────────────────────────────┬──────────────────────┘
                                   │ TLS
                                   ▼
                         OpenAI-compatible provider
```

## Trust boundaries

### Browser to application server

The browser is untrusted. The route accepts only a JSON object with a bounded `messages` array. Each message must have a `user` or `assistant` role and non-empty string content. A client-provided `system` role is rejected, and the final message must be from the user.

Request limits currently include:

- 64 KB encoded request body
- 20 messages
- 4,000 characters per message
- 16,000 characters across a conversation
- 10 requests per minute per client identifier per running instance

### Application server to AI provider

`OPENAI_API_KEY` is read only on the server. The application owns and prepends the system policy. Provider calls have one retry, a 25-second SDK timeout, and a bounded output-token setting.

The browser receives normalized 4xx/5xx responses. Provider exceptions are logged without conversation content and are not returned verbatim.

### Simulation boundary

Metrics, security findings, and diagnostic output are generated locally in React. Labels in the UI and README identify them as simulations. They must not be interpreted as observed infrastructure state.

## Module responsibilities

| Module | Responsibility |
| --- | --- |
| `app/api/chat/route.ts` | HTTP parsing, limits, status codes, and response headers |
| `lib/chat-validation.ts` | Provider-independent runtime schema rules |
| `lib/rate-limit.ts` | Lightweight public-demo abuse protection |
| `lib/ai.ts` | Provider configuration, system policy, and completion request |
| `components/ops-pilot/ChatPanel.tsx` | Client orchestration and workspace selection |
| `components/ops-pilot/ChatWorkspace.tsx` | Accessible conversation UI and request state |
| `components/ops-pilot/WorkspacePanels.tsx` | Explicitly simulated feature panels |
| `components/ops-pilot/TelemetrySidebar.tsx` | Explicitly simulated telemetry summary |

## Error behavior

| Condition | Status |
| --- | ---: |
| Invalid JSON or message shape | 400 |
| Payload/conversation too large | 413 |
| Rate limit exceeded | 429 |
| API key not configured | 503 |
| Provider timeout or failure | 502 |

The client handles non-2xx responses and displays a recoverable alert rather than silently failing.

## Deployment

`next.config.ts` uses Vercel's native trace layout on Vercel and enables standalone output elsewhere. The multi-stage Docker build installs from `package-lock.json`, compiles in a builder stage, and copies only the standalone runtime into a Node 22 Alpine image. The process runs as the unprivileged `nextjs` user and includes a health check.

GitHub Actions executes linting, strict type checking, unit tests, a high-severity production dependency audit, a production build, and a standalone container build.

## Known limitations

- The in-memory rate limiter is instance-local and cannot enforce a global quota in a horizontally scaled or serverless deployment.
- The demo has no user authentication, tenant model, persistent data, distributed tracing, or external telemetry.
- Prompt injection remains a model-level risk even though role injection is blocked. No model output should be executed automatically.
- Unit tests cover deterministic boundary logic; browser and provider integrations need end-to-end coverage before production use.

## Safe path to real integrations

A production extension should place read-only adapters behind authenticated server-side tools, validate every tool argument, apply least-privilege credentials, and record an immutable audit event. Any write action should require a human approval step and policy evaluation. Generated shell, Terraform, or Kubernetes content must remain advisory until explicitly reviewed.
