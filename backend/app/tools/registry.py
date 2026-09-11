from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable

from app.tools.browser_tools import ALLOWED_WEBSITES, BrowserToolResult, open_website, search_youtube
from app.tools.system_tools import ToolResult, execute_system_command, supports_system_command


@dataclass(frozen=True)
class ResolvedTool:
    name: str
    execute: Callable[[], BrowserToolResult | ToolResult]


def _clean_command(command: str) -> str:
    cleaned = command.casefold().strip()
    cleaned = re.sub(r"[?.!,]+$", "", cleaned)
    cleaned = re.sub(r"^(please|can you|could you|would you)\s+", "", cleaned)
    return cleaned.strip()


def resolve_tool(command: str) -> ResolvedTool | None:
    cleaned = _clean_command(command)

    if cleaned.startswith("search youtube for "):
        query = command.strip()[len("search youtube for ") :]
        return ResolvedTool("search_youtube", lambda: search_youtube(query))

    has_open_intent = any(
        phrase in cleaned for phrase in ("open ", "launch ", "go to ", "take me to ")
    )
    if has_open_intent:
        for site in ALLOWED_WEBSITES:
            if re.search(rf"\b{re.escape(site)}(?:\.com)?\b", cleaned):
                return ResolvedTool("open_website", lambda site=site: open_website(site))

    if supports_system_command(cleaned):
        return ResolvedTool("system_command", lambda: execute_system_command(command))

    return None


def execute_resolved_tool(command: str) -> BrowserToolResult | ToolResult | None:
    resolved = resolve_tool(command)
    return resolved.execute() if resolved else None
