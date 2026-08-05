from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class WorkflowRunRequest(BaseModel):
    mission: str = Field(..., min_length=3, max_length=30000)


class WorkflowFollowupRequest(BaseModel):
    run_id: str
    instruction: str = Field(..., min_length=2, max_length=30000)


class WorkflowSource(BaseModel):
    id: int
    title: str
    url: str
    snippet: str


class WorkflowActiveAgent(BaseModel):
    id: str
    label: str
    reason: str
    status: str


class WorkflowSubAgentActivity(BaseModel):
    id: str
    name: str
    role: str
    status: str
    output: str


class WorkflowWidget(BaseModel):
    id: str
    title: str
    type: str
    data: Dict[str, Any]


class WorkflowMetrics(BaseModel):
    confidence: float
    elapsed_seconds: float
    tokens: int
    sub_agents_used: int


class WorkflowNode(BaseModel):
    id: str
    label: str
    status: str
    detail: str


class WorkflowRunResponse(BaseModel):
    run_id: str
    mission: str
    workspace_type: str
    final_answer: str

    # New platform fields
    sources: List[WorkflowSource] = Field(default_factory=list)
    sub_agent_activity: List[WorkflowSubAgentActivity] = Field(default_factory=list)

    # Existing Step B fields
    active_agents: List[WorkflowActiveAgent]
    timeline: List[Dict[str, Any]]
    widgets: List[WorkflowWidget]
    step_outputs: Dict[str, Any]
    metrics: WorkflowMetrics

    # compatibility fields
    nodes: List[WorkflowNode] = Field(default_factory=list)
    elapsed: float = 0.0
    tokens: int = 0
    confidence: float = 0.0
    artifacts: Dict[str, Any] = Field(default_factory=dict)


class WorkflowFollowupResponse(BaseModel):
    run_id: str
    instruction: str
    answer: str
    updated_widgets: Optional[List[WorkflowWidget]] = None


class WorkflowStartResponse(BaseModel):
    run_id: str
    status: str


class WorkflowStatusResponse(BaseModel):
    run_id: str
    status: str
    result: Optional[WorkflowRunResponse] = None


class WorkflowHistoryItem(BaseModel):
    run_id: str
    mission: str
    workspace_type: str
    confidence: float
    final_answer_preview: str
    updated_at: str


class WorkflowHistoryResponse(BaseModel):
    items: List[WorkflowHistoryItem]