import asyncio
import re
from typing import Optional
import httpx

from app.models import (
    DrugInteractionAlert,
    FDACitation,
    SeverityLevel,
    VerifiedMedication,
)

RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST"
OPENFDA_BASE = "https://api.fda.gov/drug/label.json"
DAILYMED_LOOKUP = "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid="

# Curated high-alert clinical interaction rules backed by FDA drug labeling.
# Each tuple: (set_of_keywords_a, set_of_keywords_b, severity, title, plain_explanation, watch_for)
CLINICAL_INTERACTION_RULES: list[
    tuple[set[str], set[str], SeverityLevel, str, str, str]
] = [
    (
        {"warfarin", "coumadin", "jantoven"},
        {"aspirin", "acetylsalicylic", "ibuprofen", "advil", "motrin", "naproxen", "aleve", "nsaid", "diclofenac", "meloxicam"},
        "high",
        "Major Bleeding Risk (Blood Thinner + Pain Reliever/Aspirin)",
        "Taking warfarin together with aspirin or an NSAID pain reliever (like ibuprofen or naproxen) significantly increases the risk of serious stomach or internal bleeding.",
        "Watch for black or tarry stools, pink/red urine, nosebleeds that won't stop, unusual bruising, or coughing up blood.",
    ),
    (
        {"warfarin", "coumadin", "jantoven"},
        {"omeprazole", "prilosec", "pantoprazole", "esomeprazole"},
        "moderate",
        "Blood Thinner Level Change (Warfarin + Stomach Acid Reducer)",
        "Omeprazole can slow down how your body clears warfarin, which may make your blood thinner stronger than intended.",
        "Ask your doctor if your INR blood test needs to be checked sooner; watch for easy bruising or bleeding.",
    ),
    (
        {"clopidogrel", "plavix"},
        {"omeprazole", "prilosec", "esomeprazole", "nexium"},
        "high",
        "Reduced Heart Protection (Clopidogrel + Omeprazole)",
        "Omeprazole can block your body from activating clopidogrel, making it less effective at preventing blood clots after a heart procedure.",
        "Ask your doctor or pharmacist whether a different stomach medicine (like pantoprazole or famotidine) is safer for you.",
    ),
    (
        {"lisinopril", "enalapril", "ramipril", "losartan", "valsartan"},
        {"potassium", "klor-con", "k-dur", "spironolactone", "aldactone"},
        "high",
        "High Potassium Risk (Blood Pressure Medicine + Potassium)",
        "ACE inhibitors (like lisinopril) cause your body to hold onto potassium. Adding a potassium supplement or spironolactone can raise blood potassium to dangerous levels.",
        "Watch for muscle weakness, tingling, numbness, or a slow/irregular heartbeat. Do not skip lab blood checks.",
    ),
    (
        {"lisinopril", "enalapril", "ramipril", "losartan", "valsartan"},
        {"ibuprofen", "advil", "motrin", "naproxen", "aleve", "diclofenac", "meloxicam", "celecoxib"},
        "moderate",
        "Kidney Strain & Reduced Blood Pressure Control (BP Med + NSAID)",
        "Pain relievers like ibuprofen or naproxen can make blood pressure medicines less effective and put extra stress on your kidneys.",
        "Watch for swelling in your ankles/feet, sudden weight gain, or urinating much less than usual.",
    ),
    (
        {"metformin", "glucophage"},
        {"furosemide", "lasix", "ibuprofen", "naproxen", "contrast", "iodinated"},
        "moderate",
        "Kidney & Lactic Acidosis Precaution (Metformin + Kidney-Affecting Meds)",
        "Medicines that affect kidney function or hydration (like water pills or NSAIDs) can increase the chance of metformin building up in your body.",
        "Stay well hydrated and call your doctor if you develop severe fatigue, muscle pain, trouble breathing, or stomach pain.",
    ),
    (
        {"sertraline", "fluoxetine", "escitalopram", "citalopram", "venlafaxine", "duloxetine"},
        {"tramadol", "ultram", "sumatriptan", "linezolid"},
        "high",
        "Serotonin Syndrome Risk (Antidepressant + Tramadol/Triptan)",
        "Combining these medicines can cause too much serotonin to build up in your nervous system.",
        "Watch for agitation, confusion, fast heartbeat, sweating, muscle twitching, or fever.",
    ),
    (
        {"atorvastatin", "simvastatin", "rosuvastatin", "lipitor"},
        {"clarithromycin", "erythromycin", "amiodarone", "gemfibrozil"},
        "high",
        "Muscle Injury Risk (Statin + Antibiotic/Heart Med)",
        "Certain antibiotics and heart medicines slow down how your liver clears statins, raising the risk of muscle breakdown.",
        "Report any unexplained muscle pain, tenderness, weakness, or dark brown urine right away.",
    ),
]


def _clean_drug_query(raw_name: str) -> str:
    """Strip dosages, salts, routes, and parentheticals to improve RxNorm lookup."""
    name = re.sub(r"\(.*?\)", " ", raw_name)
    name = re.sub(r"\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|meq|%|units?)\b", " ", name, flags=re.I)
    name = re.sub(
        r"\b(tablet|capsule|oral|extended[- ]release|er|xr|sr|dr|hcl|sodium|chloride|potassium|po|iv|im|sq|prn|daily|bid|tid|qid|qd)\b",
        " ",
        name,
        flags=re.I,
    )
    return " ".join(name.split()).strip()


def _truncate_text(text: str, max_len: int = 420) -> str:
    cleaned = " ".join(text.split())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 3].rsplit(" ", 1)[0] + "..."


class ClinicalVerificationClient:
    """Async client for NLM RxNorm and OpenFDA Drug Label APIs."""

    def __init__(self, timeout: float = 8.0) -> None:
        self._timeout = timeout

    async def verify_medication(self, raw_name: str) -> FDACitation:
        """Normalize drug name via RxNorm and fetch official FDA label data."""
        query = _clean_drug_query(raw_name) or raw_name.strip()
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            rxcui, norm_name = await self._lookup_rxnorm(client, query)
            fda_data = await self._lookup_openfda(client, rxcui, norm_name or query)

        if fda_data:
            openfda = fda_data.get("openfda", {})
            set_id = fda_data.get("set_id")
            brand_names = openfda.get("brand_name", [])[:3]
            generic_names = openfda.get("generic_name", [])[:3]
            boxed = fda_data.get("boxed_warning", [None])[0]
            warnings = (
                fda_data.get("warnings_and_cautions", [None])[0]
                or fda_data.get("warnings", [None])[0]
            )
            interactions = fda_data.get("drug_interactions", [None])[0]

            return FDACitation(
                rxcui=rxcui,
                normalized_name=norm_name or (generic_names[0] if generic_names else query),
                brand_names=brand_names,
                generic_names=generic_names,
                set_id=set_id,
                fda_label_url=f"{DAILYMED_LOOKUP}{set_id}" if set_id else None,
                boxed_warning=_truncate_text(boxed, 320) if boxed else None,
                key_warnings=_truncate_text(warnings, 380) if warnings else None,
                drug_interactions_excerpt=_truncate_text(interactions, 450) if interactions else None,
                verified_via="rxnorm_openfda",
            )

        if rxcui:
            return FDACitation(
                rxcui=rxcui,
                normalized_name=norm_name or query,
                verified_via="rxnorm_only",
            )

        return FDACitation(
            rxcui=None,
            normalized_name=query,
            verified_via="unverified",
        )

    async def _lookup_rxnorm(
        self, client: httpx.AsyncClient, query: str
    ) -> tuple[Optional[str], Optional[str]]:
        try:
            resp = await client.get(f"{RXNAV_BASE}/rxcui.json", params={"name": query})
            if resp.status_code == 200:
                ids = resp.json().get("idGroup", {}).get("rxnormId", [])
                if ids:
                    rxcui = ids[0]
                    name = await self._get_rxnorm_name(client, rxcui)
                    return rxcui, name or query

            approx = await client.get(
                f"{RXNAV_BASE}/approximateTerm.json",
                params={"term": query, "maxEntries": 1},
            )
            if approx.status_code == 200:
                candidates = (
                    approx.json()
                    .get("approximateGroup", {})
                    .get("candidate", [])
                )
                if candidates:
                    rxcui = candidates[0].get("rxcui")
                    name = candidates[0].get("name") or await self._get_rxnorm_name(client, rxcui)
                    return rxcui, name or query
        except Exception:
            pass
        return None, None

    async def _get_rxnorm_name(
        self, client: httpx.AsyncClient, rxcui: Optional[str]
    ) -> Optional[str]:
        if not rxcui:
            return None
        try:
            resp = await client.get(f"{RXNAV_BASE}/rxcui/{rxcui}/properties.json")
            if resp.status_code == 200:
                return resp.json().get("properties", {}).get("name")
        except Exception:
            pass
        return None

    async def _lookup_openfda(
        self, client: httpx.AsyncClient, rxcui: Optional[str], name: str
    ) -> Optional[dict]:
        queries: list[str] = []
        if rxcui:
            queries.append(f'openfda.rxcui:"{rxcui}"')
        safe_name = name.replace('"', "").strip()
        if safe_name:
            queries.append(f'openfda.generic_name:"{safe_name}"')
            queries.append(f'openfda.brand_name:"{safe_name}"')

        for search_expr in queries:
            try:
                resp = await client.get(
                    OPENFDA_BASE,
                    params={"search": search_expr, "limit": 1},
                )
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    if results:
                        return results[0]
            except Exception:
                continue
        return None


def _tokens_for_med(med: VerifiedMedication) -> set[str]:
    parts = [med.extracted.raw_name, med.fda_citation.normalized_name]
    parts.extend(med.fda_citation.generic_names)
    parts.extend(med.fda_citation.brand_names)
    tokens: set[str] = set()
    for part in parts:
        for word in re.findall(r"[a-zA-Z0-9-]+", part.lower()):
            if len(word) >= 3:
                tokens.add(word)
    return tokens


def check_drug_interactions(
    medications: list[VerifiedMedication],
) -> list[DrugInteractionAlert]:
    """Deterministically audit pairwise drug interactions using FDA labels & clinical rules."""
    alerts: list[DrugInteractionAlert] = []
    seen_pairs: set[tuple[str, str]] = set()

    for i in range(len(medications)):
        for j in range(i + 1, len(medications)):
            med_a = medications[i]
            med_b = medications[j]
            tokens_a = _tokens_for_med(med_a)
            tokens_b = _tokens_for_med(med_b)

            pair_key = tuple(sorted([med_a.extracted.raw_name, med_b.extracted.raw_name]))
            if pair_key in seen_pairs:
                continue

            matched_rule = None
            for kw_a, kw_b, severity, title, explanation, watch_for in CLINICAL_INTERACTION_RULES:
                if (tokens_a & kw_a and tokens_b & kw_b) or (
                    tokens_a & kw_b and tokens_b & kw_a
                ):
                    matched_rule = (severity, title, explanation, watch_for)
                    break

            if matched_rule:
                severity, title, explanation, watch_for = matched_rule
                citation_med = (
                    med_a if med_a.fda_citation.fda_label_url else med_b
                )
                source_url = citation_med.fda_citation.fda_label_url
                source_label = (
                    f"FDA Drug Label ({citation_med.fda_citation.normalized_name})"
                    if source_url
                    else "Clinical Interaction Rulebook + FDA Labeling"
                )
                alerts.append(
                    DrugInteractionAlert(
                        id=f"int-{i}-{j}",
                        drug_a=med_a.extracted.raw_name,
                        drug_b=med_b.extracted.raw_name,
                        severity=severity,
                        title=title,
                        plain_explanation=explanation,
                        what_to_watch_for=watch_for,
                        source_citation=source_label,
                        source_url=source_url,
                        detection_method="clinical_rulebook_and_fda",
                    )
                )
                seen_pairs.add(pair_key)
                continue

            # Fallback: check if OpenFDA drug_interactions text explicitly mentions the other drug
            fda_a_text = (med_a.fda_citation.drug_interactions_excerpt or "").lower()
            fda_b_text = (med_b.fda_citation.drug_interactions_excerpt or "").lower()
            b_hit = next(
                (t for t in tokens_b if len(t) >= 5 and re.search(rf"\b{re.escape(t)}\b", fda_a_text)),
                None,
            )
            a_hit = next(
                (t for t in tokens_a if len(t) >= 5 and re.search(rf"\b{re.escape(t)}\b", fda_b_text)),
                None,
            )

            if b_hit or a_hit:
                citing_med = med_a if b_hit else med_b
                alerts.append(
                    DrugInteractionAlert(
                        id=f"int-{i}-{j}",
                        drug_a=med_a.extracted.raw_name,
                        drug_b=med_b.extracted.raw_name,
                        severity="moderate",
                        title=f"Potential Interaction Noted in FDA Label ({med_a.extracted.raw_name} + {med_b.extracted.raw_name})",
                        plain_explanation=(
                            f"The official FDA label for {citing_med.fda_citation.normalized_name} "
                            f"mentions '{b_hit or a_hit}' in its Drug Interactions section."
                        ),
                        what_to_watch_for="Ask your pharmacist to confirm whether you need to separate doses or monitor side effects.",
                        source_citation=f"OpenFDA Label: {citing_med.fda_citation.normalized_name}",
                        source_url=citing_med.fda_citation.fda_label_url,
                        detection_method="openfda_label_match",
                    )
                )
                seen_pairs.add(pair_key)

    severity_rank = {"high": 0, "moderate": 1, "low": 2}
    alerts.sort(key=lambda a: severity_rank.get(a.severity, 3))
    return alerts


async def verify_all_medications(
    extracted_meds: list,
) -> tuple[list[VerifiedMedication], list[DrugInteractionAlert]]:
    """Verify all extracted medications in parallel and run pairwise interaction audit."""
    client = ClinicalVerificationClient()
    citations = await asyncio.gather(
        *[client.verify_medication(m.raw_name) for m in extracted_meds]
    )
    verified = [
        VerifiedMedication(extracted=m, fda_citation=c)
        for m, c in zip(extracted_meds, citations)
    ]
    interactions = check_drug_interactions(verified)
    return verified, interactions
