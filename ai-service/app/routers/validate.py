"""POST /validate — completeness, consistency and disclosure-gap checks.

Rule-based core always runs (missing required fields + cross-document diffs on
tracked fields). LLM adds disclosure-gap flags when available.
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from ..llm import complete_json
from ..schema import FIELD_BY_KEY, REQUIRED_KEYS, SECTIONS, TRACKED_KEYS

router = APIRouter(tags=["validate"])


class ValidateRequest(BaseModel):
    ipo_data: dict[str, str] = {}
    # tracked_sources: {field_key: [{"document_id": int, "value": str}, ...]}
    tracked_sources: dict[str, list[dict]] = {}


def _rule_flags(ipo_data: dict, tracked_sources: dict) -> list[dict]:
    flags: list[dict] = []

    # 1. Missing required fields.
    for key in REQUIRED_KEYS:
        val = (ipo_data.get(key) or "").strip()
        if not val:
            spec = FIELD_BY_KEY[key]
            flags.append({
                "issue_type": "missing",
                "field_key": key,
                "section_key": None,
                "reason": f"Required field '{spec['label']}' is not captured.",
            })

    # 2. Cross-document inconsistency on tracked fields.
    for key in TRACKED_KEYS:
        sources = tracked_sources.get(key, [])
        distinct = {}
        for s in sources:
            v = str(s.get("value", "")).strip()
            if v:
                distinct.setdefault(v, []).append(s.get("document_id"))
        if len(distinct) > 1:
            spec = FIELD_BY_KEY[key]
            variants = "; ".join(f"'{v}' (doc {ids})" for v, ids in distinct.items())
            flags.append({
                "issue_type": "inconsistent",
                "field_key": key,
                "section_key": None,
                "reason": f"'{spec['label']}' differs across documents: {variants}.",
            })

    # 3. Disclosure-gap heuristic: section required fields absent.
    for sec in SECTIONS:
        missing = [k for k in sec["required_fields"] if not (ipo_data.get(k) or "").strip()]
        if missing:
            labels = ", ".join(FIELD_BY_KEY[k]["label"] for k in missing)
            flags.append({
                "issue_type": "disclosure_gap",
                "field_key": None,
                "section_key": sec["key"],
                "reason": f"Section '{sec['title']}' lacks required disclosure(s): {labels}.",
            })

    return flags


def _llm_flags(req: ValidateRequest) -> list[dict]:
    system = ("You are a completeness reviewer for SME IPO offer documents under "
              "SEBI's ICDR framework.")
    user = (
        "Identify material disclosure gaps and internal inconsistencies.\n"
        f"Structured IPO data: {req.ipo_data}\n"
        f"Cross-document tracked values: {req.tracked_sources}\n"
        'Output: {"flags":[{"issue_type","field_key","section_key","reason"}]}'
    )
    data = complete_json(system, user)
    return data.get("flags", [])


@router.post("/validate")
def validate(req: ValidateRequest) -> dict:
    flags = _rule_flags(req.ipo_data, req.tracked_sources)
    mode = "rules"
    try:
        llm = _llm_flags(req)
        # de-dupe llm flags that duplicate a rule reason
        existing = {(f["issue_type"], f["field_key"], f["section_key"]) for f in flags}
        for f in llm:
            key = (f.get("issue_type"), f.get("field_key"), f.get("section_key"))
            if key not in existing:
                flags.append(f)
        mode = "rules+llm"
    except Exception:  # LLMUnavailable or any provider error -> rules-only
        pass
    return {"mode": mode, "count": len(flags), "flags": flags}
