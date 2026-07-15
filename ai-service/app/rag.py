"""Module 15 — SEBI ICDR Retrieval-Augmented Generation pipeline.

The regulation corpus (abridged ICDR paraphrases in app/data/icdr_regulations.json)
is embedded and stored in pgvector when DATABASE_URL + the extension are
available; otherwise an in-memory cosine index keeps the pipeline fully offline.

Embedding providers:
  openai — text-embedding-3-small (1536d) when OPENAI_API_KEY is set
  local  — deterministic signed-hashing embedding (384d): no network, no deps,
           stable across runs, good enough for keyword-heavy regulatory text

The pgvector table name embeds the dimension (regulation_chunks_<dim>) so a
provider switch can never silently mix vector spaces.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import threading
from pathlib import Path

from .settings import settings

_DATA = Path(__file__).parent / "data" / "icdr_regulations.json"
_LOCAL_DIM = 384


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _local_embed(text: str) -> list[float]:
    """Signed feature-hashing over unigrams + bigrams, L2-normalised."""
    vec = [0.0] * _LOCAL_DIM
    toks = _tokenize(text)
    grams = toks + [f"{a} {b}" for a, b in zip(toks, toks[1:])]
    for g in grams:
        h = int(hashlib.md5(g.encode()).hexdigest(), 16)
        vec[h % _LOCAL_DIM] += 1.0 if (h >> 16) % 2 == 0 else -1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def _openai_embed(texts: list[str]) -> list[list[float]]:
    import openai  # lazy optional dep

    client = openai.OpenAI(api_key=settings.openai_key)
    resp = client.embeddings.create(model=settings.openai_embed_model, input=texts)
    return [d.embedding for d in resp.data]


def _cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


class RegulationIndex:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        raw = json.loads(_DATA.read_text(encoding="utf-8"))
        self.chunks: list[dict] = raw["chunks"]
        self.provider = "openai" if settings.openai_key else "local"
        self.dim = 1536 if self.provider == "openai" else _LOCAL_DIM
        self.backend = "uninitialised"
        self._conn = None
        self._memory: list[tuple[list[float], dict]] = []
        self._ready = False

    @property
    def table(self) -> str:
        return f"regulation_chunks_{self.dim}"

    # ------------------------------------------------------------- embedding

    def _embed(self, texts: list[str]) -> list[list[float]]:
        if self.provider == "openai":
            try:
                return _openai_embed(texts)
            except Exception as e:
                print(f"[rag] openai embeddings failed ({e}); switching to local embeddings")
                self.provider = "local"
                self.dim = _LOCAL_DIM
        return [_local_embed(t) for t in texts]

    # ------------------------------------------------------------- indexing

    def _pg_connect(self):
        import psycopg  # lazy optional dep
        from pgvector.psycopg import register_vector

        conn = psycopg.connect(settings.database_url, autocommit=True)
        register_vector(conn)
        return conn

    def _index_pg(self) -> None:
        from pgvector import Vector

        embeddings = self._embed([c["text"] for c in self.chunks])
        with self._conn.cursor() as cur:
            cur.execute(f"DELETE FROM {self.table}")
            for chunk, emb in zip(self.chunks, embeddings):
                cur.execute(
                    f"INSERT INTO {self.table} (id, reg_code, title, section_keys, body, embedding) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (chunk["id"], chunk["reg_code"], chunk["title"],
                     [str(k) for k in chunk.get("section_keys", [])],
                     chunk["text"], Vector(emb)),
                )

    def _index_memory(self) -> None:
        embeddings = self._embed([c["text"] for c in self.chunks])
        self._memory = list(zip(embeddings, self.chunks))

    def ensure_indexed(self) -> None:
        with self._lock:
            if self._ready:
                return
            if settings.database_url:
                try:
                    self._conn = self._pg_connect()
                    with self._conn.cursor() as cur:
                        cur.execute(
                            f"CREATE TABLE IF NOT EXISTS {self.table} ("
                            "  id TEXT PRIMARY KEY,"
                            "  reg_code TEXT NOT NULL,"
                            "  title TEXT NOT NULL,"
                            "  section_keys TEXT[],"
                            "  body TEXT NOT NULL,"
                            f"  embedding vector({self.dim})"
                            ")"
                        )
                        cur.execute(f"SELECT COUNT(*) FROM {self.table}")
                        if cur.fetchone()[0] < len(self.chunks):
                            self._index_pg()
                    self.backend = "pgvector"
                    self._ready = True
                    print(f"[rag] pgvector index ready ({self.table}, provider={self.provider})")
                    return
                except Exception as e:
                    print(f"[rag] pgvector unavailable ({e}); using in-memory index")
                    self._conn = None
            self._index_memory()
            self.backend = "memory"
            self._ready = True
            print(f"[rag] in-memory index ready ({len(self._memory)} chunks, provider={self.provider})")

    def reindex(self) -> None:
        with self._lock:
            self._ready = False
            self._memory = []
            if self._conn is not None:
                try:
                    with self._conn.cursor() as cur:
                        cur.execute(f"DELETE FROM {self.table}")
                except Exception:
                    pass
                self._conn = None
        # reload the corpus from disk so edited chunks are picked up
        raw = json.loads(_DATA.read_text(encoding="utf-8"))
        self.chunks = raw["chunks"]
        self.ensure_indexed()

    # --------------------------------------------------------------- search

    def _keyword_fallback(self, query: str, k: int) -> list[dict]:
        q = set(_tokenize(query))
        scored = sorted(
            ((len(q & set(_tokenize(c["text"] + " " + c["title"]))), c) for c in self.chunks),
            key=lambda t: -t[0],
        )[:k]
        return [self._hit(c, float(s)) for s, c in scored if s > 0]

    @staticmethod
    def _hit(chunk: dict, score: float) -> dict:
        return {
            "id": chunk["id"], "reg_code": chunk["reg_code"], "title": chunk["title"],
            "text": chunk["text"], "score": round(score, 4),
        }

    def search(self, query: str, k: int = 3) -> list[dict]:
        self.ensure_indexed()
        try:
            qv = self._embed([query])[0]
        except Exception:
            return self._keyword_fallback(query, k)

        if self.backend == "pgvector" and self._conn is not None:
            try:
                from pgvector import Vector

                with self._conn.cursor() as cur:
                    cur.execute(
                        f"SELECT id, reg_code, title, body, 1 - (embedding <=> %s) AS score "
                        f"FROM {self.table} ORDER BY embedding <=> %s LIMIT %s",
                        (Vector(qv), Vector(qv), k),
                    )
                    return [
                        {"id": r[0], "reg_code": r[1], "title": r[2], "text": r[3],
                         "score": round(float(r[4]), 4)}
                        for r in cur.fetchall()
                    ]
            except Exception as e:
                print(f"[rag] pgvector query failed ({e}); rebuilding in-memory index")
                self._conn = None
                self.backend = "memory"
                self._index_memory()

        scored = sorted(((_cosine(qv, e), c) for e, c in self._memory), key=lambda t: -t[0])[:k]
        return [self._hit(c, float(s)) for s, c in scored]

    def status(self) -> dict:
        return {
            "backend": self.backend,
            "provider": self.provider,
            "dimension": self.dim,
            "chunks": len(self.chunks),
            "ready": self._ready,
        }


regulation_index = RegulationIndex()
