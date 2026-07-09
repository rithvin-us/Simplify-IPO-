"""Canonical IPO field schema and DRHP section definitions.

Single source of truth for:
  - which structured fields the wizard/parser capture (FIELD_SCHEMA)
  - how each field is typed/constrained/described (drives UI + validation)
  - which DRHP sections exist, who owns them, and what data they need (SECTIONS)

field_key convention matches database/schema.sql (e.g. 'financials.revenue_fy25').

Field `type` values and their constraint meaning (enforced client + server side):
  text      - free text
  textarea  - long free text
  number    - numeric only (int/decimal); honour min/max/step
  percent   - numeric 0..100
  currency  - must contain a number (units allowed, e.g. "INR 48.2 crore")
  date      - ISO date (YYYY-MM-DD)
  select    - must be one of `options`
  tags      - comma-separated; `options` are suggestions, custom values allowed
"""
from __future__ import annotations

INDUSTRY_OPTIONS = [
    "Auto Components", "Manufacturing", "IT & Software Services", "Pharmaceuticals",
    "FMCG", "Textiles & Apparel", "Chemicals", "Financial Services", "Real Estate",
    "Agriculture & Food Processing", "Healthcare", "Logistics", "Other",
]

RISK_OPTIONS = [
    "Customer concentration", "Supplier dependence", "Raw material price volatility",
    "Regulatory / policy changes", "Foreign exchange fluctuation", "Pending litigation",
    "Key personnel dependence", "Intense competition", "Technology obsolescence",
    "Working capital intensity", "Geographic concentration",
]

FIELD_SCHEMA: list[dict] = [
    # Company (corporate)
    {"key": "company.name", "label": "Company Name", "wizard_step": "company",
     "category": "corporate", "required": True, "tracked": False, "type": "text",
     "description": "Full registered legal name of the issuer company.",
     "patterns": [r"company\s*name\s*[:\-]\s*(.+)"]},
    {"key": "company.cin", "label": "CIN", "wizard_step": "company",
     "category": "corporate", "required": True, "tracked": False, "type": "text",
     "description": "21-character Corporate Identity Number from the MCA.",
     "patterns": [r"\b([UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})\b", r"cin\s*[:\-]\s*(.+)"]},
    {"key": "company.incorporation_date", "label": "Date of Incorporation", "wizard_step": "company",
     "category": "corporate", "required": False, "tracked": False, "type": "date",
     "description": "Date the company was incorporated, per its Certificate of Incorporation.",
     "patterns": [r"incorporat(?:ion|ed)\s*(?:date|on)?\s*[:\-]\s*(.+)"]},
    {"key": "company.registered_office", "label": "Registered Office", "wizard_step": "company",
     "category": "corporate", "required": False, "tracked": False, "type": "text",
     "description": "Full address of the registered office.",
     "patterns": [r"registered\s*office\s*[:\-]\s*(.+)"]},
    {"key": "company.industry", "label": "Industry", "wizard_step": "company",
     "category": "corporate", "required": True, "tracked": False, "type": "select",
     "options": INDUSTRY_OPTIONS, "description": "Primary industry sector of the business.",
     "patterns": [r"industry\s*[:\-]\s*(.+)"]},

    # Promoters (corporate) — edited as a repeatable group in the wizard; these
    # flat keys are the aggregate the parser/validator/drafter consume.
    {"key": "promoters.names", "label": "Promoter Names", "wizard_step": "promoters",
     "category": "corporate", "required": True, "tracked": False, "type": "text",
     "description": "Names of all promoters (aggregated from the promoter list).",
     "patterns": [r"promoters?\s*[:\-]\s*(.+)"]},
    {"key": "promoters.holding_pct", "label": "Total Promoter Holding %", "wizard_step": "promoters",
     "category": "corporate", "required": True, "tracked": True, "type": "percent",
     "min": 0, "max": 100, "step": 0.1, "unit": "%",
     "description": "Aggregate pre-issue promoter shareholding percentage.",
     "patterns": [r"promoter[s]?\s*(?:holding|shareholding)\s*(?:%|percent)?\s*[:\-]\s*([\d.]+)"]},
    {"key": "promoters.experience", "label": "Promoter Experience", "wizard_step": "promoters",
     "category": "corporate", "required": False, "tracked": False, "type": "textarea",
     "description": "Relevant background and experience of the promoters.",
     "patterns": [r"promoter\s*experience\s*[:\-]\s*(.+)"]},

    # Financials (financial)
    {"key": "financials.revenue_fy25", "label": "Revenue FY25", "wizard_step": "financials",
     "category": "financial", "required": True, "tracked": True, "type": "currency",
     "unit": "INR", "description": "Revenue from operations for FY2024-25 (restated).",
     "patterns": [r"revenue\s*(?:fy\s*25|2024[-/]25)?\s*[:\-]\s*(.+)"]},
    {"key": "financials.revenue_fy24", "label": "Revenue FY24", "wizard_step": "financials",
     "category": "financial", "required": False, "tracked": False, "type": "currency",
     "unit": "INR", "description": "Revenue from operations for FY2023-24 (restated).",
     "patterns": [r"revenue\s*(?:fy\s*24|2023[-/]24)\s*[:\-]\s*(.+)"]},
    {"key": "financials.pat_fy25", "label": "Profit After Tax FY25", "wizard_step": "financials",
     "category": "financial", "required": True, "tracked": False, "type": "currency",
     "unit": "INR", "description": "Restated profit after tax for FY2024-25.",
     "patterns": [r"(?:pat|profit\s*after\s*tax)\s*(?:fy\s*25)?\s*[:\-]\s*(.+)"]},
    {"key": "financials.net_worth", "label": "Net Worth", "wizard_step": "financials",
     "category": "financial", "required": True, "tracked": True, "type": "currency",
     "unit": "INR", "description": "Net worth as at the latest restated balance sheet date.",
     "patterns": [r"net\s*worth\s*[:\-]\s*(.+)"]},
    {"key": "financials.employee_count", "label": "Employee Count", "wizard_step": "financials",
     "category": "financial", "required": False, "tracked": True, "type": "number",
     "min": 0, "step": 1, "description": "Total number of employees as on the latest date.",
     "patterns": [r"employee[s]?\s*(?:count|strength)?\s*[:\-]\s*([\d,]+)"]},

    # Legal (legal)
    {"key": "legal.litigations", "label": "Material Litigations", "wizard_step": "legal",
     "category": "legal", "required": True, "tracked": False, "type": "textarea",
     "description": "Summary of material pending litigation and proceedings.",
     "patterns": [r"litigation[s]?\s*[:\-]\s*(.+)"]},
    {"key": "legal.approvals", "label": "Statutory Approvals", "wizard_step": "legal",
     "category": "legal", "required": False, "tracked": False, "type": "textarea",
     "description": "Key statutory / regulatory approvals and licences held.",
     "patterns": [r"approvals?\s*[:\-]\s*(.+)"]},

    # Issue (corporate)
    {"key": "issue.size", "label": "Issue Size", "wizard_step": "issue",
     "category": "corporate", "required": True, "tracked": False, "type": "currency",
     "unit": "INR", "description": "Proposed fresh issue size.",
     "patterns": [r"issue\s*size\s*[:\-]\s*(.+)"]},
    {"key": "issue.objects", "label": "Objects of the Issue", "wizard_step": "issue",
     "category": "corporate", "required": True, "tracked": False, "type": "textarea",
     "description": "How the net proceeds of the issue will be deployed.",
     "patterns": [r"objects?\s*(?:of\s*(?:the\s*)?issue)?\s*[:\-]\s*(.+)"]},

    # Risk (compliance)
    {"key": "risk.key_risks", "label": "Key Risk Factors", "wizard_step": "risk",
     "category": "compliance", "required": True, "tracked": False, "type": "tags",
     "options": RISK_OPTIONS, "description": "Select common risk factors and/or add your own.",
     "patterns": [r"(?:key\s*)?risk[s]?\s*(?:factors?)?\s*[:\-]\s*(.+)"]},
]

FIELD_BY_KEY: dict[str, dict] = {f["key"]: f for f in FIELD_SCHEMA}
REQUIRED_KEYS: list[str] = [f["key"] for f in FIELD_SCHEMA if f["required"]]
TRACKED_KEYS: list[str] = [f["key"] for f in FIELD_SCHEMA if f["tracked"]]

WIZARD_STEPS: list[str] = ["company", "promoters", "financials", "legal", "issue", "risk"]

# Per-step guidance + the specific supporting document to upload for that step.
WIZARD_STEP_META: dict[str, dict] = {
    "company": {"label": "Company", "category": "corporate",
                "doc_label": "Certificate of Incorporation / MOA & AOA",
                "description": "Identify the issuer: legal name, CIN, incorporation and registered office."},
    "promoters": {"label": "Promoters", "category": "corporate",
                  "doc_label": "Promoter KYC / shareholding statement",
                  "description": "Add each promoter with their shareholding and experience."},
    "financials": {"label": "Financials", "category": "financial",
                   "doc_label": "Audited / restated financial statements (you may upload several)",
                   "description": "Restated revenue, profitability and net worth for the reporting period."},
    "legal": {"label": "Legal", "category": "legal",
              "doc_label": "Litigation & statutory approvals summary",
              "description": "Material litigation and the statutory approvals the company holds."},
    "issue": {"label": "The Issue", "category": "corporate",
              "doc_label": "Board / shareholder resolution for the issue",
              "description": "Size of the fresh issue and how proceeds will be used."},
    "risk": {"label": "Risk", "category": "compliance",
             "doc_label": "Risk assessment notes (optional)",
             "description": "The principal internal and external risks to the business."},
}

# --- DRHP section catalogue -----------------------------------------------------
SECTIONS: list[dict] = [
    {
        "key": "company_overview", "title": "Company Overview", "owner_role": "sme",
        "required_fields": ["company.name", "company.cin", "company.industry",
                            "company.incorporation_date"],
        "description": "General information about the issuer — legal identity, history and corporate matters.",
        "instructions": "State the legal name, CIN, date and place of incorporation, "
                        "registered office and the nature of the business.",
        "regulation": "SEBI ICDR Schedule VI: general information about the issuer, "
                      "history and certain corporate matters.",
    },
    {
        "key": "business", "title": "Our Business", "owner_role": "sme",
        "required_fields": ["company.industry", "promoters.names", "financials.employee_count"],
        "description": "What the company does — model, products, operations and strengths.",
        "instructions": "Describe the business model, products/services, industry context, "
                        "competitive strengths and operations.",
        "regulation": "SEBI ICDR Schedule VI Part A: business overview, products, "
                      "capacity and key operational metrics.",
    },
    {
        "key": "financial_summary", "title": "Financial Information", "owner_role": "sme",
        "required_fields": ["financials.revenue_fy25", "financials.pat_fy25",
                            "financials.net_worth"],
        "description": "Summary of restated financials — revenue, profitability, net worth.",
        "instructions": "Summarise revenue, profitability, net worth and key ratios over "
                        "the restated period.",
        "regulation": "SEBI ICDR Schedule VI Part A (9): restated financial statements "
                      "and management discussion of financial condition.",
    },
    {
        "key": "risk_factors", "title": "Risk Factors", "owner_role": "legal_counsel",
        "required_fields": ["risk.key_risks", "legal.litigations"],
        "description": "Internal and external risks specific to the issuer, materiality-ordered.",
        "instructions": "Present internal and external risk factors specific to the issuer, "
                        "materiality-ordered, each with a brief impact statement.",
        "regulation": "SEBI ICDR Schedule VI Part A (2): risk factors, internal and external, "
                      "with quantification where possible.",
    },
    {
        "key": "objects_of_issue", "title": "Objects of the Issue", "owner_role": "merchant_banker",
        "required_fields": ["issue.size", "issue.objects"],
        "description": "Objects of the fresh issue and the deployment of net proceeds.",
        "instructions": "State the objects of the fresh issue, the proposed deployment of "
                        "net proceeds and the means of finance.",
        "regulation": "SEBI ICDR Schedule VI Part A (4): objects of the issue and detailed "
                      "break-up of proceeds utilisation.",
    },
]

SECTION_BY_KEY: dict[str, dict] = {s["key"]: s for s in SECTIONS}
SECTION_KEYS: list[str] = [s["key"] for s in SECTIONS]
