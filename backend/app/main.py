from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.chat import router as chat_router
from app.api.routes.health import router as health_router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="JARVIS core backend API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(chat_router)


@app.get("/")
async def root() -> dict:
    return {"message": "JARVIS backend online"}


@app.get("/api/voice-status")
async def voice_status() -> dict:
    return {
        "state": "idle",
        "wake_word": "Jarvis",
        "listening": False,
    }
