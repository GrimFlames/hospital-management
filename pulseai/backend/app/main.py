from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.triage import router as triage_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("==========================================================")
    print("🩺 PulseAI Clinical Triage Gateway starting up...")
    print(f"📡 Environment: {settings.ENVIRONMENT} | Version: {settings.VERSION}")
    print("==========================================================")
    yield
    print("🛑 PulseAI Clinical Triage Gateway shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-Grade AI Clinical Intake & Emergency Triage RAG API",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(triage_router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "PulseAI Clinical Triage & Patient Intelligence Copilot",
        "documentation": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
