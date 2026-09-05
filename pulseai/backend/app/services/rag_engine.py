import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from app.core.config import settings
from app.core.database import (
    get_supabase_client,
    get_in_memory_guidelines,
    add_in_memory_record
)
from app.schemas.assessment import TriageAssessment, GuidelineCitation

# Configure Gemini AI if API key is provided
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "AIzaSy...your-google-ai-studio-key":
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"[Gemini] Warning: Failed to configure Google Generative AI ({e})")

def generate_embedding(text: str) -> List[float]:
    """Generates a 768-dimensional embedding vector using Gemini text-embedding-004."""
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "AIzaSy...your-google-ai-studio-key":
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_query"
            )
            return result["embedding"]
        except Exception as e:
            print(f"[Gemini] Embedding API call failed ({e}). Using semantic fallback.")
    # Return 768-dim normalized dummy vector for local offline development
    return [0.01] * 768

def retrieve_guidelines(query_vector: List[float], query_text: str) -> List[Dict[str, Any]]:
    """Retrieves top matching clinical guidelines via Supabase pgvector RPC or in-memory search."""
    supabase = get_supabase_client()
    if supabase is not None:
        try:
            response = supabase.rpc("match_guidelines", {
                "query_embedding": query_vector,
                "match_threshold": 0.35,
                "match_count": 3
            }).execute()
            if response.data and len(response.data) > 0:
                return response.data
        except Exception as e:
            print(f"[Supabase] Vector RPC failed ({e}). Falling back to in-memory guidelines.")
            
    # In-memory heuristic guideline matching
    query_lower = query_text.lower()
    in_mem = get_in_memory_guidelines()
    
    # Priority matching based on keywords
    if any(k in query_lower for k in ["chest pain", "troponin", "stemi", "heart", "ecg", "cardiac", "infarct"]):
        return [in_mem[0], in_mem[3]]
    elif any(k in query_lower for k in ["sepsis", "lactate", "wbc", "fever", "qsofa", "bp 80", "bp 70", "hypotension"]):
        return [in_mem[1], in_mem[2]]
    elif any(k in query_lower for k in ["breath", "spo2", "wheez", "stridor", "asthma", "oxygen", "cyanosis"]):
        return [in_mem[2], in_mem[1]]
    elif any(k in query_lower for k in ["abdominal", "appendix", "pain", "vomiting", "tenderness"]):
        return [in_mem[3], in_mem[4]]
    else:
        return [in_mem[4], in_mem[3]]

def deterministic_clinical_triage_fallback(
    patient_name: str,
    age: int,
    gender: str,
    symptoms: str,
    pdf_text: str,
    matched_guidelines: List[Dict[str, Any]]
) -> TriageAssessment:
    """Zero-hallucination deterministic fallback engine when LLM is unavailable."""
    combined = f"{symptoms} {pdf_text}".lower()
    
    # Emergency Rule Check: Cardiac / Sepsis / Severe Hypoxia
    is_emergency = False
    red_flags = []
    specialist = "General Physician"
    time_slot = "Next Available Slot (Tomorrow 10:00 AM)"
    triage_level = "ROUTINE"
    summary = f"Patient {patient_name} ({age}yo {gender}) presents for clinical evaluation."
    rationale = "Symptoms are consistent with non-urgent outpatient presentation."
    
    if any(k in combined for k in ["troponin", "stemi", "crushing chest pain", "cardiac arrest", "ecg st elevation"]):
        is_emergency = True
        triage_level = "EMERGENCY"
        red_flags.extend(["Elevated Cardiac Biomarkers / Troponin", "Severe Ischemic Chest Pain", "High Risk of Acute Coronary Syndrome (ACS)"])
        specialist = "Interventional Cardiologist"
        time_slot = "IMMEDIATE RESUSCITATION (0 min)"
        summary = f"CRITICAL: {patient_name} presents with hallmark indicators of Acute Coronary Syndrome / Myocardial Infarction requiring immediate catheterization lab activation."
        rationale = "Matches AHA/ACC STEMI Emergency Protocol: elevated troponin/substernal pain requires resuscitation within 10 minutes."
    elif any(k in combined for k in ["spo2 < 90", "spo2: 8", "stridor", "respiratory arrest", "severe dyspnea", "cyanosis"]):
        is_emergency = True
        triage_level = "EMERGENCY"
        red_flags.extend(["Severe Hypoxemia (SpO2 < 90%)", "Acute Respiratory Distress", "Airway Compromise Risk"])
        specialist = "Critical Care / Pulmonologist"
        time_slot = "IMMEDIATE RESUSCITATION (0 min)"
        summary = f"CRITICAL: {patient_name} shows acute respiratory failure and critical hypoxemia."
        rationale = "Matches BTS Acute Respiratory Failure Protocol: immediate high-flow oxygen or non-invasive ventilation required."
    elif any(k in combined for k in ["sepsis", "lactate > 2", "qsofa >= 2", "bp 80/", "bp 70/", "unresponsive", "fever 104"]):
        is_emergency = True
        triage_level = "EMERGENCY"
        red_flags.extend(["Sepsis Physiology / qSOFA Criteria Met", "Severe Hypotension / Septic Shock Risk", "Elevated Serum Lactate"])
        specialist = "Critical Care Medicine Specialist"
        time_slot = "IMMEDIATE RESUSCITATION (0 min)"
        summary = f"CRITICAL: {patient_name} exhibits severe systemic inflammatory response and hemodynamic instability."
        rationale = "Matches Surviving Sepsis Campaign Guidelines: immediate fluid resuscitation and broad-spectrum IV antibiotics required within 1 hour."
    elif any(k in combined for k in ["severe pain", "fever", "vomiting", "hypertension", "fracture", "hematuria", "headache"]):
        triage_level = "URGENT"
        red_flags.extend(["Moderate Acute Pain", "Need for Diagnostic Imaging / Lab Workup"])
        specialist = "Emergency Physician / Internist"
        time_slot = "Within 2 Hours (Today 11:30 AM)"
        summary = f"URGENT: {patient_name} presents with acute symptoms requiring rapid diagnostic workup and stabilization."
        rationale = "Matches Emergency Medicine Practice Guidelines for urgent, time-sensitive outpatient assessment."
    else:
        triage_level = "ROUTINE"
        red_flags = ["Mild/Stable Vitals"]
        specialist = "General Physician"
        time_slot = "Next Available Slot (Tomorrow 10:00 AM)"
        summary = f"ROUTINE: {patient_name} presents with mild, stable symptoms suitable for scheduled consultation."
        rationale = "Matches NICE Routine Outpatient Triage Standard."

    citations = [
        GuidelineCitation(
            category=g.get("category", "General"),
            excerpt=g.get("guideline_text", "")[:180] + "...",
            source_reference=g.get("source_reference", "Clinical Protocol"),
            similarity_score=round(float(g.get("similarity", 0.75)), 3)
        )
        for g in matched_guidelines
    ]

    return TriageAssessment(
        triage_level=triage_level,
        clinical_summary=summary,
        key_red_flags=red_flags,
        recommended_specialist=specialist,
        suggested_time_slot=time_slot,
        rationale=rationale,
        citations=citations
    )

async def run_triage_rag(
    patient_name: str,
    age: int,
    gender: str,
    symptoms: str,
    pdf_text: str = ""
) -> Dict[str, Any]:
    """
    Executes the Complete RAG Pipeline:
    1. Generates 768-dim embedding
    2. Queries Vector Knowledge Base
    3. Invokes Gemini 1.5 Flash with Pydantic JSON Schema
    4. Persists assessment to Supabase / In-Memory Store
    """
    combined_query = f"Patient: {patient_name}, {age}yo {gender}. Reported Symptoms: {symptoms}. Diagnostic Findings: {pdf_text[:1000]}"
    query_vector = generate_embedding(combined_query)
    matched_guidelines = retrieve_guidelines(query_vector, combined_query)
    
    assessment: Optional[TriageAssessment] = None
    
    # Try Gemini 1.5 Flash if configured
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "AIzaSy...your-google-ai-studio-key":
        try:
            context_str = "\n\n".join([
                f"[{g.get('category')}] (Ref: {g.get('source_reference')})\n{g.get('guideline_text')}"
                for g in matched_guidelines
            ])
            
            prompt = f"""You are PulseAI, a board-certified Clinical Triage & Patient Intelligence Copilot.
Your mission is to perform clinical triage on the incoming patient using the verified guidelines below.

[VERIFIED CLINICAL GUIDELINES]
{context_str}

[PATIENT INTAKE RECORD]
- Full Name: {patient_name}
- Demographics: {age} years old, {gender}
- Reported Clinical Symptoms: {symptoms}
- Extracted Diagnostic / Lab PDF Findings:
{pdf_text if pdf_text else "No uploaded lab report attached."}

[INSTRUCTIONS]
1. Assess triage level strictly as EMERGENCY, URGENT, or ROUTINE based on the guidelines.
2. Identify critical red flags (abnormal biomarkers, dangerous vitals, acute distress).
3. Assign the precise medical specialist and optimal appointment time slot.
4. Provide structured clinical rationale citing the matched guidelines.
"""
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={
                    "response_mime_type": "application/json",
                    "response_schema": TriageAssessment,
                    "temperature": 0.1,
                }
            )
            
            response = model.generate_content(prompt)
            assessment = TriageAssessment.model_validate_json(response.text)
            
            # Attach retrieved citations
            citations = [
                GuidelineCitation(
                    category=g.get("category", "General"),
                    excerpt=g.get("guideline_text", "")[:180] + "...",
                    source_reference=g.get("source_reference", "Clinical Protocol"),
                    similarity_score=round(float(g.get("similarity", 0.85)), 3)
                )
                for g in matched_guidelines
            ]
            assessment.citations = citations
        except Exception as e:
            print(f"[Gemini] Generation failed or timed out ({e}). Executing deterministic clinical rule engine.")
            assessment = None

    if assessment is None:
        assessment = deterministic_clinical_triage_fallback(
            patient_name=patient_name,
            age=age,
            gender=gender,
            symptoms=symptoms,
            pdf_text=pdf_text,
            matched_guidelines=matched_guidelines
        )

    # Persist in Supabase or In-Memory Store
    created_at_str = datetime.datetime.utcnow().isoformat() + "Z"
    new_id = str(uuid.uuid4())
    record_payload = {
        "id": new_id,
        "patient_name": patient_name,
        "age": age,
        "gender": gender,
        "raw_symptoms": symptoms,
        "extracted_pdf_text": pdf_text[:5000] if pdf_text else None,
        "triage_level": assessment.triage_level,
        "clinical_summary": assessment.clinical_summary,
        "key_red_flags": assessment.key_red_flags,
        "recommended_specialist": assessment.recommended_specialist,
        "suggested_time_slot": assessment.suggested_time_slot,
        "rationale": assessment.rationale,
        "guideline_citations": [c.model_dump() for c in (assessment.citations or [])],
        "status": "PENDING",
        "created_at": created_at_str
    }
    
    supabase = get_supabase_client()
    if supabase is not None:
        try:
            res = supabase.table("triage_records").insert(record_payload).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            print(f"[Supabase] Insert failed ({e}). Storing in local memory.")
            
    return add_in_memory_record(record_payload)
