"""IPO Drafting Workspace — AI/document services (FastAPI).

Pipeline endpoints:
  POST /parse        — extract text/tables from an uploaded document (PDF/docx/xlsx/txt)
  POST /extract      — structured extraction -> {field_key, value, confidence, quote}
  POST /validate     — missing-field, cross-document, disclosure-gap checks
  POST /draft        — generate one DRHP section (RAG regulatory context, multi-language)
  POST /export       — render approved sections to markdown / HTML / .docx
  POST /consistency  — Module 16: whole-draft cross-section consistency engine
  POST /translate    — Module 17: translate drafted content
  GET  /regulations/search — Module 15: query the SEBI ICDR vector index

Runs fully offline: with no LLM key configured, every stage uses deterministic
stub logic (including a local hashing-embedding vector index) so the pipeline
is runnable and debuggable end-to-end.
"""
from fastapi import FastAPI

from .rag import regulation_index
from .schema import FIELD_SCHEMA, SECTIONS, WIZARD_STEPS, WIZARD_STEP_META
from .settings import settings
from .routers import parse, extract, validate, draft, export, consistency, translate, regulations

app = FastAPI(title="IPOW AI Service", version="2.0.0")

app.include_router(parse.router)
app.include_router(extract.router)
app.include_router(validate.router)
app.include_router(draft.router)
app.include_router(export.router)
app.include_router(consistency.router)
app.include_router(translate.router)
app.include_router(regulations.router)


@app.on_event("startup")
def warm_rag_index() -> None:
    try:
        regulation_index.ensure_indexed()
    except Exception as e:  # never block startup on the index
        print(f"[rag] startup indexing failed: {e}")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "llm": settings.describe(), "rag": regulation_index.status()}


@app.get("/schema/fields")
def field_schema() -> dict:
    return {"wizard_steps": WIZARD_STEPS, "step_meta": WIZARD_STEP_META, "fields": FIELD_SCHEMA}


@app.get("/schema/sections")
def section_schema() -> dict:
    return {"sections": SECTIONS}
