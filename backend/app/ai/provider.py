from __future__ import annotations

import httpx

from app.ai.models import AIResult, ConversationMessage
from app.core.config import settings


class AIProvider:
    async def answer(self, message: str, context: list[ConversationMessage]) -> AIResult:
        raise NotImplementedError


class LocalAIProvider(AIProvider):
    async def answer(self, message: str, context: list[ConversationMessage]) -> AIResult:
        lower = message.casefold()
        normalized = lower.strip(" .,!?;:")
        if normalized in {"hello", "hi", "hey", "good morning", "good afternoon", "good evening"}:
            reply = "Hello. I’m JARVIS, and I’m here with you. What would you like to work on?"
        elif "how are you" in lower or "how are things" in lower or "how's it going" in lower:
            reply = "I’m doing well, thank you. My conversation system and connected tools are online. What can I help you with?"
        elif "who are you" in lower or "what are you" in lower:
            reply = "I’m JARVIS, your local desktop assistant. I can talk with you and use my connected browser and Windows tools."
        elif "what can you do" in lower or "what are your capabilities" in lower:
            reply = "I can answer supported questions, remember the current conversation, search the web, open approved websites, and control connected system tools."
        elif "thank" in lower or normalized in {"thanks", "thx"}:
            reply = "You’re welcome. I’m here whenever you need me."
        elif normalized in {"yes", "yeah", "yep", "okay", "ok"} and context:
            reply = "Understood. What would you like me to do next?"
        elif "python" in lower:
            reply = "Python is a general-purpose programming language known for readable syntax and a large ecosystem of libraries."
        elif "react" in lower:
            reply = "React is a JavaScript library for building interactive user interfaces from reusable components."
        elif "javascript" in lower:
            reply = "JavaScript is a programming language used to add behavior and interactivity to websites and applications."
        elif "html" in lower:
            reply = "HTML is the markup language used to structure content on web pages, such as headings, paragraphs, links, and forms."
        elif "django" in lower:
            reply = "Django is a Python web framework that provides routing, database tools, templates, and security features for web applications."
        elif "api" in lower:
            reply = "An API is a defined way for software systems to communicate using agreed requests, data, and responses."
        elif "remember" in lower or "favorite" in lower or "prefer" in lower:
            reply = "I can store that preference after the explicit memory command is connected."
        elif "how are you" in lower:
            reply = "I’m operating normally and ready to help with supported questions and tasks."
        elif lower in {"explain it simply", "explain that simply", "simplify it"} and context:
            previous_topic = next((item.content for item in reversed(context) if item.role in {"user", "assistant"}), "that")
            reply = f"In simple terms, {previous_topic.rstrip('.')} means the basic idea is easier to use than it first sounds."
        elif "who created it" in lower and context:
            previous = " ".join(item.content.casefold() for item in context)
            if "react" in previous:
                reply = "React was created at Facebook, now Meta, and was first released publicly in 2013."
            elif "python" in previous:
                reply = "Python was created by Guido van Rossum and first released in 1991."
            else:
                reply = "I need a little more context to identify what you mean by ‘it’."
        else:
            reply = "I’m still learning how to answer that well. Could you rephrase it or tell me what outcome you want?"
        return AIResult(reply=reply, intent="general_question", source="local")


class OpenAICompatibleProvider(AIProvider):
    async def answer(self, message: str, context: list[ConversationMessage]) -> AIResult:
        if not settings.ai_api_key:
            return await LocalAIProvider().answer(message, context)

        messages = [
            {"role": "system", "content": "You are JARVIS, a concise and accurate desktop assistant. Do not claim to execute tools."},
            *[item.model_dump() for item in context[-settings.memory_max_messages :]],
            {"role": "user", "content": message},
        ]
        headers = {"Authorization": f"Bearer {settings.ai_api_key}"}
        payload = {"model": settings.ai_model, "messages": messages, "temperature": 0.2}

        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.post(f"{settings.ai_base_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"].strip()
        return AIResult(reply=content, intent="general_question", source="llm")


def get_ai_provider() -> AIProvider:
    if settings.ai_provider == "openai" and settings.ai_api_key:
        return OpenAICompatibleProvider()
    return LocalAIProvider()
