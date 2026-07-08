# IPOW — Setup & Demo Instructions

Get the IPO Drafting Workspace running and walk through the full pipeline in ~5
minutes. **No PostgreSQL and no LLM API key are required** — the system runs
fully offline with deterministic stub extraction/drafting. (Add a key later to
switch on a real model; see the end.)

---

## 1. Prerequisites

| Need | Version | Check |
|---|---|---|
| Node.js + npm | ≥ 18 (tested 24) | `node -v` |
| Python | ≥ 3.10 (tested 3.14) | `python --version` |

*(Docker path below needs only Docker Desktop — no Node/Python on the host.)*

---

## 2a. Fastest path — Docker (one line)

With Docker Desktop running:

```bash
docker compose up --build
```

Then open **http://localhost:5173**. That builds and starts all three services
(frontend on :5173, backend on :4000, AI on :8000) wired together. Stop with
`Ctrl+C`, or `docker compose down` to remove the containers.

> The Docker image installs the optional deps too, so Word (.docx) export and a
> real LLM work out of the box — export `LLM_PROVIDER` + an API key before `up`.
> If ports 5173/4000/8000 are already taken (e.g. a manual run below), free them first.

Prefer running from source without Docker? Continue with the manual steps.

---

## 2b. Install from source (once)

Run each block from the repo root (`E:\w\IPO`).

```bash
# AI service (FastAPI)
cd ai-service
python -m pip install -r requirements.txt
cd ..

# Backend (Express)
cd backend
npm install
cd ..

# Frontend (React/Vite)
cd frontend
npm install
cd ..
```

---

## 3. Run (three terminals, in this order)

The backend needs the AI service; the frontend needs the backend — so start them
1 → 2 → 3.

**Terminal 1 — AI service** → http://localhost:8000
```bash
cd ai-service
python -m uvicorn app.main:app --port 8000
```

**Terminal 2 — Backend** → http://localhost:4000
```bash
cd backend
npm run dev
```

**Terminal 3 — Frontend** → http://localhost:5173
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**.

> Windows PowerShell: run each command on its own line (`&&` is not supported).

---

## 4. Demo accounts (seeded)

| Role | Email | Password |
|---|---|---|
| SME promoter | `sme@demo.in` | `demo` |
| Merchant banker | `mb@demo.in` | `demo` |
| Legal counsel | `legal@demo.in` | `demo` |

On the login screen you can also click **SME / Merchant Banker / Legal Counsel**
for one-click sign-in.

---

## 5. Full walkthrough

### As the SME
1. Sign in as **SME**. Click **Start a new IPO** → enter a company name (e.g.
   *Acme Precision Components Limited*) and CIN → **Create workspace**.
2. Open the workspace. You land on the **1 · Wizard** tab.
3. **Upload a document.** Any `.txt`/`.pdf`/`.docx` works. For a clean offline
   extraction, save this as `profile.txt` and upload it under the *Company* step:

   ```
   Company Name: Acme Precision Components Limited
   CIN: U27100MH2015PLC123456
   Industry: Auto components manufacturing
   Date of Incorporation: 12 March 2015
   Registered Office: Plot 22, MIDC Bhosari, Pune 411026
   Promoters: Ramesh Verma, Sunita Verma
   Promoter Holding %: 72.5
   Revenue FY25: INR 48.2 crore
   Revenue FY24: INR 39.1 crore
   PAT FY25: INR 5.6 crore
   Net Worth: INR 22.4 crore
   Employee Count: 340
   Litigations: One pending tax dispute of INR 12 lakh before CIT(A)
   Issue Size: INR 25 crore
   Objects of Issue: Capacity expansion, working capital, general corporate purposes
   Key Risks: Customer concentration; raw material price volatility
   ```
   > The offline parser reads `Label: value` lines. A real LLM key handles free-form documents.

4. **2 · Extraction** — review confidence-scored, source-tagged fields. Edit any
   value, then click **Accept all into wizard**.
5. **3 · Validation** — click **Run validation**. See missing required fields,
   cross-document conflicts, and SEBI disclosure gaps. Resolve as you fix data.
6. **4 · Draft** — pick each section, click **Generate**, edit the text, **Save**
   (marks it verified). Missing data shows as `[INFORMATION REQUIRED: …]`.
7. Invite reviewers: on the workspace, add `mb@demo.in` and `legal@demo.in` as
   members (SME creator or a merchant banker may invite).

### As the reviewers
8. Sign out, sign in as **Merchant Banker** → open the same workspace →
   **5 · Review** → approve *Objects of the Issue*.
9. Sign in as **Legal Counsel** → **5 · Review** → approve *Risk Factors*.
   (SMEs cannot approve/reject — that is enforced.)

### Back as the SME
10. **6 · Export** — check readiness (sections drafted, `[INFORMATION REQUIRED]`
    markers, approvals) → **Download Word (.docx)** or **Open PDF (print)**.

The **Draft Health Score** (top-right of the workspace) updates live as sections
advance, flags resolve, and documents are uploaded.

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Upload returns 502 | AI service not running — start Terminal 1 first. |
| Login fails | Backend not running (Terminal 2). Check `GET http://localhost:4000/api/health`. |
| Frontend blank / API errors | Vite proxy targets `:4000`; ensure the backend is up. |
| Data disappeared after restart | Expected — the prototype store is **in-memory** and resets when the backend restarts. |
| Word download disabled | `python-docx` missing; install optional deps (below) or use **Open PDF**. |

Health checks: backend `http://localhost:4000/api/health`, AI service
`http://localhost:8000/health`, AI API docs `http://localhost:8000/docs`.

---

## 7. Optional — enable a real LLM & richer parsers

```bash
cd ai-service
python -m pip install -r requirements-optional.txt   # anthropic, openai, pymupdf, python-docx, openpyxl
```

Set env vars **before** starting the AI service:

```powershell
# PowerShell
$env:LLM_PROVIDER = "anthropic"      # or "openai"
$env:ANTHROPIC_API_KEY = "sk-ant-..."
python -m uvicorn app.main:app --port 8000
```

`GET http://localhost:8000/health` reports the active mode (`stub` vs `llm`).

---

## 8. Stopping

Press `Ctrl+C` in each terminal, or free the ports:

```powershell
Get-NetTCPConnection -LocalPort 5173,4000,8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

For deeper detail (architecture, full endpoint map), see
[docs/RUNBOOK.md](docs/RUNBOOK.md).
