"""Canonical IPO field schema and DRHP section definitions.

Single source of truth for:
  - which structured fields the wizard/parser capture (FIELD_SCHEMA)
  - which DRHP sections exist, who owns them, and what data they need (SECTIONS)

field_key convention matches database/schema.sql (e.g. 'financials.revenue_fy25').
"""
from __future__ import annotations

# --- Structured field catalogue -------------------------------------------------
# tracked=True  -> compared across documents for cross-document consistency
# required=True -> flagged as a 'missing' validation issue when absent
# patterns      -> regexes the offline stub extractor uses (LLM ignores them)

FIELD_SCHEMA: list[dict] = [
    # Company (corporate)
    {"key": "company.name", "label": "Company Name", "wizard_step": "company",
     "category": "corporate", "required": True, "tracked": False,
     "patterns": [r"company\s*name\s*[:\-]\s*(.+)"]},
    {"key": "company.cin", "label": "CIN", "wizard_step": "company",
     "category": "corporate", "required": True, "tracked": False,
     "patterns": [r"\b([UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})\b", r"cin\s*[:\-]\s*(.+)"]},
    {"key": "company.incorporation_date", "label": "Date of Incorporation", "wizard_step": "company",
     "category": "corporate", "required": False, "tracked": False,
     "patterns": [r"incorporat(?:ion|ed)\s*(?:date|on)?\s*[:\-]\s*(.+)"]},
    {"key": "company.registered_office", "label": "Registered Office", "wizard_step": "company",
     "category": "corporate", "required": False, "tracked": False,
     "patterns": [r"registered\s*office\s*[:\-]\s*(.+)"]},
    {"key": "company.industry", "label": "Industry", "wizard_step": "company",
     "category": "corporate", "required": True, "tracked": False,
     "patterns": [r"industry\s*[:\-]\s*(.+)"]},

    # Promoters (corporate/legal)
    {"key": "promoters.names", "label": "Promoter Names", "wizard_step": "promoters",
     "category": "corporate", "required": True, "tracked": False,
     "patterns": [r"promoters?\s*[:\-]\s*(.+)"]},
    {"key": "promoters.holding_pct", "label": "Promoter Holding %", "wizard_step": "promoters",
     "category": "corporate", "required": True, "tracked": True,
     "patterns": [r"promoter[s]?\s*(?:holding|shareholding)\s*(?:%|percent)?\s*[:\-]\s*([\d.]+)"]},
    {"key": "promoters.experience", "label": "Promoter Experience", "wizard_step": "promoters",
     "category": "corporate", "required": False, "tracked": False,
     "patterns": [r"promoter\s*experience\s*[:\-]\s*(.+)"]},

    # Financials (financial)
    {"key": "financials.revenue_fy25", "label": "Revenue FY25", "wizard_step": "financials",
     "category": "financial", "required": True, "tracked": True,
     "patterns": [r"revenue\s*(?:fy\s*25|2024[-/]25)?\s*[:\-]\s*(.+)"]},
    {"key": "financials.revenue_fy24", "label": "Revenue FY24", "wizard_step": "financials",
     "category": "financial", "required": False, "tracked": False,
     "patterns": [r"revenue\s*(?:fy\s*24|2023[-/]24)\s*[:\-]\s*(.+)"]},
    {"key": "financials.pat_fy25", "label": "Profit After Tax FY25", "wizard_step": "financials",
     "category": "financial", "required": True, "tracked": False,
     "patterns": [r"(?:pat|profit\s*after\s*tax)\s*(?:fy\s*25)?\s*[:\-]\s*(.+)"]},
    {"key": "financials.net_worth", "label": "Net Worth", "wizard_step": "financials",
     "category": "financial", "required": True, "tracked": True,
     "patterns": [r"net\s*worth\s*[:\-]\s*(.+)"]},
    {"key": "financials.employee_count", "label": "Employee Count", "wizard_step": "financials",
     "category": "financial", "required": False, "tracked": True,
     "patterns": [r"employee[s]?\s*(?:count|strength)?\s*[:\-]\s*([\d,]+)"]},

    # Legal (legal)
    {"key": "legal.litigations", "label": "Material Litigations", "wizard_step": "legal",
     "category": "legal", "required": True, "tracked": False,
     "patterns": [r"litigation[s]?\s*[:\-]\s*(.+)"]},
    {"key": "legal.approvals", "label": "Statutory Approvals", "wizard_step": "legal",
     "category": "legal", "required": False, "tracked": False,
     "patterns": [r"approvals?\s*[:\-]\s*(.+)"]},

    # Issue (corporate)
    {"key": "issue.size", "label": "Issue Size", "wizard_step": "issue",
     "category": "corporate", "required": True, "tracked": False,
     "patterns": [r"issue\s*size\s*[:\-]\s*(.+)"]},
    {"key": "issue.objects", "label": "Objects of the Issue", "wizard_step": "issue",
     "category": "corporate", "required": True, "tracked": False,
     "patterns": [r"objects?\s*(?:of\s*(?:the\s*)?issue)?\s*[:\-]\s*(.+)"]},

    # Risk (compliance)
    {"key": "risk.key_risks", "label": "Key Risk Factors", "wizard_step": "risk",
     "category": "compliance", "required": True, "tracked": False,
     "patterns": [r"(?:key\s*)?risk[s]?\s*(?:factors?)?\s*[:\-]\s*(.+)"]},
]

FIELD_BY_KEY: dict[str, dict] = {f["key"]: f for f in FIELD_SCHEMA}
REQUIRED_KEYS: list[str] = [f["key"] for f in FIELD_SCHEMA if f["required"]]
TRACKED_KEYS: list[str] = [f["key"] for f in FIELD_SCHEMA if f["tracked"]]

WIZARD_STEPS: list[str] = ["company", "promoters", "financials", "legal", "issue", "risk"]


# --- DRHP section catalogue -----------------------------------------------------
# Phase 1: hardcoded SEBI ICDR snippets (Phase 2 replaces with RAG retrieval).

SECTIONS: list[dict] = [
    {
        "key": "company_overview",
        "title": "Company Overview",
        "owner_role": "sme",
        "required_fields": ["company.name", "company.cin", "company.industry",
                            "company.incorporation_date"],
        "instructions": "State the legal name, CIN, date and place of incorporation, "
                        "registered office and the nature of the business.",
        "regulation": "SEBI ICDR Schedule VI: general information about the issuer, "
                      "history and certain corporate matters.",
    },
    {
        "key": "business",
        "title": "Our Business",
        "owner_role": "sme",
        "required_fields": ["company.industry", "promoters.names", "financials.employee_count"],
        "instructions": "Describe the business model, products/services, industry context, "
                        "competitive strengths and operations.",
        "regulation": "SEBI ICDR Schedule VI Part A: business overview, products, "
                      "capacity and key operational metrics.",
    },
    {
        "key": "financial_summary",
        "title": "Financial Information",
        "owner_role": "sme",
        "required_fields": ["financials.revenue_fy25", "financials.pat_fy25",
                            "financials.net_worth"],
        "instructions": "Summarise revenue, profitability, net worth and key ratios over "
                        "the restated period.",
        "regulation": "SEBI ICDR Schedule VI Part A (9): restated financial statements "
                      "and management discussion of financial condition.",
    },
    {
        "key": "risk_factors",
        "title": "Risk Factors",
        "owner_role": "legal_counsel",
        "required_fields": ["risk.key_risks", "legal.litigations"],
        "instructions": "Present internal and external risk factors specific to the issuer, "
                        "materiality-ordered, each with a brief impact statement.",
        "regulation": "SEBI ICDR Schedule VI Part A (2): risk factors, internal and external, "
                      "with quantification where possible.",
    },
    {
        "key": "objects_of_issue",
        "title": "Objects of the Issue",
        "owner_role": "merchant_banker",
        "required_fields": ["issue.size", "issue.objects"],
        "instructions": "State the objects of the fresh issue, the proposed deployment of "
                        "net proceeds and the means of finance.",
        "regulation": "SEBI ICDR Schedule VI Part A (4): objects of the issue and detailed "
                      "break-up of proceeds utilisation.",
    },
]

SECTION_BY_KEY: dict[str, dict] = {s["key"]: s for s in SECTIONS}
SECTION_KEYS: list[str] = [s["key"] for s in SECTIONS]
