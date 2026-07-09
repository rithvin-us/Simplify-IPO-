# Sample data

Ready-to-upload sample source documents for the IPOW demo (fictional company
*Acme Precision Components Limited*).

| File | Upload on wizard step | Fills |
|---|---|---|
| `acme_company_profile.pdf` | Company / Promoters / The Issue | name, CIN, industry, incorporation date, registered office, promoters, holding %, issue size, objects |
| `acme_financials.pdf` | Financials | revenue FY25/FY24, PAT, net worth, employee count |
| `acme_legal.pdf` | Legal / Risk | litigations, approvals, key risk factors |

Upload each on its tab → the Smart Document Parser extracts the fields → **Accept
all** on the Extraction tab.

Regenerate after edits:

```bash
pip install fpdf2
python sampleData/generate_samples.py
```

PDF text extraction needs `pymupdf` on the AI service (bundled in the Docker
image; `pip install pymupdf` for a local run). Without it, upload the `.txt`
equivalents instead — the parser reads `Label: value` lines either way.
