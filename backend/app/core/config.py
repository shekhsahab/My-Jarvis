from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "JARVIS"
    app_version: str = "0.1.0"
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"
    ai_provider: str = "openai"
    ai_base_url: str = "https://api.openai.com/v1"
    ai_timeout_seconds: float = 20.0
    memory_max_messages: int = 12

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
