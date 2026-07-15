"""Module 16 — POST /consistency: whole-draft logical consistency engine.

Goes beyond missing-field checks (/validate): analyses the assembled DRHP
across sections for contradictions, stale figures and placeholder residue.
Rule-based core always runs; an LLM pass adds semantic cross-section findings
when a provider is configured.
"""
from __future__ import annotations

import re

from fastapi import APIRouter
from pydantic import BaseModel

from ..llm import complete_json
from ..schema import FIELD_BY_KEY, SECTION_BY_KEY

router = APIRouter(tags=["consistency"])

SEVERITIES = ("high", "medium", "low")


class SectionPayload(BaseModel):
    section_key: str
    title: str
    content: str = ""
    status: str = "empty"


class ConsistencyRequest(BaseModel):
    company_name: str = ""
    ipo_data: dict[str, str] = {}
    sections: list[SectionPayload] = []


def _norm(s: str) -> str:
    return re.sub(r"[,\s]+", "", s or "").lower()


def _rule_findings(req: ConsistencyRequest) -> list[dict]:
    findings: list[dict] = []

    for s in req.sections:
        content = s.content or ""

        # 1. Placeholder residue in sections already marked as reviewed/verified.
        if "[INFORMATION REQUIRED" in content and s.status not in ("empty", "ai_generated"):
            findings.append({
                "severity": "high",
                "type": "placeholder",
                "section_key": s.section_key,
                "related_sections": [],
                "detail": (f"Section '{s.title}' is marked '{s.status}' but still contains "
                           "[INFORMATION REQUIRED] placeholders."),
            })

        # 2. Stale figures: canonical value absent from the section that must disclose it.
        cat = SECTION_BY_KEY.get(s.section_key)
        if cat:
            content_norm = _norm(content)
            for key in cat["required_fields"]:
                val = (req.ipo_data.get(key) or "").strip()
                if (val and any(ch.isdigit() for ch in val)
                        and len(_norm(val)) >= 3 and _norm(val) not in content_norm):
                    label = FIELD_BY_KEY.get(key, {}).get("label", key)
                    findings.append({
                        "severity": "medium",
                        "type": "stale_data",
                        "section_key": s.section_key,
                        "related_sections": [],
                        "detail": (f"'{label}' is '{val}' in the structured data but that figure "
                                   f"does not appear in '{s.title}' — the draft may predate a data change."),
                    })

    # 3. Company-name consistency in identity-bearing sections.
    name = (req.ipo_data.get("company.name") or req.company_name or "").strip()
    if name:
        for s in req.sections:
            if s.section_key in ("company_overview", "business") and s.content \
                    and name.lower() not in s.content.lower():
                findings.append({
                    "severity": "low",
                    "type": "name_mismatch",
                    "section_key": s.section_key,
                    "related_sections": [],
                    "detail": f"Company name '{name}' does not appear in '{s.title}'.",
                })

    return findings


def _llm_findings(req: ConsistencyRequest) -> list[dict]:
    system = ("You are a consistency reviewer for a Draft Red Herring Prospectus (SME IPO, "
              "SEBI ICDR). You check the WHOLE draft across sections for logical "
              "contradictions — figures, dates, names, promises vs objects — not for "
              "missing fields.")
    body = "\n\n".join(
        f"### {s.title} [{s.section_key}] (status: {s.status})\n{(s.content or '')[:4000]}"
        for s in req.sections
    )
    user = (
        f"Company: {req.company_name}\n"
        f"Canonical structured data: {req.ipo_data}\n\n"
        f"Draft sections:\n{body}\n\n"
        "Identify cross-section inconsistencies: conflicting figures, contradictory statements, "
        "risks contradicted elsewhere, objects of the issue not matching financial narrative, "
        "inconsistent entity names or dates. Do NOT report missing data.\n"
        'Output STRICT JSON: {"findings":[{"severity":"high|medium|low","type":"cross_section",'
        '"section_key":"...","related_sections":["..."],"detail":"..."}]}'
    )
    data = complete_json(system, user, max_tokens=2000)
    out = []
    for f in data.get("findings", []):
        out.append({
            "severity": f.get("severity") if f.get("severity") in SEVERITIES else "medium",
            "type": f.get("type") or "cross_section",
            "section_key": f.get("section_key"),
            "related_sections": f.get("related_sections") or [],
            "detail": f.get("detail") or "",
        })
    return out


@router.post("/consistency")
def consistency(req: ConsistencyRequest) -> dict:
    findings = _rule_findings(req)
    mode = "rules"
    try:
        existing = {(f["type"], f["section_key"]) for f in findings}
        for f in _llm_findings(req):
            if (f["type"], f["section_key"]) not in existing and f["detail"]:
                findings.append(f)
        mode = "rules+llm"
    except Exception:  # LLMUnavailable or provider error -> rules-only
        pass
    order = {s: i for i, s in enumerate(SEVERITIES)}
    findings.sort(key=lambda f: order.get(f["severity"], 1))
    return {"mode": mode, "count": len(findings), "findings": findings}
