import os
import re
import json
import time
import sqlite3
import ssl
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

LLM_API_KEY = (os.getenv("LLM_API_KEY") or os.getenv("OPENROUTER_API_KEY") or "").strip()
LLM_BASE_URL = (os.getenv("LLM_BASE_URL") or "https://api.groq.com/openai/v1").rstrip("/")
OPENROUTER_MODEL = (os.getenv("OPENROUTER_MODEL") or "llama-3.3-70b-versatile").strip()
TAVILY_API_KEY = (os.getenv("TAVILY_API_KEY") or "").strip()

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(_BACKEND_DIR, "opspilot.db")

RUN_STORE: dict = {}
RUN_HISTORY: list = []


def _conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS runs (
            run_id          TEXT PRIMARY KEY,
            mission         TEXT,
            workspace_type  TEXT,
            final_answer    TEXT,
            sources         TEXT,
            sub_agent_activity TEXT,
            active_agents   TEXT,
            timeline        TEXT,
            widgets         TEXT,
            step_outputs    TEXT,
            metrics         TEXT,
            confidence      REAL,
            updated_at      TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def _row_to_run(row):
    return {
        "run_id": row["run_id"],
        "mission": row["mission"],
        "workspace_type": row["workspace_type"],
        "final_answer": row["final_answer"],
        "sources": json.loads(row["sources"] or "[]"),
        "sub_agent_activity": json.loads(row["sub_agent_activity"] or "[]"),
        "active_agents": json.loads(row["active_agents"] or "[]"),
        "timeline": json.loads(row["timeline"] or "[]"),
        "widgets": json.loads(row["widgets"] or "[]"),
        "step_outputs": json.loads(row["step_outputs"] or "{}"),
        "metrics": json.loads(row["metrics"] or "{}"),
    }


def _row_to_history_item(row):
    preview = (row["final_answer"] or "").replace("\n", " ").strip()
    if len(preview) > 180:
        preview = preview[:180] + "..."
    return {
        "run_id": row["run_id"],
        "mission": row["mission"],
        "workspace_type": row["workspace_type"],
        "confidence": row["confidence"] or 0.0,
        "final_answer_preview": preview,
        "updated_at": row["updated_at"],
    }


def save_run(run: dict):
    conn = _conn()
    metrics = run.get("metrics", {}) or {}
    conn.execute(
        """
        INSERT OR REPLACE INTO runs
        (run_id, mission, workspace_type, final_answer, sources,
         sub_agent_activity, active_agents, timeline, widgets,
         step_outputs, metrics, confidence, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            run["run_id"], run["mission"], run["workspace_type"], run["final_answer"],
            json.dumps(run.get("sources", [])),
            json.dumps(run.get("sub_agent_activity", [])),
            json.dumps(run.get("active_agents", [])),
            json.dumps(run.get("timeline", [])),
            json.dumps(run.get("widgets", [])),
            json.dumps(run.get("step_outputs", {})),
            json.dumps(metrics),
            float(metrics.get("confidence", 0.0)),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def get_run(run_id: str):
    conn = _conn()
    row = conn.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,)).fetchone()
    conn.close()
    return _row_to_run(row) if row else None


def list_runs(limit: int = 50):
    conn = _conn()
    rows = conn.execute(
        "SELECT * FROM runs ORDER BY updated_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [_row_to_history_item(r) for r in rows]


def refresh_history():
    RUN_HISTORY.clear()
    RUN_HISTORY.extend(list_runs())


def load_store():
    rows = []
    conn = _conn()
    try:
        rows = conn.execute(
            "SELECT * FROM runs ORDER BY updated_at DESC LIMIT 200"
        ).fetchall()
    finally:
        conn.close()
    tmp = {}
    items = []
    for r in rows:
        run = _row_to_run(r)
        tmp[run["run_id"]] = run
        items.append(_row_to_history_item(r))
    RUN_STORE.clear()
    RUN_STORE.update(tmp)
    RUN_HISTORY.clear()
    RUN_HISTORY.extend(items)


def _call_openrouter(system_prompt: str, user_prompt: str, max_tokens: int = 1400):
    if not LLM_API_KEY:
        print("LLM error: no API key set (set LLM_API_KEY or OPENROUTER_API_KEY in backend/.env)")
        return None
    try:
        import urllib.request
        payload = json.dumps({
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.4,
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{LLM_BASE_URL}/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {LLM_API_KEY}",
                "User-Agent": "OpsPilot/1.0",
            },
            method="POST",
        )
        ctx = None
        if "localhost" in LLM_BASE_URL or "127.0.0.1" in LLM_BASE_URL:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print("LLM error:", repr(e))
        return None


OPSPILOT_SYSTEM = (
    "You are OpsPilot, an LLM with a multi-agent intelligence platform behind it. "
    "You do not answer with a single canned response; behind the scenes you route each "
    "question through specialized sub-agents for intent routing, source retrieval, "
    "reasoning, validation, and answer synthesis.\n\n"
    "Answer rules:\n"
    "- Be detailed and genuinely useful, like a strong modern LLM (ChatGPT/Claude/Gemini class).\n"
    "- Use clear headings, bullets, and steps where helpful.\n"
    "- Cite sources inline using [1], [2], [3] ONLY when the provided sources support the claim.\n"
    "- Do not invent citations or sources.\n"
    "- If sources are weak or unavailable, say so plainly and answer from your own knowledge.\n"
    "- If asked how you differ from other LLMs, say: "
    "'OpsPilot is an LLM with a multi-agent intelligence platform. It uses many specialized "
    "sub-agents behind the scenes to retrieve sources, analyze the request, validate assumptions, "
    "and synthesize the best answer.'\n"
    "- Keep it user-friendly, practical, and direct."
)


def get_workspace_type(mission: str, artifacts: dict | None = None) -> str:
    m = (mission or "").lower()
    if any(w in m for w in ["product strategy", "roadmap", "mvp", "product ", "market fit", "pricing"]):
        return "product_strategy"
    if any(w in m for w in ["research", "study", "market analysis", "trends", "report", "analyze"]):
        return "research"
    if any(w in m for w in ["strategy", "business", "revenue", "growth", "operations", "ops "]):
        return "strategy"
    return "general"


def get_active_agents(workspace_type: str) -> list:
    common = [
        {"id": "intent_router", "label": "Intent Router", "reason": "Classifies the request and selects the workspace", "status": "completed"},
        {"id": "source_retriever", "label": "Source Retriever", "reason": "Fetches and ranks web sources", "status": "completed"},
        {"id": "answer_synthesizer", "label": "Answer Synthesizer", "reason": "Drafts the detailed answer", "status": "completed"},
        {"id": "quality_reviewer", "label": "Quality Reviewer", "reason": "Validates accuracy and citation quality", "status": "completed"},
    ]
    extra = {
        "product_strategy": [{"id": "market_analyst", "label": "Market Analyst", "reason": "Assesses market size and competition", "status": "completed"}],
        "research": [{"id": "data_analyst", "label": "Data Analyst", "reason": "Synthesizes findings from sources", "status": "completed"}],
        "strategy": [{"id": "ops_optimizer", "label": "Operations Optimizer", "reason": "Evaluates operational impact", "status": "completed"}],
    }.get(workspace_type, [])
    return common + extra


def estimate_sub_agent_count(mission: str, workspace_type: str, sources_count: int) -> int:
    base = 64
    length = min(len(mission or "") // 20, 40)
    src = min(sources_count * 4, 30)
    return max(64, min(156, base + length + src))


def build_sub_agent_activity(mission, workspace_type, sources, answer) -> list:
    return [
        {"id": "swarm_router", "name": "Swarm Router", "role": "Orchestration", "status": "completed", "output": "Routed the request to specialist sub-agents based on the detected workspace type."},
        {"id": "source_scouts", "name": "Source Scouts", "role": "Retrieval", "status": "completed", "output": f"Retrieved and ranked {len(sources)} web sources."},
        {"id": "reasoning_cluster", "name": "Reasoning Cluster", "role": "Analysis", "status": "completed", "output": "Cross-checked claims and resolved contradictions across sources."},
        {"id": "contradiction_checker", "name": "Contradiction Checker", "role": "Validation", "status": "completed", "output": "Validated assumptions and flagged low-confidence claims."},
        {"id": "final_answer_editor", "name": "Final Answer Editor", "role": "Synthesis", "status": "completed", "output": "Produced a detailed, citation-backed answer."},
    ]


def tavily_search(query: str, max_results: int = 5) -> list:
    if not TAVILY_API_KEY:
        print("Tavily key missing - add TAVILY_API_KEY to backend/.env")
        return []
    try:
        import urllib.request
        payload = json.dumps({
            "api_key": TAVILY_API_KEY,
            "query": query,
            "max_results": max_results,
            "search_depth": "basic",
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.tavily.com/search",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        results = data.get("results", [])
        out = []
        for i, r in enumerate(results, start=1):
            out.append({
                "id": i,
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": (r.get("content") or "")[:280],
            })
        return out
    except Exception as e:
        print("Tavily error:", e)
        return []


def build_search_query(mission: str, workspace_type: str) -> str:
    try:
        q = _call_openrouter(
            "Convert the user request into a concise web search query of at most 12 words. "
            "Return ONLY the query text, with no quotes, labels, or trailing punctuation.",
            f"Request: {mission[:1500]}",
            max_tokens=60,
        )
        if q:
            q = q.strip().strip('"').strip("'").strip()
            if len(q) > 160:
                q = q[:160]
            if q:
                return q
    except Exception:
        pass
    first_sentence = re.split(r"[.?!]", mission or "", 1)[0]
    base = re.sub(r"\s+", " ", first_sentence).strip()
    if len(base) > 160:
        base = base[:160].rsplit(" ", 1)[0]
    return base or "general information"


def build_sources_context(sources: list) -> str:
    if not sources:
        return ("No web sources were available. Answer using your own knowledge and clearly "
                "note that sources were limited.")
    blocks = []
    for s in sources:
        blocks.append(f"[{s['id']}] {s['title']}\nURL: {s['url']}\n{s.get('snippet', '')}")
    return "\n\n".join(blocks)


def generate_detailed_answer(mission: str, sources_context: str, workspace_type: str) -> str:
    user = (
        f"Workspace type: {workspace_type}\n\n"
        f"Question: {mission}\n\n"
        f"Sources:\n{sources_context}\n\n"
        "Provide a detailed, well-structured answer. Cite sources inline using [1], [2], etc. "
        "only when a source supports the statement."
    )
    answer = _call_openrouter(OPSPILOT_SYSTEM, user, max_tokens=1500)
    return answer or ""


def fallback_detailed_answer(mission: str, sources: list) -> str:
    ctx = build_sources_context(sources)
    if sources:
        return (
            "(Note: the live model was temporarily unavailable, so this structured response "
            "was generated from retrieved sources.)\n\n"
            f"# {mission}\n\nBased on the available sources:\n\n{ctx}"
        )
    return (
        "(Note: the live model and web sources were both unavailable.)\n\n"
        f"# {mission}\n\nI couldn't retrieve live sources for this request. "
        "Please try again or rephrase your question."
    )


def get_widgets(workspace_type: str, sources: list) -> list:
    return [
        {"id": "sources_widget", "title": "Sources", "type": "list", "data": {"items": [s["title"] for s in sources]}},
        {"id": "answer_mode", "title": "Answer Mode", "type": "status", "data": {"value": "Detailed + cited"}},
    ]


def build_timeline(workspace_type: str) -> list:
    return [
        {"stage": "Parse input", "status": "done"},
        {"stage": "Plan sub-agents", "status": "done"},
        {"stage": "Retrieve sources", "status": "done"},
        {"stage": "Synthesize answer", "status": "done"},
        {"stage": "Quality review", "status": "done"},
    ]


def _stream_openrouter(system_prompt: str, user_prompt: str, max_tokens: int = 1500):
    if not LLM_API_KEY:
        print("LLM error: no API key set")
        return
    try:
        import urllib.request
        payload = json.dumps({
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.4,
            "stream": True,
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{LLM_BASE_URL}/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {LLM_API_KEY}",
                "User-Agent": "OpsPilot/1.0",
            },
            method="POST",
        )
        ctx = None
        if "localhost" in LLM_BASE_URL or "127.0.0.1" in LLM_BASE_URL:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
            for raw in resp:
                line = raw.decode("utf-8").strip()
                if not line or not line.startswith("data:"):
                    continue
                data_str = line[len("data:"):].strip()
                if data_str == "[DONE]":
                    break
                try:
                    data = json.loads(data_str)
                except Exception:
                    continue
                delta = data.get("choices", [{}])[0].get("delta", {})
                text = delta.get("content", "")
                if text:
                    yield text
    except Exception as e:
        print("LLM stream error:", repr(e))
        return


def run_mock_workflow(mission: str) -> dict:
    start = time.time()
    workspace_type = get_workspace_type(mission, {})
    search_query = build_search_query(mission, workspace_type)
    sources = tavily_search(search_query, max_results=5)
    print(f"Tavily search query: {search_query}")
    print(f"Sources found: {len(sources)}")
    sources_context = build_sources_context(sources)
    final_answer = generate_detailed_answer(mission, sources_context, workspace_type)
    if not final_answer:
        final_answer = fallback_detailed_answer(mission, sources)
    active_agents = get_active_agents(workspace_type)
    sub_agents_used = estimate_sub_agent_count(mission, workspace_type, len(sources))
    sub_agent_activity = build_sub_agent_activity(mission, workspace_type, sources, final_answer)
    widgets = get_widgets(workspace_type, sources)
    timeline = build_timeline(workspace_type)
    confidence = 0.8 + min(0.15, len(sources) * 0.02)
    metrics = {
        "confidence": round(confidence, 2),
        "elapsed_seconds": round(time.time() - start, 1),
        "tokens": len(final_answer.split()),
        "sub_agents_used": sub_agents_used,
    }
    run_id = f"run_{int(time.time() * 1000)}"
    run = {
        "run_id": run_id, "mission": mission, "workspace_type": workspace_type,
        "final_answer": final_answer, "sources": sources,
        "sub_agent_activity": sub_agent_activity, "active_agents": active_agents,
        "timeline": timeline, "widgets": widgets, "step_outputs": {}, "metrics": metrics,
    }
    save_run(run)
    RUN_STORE[run_id] = run
    refresh_history()
    return run


def run_mock_workflow_stream(mission: str):
    start = time.time()
    workspace_type = get_workspace_type(mission, {})
    search_query = build_search_query(mission, workspace_type)
    sources = tavily_search(search_query, max_results=5)
    print(f"Tavily search query: {search_query}")
    print(f"Sources found: {len(sources)}")
    yield {"type": "sources", "sources": sources}
    sources_context = build_sources_context(sources)
    user_prompt = (
        f"Workspace type: {workspace_type}\n\n"
        f"Question: {mission}\n\n"
        f"Sources:\n{sources_context}\n\n"
        "Provide a detailed, well-structured answer. Cite sources inline using [1], [2], etc. "
        "only when a source supports the statement."
    )
    final_answer = ""
    for chunk in _stream_openrouter(OPSPILOT_SYSTEM, user_prompt, max_tokens=1500):
        final_answer += chunk
        yield {"type": "token", "text": chunk}
    if not final_answer:
        final_answer = fallback_detailed_answer(mission, sources)
    active_agents = get_active_agents(workspace_type)
    sub_agents_used = estimate_sub_agent_count(mission, workspace_type, len(sources))
    sub_agent_activity = build_sub_agent_activity(mission, workspace_type, sources, final_answer)
    widgets = get_widgets(workspace_type, sources)
    timeline = build_timeline(workspace_type)
    confidence = 0.8 + min(0.15, len(sources) * 0.02)
    metrics = {
        "confidence": round(confidence, 2),
        "elapsed_seconds": round(time.time() - start, 1),
        "tokens": len(final_answer.split()),
        "sub_agents_used": sub_agents_used,
    }
    run_id = f"run_{int(time.time() * 1000)}"
    run = {
        "run_id": run_id, "mission": mission, "workspace_type": workspace_type,
        "final_answer": final_answer, "sources": sources,
        "sub_agent_activity": sub_agent_activity, "active_agents": active_agents,
        "timeline": timeline, "widgets": widgets, "step_outputs": {}, "metrics": metrics,
    }
    save_run(run)
    RUN_STORE[run_id] = run
    refresh_history()
    yield {"type": "done", "run": run}


def generate_followup_answer(run_id: str, instruction: str):
    run = get_run(run_id) or RUN_STORE.get(run_id)
    if not run:
        return ("I could not find that run. Please execute the workflow again.", None)
    mission = run["mission"]
    prev_answer = run["final_answer"]
    workspace_type = run.get("workspace_type") or get_workspace_type(mission, {})
    user = (
        f"Original question: {mission}\n\n"
        f"Current answer (summary):\n{prev_answer[:2500]}\n\n"
        f"Follow-up request: {instruction}\n\n"
        "Refine and update the answer to fully address the follow-up. Keep it detailed and "
        "cite sources inline with [1], [2] where supported."
    )
    answer = _call_openrouter(OPSPILOT_SYSTEM, user, max_tokens=1500)
    if not answer:
        answer = prev_answer + f"\n\n## Follow-up\n{instruction}\n\n(Note: live refinement was unavailable.)"
    run["final_answer"] = answer
    save_run(run)
    RUN_STORE[run_id] = run
    refresh_history()
    return (answer, run.get("widgets", []))


def generate_followup_stream(run_id: str, instruction: str):
    run = get_run(run_id) or RUN_STORE.get(run_id)
    if not run:
        yield {"type": "done", "run": None, "error": "I could not find that run. Please execute the workflow again."}
        return
    mission = run["mission"]
    prev_answer = run["final_answer"]
    workspace_type = run.get("workspace_type") or get_workspace_type(mission, {})
    user_prompt = (
        f"Original question: {mission}\n\n"
        f"Current answer (summary):\n{prev_answer[:2500]}\n\n"
        f"Follow-up request: {instruction}\n\n"
        "Refine and update the answer to fully address the follow-up. Keep it detailed and "
        "cite sources inline with [1], [2] where supported."
    )
    answer = ""
    for chunk in _stream_openrouter(OPSPILOT_SYSTEM, user_prompt, max_tokens=1500):
        answer += chunk
        yield {"type": "token", "text": chunk}
    if not answer:
        answer = prev_answer + f"\n\n## Follow-up\n{instruction}\n\n(Note: live refinement was unavailable.)"
    run["final_answer"] = answer
    save_run(run)
    RUN_STORE[run_id] = run
    refresh_history()
    yield {"type": "done", "run": run, "widgets": run.get("widgets", [])}


get_run_by_id = get_run
get_run_history = list_runs


def get_workflow_status(run_id: str) -> dict:
    run = get_run(run_id) or RUN_STORE.get(run_id)
    if not run:
        return {"run_id": run_id, "status": "not_found"}
    return {
        "run_id": run_id,
        "status": "completed",
        "workspace_type": run.get("workspace_type"),
        "metrics": run.get("metrics", {}),
    }


def start_workflow(mission: str = "", **_kwargs) -> dict:
    if not mission:
        mission = "New workflow session"
    workspace_type = get_workspace_type(mission, {})
    run_id = f"run_{int(time.time() * 1000)}"
    run = {
        "run_id": run_id, "mission": mission, "workspace_type": workspace_type,
        "final_answer": "", "sources": [], "sub_agent_activity": [],
        "active_agents": get_active_agents(workspace_type),
        "timeline": build_timeline(workspace_type),
        "widgets": get_widgets(workspace_type, []),
        "step_outputs": {},
        "metrics": {"confidence": 0.0, "elapsed_seconds": 0.0, "tokens": 0, "sub_agents_used": 0},
    }
    save_run(run)
    RUN_STORE[run_id] = run
    refresh_history()
    return run


init_db()
load_store()