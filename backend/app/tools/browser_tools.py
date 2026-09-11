from __future__ import annotations

import webbrowser
from dataclasses import dataclass
from urllib.parse import quote_plus


@dataclass(frozen=True)
class BrowserToolResult:
    reply: str
    tool_name: str
    permission: str = "safe"


ALLOWED_WEBSITES: dict[str, str] = {
    "youtube": "https://www.youtube.com",
    "google": "https://www.google.com",
    "gmail": "https://mail.google.com",
    "github": "https://github.com",
}


def open_website(site: str) -> BrowserToolResult:
    key = site.casefold().strip().removesuffix(".com")
    url = ALLOWED_WEBSITES.get(key)
    if not url:
        raise ValueError(f"I can only open approved websites: {', '.join(ALLOWED_WEBSITES)}.")

    webbrowser.open(url)

    return BrowserToolResult(f"Opening {key.title()} in your default browser.", "open_website")


def search_youtube(query: str) -> BrowserToolResult:
    cleaned_query = query.strip()
    if not cleaned_query:
        raise ValueError("Tell me what you want to search for on YouTube.")

    url = f"https://www.youtube.com/results?search_query={quote_plus(cleaned_query)}"
    webbrowser.open(url)

    return BrowserToolResult(f"Searching YouTube for {cleaned_query}.", "search_youtube")
