# Screens (9 total — locked scope)

| # | Screen | Component (to build) | Role |
|---|--------|----------------------|------|
| 1 | Login | `Login.jsx` | All |
| 2 | Dashboard (workspace list, health score, activity feed) | `Dashboard.jsx` | SME, MB, Legal |
| 3 | Wizard steps 1-5 (forms + upload + doc checklist) | `Wizard.jsx` | SME |
| 4 | Smart Document Parser preview (extracted fields, confidence, source, editable) | `ExtractionPreview.jsx` | SME |
| 5 | Draft Viewer (section-by-section, generate/regenerate/edit) | `DraftViewer.jsx` | All |
| 6 | Missing Info Panel (validation flags) | `ValidationPanel.jsx` | SME |
| 7 | Review/Comment view (per-section comments, approve/reject) | `ReviewView.jsx` | MB, Legal |
| 8 | Export Summary (readiness check before export) | `ExportSummary.jsx` | SME |
| 9 | Export (Word + PDF download) | part of `ExportSummary.jsx` | SME |

Anything beyond these is scope creep for the prototype.
