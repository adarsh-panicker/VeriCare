import json
import os
from typing import Optional

from google import genai
from google.genai import types

from app.models import (
    AnalysisResponse,
    AskPharmacistResponse,
    DailySchedule,
    ExtractedDischarge,
    ScheduleEntry,
    VerifiedMedication,
)

MEDICAL_DISCLAIMER = (
    "Educational & decision-support tool only — NOT medical advice. "
    "AI extraction may miss or misread details. Always confirm your exact doses "
    "and drug interactions with your doctor or pharmacist."
)

EXTRACTION_SYSTEM_PROMPT = """You are VeriCare, a clinical discharge translator and patient safety assistant.
Your job is to extract structured medication and care instructions from a hospital discharge summary or prescription (image, PDF, or text) and rewrite them at a clear 6th-grade reading level.

STRICT SAFETY & ACCURACY RULES:
1. Never guess or invent a medication name, dosage, or frequency. If handwriting is smudged, blurry, cut off, or ambiguous, set `ocr_confidence` to "low" or "medium" and explain why in `uncertainty_reason`. Also set `overall_ocr_confidence` accordingly and add a clear warning in `document_warnings`.
2. Keep `raw_name` as the clean drug name in English (e.g., "Warfarin", "Metformin") so deterministic FDA/RxNorm lookup works reliably.
3. For `timing_slots`, map each medication into one or more of: "morning", "midday", "evening", "bedtime", "as_needed".
4. Write `patient_friendly_summary`, `plain_purpose`, `plain_instructions`, `red_flags`, `follow_up_instructions`, and `questions_for_pharmacist` in warm, simple 6th-grade language.
5. If the requested target language is not English, write ALL patient-facing narrative fields (`patient_friendly_summary`, `primary_diagnosis`, `plain_purpose`, `plain_instructions`, `red_flags`, `follow_up_instructions`, `questions_for_pharmacist`, `document_warnings`) in the target language, while keeping `raw_name` in English (or "EnglishName (Translated)" only in `plain_purpose` if helpful).
"""


def get_gemini_client() -> Optional[genai.Client]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


async def extract_discharge_with_gemini(
    *,
    file_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None,
    raw_text: Optional[str] = None,
    language: str = "English",
) -> ExtractedDischarge:
    """Use Gemini multimodal structured output to extract discharge data."""
    client = get_gemini_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"

    contents: list = []
    if file_bytes and mime_type:
        contents.append(types.Part.from_bytes(data=file_bytes, mime_type=mime_type))

    prompt = (
        f"Target patient language: {language}.\n"
        "Extract all medications, dosages, frequencies, timing slots, red-flag symptoms, "
        "follow-up instructions, and pharmacist questions from this discharge document.\n"
    )
    if raw_text:
        prompt += f"\nDocument text:\n{raw_text}"
    contents.append(prompt)

    response = await client.aio.models.generate_content(
        model=model_name,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=EXTRACTION_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=ExtractedDischarge,
            temperature=0.1,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return ExtractedDischarge.model_validate_json(response.text)


async def translate_response_if_needed(
    response_obj: AnalysisResponse, target_language: str
) -> AnalysisResponse:
    """Translate patient-facing fields of a fallback sample when Gemini is available."""
    if target_language.lower() == "english":
        return response_obj

    client = get_gemini_client()
    if client is None:
        response_obj.document_warnings.append(
            f"Translation to {target_language} requires GEMINI_API_KEY; showing English."
        )
        return response_obj

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    payload = response_obj.model_dump(
        include={
            "medical_disclaimer",
            "patient_friendly_summary",
            "primary_diagnosis",
            "document_warnings",
            "red_flags",
            "follow_up_instructions",
            "questions_for_pharmacist",
        }
    )

    prompt = (
        f"Translate all string values in this JSON into {target_language} at a 6th-grade reading level. "
        "Keep JSON keys and enum values ('call_911', 'call_doctor') unchanged. Return valid JSON only.\n\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )

    res = await client.aio.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )
    if res.text:
        translated = json.loads(res.text)
        for key in (
            "medical_disclaimer",
            "patient_friendly_summary",
            "primary_diagnosis",
            "document_warnings",
            "follow_up_instructions",
            "questions_for_pharmacist",
        ):
            if key in translated:
                setattr(response_obj, key, translated[key])
        if "red_flags" in translated and isinstance(translated["red_flags"], list):
            from app.models import RedFlagItem

            response_obj.red_flags = [
                RedFlagItem.model_validate(item) for item in translated["red_flags"]
            ]
        response_obj.language = target_language
    return response_obj


def build_daily_schedule(medications: list[VerifiedMedication]) -> DailySchedule:
    """Organize verified medications into a 4-slot + PRN daily schedule."""
    schedule = DailySchedule()
    for med in medications:
        ex = med.extracted
        entry = ScheduleEntry(
            medication_name=med.fda_citation.normalized_name or ex.raw_name,
            dosage=ex.dosage,
            instructions=ex.plain_instructions,
            with_food=ex.with_food,
            ocr_confidence=ex.ocr_confidence,
        )
        slots = ex.timing_slots or ["morning"]
        for slot in slots:
            if slot == "morning":
                schedule.morning.append(entry)
            elif slot == "midday":
                schedule.midday.append(entry)
            elif slot == "evening":
                schedule.evening.append(entry)
            elif slot == "bedtime":
                schedule.bedtime.append(entry)
            elif slot == "as_needed":
                schedule.as_needed.append(entry)
    return schedule


async def answer_patient_question(
    question: str,
    language: str,
    context_summary: str,
    medications_json: str,
) -> AskPharmacistResponse:
    """Answer a follow-up question strictly grounded in the discharge & FDA data."""
    client = get_gemini_client()
    if client is None:
        return AskPharmacistResponse(
            answer=(
                "Live Q&A requires a GEMINI_API_KEY in backend/.env. "
                "Please review the FDA citations and Questions for Your Pharmacist above, and confirm directly with your pharmacist."
            ),
            disclaimer=MEDICAL_DISCLAIMER,
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    system = (
        "You are VeriCare, a patient-education assistant. Answer ONLY using the provided discharge summary "
        "and FDA medication data. Use a warm 6th-grade reading level. Never diagnose, never tell a patient to "
        "stop or change a prescribed dose on their own—always advise confirming with their doctor or pharmacist. "
        f"Respond in {language}."
    )
    prompt = (
        f"Discharge Summary:\n{context_summary}\n\n"
        f"Verified Medications & FDA Data:\n{medications_json[:8000]}\n\n"
        f"Patient Question: {question}"
    )
    res = await client.aio.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.2,
        ),
    )
    return AskPharmacistResponse(
        answer=res.text or "I could not generate an answer. Please ask your pharmacist directly.",
        disclaimer=MEDICAL_DISCLAIMER,
    )
