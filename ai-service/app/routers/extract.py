"""POST /extract — structured field extraction from document text.

LLM path uses the extraction prompt; offline path uses regex/label heuristics
over FIELD_SCHEMA so the pipeline always yields structured fields.
"""
from __future__ import annotations

import re

from fastapi import APIRouter
from pydantic import BaseModel

from ..llm import complete_json
from ..schema import FIELD_SCHEMA

router = APIRouter(tags=["extract"])


class ExtractRequest(BaseModel):
    filename: str = ""
    category: str = ""
    wizard_step: str = ""
    text: str


def _stub_extract(text: str, category: str, wizard_step: str) -> list[dict]:
    """Deterministic extraction: regex patterns + 'Label: value' lines."""
    fields: list[dict] = []
    seen: set[str] = set()
    lowered = text

    for spec in FIELD_SCHEMA:
        # Bias toward fields relevant to this document, but still try all.
        relevant = (not category or spec["category"] == category
                    or not wizard_step or spec["wizard_step"] == wizard_step)
        value = None
        quote = ""
        for pat in spec.get("patterns", []):
            m = re.search(pat, lowered, flags=re.IGNORECASE)
            if m:
                value = m.group(1).strip() if m.groups() else m.group(0).strip()
                quote = m.group(0).strip()[:160]
                break
        if value is None:
            # try "<label>: value"
            label = re.escape(spec["label"])
            m = re.search(rf"{label}\s*[:\-]\s*(.+)", text, flags=re.IGNORECASE)
            if m:
                value = m.group(1).strip()
                quote = m.group(0).strip()[:160]
        if value:
            value = value.splitlines()[0].strip().rstrip(".;,")
            if not value or spec["key"] in seen:
                continue
            seen.add(spec["key"])
            conf = 0.9 if relevant else 0.72
            fields.append({
                "field_key": spec["key"],
                "value": value,
                "confidence": conf,
                "quote": quote,
            })
    return fields


def _llm_extract(req: ExtractRequest) -> list[dict]:
    schema_json = [
        {"field_key": f["key"], "label": f["label"], "category": f["category"]}
        for f in FIELD_SCHEMA
    ]
    system = "You are a data-extraction engine for SME IPO preparation in India."
    user = (
        f"Document filename: {req.filename}\n"
        f"Document category: {req.category}\n"
        f"Wizard step context: {req.wizard_step}\n\n"
        f"Target fields: {schema_json}\n\n"
        "Rules: never invent values; omit unevidenced fields; confidence 0.0-1.0; "
        "preserve units/currency; quote is the shortest supporting snippet.\n"
        'Output: {"fields":[{"field_key","value","confidence","quote"}]}\n\n'
        f"Document text:\n{req.text[:12000]}"
    )
    data = complete_json(system, user)
    return data.get("fields", [])


@router.post("/extract")
def extract(req: ExtractRequest) -> dict:
    try:
        fields = _llm_extract(req)
        mode = "llm"
    except Exception:  # LLMUnavailable or any provider error -> deterministic stub
        fields = _stub_extract(req.text, req.category, req.wizard_step)
        mode = "stub"
    return {"mode": mode, "count": len(fields), "fields": fields}
