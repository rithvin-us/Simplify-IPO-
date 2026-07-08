"""Runtime configuration for the AI service.

Everything degrades gracefully: with no LLM key set, LLM_PROVIDER falls back to
'stub' and the pipeline runs deterministically offline. This keeps the whole
workflow runnable and debuggable without external services.
"""
import os


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip()


class Settings:
    def __init__(self) -> None:
        self.provider = _env("LLM_PROVIDER", "stub").lower() or "stub"
        self.anthropic_key = _env("ANTHROPIC_API_KEY")
        self.openai_key = _env("OPENAI_API_KEY")
        self.anthropic_model = _env("ANTHROPIC_MODEL", "claude-sonnet-5")
        self.openai_model = _env("OPENAI_MODEL", "gpt-4o")
        self.port = int(_env("AI_SERVICE_PORT", "8000") or "8000")

    @property
    def llm_enabled(self) -> bool:
        """True only if a real provider is selected AND a key is present."""
        if self.provider == "anthropic":
            return bool(self.anthropic_key)
        if self.provider == "openai":
            return bool(self.openai_key)
        return False

    def describe(self) -> dict:
        return {
            "provider": self.provider,
            "llm_enabled": self.llm_enabled,
            "mode": "llm" if self.llm_enabled else "stub (deterministic offline)",
        }


settings = Settings()
