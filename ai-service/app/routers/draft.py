"""POST /draft — generate ONE DRHP section from structured IPO data.

Never one-click full-document generation. Offline path renders a formal
section template, inserting [INFORMATION REQUIRED: ...] where data is absent.
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from ..llm import complete
from ..schema import FIELD_BY_KEY, SECTION_BY_KEY

router = APIRouter(tags=["draft"])


class DraftRequest(BaseModel):
    section_key: str
    ipo_data: dict[str, str] = {}


def _val(data: dict, key: str) -> str:
    v = (data.get(key) or "").strip()
    if v:
        return v
    label = FIELD_BY_KEY.get(key, {}).get("label", key)
    return f"[INFORMATION REQUIRED: {label}]"


def _stub_draft(sec: dict, data: dict) -> str:
    k = sec["key"]
    title = sec["title"]
    if k == "company_overview":
        body = (
            f"{_val(data, 'company.name')} (the \"Company\") is a company incorporated "
            f"in India bearing Corporate Identity Number {_val(data, 'company.cin')}. "
            f"The Company was incorporated on {_val(data, 'company.incorporation_date')} "
            f"and operates in the {_val(data, 'company.industry')} sector. Its registered "
            f"office is situated at {_val(data, 'company.registered_office')}.")
    elif k == "business":
        body = (
            f"The Company operates in the {_val(data, 'company.industry')} sector. "
            f"As on the date of this Draft Red Herring Prospectus, the Company employs "
            f"{_val(data, 'financials.employee_count')} personnel. The business is "
            f"promoted and managed by {_val(data, 'promoters.names')}, whose relevant "
            f"experience is set out in the section titled 'Our Management'.")
    elif k == "financial_summary":
        body = (
            "The following is a summary of the restated financial information of the "
            f"Company. Revenue from operations for FY2025 was {_val(data, 'financials.revenue_fy25')} "
            f"and for FY2024 was {_val(data, 'financials.revenue_fy24')}. Profit after tax "
            f"for FY2025 was {_val(data, 'financials.pat_fy25')}. The net worth of the "
            f"Company was {_val(data, 'financials.net_worth')}. Investors should read this "
            "summary together with the restated financial statements included elsewhere in "
            "this Draft Red Herring Prospectus.")
    elif k == "risk_factors":
        body = (
            "Investment in equity shares involves a high degree of risk. Prospective "
            "investors should carefully consider the following risk factors:\n\n"
            f"1. {_val(data, 'risk.key_risks')}\n\n"
            f"2. The Company is subject to the following material litigation: "
            f"{_val(data, 'legal.litigations')}. An adverse outcome could affect the "
            "Company's financial condition and results of operations.")
    elif k == "objects_of_issue":
        body = (
            f"The Company proposes to raise {_val(data, 'issue.size')} through the fresh "
            f"issue of equity shares. The objects of the Issue are: {_val(data, 'issue.objects')}. "
            "The net proceeds, after deduction of Issue-related expenses, are proposed to be "
            "deployed towards the objects set out above, in accordance with the schedule of "
            "implementation disclosed herein.")
    else:
        body = "[INFORMATION REQUIRED: section body]"

    return (
        f"## {title}\n\n"
        f"*Regulatory basis: {sec['regulation']}*\n\n"
        f"{body}\n"
    )


def _llm_draft(sec: dict, data: dict) -> str:
    system = ("You are drafting one section of a Draft Red Herring Prospectus for an SME "
              "IPO on an Indian SME Exchange, aligned with SEBI ICDR disclosure norms.")
    user = (
        f"Section to draft: {sec['title']}\n"
        f"Section-specific instructions: {sec['instructions']}\n"
        f"Relevant SEBI ICDR disclosure requirement: {sec['regulation']}\n"
        f"Structured company data: {data}\n\n"
        "Rules: use ONLY the structured data provided; where required information is absent, "
        "insert [INFORMATION REQUIRED: <what is missing>] rather than inventing it. Formal "
        "prospectus register, third person, no marketing language. Output clean markdown."
    )
    return complete(system, user, max_tokens=1500)


@router.post("/draft")
def draft(req: DraftRequest) -> dict:
    sec = SECTION_BY_KEY.get(req.section_key)
    if sec is None:
        return {"error": f"unknown section '{req.section_key}'",
                "known": list(SECTION_BY_KEY)}
    try:
        content = _llm_draft(sec, req.ipo_data)
        mode = "llm"
    except Exception:  # LLMUnavailable or any provider error -> deterministic stub
        content = _stub_draft(sec, req.ipo_data)
        mode = "stub"
    missing = [k for k in sec["required_fields"] if not (req.ipo_data.get(k) or "").strip()]
    return {
        "mode": mode,
        "section_key": sec["key"],
        "title": sec["title"],
        "owner_role": sec["owner_role"],
        "content": content,
        "missing": missing,
    }
