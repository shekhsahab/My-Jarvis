from __future__ import annotations


def detect_wake_word(transcript: str, wake_word: str = "Jarvis") -> bool:
    text = (transcript or "").strip()
    if not text:
        return False

    normalized = text.casefold()
    target = wake_word.casefold()
    return normalized == target or normalized.startswith(f"{target} ") or normalized.startswith(f"{target},")


def extract_command(transcript: str, wake_word: str = "Jarvis") -> str:
    text = (transcript or "").strip()
    if not text:
        return ""

    normalized = text.casefold()
    target = wake_word.casefold()
    if normalized == target:
        return ""
    if normalized.startswith(target) and len(text) > len(wake_word):
        return text[len(wake_word) :].lstrip(" ,:-").strip()

    return text
