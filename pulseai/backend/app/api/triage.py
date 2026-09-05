from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from app.services.pdf_parser import extract_text_from_pdf_bytes
from app.services.rag_engine import run_triage_rag
from app.core.database import (
    get_supabase_client,
    get_in_memory_records
)
from app.schemas.assessment import ConfirmAppointmentRequest

router = APIRouter(tags=["Triage & Patient Intelligence"])

@router.get("/health", summary="Health Check & System Telemetry")
async def health_check():
    supabase = get_supabase_client()
    return {
        "status": "healthy",
        "service": "PulseAI Clinical Gateway",
        "version": "1.0.0",
        "supabase_connected": supabase is not None
    }

@router.get("/records", summary="Fetch All Triage Assessment Records")
async def get_triage_records():
    """Retrieves all triaged patient records sorted chronologically."""
    supabase = get_supabase_client()
    if supabase is not None:
        try:
            res = supabase.table("triage_records").select("*").order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase] Fetch failed ({e}). Returning in-memory records.")
            
    return get_in_memory_records()

@router.post("/triage", summary="Ingest Patient & Execute Clinical RAG Triage", status_code=status.HTTP_201_CREATED)
async def process_patient_triage(
    patient_name: str = Form(..., description="Full Name of Patient"),
    age: int = Form(..., description="Age in years"),
    gender: str = Form(..., description="Gender (Male, Female, Other)"),
    symptoms: str = Form(..., description="Reported clinical symptoms & vitals"),
    file: Optional[UploadFile] = File(None, description="Optional diagnostic lab report PDF")
):
    """
    Ingests patient data and optional PDF, extracts text in-memory,
    matches against vector guidelines, and outputs guaranteed structured triage JSON.
    """
    # Guard Clauses (Nil Path validation)
    if not patient_name.strip():
        raise HTTPException(status_code=400, detail="Patient name cannot be empty.")
    if age < 0 or age > 130:
        raise HTTPException(status_code=400, detail="Patient age must be between 0 and 130.")
    if not symptoms.strip():
        raise HTTPException(status_code=400, detail="Symptoms and vitals description cannot be empty.")

    extracted_pdf_text = ""
    if file is not None:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF lab reports are supported.")
        try:
            file_bytes = await file.read()
            if len(file_bytes) > 25 * 1024 * 1024:  # 25MB safety ceiling
                raise HTTPException(status_code=400, detail="File size exceeds 25MB safety limit.")
            extracted_pdf_text, page_count = extract_text_from_pdf_bytes(file_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process PDF report: {str(e)}")

    try:
        result = await run_triage_rag(
            patient_name=patient_name.strip(),
            age=age,
            gender=gender,
            symptoms=symptoms.strip(),
            pdf_text=extracted_pdf_text
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Clinical RAG processing encountered an unexpected error: {str(e)}"
        )

@router.patch("/records/{record_id}/confirm", summary="Confirm / Update Patient Appointment Status")
async def confirm_appointment(record_id: str, payload: ConfirmAppointmentRequest):
    """Updates the status of a triaged patient (e.g. from PENDING to CONFIRMED)."""
    supabase = get_supabase_client()
    if supabase is not None:
        try:
            res = supabase.table("triage_records").update({
                "status": payload.status
            }).eq("id", record_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            print(f"[Supabase] Update failed ({e}). Updating in-memory.")

    records = get_in_memory_records()
    for r in records:
        if r.get("id") == record_id:
            r["status"] = payload.status
            return r
            
    raise HTTPException(status_code=404, detail="Triage record not found.")

@router.delete("/records/{record_id}", summary="Delete Triage Record")
async def delete_triage_record(record_id: str):
    """Deletes a triage record from database."""
    supabase = get_supabase_client()
    if supabase is not None:
        try:
            supabase.table("triage_records").delete().eq("id", record_id).execute()
            return {"message": "Record deleted successfully", "id": record_id}
        except Exception as e:
            print(f"[Supabase] Delete failed ({e}).")

    records = get_in_memory_records()
    for idx, r in enumerate(records):
        if r.get("id") == record_id:
            records.pop(idx)
            return {"message": "Record deleted successfully", "id": record_id}

    return {"message": "Record deleted or not found", "id": record_id}
