from __future__ import annotations

from collections import deque

from app.ai.models import ConversationMessage
from app.core.config import settings


class ConversationManager:
    def __init__(self) -> None:
        self._messages: deque[ConversationMessage] = deque(maxlen=settings.memory_max_messages)

    def add(self, role: str, content: str) -> None:
        self._messages.append(ConversationMessage(role=role, content=content))

    def recent(self) -> list[ConversationMessage]:
        return list(self._messages)

    def clear(self) -> None:
        self._messages.clear()


conversation_manager = ConversationManager()
