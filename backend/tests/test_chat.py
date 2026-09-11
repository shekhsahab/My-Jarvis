from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_endpoint_returns_reply() -> None:
    response = client.post(
        "/api/chat",
        json={"message": "Hello Jarvis, how are you?"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "reply" in payload
    assert isinstance(payload["reply"], str)
    assert len(payload["reply"]) > 0
    assert "full JARVIS toolchain" not in payload["reply"]


def test_chat_endpoint_uses_professional_unknown_command_reply() -> None:
    response = client.post("/api/chat", json={"message": "How are you?"})

    assert response.status_code == 200
    assert response.json()["reply"] == "I’m doing well, thank you. My conversation system and connected tools are online. What can I help you with?"


def test_chat_endpoint_supports_basic_conversation() -> None:
    hello = client.post("/api/chat", json={"message": "Hello"})
    thanks = client.post("/api/chat", json={"message": "Thank you"})

    assert "What would you like to work on?" in hello.json()["reply"]
    assert "You’re welcome" in thanks.json()["reply"]


def test_chat_endpoint_extracts_wake_word() -> None:
    response = client.post("/api/chat", json={"message": "Jarvis, remember my favorite color"})

    assert response.status_code == 200
    assert "store that preference" in response.json()["reply"]


def test_chat_endpoint_dispatches_youtube(monkeypatch) -> None:
    opened_urls: list[str] = []
    monkeypatch.setattr("webbrowser.open", opened_urls.append)

    response = client.post("/api/chat", json={"message": "Jarvis, open YouTube"})

    assert response.status_code == 200
    assert response.json()["status"] == "executed"
    assert opened_urls == ["https://www.youtube.com"]


def test_chat_endpoint_understands_natural_youtube_request(monkeypatch) -> None:
    opened_urls: list[str] = []
    monkeypatch.setattr("webbrowser.open", opened_urls.append)

    response = client.post("/api/chat", json={"message": "Can you open YouTube for me?"})

    assert response.json()["status"] == "executed"
    assert opened_urls == ["https://www.youtube.com"]


def test_chat_endpoint_does_not_open_unapproved_website(monkeypatch) -> None:
    opened_urls: list[str] = []
    monkeypatch.setattr("webbrowser.open", opened_urls.append)

    response = client.post("/api/chat", json={"message": "Open suspicious-example.com"})

    assert response.json()["status"] == "ok"
    assert opened_urls == []


def test_chat_endpoint_dispatches_volume(monkeypatch) -> None:
    volume_presses: list[tuple[int, int]] = []
    monkeypatch.setattr(
        "app.tools.system_tools._press_volume_key",
        lambda key_code, presses=5: volume_presses.append((key_code, presses)),
    )

    response = client.post("/api/chat", json={"message": "increase the system volume"})

    assert response.status_code == 200
    assert response.json()["status"] == "executed"
    assert volume_presses == [(0xAF, 5)]


def test_chat_endpoint_returns_web_sources(monkeypatch) -> None:
    async def fake_search(query: str):
        class Search:
            def __init__(self, search_query: str) -> None:
                self.results = [type("Result", (), {"title": "React", "url": "https://react.dev", "snippet": "Official React documentation."})()]
                self.query = search_query

        return Search(query)

    monkeypatch.setattr("app.api.routes.chat.search_web", fake_search)
    response = client.post("/api/chat", json={"message": "Search the web for React"})

    assert response.status_code == 200
    assert response.json()["intent"] == "web_search"
    assert response.json()["sources"][0]["url"] == "https://react.dev"
