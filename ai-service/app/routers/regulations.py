"""Module 15 — /regulations: query + manage the SEBI ICDR vector index."""
from __future__ import annotations

from fastapi import APIRouter

from ..rag import regulation_index

router = APIRouter(tags=["regulations"])


@router.get("/regulations/status")
def status() -> dict:
    return regulation_index.status()


@router.get("/regulations/search")
def search(q: str, k: int = 3) -> dict:
    results = regulation_index.search(q, k=max(1, min(k, 10)))
    return {"query": q, "count": len(results), "results": results}


@router.post("/regulations/reindex")
def reindex() -> dict:
    regulation_index.reindex()
    return regulation_index.status()
