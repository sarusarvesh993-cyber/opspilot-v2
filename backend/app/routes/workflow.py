from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from typing import Optional
import json

from app.schemas.workflow import WorkflowRunRequest, WorkflowFollowupRequest
from app.services.orchestrator import (
    run_mock_workflow,
    run_mock_workflow_stream,
    generate_followup_answer,
    generate_followup_stream,
    start_workflow,
    get_workflow_status,
    get_run_history,
    get_run_by_id,
)

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "service": "opspilot-workflow"}


@router.post("/workflow/run")
def run_workflow(req: WorkflowRunRequest):
    return run_mock_workflow(req.mission)


@router.post("/workflow/followup")
def followup(req: WorkflowFollowupRequest):
    return generate_followup_answer(req.run_id, req.instruction)


@router.post("/workflow/start")
def start():
    return start_workflow()


@router.get("/workflow/status/{run_id}")
def status(run_id: str):
    return get_workflow_status(run_id)


@router.get("/workflow/history")
def history():
    return get_run_history()


@router.get("/workflow/history/{run_id}")
def history_detail(run_id: str):
    return get_run_by_id(run_id)


@router.post("/workflow/run/stream")
def run_stream(req: WorkflowRunRequest):
    def generate():
        try:
            for evt in run_mock_workflow_stream(req.mission):
                yield json.dumps(evt, ensure_ascii=False) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False) + "\n"
    return StreamingResponse(generate(), media_type="application/x-ndjson")


@router.post("/workflow/followup/stream")
def followup_stream(req: WorkflowFollowupRequest):
    def generate():
        try:
            for evt in generate_followup_stream(req.run_id, req.instruction):
                yield json.dumps(evt, ensure_ascii=False) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False) + "\n"
    return StreamingResponse(generate(), media_type="application/x-ndjson")