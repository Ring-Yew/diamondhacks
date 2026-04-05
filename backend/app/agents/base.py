import anthropic
from app.core.config import get_settings

settings = get_settings()
_client: anthropic.AsyncAnthropic | None = None


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


CLAUDE_MODEL = "claude-sonnet-4-6"
