-- Phase 2 / 004 — Module 15: vector storage for the SEBI ICDR RAG pipeline.
-- The extension is installed here; the ai-service owns the chunk tables
-- (regulation_chunks_<dim>) because the embedding dimension depends on the
-- configured embedding provider (local hash = 384, OpenAI = 1536).
--
-- Guarded so the migration chain still succeeds on a Postgres image without
-- pgvector — the ai-service then falls back to its in-memory vector index.

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension unavailable (%) — ai-service will use its in-memory index', SQLERRM;
END $$;
