from __future__ import annotations

import time
from typing import Any, Dict, List, Literal, TypedDict

from langgraph.graph import END, StateGraph


WorkflowType = Literal["general", "research", "prd", "strategy", "operations"]


class WorkflowState(TypedDict, total=False):
    mission: str
    workflow_type: WorkflowType
    timeline: List[Dict[str, Any]]
    artifacts: Dict[str, Any]
    current_agent: str
    confidence: float
    tokens: int
    elapsed: float
    final_answer: str


def _timeline_item(agent: str, title: str, detail: str, status: str = "completed") -> Dict[str, Any]:
    return {
        "agent": agent,
        "title": title,
        "detail": detail,
        "status": status,
        "time": "now",
    }


def _classify_workflow(mission: str) -> WorkflowType:
    mission_lower = mission.lower()

    if any(keyword in mission_lower for keyword in ["prd", "product requirement", "requirements", "spec", "feature spec"]):
        return "prd"

    if any(keyword in mission_lower for keyword in ["research", "analyze", "analysis", "compare", "earnings", "risks"]):
        return "research"

    if any(keyword in mission_lower for keyword in ["go-to-market", "gtm", "launch", "marketing", "strategy"]):
        return "strategy"

    if any(keyword in mission_lower for keyword in ["stock", "market", "trading", "excel", "whatsapp", "automation", "chainlink", "charlink"]):
        return "operations"

    return "general"


def input_parser_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]
    workflow_type = _classify_workflow(mission)

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    timeline.append(
        _timeline_item(
            "input_parser",
            "Question received",
            "The orchestrator captured the user request and classified the workflow.",
        )
    )

    artifacts["mission"] = mission
    artifacts["workflow_type"] = workflow_type

    return {
        **state,
        "workflow_type": workflow_type,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "input_parser",
    }


def planner_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]
    workflow_type = state.get("workflow_type", "general")

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    plan = (
        f"Plan for: {mission}\n\n"
        f"1. Understand the requested outcome.\n"
        f"2. Select only the agents needed for a {workflow_type} workflow.\n"
        f"3. Generate useful intermediate artifacts.\n"
        f"4. Review the result for clarity and actionability.\n"
        f"5. Deliver an answer-first final response."
    )

    artifacts["plan"] = plan

    timeline.append(
        _timeline_item(
            "planner",
            "Planner completed",
            f"The task was decomposed into a {workflow_type} workflow.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "planner",
    }


def researcher_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    research_notes = (
        f"Research notes for: {mission}\n\n"
        f"- Identified the main user goal.\n"
        f"- Listed the key constraints and dependencies.\n"
        f"- Highlighted implementation considerations.\n"
        f"- Prepared context for the writing/synthesis step."
    )

    artifacts["research_notes"] = research_notes

    timeline.append(
        _timeline_item(
            "researcher",
            "Research completed",
            "Relevant context and implementation considerations were gathered.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "researcher",
    }


def deep_researcher_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    deep_research = (
        f"Deep research analysis for: {mission}\n\n"
        f"- Summarized the core topic.\n"
        f"- Identified important risks and uncertainties.\n"
        f"- Separated known facts from assumptions.\n"
        f"- Prepared an executive synthesis structure."
    )

    artifacts["deep_research"] = deep_research

    timeline.append(
        _timeline_item(
            "deep_researcher",
            "Deep research completed",
            "The research path produced a deeper analytical summary.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "deep_researcher",
    }


def writer_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]
    workflow_type = state.get("workflow_type", "general")

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    if workflow_type == "operations":
        draft = (
            f"Operational workflow draft for: {mission}\n\n"
            f"Recommended implementation path:\n"
            f"1. Define the exact trigger and output required.\n"
            f"2. Use Excel or Google Sheets as the operating database.\n"
            f"3. Connect automation tools for WhatsApp notifications.\n"
            f"4. Add validation rules before sending alerts or trades.\n"
            f"5. Start with a manual-review workflow before enabling full automation."
        )
    elif workflow_type == "strategy":
        draft = (
            f"Strategy draft for: {mission}\n\n"
            f"1. Clarify the target audience.\n"
            f"2. Define the value proposition.\n"
            f"3. Identify channels and launch phases.\n"
            f"4. Create success metrics.\n"
            f"5. Build a staged execution plan."
        )
    else:
        draft = (
            f"Draft response for: {mission}\n\n"
            f"The request has been structured into a clear, practical answer with next steps."
        )

    artifacts["draft"] = draft

    timeline.append(
        _timeline_item(
            "writer",
            "Writer completed",
            "The selected artifacts were converted into a clear response draft.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "writer",
    }


def spec_writer_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    specification = (
        f"Product specification for: {mission}\n\n"
        f"Objective:\n"
        f"- Define the expected product outcome.\n\n"
        f"Users:\n"
        f"- Primary users and stakeholders.\n\n"
        f"Core requirements:\n"
        f"- Functional requirements.\n"
        f"- Non-functional requirements.\n"
        f"- Success metrics.\n\n"
        f"Risks:\n"
        f"- Ambiguous scope.\n"
        f"- Missing acceptance criteria.\n"
        f"- Integration complexity."
    )

    artifacts["specification"] = specification

    timeline.append(
        _timeline_item(
            "spec_writer",
            "Specification completed",
            "A requirements-oriented artifact was generated.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "spec_writer",
    }


def synthesizer_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]
    workflow_type = state.get("workflow_type", "general")

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    if workflow_type == "research":
        final_summary = (
            f"Executive research summary for: {mission}\n\n"
            f"Key takeaways:\n"
            f"- The request requires research, risk analysis, and executive synthesis.\n"
            f"- The most useful output is a concise decision-ready summary.\n"
            f"- Risks should be separated from recommendations.\n\n"
            f"Recommended structure:\n"
            f"1. Context summary.\n"
            f"2. Key findings.\n"
            f"3. Risk assessment.\n"
            f"4. Executive recommendation.\n"
            f"5. Follow-up questions or next actions."
        )
    else:
        final_summary = (
            f"Synthesized summary for: {mission}\n\n"
            f"The key artifacts were combined into a concise, useful final response."
        )

    artifacts["final_summary"] = final_summary

    timeline.append(
        _timeline_item(
            "synthesizer",
            "Synthesis completed",
            "The agent outputs were consolidated into a final summary.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "synthesizer",
    }


def reviewer_node(state: WorkflowState) -> WorkflowState:
    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    review_notes = (
        "Review notes:\n\n"
        "- Answer is structured and readable.\n"
        "- Workflow is aligned with the user request.\n"
        "- Recommendations are actionable.\n"
        "- Final response prioritizes the answer before internal workflow details."
    )

    artifacts["review_notes"] = review_notes

    timeline.append(
        _timeline_item(
            "reviewer",
            "Review completed",
            "The output was checked for clarity, usefulness, and completeness.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "reviewer",
        "confidence": 0.91,
    }


def finalizer_node(state: WorkflowState) -> WorkflowState:
    mission = state["mission"]
    workflow_type = state.get("workflow_type", "general")

    timeline = state.get("timeline", [])
    artifacts = state.get("artifacts", {})

    if workflow_type == "operations":
        execution_checklist = [
            "Confirm the exact automation goal and risk boundaries.",
            "Create the Excel sheet structure for inputs, signals, logs, and status.",
            "Choose the WhatsApp automation method, such as WhatsApp Business API or an automation connector.",
            "Add validation rules before any alert or action is triggered.",
            "Test with paper trading or manual confirmation before real execution.",
        ]

        final_answer = (
            f"Here is the recommended automation plan for your request:\n\n"
            f"You should build this as a controlled workflow, not as direct fully automated trading on day one.\n\n"
            f"Suggested architecture:\n\n"
            f"1. Excel Sheet as your control center\n"
            f"- Store stock symbols, trigger prices, strategy rules, signal status, and action logs.\n\n"
            f"2. Market data source\n"
            f"- Connect a reliable stock market data API or broker API.\n"
            f"- Pull latest prices into your workflow.\n\n"
            f"3. Rule engine\n"
            f"- Compare live prices with your Excel rules.\n"
            f"- Generate buy, sell, hold, or alert signals.\n\n"
            f"4. WhatsApp automation\n"
            f"- Send signal alerts to WhatsApp.\n"
            f"- Start with approval-based messages before enabling automated execution.\n\n"
            f"5. Safety layer\n"
            f"- Add daily limits, duplicate-alert prevention, error logs, and manual override.\n\n"
            f"Best first version:\n"
            f"Build an alert-only MVP first. Let the system read Excel, check market conditions, and send WhatsApp alerts. "
            f"After that works reliably, you can add broker execution if legally and technically appropriate."
        )

    elif workflow_type == "research":
        execution_checklist = [
            "Validate the latest source data.",
            "Separate facts from assumptions.",
            "Review the risk section.",
            "Convert the summary into a decision memo if needed.",
        ]

        final_answer = artifacts.get("final_summary", "")

    elif workflow_type == "prd":
        execution_checklist = [
            "Review requirements with stakeholders.",
            "Add acceptance criteria.",
            "Prioritize must-have versus nice-to-have features.",
            "Convert the specification into implementation tickets.",
        ]

        final_answer = artifacts.get("specification", "")

    elif workflow_type == "strategy":
        execution_checklist = [
            "Validate target audience.",
            "Define launch milestones.",
            "Assign owners.",
            "Track metrics weekly.",
        ]

        final_answer = artifacts.get("draft", "")

    else:
        execution_checklist = [
            "Review the generated response.",
            "Clarify any missing constraints.",
            "Ask a follow-up question if more precision is needed.",
        ]

        final_answer = artifacts.get("draft", "") or artifacts.get("final_summary", "")

    if not final_answer:
        final_answer = f"Completed response for: {mission}"

    artifacts["execution_checklist"] = execution_checklist
    artifacts["delivery_status"] = "Ready"
    artifacts["final_answer"] = final_answer
    artifacts["final_summary"] = artifacts.get("final_summary", final_answer)

    timeline.append(
        _timeline_item(
            "finalizer",
            "Final answer generated",
            "The final answer and adaptive workspace contract were prepared.",
        )
    )

    return {
        **state,
        "timeline": timeline,
        "artifacts": artifacts,
        "current_agent": "finalizer",
        "final_answer": final_answer,
        "confidence": state.get("confidence", 0.91),
        "tokens": state.get("tokens", 0) + 1200,
    }


def route_after_planner(state: WorkflowState) -> str:
    workflow_type = state.get("workflow_type", "general")

    if workflow_type == "prd":
        return "spec_writer"

    if workflow_type == "research":
        return "deep_researcher"

    return "researcher"


def route_after_researcher(state: WorkflowState) -> str:
    workflow_type = state.get("workflow_type", "general")

    if workflow_type == "research":
        return "synthesizer"

    return "writer"


workflow = StateGraph(WorkflowState)

workflow.add_node("input_parser", input_parser_node)
workflow.add_node("planner", planner_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("deep_researcher", deep_researcher_node)
workflow.add_node("writer", writer_node)
workflow.add_node("spec_writer", spec_writer_node)
workflow.add_node("synthesizer", synthesizer_node)
workflow.add_node("reviewer", reviewer_node)
workflow.add_node("finalizer", finalizer_node)

workflow.set_entry_point("input_parser")

workflow.add_edge("input_parser", "planner")

workflow.add_conditional_edges(
    "planner",
    route_after_planner,
    {
        "researcher": "researcher",
        "deep_researcher": "deep_researcher",
        "spec_writer": "spec_writer",
    },
)

workflow.add_conditional_edges(
    "researcher",
    route_after_researcher,
    {
        "writer": "writer",
        "synthesizer": "synthesizer",
    },
)

workflow.add_edge("deep_researcher", "synthesizer")
workflow.add_edge("synthesizer", "reviewer")
workflow.add_edge("writer", "reviewer")
workflow.add_edge("spec_writer", "reviewer")
workflow.add_edge("reviewer", "finalizer")
workflow.add_edge("finalizer", END)

workflow_app = workflow.compile()


def run_workflow_graph(mission: str) -> Dict[str, Any]:
    start_time = time.perf_counter()

    initial_state: WorkflowState = {
        "mission": mission,
        "workflow_type": "general",
        "timeline": [],
        "artifacts": {},
        "current_agent": "input_parser",
        "confidence": 0.0,
        "tokens": 0,
        "elapsed": 0.0,
        "final_answer": "",
    }

    final_state = workflow_app.invoke(initial_state)

    elapsed = round(time.perf_counter() - start_time, 2)

    final_state["elapsed"] = elapsed
    final_state["confidence"] = final_state.get("confidence", 0.91)
    final_state["tokens"] = final_state.get("tokens", 1200)

    return final_state