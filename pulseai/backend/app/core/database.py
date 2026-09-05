import uuid
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Optional[Client] = None

# In-Memory Fallback Store for Local Zero-Credential Development & Testing
_in_memory_records: List[Dict[str, Any]] = []
_in_memory_guidelines: List[Dict[str, Any]] = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "category": "Cardiovascular Emergency",
        "guideline_text": "Severe crushing substernal chest pain radiating to left arm/jaw, diaphoresis, shortness of breath, or troponin-I elevation >0.04 ng/mL indicates Acute Coronary Syndrome (ACS) or STEMI. Immediate emergency resuscitation, ECG within 10 min, and cardiology catheterization activation required.",
        "source_reference": "AHA/ACC STEMI Guidelines 2024",
        "similarity": 0.89
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "category": "Sepsis & Critical Infection",
        "guideline_text": "qSOFA criteria (Respiratory Rate >=22/min, Altered Mental Status GCS<15, Systolic BP <=100 mmHg) with suspected infection or elevated serum lactate >2 mmol/L. Severe fever >39C or hypothermia <36C with leukocytosis >15,000/uL requires immediate IV broad-spectrum antibiotics within 1 hour.",
        "source_reference": "Surviving Sepsis Campaign 2023",
        "similarity": 0.84
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "category": "Acute Respiratory Distress",
        "guideline_text": "Pulse oximetry SpO2 <92% on room air, stridor, acute wheezing unresponsive to bronchodilators, intercostal retractions, or cyanosis. High risk for respiratory arrest requiring immediate high-flow oxygen, non-invasive ventilation or intubation.",
        "source_reference": "BTS Acute Respiratory Failure Protocol",
        "similarity": 0.81
    },
    {
        "id": "44444444-4444-4444-4444-444444444444",
        "category": "Subacute & Urgent Conditions",
        "guideline_text": "Moderate persistent abdominal pain with localized tenderness (McBurney's point / Murphy's sign), severe renal colic with microscopic hematuria, or sustained hypertension SBP 160-180 mmHg without acute target organ damage. Urgent evaluation within 2 hours.",
        "source_reference": "Emergency Medicine Practice Guidelines",
        "similarity": 0.77
    },
    {
        "id": "55555555-5555-5555-5555-555555555555",
        "category": "Routine Outpatient Protocol",
        "guideline_text": "Mild seasonal symptoms (coryza, low-grade fever <38C, uncomplicated cough), chronic stable hypertension/diabetes follow-up with normal vitals, prescription refills, or minor dermatological complaints. Standard outpatient scheduling.",
        "source_reference": "NICE General Outpatient Triage Standard",
        "similarity": 0.72
    }
]

def get_supabase_client() -> Optional[Client]:
    """Returns a singleton Supabase client or None if credentials are not configured."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    
    if settings.SUPABASE_URL and settings.SUPABASE_KEY and "your-project" not in settings.SUPABASE_URL:
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            return _supabase_client
        except Exception as e:
            print(f"[Supabase] Warning: Could not initialize Supabase client ({e}). Utilizing in-memory store.")
            return None
    return None

def get_in_memory_records() -> List[Dict[str, Any]]:
    return _in_memory_records

def get_in_memory_guidelines() -> List[Dict[str, Any]]:
    return _in_memory_guidelines

def add_in_memory_record(record: Dict[str, Any]) -> Dict[str, Any]:
    if "id" not in record or not record["id"]:
        record["id"] = str(uuid.uuid4())
    _in_memory_records.insert(0, record)
    return record
