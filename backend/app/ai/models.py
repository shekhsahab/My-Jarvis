from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant", "tool"]
    content: str = Field(min_length=1, max_length=8000)


class AIResult(BaseModel):
    reply: str
    intent: str = "general_question"
    source: Literal["local", "llm", "tool"] = "local"
    tool: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
