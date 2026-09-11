from __future__ import annotations

import ctypes
import platform
import webbrowser
from dataclasses import dataclass
from urllib.parse import quote_plus


@dataclass(frozen=True)
class ToolResult:
    handled: bool
    reply: str


def _press_volume_key(key_code: int, presses: int = 5) -> None:
    if platform.system() != "Windows":
        raise RuntimeError("System volume control is currently supported on Windows only.")

    user32 = ctypes.WinDLL("user32", use_last_error=True)
    key_up = 0x0002
    for _ in range(presses):
        user32.keybd_event(key_code, 0, 0, 0)
        user32.keybd_event(key_code, 0, key_up, 0)


def execute_system_command(command: str) -> ToolResult:
    text = command.strip()
    lower = text.casefold()

    if lower in {"open youtube", "open youtube.com", "go to youtube"}:
        webbrowser.open("https://www.youtube.com")
        return ToolResult(True, "Opening YouTube in your default browser.")

    if lower.startswith("search youtube for "):
        query = text[len("search youtube for ") :].strip()
        if query:
            webbrowser.open(f"https://www.youtube.com/results?search_query={quote_plus(query)}")
            return ToolResult(True, f"Searching YouTube for {query}.")

    if any(
        phrase in lower
        for phrase in ("increase volume", "increase the system volume", "turn up volume", "volume up", "louder")
    ):
        _press_volume_key(0xAF)
        return ToolResult(True, "Increasing the system volume.")

    if any(
        phrase in lower
        for phrase in ("decrease volume", "decrease the system volume", "turn down volume", "volume down", "quieter")
    ):
        _press_volume_key(0xAE)
        return ToolResult(True, "Decreasing the system volume.")

    if "mute" in lower and "unmute" not in lower:
        _press_volume_key(0xAD, presses=1)
        return ToolResult(True, "Toggling system mute.")

    return ToolResult(False, "")


def supports_system_command(command: str) -> bool:
    lower = command.casefold().strip()
    return any(
        phrase in lower
        for phrase in (
            "increase volume",
            "increase the system volume",
            "turn up volume",
            "volume up",
            "louder",
            "decrease volume",
            "decrease the system volume",
            "turn down volume",
            "volume down",
            "quieter",
        )
    ) or ("mute" in lower and "unmute" not in lower)
