import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    AnalysisResponse,
    AskPharmacistRequest,
    AskPharmacistResponse,
    GeminiKeyRequest,
    SampleSummaryInfo,
)
from app.services.clinical_db import verify_all_medications
from app.services.gemini_service import (
    MEDICAL_DISCLAIMER,
    answer_patient_question,
    build_daily_schedule,
    extract_discharge_with_gemini,
    get_gemini_client,
    translate_response_if_needed,
)
from app.services.samples import SAMPLES

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(
    title="VeriCare API",
    description="Clinical Discharge Translator & Deterministic FDA Interaction Auditor",
    version="1.0.0",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "gemini_configured": get_gemini_client() is not None,
        "rxnorm_api": "https://rxnav.nlm.nih.gov/REST",
        "openfda_api": "https://api.fda.gov/drug/label.json",
    }


@app.post("/api/config/gemini-key")
async def set_gemini_key(req: GeminiKeyRequest) -> dict:
    """Store Gemini API key server-side only; never echo or expose it back."""
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")

    os.environ["GEMINI_API_KEY"] = key

    env_path = Path(__file__).resolve().parent.parent / ".env"
    existing_lines: list[str] = []
    if env_path.exists():
        existing_lines = [
            line
            for line in env_path.read_text(encoding="utf-8").splitlines()
            if not line.startswith("GEMINI_API_KEY=")
        ]
    existing_lines.append(f"GEMINI_API_KEY={key}")
    env_path.write_text("\n".join(existing_lines) + "\n", encoding="utf-8")

    return {"gemini_configured": get_gemini_client() is not None}


@app.get("/api/samples", response_model=list[SampleSummaryInfo])
async def list_samples() -> list[SampleSummaryInfo]:
    return [info for info, _ in SAMPLES.values()]


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_discharge(
    file: Optional[UploadFile] = File(default=None),
    sample_id: Optional[str] = Form(default=None),
    raw_text: Optional[str] = Form(default=None),
    language: str = Form(default="English"),
) -> AnalysisResponse:
    has_gemini = get_gemini_client() is not None
    analysis_mode = "gemini_live"

    if sample_id:
        if sample_id not in SAMPLES:
            raise HTTPException(status_code=404, detail=f"Unknown sample_id: {sample_id}")
        sample_info, fallback_extracted = SAMPLES[sample_id]
        if has_gemini:
            try:
                extracted = await extract_discharge_with_gemini(
                    raw_text=sample_info.raw_text,
                    language=language,
                )
            except Exception:
                extracted = fallback_extracted
                analysis_mode = "sample_offline_fallback"
        else:
            extracted = fallback_extracted
            analysis_mode = "sample_offline_fallback"
    elif file is not None:
        if not has_gemini:
            raise HTTPException(
                status_code=400,
                detail=(
                    "GEMINI_API_KEY is required to analyze uploaded files. "
                    "Add it to backend/.env or try one of the 1-click sample discharges."
                ),
            )
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        mime_type = file.content_type or "application/octet-stream"
        if mime_type == "text/plain":
            extracted = await extract_discharge_with_gemini(
                raw_text=file_bytes.decode("utf-8", errors="replace"),
                language=language,
            )
        else:
            extracted = await extract_discharge_with_gemini(
                file_bytes=file_bytes,
                mime_type=mime_type,
                language=language,
            )
    elif raw_text and raw_text.strip():
        if not has_gemini:
            raise HTTPException(
                status_code=400,
                detail=(
                    "GEMINI_API_KEY is required to analyze custom pasted text. "
                    "Add it to backend/.env or try one of the 1-click sample discharges."
                ),
            )
        extracted = await extract_discharge_with_gemini(
            raw_text=raw_text.strip(),
            language=language,
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide a file upload, raw_text, or sample_id.",
        )

    # Deterministic RxNorm + OpenFDA verification (always runs live!)
    verified_meds, interactions = await verify_all_medications(extracted.medications)
    daily_schedule = build_daily_schedule(verified_meds)

    response = AnalysisResponse(
        analysis_mode=analysis_mode,
        language=language,
        medical_disclaimer=MEDICAL_DISCLAIMER,
        patient_friendly_summary=extracted.patient_friendly_summary,
        primary_diagnosis=extracted.primary_diagnosis,
        discharge_date=extracted.discharge_date,
        overall_ocr_confidence=extracted.overall_ocr_confidence,
        document_warnings=list(extracted.document_warnings),
        medications=verified_meds,
        interactions=interactions,
        daily_schedule=daily_schedule,
        red_flags=extracted.red_flags,
        follow_up_instructions=extracted.follow_up_instructions,
        questions_for_pharmacist=extracted.questions_for_pharmacist,
    )

    if analysis_mode == "sample_offline_fallback" and language.lower() != "english":
        response = await translate_response_if_needed(response, language)

    return response


@app.post("/api/ask", response_model=AskPharmacistResponse)
async def ask_pharmacist(req: AskPharmacistRequest) -> AskPharmacistResponse:
    return await answer_patient_question(
        question=req.question,
        language=req.language,
        context_summary=req.context_summary,
        medications_json=req.medications_json,
    )
