from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class GuidelineCitation(BaseModel):
    category: str = Field(..., description="Clinical category of the matched guideline")
    excerpt: str = Field(..., description="Relevant text excerpt from the clinical guideline")
    source_reference: Optional[str] = Field("WHO / NHS Triage Protocol", description="Official medical reference")
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")

class TriageAssessment(BaseModel):
    triage_level: Literal["EMERGENCY", "URGENT", "ROUTINE"] = Field(
        ...,
        description="Deterministic triage urgency level"
    )
    clinical_summary: str = Field(
        ...,
        description="Concise 2-3 sentence clinical overview of patient condition and primary risks"
    )
    key_red_flags: List[str] = Field(
        default_factory=list,
        description="Critical biomarkers, abnormal vitals, or high-risk symptom indicators"
    )
    recommended_specialist: str = Field(
        ...,
        description="Recommended medical specialist (e.g. Cardiologist, Pulmonologist, Critical Care, General Physician)"
    )
    suggested_time_slot: str = Field(
        ...,
        description="Suggested appointment timeframe (e.g. Immediate (0 min), Within 2 Hours, Next Available Slot)"
    )
    rationale: str = Field(
        ...,
        description="Clinical reasoning grounding the decision against matched guidelines"
    )
    citations: Optional[List[GuidelineCitation]] = Field(
        default_factory=list,
        description="Retrieved guideline citations backing the diagnosis"
    )

class TriageRecordResponse(TriageAssessment):
    id: str = Field(..., description="Unique record UUID")
    patient_name: str
    age: int
    gender: str
    raw_symptoms: str
    extracted_pdf_text: Optional[str] = None
    status: str = "PENDING"
    created_at: str

class ConfirmAppointmentRequest(BaseModel):
    status: Literal["CONFIRMED", "RESOLVED"] = "CONFIRMED"
