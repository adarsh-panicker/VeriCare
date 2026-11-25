from typing import Literal, Optional
from pydantic import BaseModel, Field


ConfidenceLevel = Literal["high", "medium", "low"]
SeverityLevel = Literal["high", "moderate", "low"]
TimeSlot = Literal["morning", "midday", "evening", "bedtime", "as_needed"]


class ExtractedMedication(BaseModel):
    """Medication extracted from a discharge summary or prescription."""

    raw_name: str
    dosage: str
    frequency: str
    route: str = "oral"
    timing_slots: list[TimeSlot] = Field(default_factory=lambda: ["morning"])
    with_food: Optional[bool] = None
    plain_purpose: str
    plain_instructions: str
    ocr_confidence: ConfidenceLevel = "high"
    uncertainty_reason: Optional[str] = None


class RedFlagItem(BaseModel):
    """Symptom that requires urgent medical attention."""

    symptom: str
    urgency: Literal["call_911", "call_doctor"]
    action: str


class ExtractedDischarge(BaseModel):
    """Structured discharge summary extracted by multimodal AI."""

    patient_friendly_summary: str
    primary_diagnosis: str
    discharge_date: Optional[str] = None
    medications: list[ExtractedMedication]
    red_flags: list[RedFlagItem]
    follow_up_instructions: list[str]
    questions_for_pharmacist: list[str]
    overall_ocr_confidence: ConfidenceLevel = "high"
    document_warnings: list[str] = Field(default_factory=list)


class FDACitation(BaseModel):
    """Exact source citation from NLM RxNorm and OpenFDA drug labels."""

    rxcui: Optional[str] = None
    normalized_name: str
    brand_names: list[str] = Field(default_factory=list)
    generic_names: list[str] = Field(default_factory=list)
    set_id: Optional[str] = None
    fda_label_url: Optional[str] = None
    boxed_warning: Optional[str] = None
    key_warnings: Optional[str] = None
    drug_interactions_excerpt: Optional[str] = None
    verified_via: Literal["rxnorm_openfda", "rxnorm_only", "unverified"] = "unverified"


class VerifiedMedication(BaseModel):
    """Extracted medication enriched with deterministic RxNorm + OpenFDA data."""

    extracted: ExtractedMedication
    fda_citation: FDACitation


class DrugInteractionAlert(BaseModel):
    """Deterministic interaction alert between two medications or a drug-condition pair."""

    id: str
    drug_a: str
    drug_b: str
    severity: SeverityLevel
    title: str
    plain_explanation: str
    what_to_watch_for: str
    source_citation: str
    source_url: Optional[str] = None
    detection_method: Literal["openfda_label_match", "clinical_rulebook_and_fda"]


class ScheduleEntry(BaseModel):
    """Single medication entry in a daily time-of-day slot."""

    medication_name: str
    dosage: str
    instructions: str
    with_food: Optional[bool] = None
    ocr_confidence: ConfidenceLevel = "high"


class DailySchedule(BaseModel):
    """Four-slot daily medication schedule."""

    morning: list[ScheduleEntry] = Field(default_factory=list)
    midday: list[ScheduleEntry] = Field(default_factory=list)
    evening: list[ScheduleEntry] = Field(default_factory=list)
    bedtime: list[ScheduleEntry] = Field(default_factory=list)
    as_needed: list[ScheduleEntry] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    """Full VeriCare audit response returned to the frontend."""

    analysis_mode: Literal["gemini_live", "sample_offline_fallback"]
    language: str
    medical_disclaimer: str
    reading_level_target: str = "6th-grade plain language"
    patient_friendly_summary: str
    primary_diagnosis: str
    discharge_date: Optional[str] = None
    overall_ocr_confidence: ConfidenceLevel
    document_warnings: list[str]
    medications: list[VerifiedMedication]
    interactions: list[DrugInteractionAlert]
    daily_schedule: DailySchedule
    red_flags: list[RedFlagItem]
    follow_up_instructions: list[str]
    questions_for_pharmacist: list[str]


class SampleSummaryInfo(BaseModel):
    """Metadata for a built-in demo discharge document."""

    id: str
    title: str
    subtitle: str
    highlight_badge: str
    raw_text: str


class AskPharmacistRequest(BaseModel):
    """Question grounded in the analyzed discharge context."""

    question: str
    language: str = "English"
    context_summary: str
    medications_json: str


class AskPharmacistResponse(BaseModel):
    """Grounded Q&A response with safety guardrail."""

    answer: str
    disclaimer: str
