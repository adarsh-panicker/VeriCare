from app.models import (
    ExtractedDischarge,
    ExtractedMedication,
    RedFlagItem,
    SampleSummaryInfo,
)

SAMPLES: dict[str, tuple[SampleSummaryInfo, ExtractedDischarge]] = {
    "cardiac_afib": (
        SampleSummaryInfo(
            id="cardiac_afib",
            title="Cardiac & Atrial Fibrillation Discharge",
            subtitle="5 medications • Triggers High-Severity Bleeding & Acid-Reducer Alerts",
            highlight_badge="High-Alert Interaction Demo",
            raw_text=(
                "DISCHARGE SUMMARY - ST. JUDE MEDICAL CENTER\n"
                "Discharge Date: 2026-11-24\n"
                "Primary Diagnosis: Atrial Fibrillation with Rapid Ventricular Response; Status-Post Coronary Stent\n\n"
                "DISCHARGE MEDICATIONS:\n"
                "1. Warfarin 5 mg PO once daily in the evening. Follow INR lab check in 3 days.\n"
                "2. Aspirin 81 mg PO once daily in the morning with food.\n"
                "3. Metoprolol Succinate 50 mg PO once daily in the morning.\n"
                "4. Atorvastatin 40 mg PO once daily at bedtime.\n"
                "5. Omeprazole 20 mg PO once daily 30 minutes before breakfast.\n\n"
                "FOLLOW-UP:\n"
                "- Anticoagulation Clinic in 3 days for INR blood draw.\n"
                "- Cardiology follow-up in 14 days.\n\n"
                "RETURN TO ER IMMEDIATELY IF:\n"
                "- Black/tarry stools, coughing up blood, or nosebleed > 15 minutes.\n"
                "- Chest pain, shortness of breath, or fainting."
            ),
        ),
        ExtractedDischarge(
            patient_friendly_summary=(
                "You were treated for an irregular heartbeat (atrial fibrillation) and had a small mesh tube (stent) "
                "placed to keep a heart blood vessel open. Your new medicines protect your heart, prevent blood clots, "
                "and keep your heart rate steady. Because you are taking a blood thinner, it is very important to watch "
                "for signs of bleeding and get your INR blood test in 3 days."
            ),
            primary_diagnosis="Irregular Heartbeat (Atrial Fibrillation) & Heart Stent Care",
            discharge_date="2026-11-24",
            overall_ocr_confidence="high",
            document_warnings=[],
            medications=[
                ExtractedMedication(
                    raw_name="Warfarin",
                    dosage="5 mg",
                    frequency="Once daily",
                    route="oral",
                    timing_slots=["evening"],
                    with_food=None,
                    plain_purpose="Blood thinner that stops dangerous blood clots from forming.",
                    plain_instructions="Take 1 tablet by mouth every evening at the same time. Get your INR blood test in 3 days.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Aspirin",
                    dosage="81 mg",
                    frequency="Once daily",
                    route="oral",
                    timing_slots=["morning"],
                    with_food=True,
                    plain_purpose="Low-dose blood thinner that helps keep your new heart stent open.",
                    plain_instructions="Take 1 tablet by mouth every morning with food to protect your stomach.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Metoprolol Succinate",
                    dosage="50 mg",
                    frequency="Once daily",
                    route="oral",
                    timing_slots=["morning"],
                    with_food=True,
                    plain_purpose="Slows down your heart rate and lowers blood pressure so your heart works less hard.",
                    plain_instructions="Take 1 tablet by mouth every morning with or right after breakfast.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Atorvastatin",
                    dosage="40 mg",
                    frequency="Once daily",
                    route="oral",
                    timing_slots=["bedtime"],
                    with_food=None,
                    plain_purpose="Lowers cholesterol to keep your heart blood vessels clean.",
                    plain_instructions="Take 1 tablet by mouth every night at bedtime.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Omeprazole",
                    dosage="20 mg",
                    frequency="Once daily",
                    route="oral",
                    timing_slots=["morning"],
                    with_food=False,
                    plain_purpose="Lowers stomach acid to help protect your stomach lining.",
                    plain_instructions="Take 1 capsule by mouth every morning 30 minutes before breakfast.",
                    ocr_confidence="high",
                ),
            ],
            red_flags=[
                RedFlagItem(
                    symptom="Chest pain, tightness, or trouble breathing",
                    urgency="call_911",
                    action="Call 911 or go to the nearest emergency room right away.",
                ),
                RedFlagItem(
                    symptom="Black or tarry stools, red urine, or nosebleed lasting over 15 minutes",
                    urgency="call_911",
                    action="Seek emergency care immediately — these can be signs of internal bleeding.",
                ),
                RedFlagItem(
                    symptom="New dizziness, fainting, or unusual bruising",
                    urgency="call_doctor",
                    action="Call your cardiology team today before taking your next blood thinner dose.",
                ),
            ],
            follow_up_instructions=[
                "Go to the Anticoagulation Clinic in 3 days for your INR blood test.",
                "See your heart doctor (cardiologist) in 14 days.",
                "Do not start any over-the-counter pain pills (like ibuprofen or naproxen) without asking your doctor.",
            ],
            questions_for_pharmacist=[
                "My discharge list includes both Warfarin and Aspirin, plus Omeprazole — should I take them at different times and what bleeding signs mean I should call right away?",
                "When is my exact target date for my INR blood test?",
            ],
        ),
    ),
    "diabetes_htn": (
        SampleSummaryInfo(
            id="diabetes_htn",
            title="Diabetes, Blood Pressure & Pain Relief",
            subtitle="4 medications • Triggers High Potassium & Kidney Strain Alerts",
            highlight_badge="Kidney & Electrolyte Check",
            raw_text=(
                "DISCHARGE SUMMARY - MERCY GENERAL HOSPITAL\n"
                "Discharge Date: 2026-11-23\n"
                "Primary Diagnosis: Hypertensive Urgency & Type 2 Diabetes Mellitus; Acute Knee Sprain\n\n"
                "DISCHARGE MEDICATIONS:\n"
                "1. Lisinopril 20 mg PO once daily in the morning.\n"
                "2. Potassium Chloride 20 mEq PO once daily with breakfast.\n"
                "3. Metformin 500 mg PO twice daily with breakfast and dinner.\n"
                "4. Ibuprofen 600 mg PO every 8 hours with food as needed for knee pain.\n\n"
                "FOLLOW-UP:\n"
                "- Primary care visit in 5 days for Basic Metabolic Panel (potassium & kidney check).\n"
            ),
        ),
        ExtractedDischarge(
            patient_friendly_summary=(
                "You were treated for very high blood pressure, blood sugar management, and a knee sprain. "
                "Your medicines help lower your blood pressure, control blood sugar, and ease knee pain. "
                "Because some of these medicines affect your kidneys and potassium levels, your doctor needs a quick "
                "blood test in 5 days."
            ),
            primary_diagnosis="High Blood Pressure, Type 2 Diabetes & Knee Sprain",
            discharge_date="2026-11-23",
            overall_ocr_confidence="high",
            document_warnings=[],
            medications=[
                ExtractedMedication(
                    raw_name="Lisinopril",
                    dosage="20 mg",
                    frequency="Once daily",
                    route="oral",
                    timing_slots=["morning"],
                    with_food=None,
                    plain_purpose="Relaxes blood vessels to lower your blood pressure and protect your heart.",
                    plain_instructions="Take 1 tablet by mouth every morning. Stand up slowly if you feel dizzy.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Potassium Chloride",
                    dosage="20 mEq",
                    frequency="Once daily",
                    route="oral",
                    timing_slots=["morning"],
                    with_food=True,
                    plain_purpose="Replaces potassium, an important mineral for your heart and muscles.",
                    plain_instructions="Take 1 tablet by mouth with breakfast and a full glass of water.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Metformin",
                    dosage="500 mg",
                    frequency="Twice daily",
                    route="oral",
                    timing_slots=["morning", "evening"],
                    with_food=True,
                    plain_purpose="Helps lower your blood sugar levels.",
                    plain_instructions="Take 1 tablet with breakfast and 1 tablet with dinner to prevent an upset stomach.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Ibuprofen",
                    dosage="600 mg",
                    frequency="Every 8 hours as needed",
                    route="oral",
                    timing_slots=["as_needed"],
                    with_food=True,
                    plain_purpose="Reduces knee pain and swelling.",
                    plain_instructions="Only take when needed for pain, always with food. Ask your doctor if acetaminophen is safer with your blood pressure pill.",
                    ocr_confidence="high",
                ),
            ],
            red_flags=[
                RedFlagItem(
                    symptom="Swelling of lips, tongue, or trouble swallowing/breathing",
                    urgency="call_911",
                    action="Call 911 immediately — this can be a serious reaction to Lisinopril.",
                ),
                RedFlagItem(
                    symptom="Muscle weakness, tingling, or a slow/fluttering heartbeat",
                    urgency="call_911",
                    action="Go to the ER or call 911 — these can be signs of high potassium.",
                ),
                RedFlagItem(
                    symptom="Swollen ankles, sudden weight gain, or urinating much less than normal",
                    urgency="call_doctor",
                    action="Call your primary doctor right away to check your kidneys.",
                ),
            ],
            follow_up_instructions=[
                "See your primary care doctor in 5 days for a potassium and kidney blood test.",
                "Drink plenty of water each day unless your doctor told you to limit fluids.",
            ],
            questions_for_pharmacist=[
                "I am prescribed both Lisinopril and Potassium Chloride — should my potassium level be checked sooner?",
                "Can I use acetaminophen (Tylenol) instead of Ibuprofen for my knee pain so my kidneys stay safe?",
            ],
        ),
    ),
    "handwritten_uncertain": (
        SampleSummaryInfo(
            id="handwritten_uncertain",
            title="Smudged Handwritten Rx (Low-Confidence OCR)",
            subtitle="3 medications • Demonstrates Responsible AI Uncertainty Flags",
            highlight_badge="OCR Uncertainty Guardrail",
            raw_text=(
                "URGENT CARE DISCHARGE NOTE (HANDWRITTEN SCAN)\n"
                "Patient seen for: Acute Asthma Flare & Bronchitis\n"
                "1. Prednisone [smudged: 20mg or 40mg?] PO daily x 5 days\n"
                "2. Albuterol HFA inhaler 2 puffs q4-6h PRN shortness of breath\n"
                "3. Azithromycin 250 mg [illegible frequency] PO\n"
            ),
        ),
        ExtractedDischarge(
            patient_friendly_summary=(
                "You were treated for an asthma flare-up and chest infection (bronchitis). "
                "Part of this handwritten note is smudged or hard to read, so we flagged the unclear dose and "
                "schedule in yellow. Please confirm those exact numbers with your pharmacy before taking them."
            ),
            primary_diagnosis="Asthma Flare-Up & Bronchitis",
            discharge_date="2026-11-25",
            overall_ocr_confidence="low",
            document_warnings=[
                "Handwriting on this document is partially smudged. Do NOT guess unclear doses—verify with your pharmacy."
            ],
            medications=[
                ExtractedMedication(
                    raw_name="Prednisone",
                    dosage="20 mg or 40 mg (UNCLEAR)",
                    frequency="Once daily for 5 days",
                    route="oral",
                    timing_slots=["morning"],
                    with_food=True,
                    plain_purpose="Steroid pill that calms down swelling in your airways so you can breathe easier.",
                    plain_instructions="Take in the morning with food. VERIFY the exact milligram strength with your pharmacy first.",
                    ocr_confidence="low",
                    uncertainty_reason="Handwritten number is smudged between 20 mg and 40 mg.",
                ),
                ExtractedMedication(
                    raw_name="Albuterol",
                    dosage="2 puffs",
                    frequency="Every 4 to 6 hours as needed",
                    route="inhalation",
                    timing_slots=["as_needed"],
                    with_food=None,
                    plain_purpose="Fast-acting rescue inhaler that opens your airways during wheezing or shortness of breath.",
                    plain_instructions="Breathe in 2 puffs when you feel short of breath, up to every 4 to 6 hours.",
                    ocr_confidence="high",
                ),
                ExtractedMedication(
                    raw_name="Azithromycin",
                    dosage="250 mg",
                    frequency="Frequency unclear (confirm label)",
                    route="oral",
                    timing_slots=["morning"],
                    with_food=None,
                    plain_purpose="Antibiotic that treats bacterial chest infections.",
                    plain_instructions="Check the printed pharmacy bottle label for how many tablets to take on Day 1 vs. Days 2–5.",
                    ocr_confidence="medium",
                    uncertainty_reason="Handwritten schedule instructions are cut off on the right margin.",
                ),
            ],
            red_flags=[
                RedFlagItem(
                    symptom="Rescue inhaler does not help, or lips/fingernails look bluish",
                    urgency="call_911",
                    action="Call 911 immediately — severe asthma flare-up.",
                ),
                RedFlagItem(
                    symptom="High fever over 101.5°F (38.6°C) or chest pain when breathing",
                    urgency="call_doctor",
                    action="Call your doctor or urgent care clinic today.",
                ),
            ],
            follow_up_instructions=[
                "Call or visit your pharmacy to confirm the Prednisone dose and Azithromycin schedule before starting.",
                "Follow up with your primary doctor in 3 to 5 days if breathing is not improving.",
            ],
            questions_for_pharmacist=[
                "The handwritten note was smudged on Prednisone — is my prescription for 20 mg or 40 mg?",
                "How many Azithromycin tablets should I take on day 1 compared to days 2 through 5?",
            ],
        ),
    ),
}
