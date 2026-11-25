from fastapi.testclient import TestClient

from app.main import app
from app.models import ExtractedMedication, FDACitation, VerifiedMedication
from app.services.clinical_db import _clean_drug_query, check_drug_interactions


def test_clean_drug_query():
    assert _clean_drug_query("Warfarin Sodium 5 mg PO tablet") == "Warfarin"
    assert _clean_drug_query("Metoprolol Succinate 50mg (Toprol XL)") == "Metoprolol Succinate"


def test_deterministic_interaction_warfarin_aspirin():
    meds = [
        VerifiedMedication(
            extracted=ExtractedMedication(
                raw_name="Warfarin",
                dosage="5 mg",
                frequency="Once daily",
                plain_purpose="Blood thinner",
                plain_instructions="Take once daily",
            ),
            fda_citation=FDACitation(
                rxcui="11289",
                normalized_name="warfarin",
                fda_label_url="https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=test-warfarin",
                verified_via="rxnorm_openfda",
            ),
        ),
        VerifiedMedication(
            extracted=ExtractedMedication(
                raw_name="Aspirin",
                dosage="81 mg",
                frequency="Once daily",
                plain_purpose="Antiplatelet",
                plain_instructions="Take once daily",
            ),
            fda_citation=FDACitation(
                rxcui="1191",
                normalized_name="aspirin",
                verified_via="rxnorm_openfda",
            ),
        ),
    ]
    alerts = check_drug_interactions(meds)
    assert len(alerts) == 1
    assert alerts[0].severity == "high"
    assert "Bleeding" in alerts[0].title
    assert alerts[0].source_url == "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=test-warfarin"


def test_openfda_text_fallback_interaction():
    meds = [
        VerifiedMedication(
            extracted=ExtractedMedication(
                raw_name="DrugAlpha",
                dosage="10 mg",
                frequency="Daily",
                plain_purpose="Test",
                plain_instructions="Test",
            ),
            fda_citation=FDACitation(
                rxcui="1",
                normalized_name="drugalpha",
                drug_interactions_excerpt="Avoid co-administration with drugbeta due to elevated plasma levels.",
                fda_label_url="https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=alpha",
                verified_via="rxnorm_openfda",
            ),
        ),
        VerifiedMedication(
            extracted=ExtractedMedication(
                raw_name="DrugBeta",
                dosage="20 mg",
                frequency="Daily",
                plain_purpose="Test",
                plain_instructions="Test",
            ),
            fda_citation=FDACitation(
                rxcui="2",
                normalized_name="drugbeta",
                verified_via="rxnorm_only",
            ),
        ),
    ]
    alerts = check_drug_interactions(meds)
    assert len(alerts) == 1
    assert alerts[0].detection_method == "openfda_label_match"


def test_api_health_and_samples():
    client = TestClient(app)
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    samples = client.get("/api/samples")
    assert samples.status_code == 200
    data = samples.json()
    assert len(data) == 3
    assert {s["id"] for s in data} == {"cardiac_afib", "diabetes_htn", "handwritten_uncertain"}
