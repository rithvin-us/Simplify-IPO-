"""Generate sample SME-IPO source documents as PDFs for the IPOW demo.

Run:  python sampleData/generate_samples.py
Deps: pip install fpdf2

Produces three PDFs whose text layer contains `Label: value` lines, so the Smart
Document Parser (pymupdf text extraction + stub/LLM field mapping) extracts them.
Upload them on the matching wizard step: company/promoters/issue -> profile,
financials -> financials, legal/risk -> legal.
"""
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

OUT = Path(__file__).parent


def cell(pdf: FPDF, height: float, text: str) -> None:
    # new_x=LMARGIN + new_y=NEXT keeps each line left-aligned on its own row.
    pdf.multi_cell(0, height, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

DOCS = {
    "acme_company_profile.pdf": {
        "title": "Company Profile & Issue Particulars",
        "lines": [
            "Company Name: Acme Precision Components Limited",
            "CIN: U27100MH2015PLC123456",
            "Industry: Auto Components",
            "Date of Incorporation: 2015-03-12",
            "Registered Office: Plot 22, MIDC Bhosari, Pune 411026, Maharashtra",
            "",
            "Promoters: Ramesh Verma, Sunita Verma",
            "Promoter Holding %: 72.5",
            "Promoter Experience: 22 years in precision auto components manufacturing.",
            "",
            "Issue Size: INR 25 crore",
            "Objects of Issue: Capacity expansion, working capital, and general corporate purposes.",
        ],
    },
    "acme_financials.pdf": {
        "title": "Restated Financial Statements (Summary)",
        "lines": [
            "Company Name: Acme Precision Components Limited",
            "Revenue FY25: INR 48.2 crore",
            "Revenue FY24: INR 39.1 crore",
            "PAT FY25: INR 5.6 crore",
            "Net Worth: INR 22.4 crore",
            "Employee Count: 340",
        ],
    },
    "acme_legal.pdf": {
        "title": "Legal, Litigation & Risk Summary",
        "lines": [
            "Company Name: Acme Precision Components Limited",
            "Litigations: One pending tax dispute of INR 12 lakh before CIT(A); no criminal proceedings.",
            "Approvals: Factory licence, GST registration, ISO 9001:2015, Pollution Control Board consent.",
            "Key Risks: Customer concentration; Raw material price volatility; Foreign exchange fluctuation.",
        ],
    },
}


def build(name: str, spec: dict) -> None:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 15)
    cell(pdf, 10, "Acme Precision Components Limited")
    pdf.set_font("Helvetica", "", 12)
    cell(pdf, 8, spec["title"])
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 11)
    for line in spec["lines"]:
        cell(pdf, 7, line if line else " ")
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    cell(pdf, 6, "Sample document for demonstration only. Not an actual SEBI filing.")
    pdf.output(str(OUT / name))
    print(f"wrote {name}")


if __name__ == "__main__":
    for name, spec in DOCS.items():
        build(name, spec)
    print(f"done -> {OUT}")
