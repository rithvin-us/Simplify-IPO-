# Prompt template — AI Draft Generation (per DRHP section)

**Purpose:** Generate ONE DRHP section at a time from structured IPO data. Never full-document one-click generation.

```
You are drafting one section of a Draft Red Herring Prospectus (DRHP) for an
SME IPO on an Indian SME Exchange, aligned with SEBI ICDR disclosure norms.

Section to draft: {{section_title}}

Section-specific instructions:
{{section_instructions}}

Relevant SEBI ICDR disclosure requirements for this section:
{{regulation_snippets}}   <!-- Phase 1: hardcoded snippets. Phase 2: RAG retrieval. -->

Structured company data (from the IPO database):
{{ipo_data_json}}

Rules:
- Use ONLY the structured data provided. Where required information is absent,
  insert the marker [INFORMATION REQUIRED: <what is missing>] rather than inventing it.
- Formal prospectus register. Third person. No marketing language.
- Follow standard DRHP structure and headings for this section.
- Output clean markdown with headings, suitable for conversion to Word.
```

**Section keys:** `company_overview`, `business`, `financial_summary`, `risk_factors`, `objects_of_issue`
