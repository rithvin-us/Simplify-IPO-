"""IPO Drafting Workspace — AI/document services (FastAPI).

Pipeline endpoints:
  POST /parse     — extract text/tables from an uploaded document (PDF/docx/xlsx/txt)
  POST /extract   — structured extraction -> {field_key, value, confidence, quote}
  POST /validate  — missing-field, cross-document, disclosure-gap checks
  POST /draft     — generate one DRHP section from structured IPO data
  POST /export    — render approved sections to markdown / HTML / .docx

Runs fully offline: with no LLM key configured, every stage uses deterministic
stub logic so the pipeline is runnable and debuggable end-to-end.
"""
from fastapi import FastAPI

from .schema import FIELD_SCHEMA, SECTIONS, WIZARD_STEPS
from .settings import settings
from .routers import parse, extract, validate, draft, export

app = FastAPI(title="IPOW AI Service", version="1.0.0")

app.include_router(parse.router)
app.include_router(extract.router)
app.include_router(validate.router)
app.include_router(draft.router)
app.include_router(export.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "llm": settings.describe()}


@app.get("/schema/fields")
def field_schema() -> dict:
    return {"wizard_steps": WIZARD_STEPS, "fields": FIELD_SCHEMA}


@app.get("/schema/sections")
def section_schema() -> dict:
    return {"sections": SECTIONS}
