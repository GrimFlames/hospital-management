import pytest
from app.schemas.assessment import TriageAssessment, GuidelineCitation
from app.services.pdf_parser import extract_text_from_pdf_bytes
from app.services.rag_engine import deterministic_clinical_triage_fallback, retrieve_guidelines
from app.core.database import get_in_memory_guidelines

def test_pydantic_schema_validation_happy_path():
    """Validates that a correctly structured clinical assessment parses cleanly."""
    data = {
        "triage_level": "EMERGENCY",
        "clinical_summary": "Patient experiencing severe substernal chest pain and diaphoresis.",
        "key_red_flags": ["Elevated Troponin-I", "Ischemic ECG changes"],
        "recommended_specialist": "Interventional Cardiologist",
        "suggested_time_slot": "IMMEDIATE RESUSCITATION (0 min)",
        "rationale": "Meets AHA STEMI protocol.",
        "citations": [
            {
                "category": "Cardiovascular Emergency",
                "excerpt": "Severe crushing chest pain indicates ACS.",
                "source_reference": "AHA 2024",
                "similarity_score": 0.91
            }
        ]
    }
    assessment = TriageAssessment.model_validate(data)
    assert assessment.triage_level == "EMERGENCY"
    assert len(assessment.key_red_flags) == 2
    assert assessment.citations[0].similarity_score == 0.91

def test_pdf_stream_empty_handling():
    """Validates that empty byte input returns empty string gracefully without error."""
    text, pages = extract_text_from_pdf_bytes(b"")
    assert text == ""
    assert pages == 0

def test_deterministic_cardiac_emergency_triage():
    """Tests that cardiac emergency symptoms deterministically triage to EMERGENCY with cardiologist."""
    guidelines = get_in_memory_guidelines()
    assessment = deterministic_clinical_triage_fallback(
        patient_name="Alex Mercer",
        age=52,
        gender="Male",
        symptoms="Crushing chest pain radiating to left jaw, diaphoresis, shortness of breath.",
        pdf_text="Troponin-I level is 0.35 ng/mL (Critical High).",
        matched_guidelines=guidelines
    )
    assert assessment.triage_level == "EMERGENCY"
    assert "Cardiologist" in assessment.recommended_specialist
    assert "IMMEDIATE" in assessment.suggested_time_slot
    assert len(assessment.key_red_flags) > 0

def test_deterministic_routine_triage():
    """Tests that mild symptoms deterministically triage to ROUTINE."""
    guidelines = get_in_memory_guidelines()
    assessment = deterministic_clinical_triage_fallback(
        patient_name="Jane Doe",
        age=24,
        gender="Female",
        symptoms="Mild runny nose and sore throat for 2 days. No fever, normal breathing.",
        pdf_text="",
        matched_guidelines=guidelines
    )
    assert assessment.triage_level == "ROUTINE"
    assert "General Physician" in assessment.recommended_specialist

def test_guideline_retrieval_fallback():
    """Tests keyword matching fallback for guidelines."""
    dummy_vec = [0.0] * 768
    results = retrieve_guidelines(dummy_vec, "chest pain troponin ecg")
    assert len(results) >= 1
    assert "Cardiovascular" in results[0]["category"]
