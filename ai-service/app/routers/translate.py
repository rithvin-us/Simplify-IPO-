"""Module 17 — POST /translate: translate drafted section content.

LLM-backed; in stub mode the original text is returned with a note so the
pipeline stays runnable offline.
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from ..languages import LANGUAGES, language_name
from ..llm import complete

router = APIRouter(tags=["translate"])


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "hi"
    source_language: str = "en"


@router.get("/languages")
def languages() -> dict:
    return {"languages": [{"code": c, "name": n} for c, n in LANGUAGES.items()]}


@router.post("/translate")
def translate(req: TranslateRequest) -> dict:
    target = language_name(req.target_language)
    system = ("You are a professional translator for Indian securities offer documents. "
              "Preserve markdown structure, numbers, dates and amounts exactly. Keep "
              "defined terms and statutory references (e.g. 'SEBI ICDR') in English.")
    user = (f"Translate the following DRHP section from {language_name(req.source_language)} "
            f"into {target}. Output only the translated markdown.\n\n{req.text}")
    try:
        translated = complete(system, user, max_tokens=3000)
        return {"mode": "llm", "language": req.target_language, "translated": translated}
    except Exception:
        return {
            "mode": "stub",
            "language": req.target_language,
            "translated": req.text,
            "note": "translation requires an LLM provider (set LLM_PROVIDER=anthropic|openai); original text returned",
        }
