from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.workflow import router as workflow_router

app = FastAPI(title="OpsPilot Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "opspilot-backend"}