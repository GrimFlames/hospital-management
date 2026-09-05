import os
import sys

# Add app directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import get_supabase_client
from app.services.rag_engine import generate_embedding

CLINICAL_GUIDELINES_SEED = [
    {
        "category": "Cardiovascular Emergency",
        "guideline_text": "Severe crushing substernal chest pain radiating to left arm or jaw, acute diaphoresis, shortness of breath, or cardiac troponin-I elevation >0.04 ng/mL indicates Acute Coronary Syndrome (ACS) or ST-Elevation Myocardial Infarction (STEMI). Immediate emergency resuscitation, 12-lead ECG within 10 minutes, and catheterization lab activation required.",
        "source_reference": "AHA/ACC STEMI Guidelines 2024"
    },
    {
        "category": "Sepsis & Critical Infection",
        "guideline_text": "qSOFA criteria (Respiratory Rate >=22 breaths/min, Altered Mental Status GCS<15, Systolic BP <=100 mmHg) with suspected bacterial/viral infection or elevated serum lactate >2.0 mmol/L. High fever >39C or hypothermia <36C with leukocytosis >15,000/uL requires immediate IV crystalloid bolus and broad-spectrum antibiotics within 1 hour.",
        "source_reference": "Surviving Sepsis Campaign International Guidelines 2023"
    },
    {
        "category": "Acute Respiratory Distress",
        "guideline_text": "Pulse oximetry SpO2 <92% on ambient room air, acute stridor, severe wheezing unresponsive to initial nebulization, intercostal retractions, or central cyanosis. High risk for respiratory exhaustion requiring immediate high-flow oxygen, non-invasive positive pressure ventilation (BiPAP/CPAP) or endotracheal intubation.",
        "source_reference": "BTS Guidelines for the Management of Acute Respiratory Failure"
    },
    {
        "category": "Subacute & Urgent Abdominal Conditions",
        "guideline_text": "Moderate to severe persistent abdominal pain with localized peritoneal signs (McBurney's point tenderness for appendicitis, Murphy's sign for acute cholecystitis), severe flank pain with microscopic hematuria (nephrolithiasis), or sustained blood pressure 160-180/100-110 mmHg without encephalopathy. Urgent clinical evaluation within 2 hours.",
        "source_reference": "ACEP Clinical Policy: Critical Issues in the Evaluation of Adult Patients Presenting with Acute Abdominal Pain"
    },
    {
        "category": "Routine Outpatient Protocol",
        "guideline_text": "Mild seasonal upper respiratory symptoms (coryza, low-grade fever <38C, non-productive cough), chronic stable hypertension or diabetes mellitus routine follow-up with normal baseline vitals, non-urgent prescription refills, or minor localized dermatological complaints. Standard outpatient scheduling.",
        "source_reference": "NICE Clinical Guidelines: General Outpatient Assessment and Triage"
    }
]

def seed_knowledge_base():
    print("==========================================================")
    print("🌱 Seeding PulseAI Clinical Guidelines Knowledge Base...")
    print("==========================================================")
    
    supabase = get_supabase_client()
    if supabase is None:
        print("[Supabase] ❌ No active Supabase credentials found in .env.")
        print("💡 The FastAPI server will automatically utilize the high-speed in-memory vector store for local development.")
        return

    for idx, item in enumerate(CLINICAL_GUIDELINES_SEED, start=1):
        print(f"[{idx}/{len(CLINICAL_GUIDELINES_SEED)}] Embedding guideline: {item['category']}...")
        vector = generate_embedding(f"{item['category']}: {item['guideline_text']}")
        
        payload = {
            "category": item["category"],
            "guideline_text": item["guideline_text"],
            "embedding": vector,
            "source_reference": item["source_reference"]
        }
        
        try:
            supabase.table("clinical_guidelines").insert(payload).execute()
            print(f"   ✅ Inserted successfully ({len(vector)}-dim vector).")
        except Exception as e:
            print(f"   ⚠️ Insert failed: {e}")

    print("\n🎉 Seeding complete! All clinical triage guidelines are now active in pgvector.")

if __name__ == "__main__":
    seed_knowledge_base()
