export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type SeverityLevel = 'high' | 'moderate' | 'low';
export type TimeSlot = 'morning' | 'midday' | 'evening' | 'bedtime' | 'as_needed';

export interface ExtractedMedication {
  raw_name: string;
  dosage: string;
  frequency: string;
  route: string;
  timing_slots: TimeSlot[];
  with_food: boolean | null;
  plain_purpose: string;
  plain_instructions: string;
  ocr_confidence: ConfidenceLevel;
  uncertainty_reason?: string | null;
}

export interface RedFlagItem {
  symptom: string;
  urgency: 'call_911' | 'call_doctor';
  action: string;
}

export interface FDACitation {
  rxcui?: string | null;
  normalized_name: string;
  brand_names: string[];
  generic_names: string[];
  set_id?: string | null;
  fda_label_url?: string | null;
  boxed_warning?: string | null;
  key_warnings?: string | null;
  drug_interactions_excerpt?: string | null;
  verified_via: 'rxnorm_openfda' | 'rxnorm_only' | 'unverified';
}

export interface VerifiedMedication {
  extracted: ExtractedMedication;
  fda_citation: FDACitation;
}

export interface DrugInteractionAlert {
  id: string;
  drug_a: string;
  drug_b: string;
  severity: SeverityLevel;
  title: string;
  plain_explanation: string;
  what_to_watch_for: string;
  source_citation: string;
  source_url?: string | null;
  detection_method: 'openfda_label_match' | 'clinical_rulebook_and_fda';
}

export interface ScheduleEntry {
  medication_name: string;
  dosage: string;
  instructions: string;
  with_food?: boolean | null;
  ocr_confidence: ConfidenceLevel;
}

export interface DailySchedule {
  morning: ScheduleEntry[];
  midday: ScheduleEntry[];
  evening: ScheduleEntry[];
  bedtime: ScheduleEntry[];
  as_needed: ScheduleEntry[];
}

export interface AnalysisResponse {
  analysis_mode: 'gemini_live' | 'sample_offline_fallback';
  language: string;
  medical_disclaimer: string;
  reading_level_target: string;
  patient_friendly_summary: string;
  primary_diagnosis: string;
  discharge_date?: string | null;
  overall_ocr_confidence: ConfidenceLevel;
  document_warnings: string[];
  medications: VerifiedMedication[];
  interactions: DrugInteractionAlert[];
  daily_schedule: DailySchedule;
  red_flags: RedFlagItem[];
  follow_up_instructions: string[];
  questions_for_pharmacist: string[];
}

export interface SampleSummaryInfo {
  id: string;
  title: string;
  subtitle: string;
  highlight_badge: string;
  raw_text: string;
}

export interface AskPharmacistResponse {
  answer: string;
  disclaimer: string;
}
