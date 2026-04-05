from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()
_client: AsyncOpenAI | None = None


def get_anthropic_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.anthropic_api_key,
            base_url="https://api.deepseek.com",
        )
    return _client


CLAUDE_MODEL = "deepseek-chat"
