"""IPO Drafting Workspace — AI/document services (FastAPI).

Endpoints (to be implemented):
  POST /parse        — extract text/tables from an uploaded document (PDF/docx/xlsx)
  POST /extract      — LLM structured extraction -> {field_key, value, confidence, source_document_id}
  POST /validate     — missing-field, disclosure-gap, cross-document consistency checks
  POST /draft        — generate one DRHP section from structured IPO data
  POST /export       — render approved sections to .docx / .pdf
"""
from fastapi import FastAPI

app = FastAPI(title="IPOW AI Service", version="0.1.0")

# from .routers import parse, extract, validate, draft, export
# app.include_router(parse.router)
# app.include_router(extract.router)
# app.include_router(validate.router)
# app.include_router(draft.router)
# app.include_router(export.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
