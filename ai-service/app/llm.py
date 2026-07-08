"""LLM provider abstraction.

If a real provider + key is configured, calls Anthropic or OpenAI. Otherwise
raises LLMUnavailable so callers fall back to deterministic stub logic. Heavy
SDKs are imported lazily so the service installs/runs without them.
"""
from __future__ import annotations

import json

from .settings import settings


class LLMUnavailable(Exception):
    """Raised when no usable LLM is configured; callers use stub fallback."""


def complete(system: str, user: str, max_tokens: int = 2000) -> str:
    """Return raw model text. Raises LLMUnavailable if no provider/key."""
    if not settings.llm_enabled:
        raise LLMUnavailable(f"provider={settings.provider} has no key configured")

    if settings.provider == "anthropic":
        try:
            import anthropic  # lazy
        except ImportError as e:  # pragma: no cover - optional dep
            raise LLMUnavailable("anthropic SDK not installed") from e
        client = anthropic.Anthropic(api_key=settings.anthropic_key)
        msg = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return "".join(block.text for block in msg.content if block.type == "text")

    if settings.provider == "openai":
        try:
            import openai  # lazy
        except ImportError as e:  # pragma: no cover - optional dep
            raise LLMUnavailable("openai SDK not installed") from e
        client = openai.OpenAI(api_key=settings.openai_key)
        resp = client.chat.completions.create(
            model=settings.openai_model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return resp.choices[0].message.content or ""

    raise LLMUnavailable(f"unknown provider {settings.provider}")


def complete_json(system: str, user: str, max_tokens: int = 2000) -> dict:
    """Call the model and parse a JSON object out of the response."""
    raw = complete(system + "\nReturn STRICT JSON only.", user, max_tokens)
    return _extract_json(raw)


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"no JSON object in model output: {text[:200]}")
    return json.loads(text[start:end + 1])
