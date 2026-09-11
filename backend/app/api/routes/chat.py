from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ai.provider import get_ai_provider
from app.conversation.manager import conversation_manager
from app.search.web import search_web
from app.tools.registry import execute_resolved_tool
from app.voice.wake_word import extract_command

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: str
    status: str = "ok"
    intent: str = "general_question"
    source: str = "local"
    tool: str | None = None
    sources: list[dict[str, str]] = Field(default_factory=list)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    message = extract_command(request.message)

    if not message:
        return ChatResponse(reply="I’m here. Tell me what you want me to do.", status="ok")

    try:
        tool_result = execute_resolved_tool(message)
    except Exception as error:
        return ChatResponse(reply=f"I could not complete that task: {error}", status="error")

    if tool_result is not None:
        reply = tool_result.reply
        conversation_manager.add("user", message)
        conversation_manager.add("tool", reply)
        return ChatResponse(reply=reply, status="executed", intent="tool_call", source="tool", tool=getattr(tool_result, "tool_name", "system_command"))

    lower = message.casefold()
    search_requested = any(
        phrase in lower
        for phrase in ("search the web", "search online", "latest", "current news", "today's news", "what happened today")
    )
    if search_requested:
        query = message
        for prefix in ("search the web for", "search online for", "find the latest information about"):
            if lower.startswith(prefix):
                query = message[len(prefix) :].strip()
                break
        try:
            search = await search_web(query)
        except Exception:
            return ChatResponse(
                reply="I couldn’t complete that web search because the search service is unavailable right now.",
                status="error",
                intent="web_search",
                source="local",
            )
        if not search.results:
            return ChatResponse(reply=f"I couldn’t find reliable results for {search.query}.", status="ok", intent="web_search")
        summary = " ".join(result.snippet for result in search.results[:3] if result.snippet)
        reply = f"I found these results for {search.query}: {summary}" if summary else f"I found results for {search.query}."
        conversation_manager.add("user", message)
        conversation_manager.add("tool", reply)
        return ChatResponse(
            reply=reply,
            status="executed",
            intent="web_search",
            source="tool",
            tool="web_search",
            sources=[{"title": item.title, "url": item.url, "snippet": item.snippet} for item in search.results],
        )

    conversation_manager.add("user", message)
    try:
        result = await get_ai_provider().answer(message, conversation_manager.recent()[:-1])
    except Exception:
        result = None

    if result is None:
        reply = "I’m unable to reach the AI service right now. I can still handle my connected local tools."
        return ChatResponse(reply=reply, status="error", intent="general_question", source="local")

    conversation_manager.add("assistant", result.reply)
    return ChatResponse(reply=result.reply, status="ok", intent=result.intent, source=result.source, tool=result.tool)
