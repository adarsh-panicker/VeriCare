# VeriCare — Clinical Discharge Translator & FDA Interaction Auditor

Built for **SLAY HACKS 2026**.

VeriCare transforms dense hospital discharge summaries and handwritten/printed prescriptions into a **6th-grade plain-language care plan**, **4-slot daily medication schedule**, and **deterministic FDA drug-interaction audit** with official source citations.

## Architecture
1. **Multimodal Extraction (`Gemini 2.5 Flash`):** Extracts medications, dosages, frequencies, timing, red-flag symptoms, and per-field OCR confidence (`high`, `medium`, `low`) from uploaded PDFs, photos, or text, and translates patient-facing instructions into multiple languages.
2. **Deterministic Clinical Verification (`NLM RxNorm` + `OpenFDA`):** Normalizes drug names to RxCUI identifiers, fetches official FDA drug labels (`boxed_warning`, `warnings`, `drug_interactions`, `set_id`), and runs a deterministic pairwise interaction audit—never relying on LLM guessing for drug safety.
3. **Responsible AI Guardrails:**
   - Persistent "Not Medical Advice" disclaimer.
   - Explicit amber uncertainty flags when handwriting/OCR confidence is low or smudged.
   - Clickable DailyMed / OpenFDA label citations on every interaction and medication card.

## Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
cp .env.example .env   # Add your GEMINI_API_KEY
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Even without a `GEMINI_API_KEY`, the **3 built-in 1-click Clinical Demos** run live against the NLM RxNorm and OpenFDA APIs.
