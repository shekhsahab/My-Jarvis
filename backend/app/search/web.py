from __future__ import annotations

import re
from html import unescape
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

import httpx
from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    title: str = Field(min_length=1)
    url: str
    snippet: str = ""


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


def _clean_html(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def _safe_result_url(value: str) -> str | None:
    parsed = urlparse(value)
    if parsed.path == "/l/" and "uddg" in parse_qs(parsed.query):
        value = parse_qs(parsed.query)["uddg"][0]
        parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return value


async def search_web(query: str, limit: int = 5) -> SearchResponse:
    cleaned = query.strip()
    if not cleaned:
        raise ValueError("Tell me what you want to search for.")

    url = f"https://html.duckduckgo.com/html/?q={quote_plus(cleaned)}"
    headers = {"User-Agent": "JARVIS/1.0 local assistant"}
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

    links = re.findall(r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', response.text, re.S)
    snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</(?:a|div)>', response.text, re.S)
    results: list[SearchResult] = []
    for index, (raw_url, raw_title) in enumerate(links[:limit]):
        decoded_url = unquote(raw_url)
        safe_url = _safe_result_url(decoded_url)
        if not safe_url:
            continue
        results.append(
            SearchResult(
                title=_clean_html(raw_title),
                url=safe_url,
                snippet=_clean_html(snippets[index]) if index < len(snippets) else "",
            )
        )

    return SearchResponse(query=cleaned, results=results)
