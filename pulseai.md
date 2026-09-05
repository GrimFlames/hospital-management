# 🩺 PulseAI — Production-Grade Clinical Triage & Patient Intelligence Copilot (`pulseai.md`)

**Version:** 1.0.0 Enterprise Standard  
**System Standard:** Antigravity × gstack Protocol Activated | 3-Layer Decoupled Architecture | 100% Free-Tier Compliance | Full Type Safety

---

## 📌 1. EXECUTIVE SUMMARY & STRATEGIC DISCOVERY

**PulseAI** is a high-throughput, clinical-grade AI intake and triage copilot engineered to eliminate Emergency Department (ED) and outpatient intake bottlenecks. Medical staff currently spend over 35% of their intake time manually parsing disparate lab PDFs and messy clinical notes. PulseAI ingests raw PDF lab reports or unstructured symptom text and executes a **grounded RAG workflow** to return deterministic triage classifications (`EMERGENCY`, `URGENT`, `ROUTINE`), clinical summaries, and auto-populated specialist appointments in **under 2 seconds**.

```
====================================================================================================
                                      PULSEAI PIPELINE FLOW
====================================================================================================

  [Patient / Intake Nurse]
         │
         ▼ (1. Uploads Lab Report PDF or Types Raw Symptoms)
  [Next.js 14 Frontend Cockpit (Vercel)]
         │
         ▼ (2. POST /api/triage — Form-Data with File / Text)
  [FastAPI 3.11 Backend Gateway (Render / Railway)]
         │
         ├── 📄 Text Extraction (`pypdf` In-Memory Stream Ingestion)
         ├── 🧠 Vector Embedding (Gemini `text-embedding-004` — 768-dim Vector)
         ├── 🔍 Semantic Match (`pgvector` Cosine Similarity RPC on Supabase)
         └── 🤖 Structured Inference (`Gemini 1.5 Flash` + Strict Pydantic JSON Schema)
         │
         ▼ (3. Returns Guaranteed Structured Assessment)
  [Supabase PostgreSQL] ◄── Stores Triage Record, Priority Level, Red Flags & Appointment Slot
```

---

## 🏛️ 2. THE 3-LAYER DECOUPLED ARCHITECTURE

```
+--------------------------------------------------------------------------------------------------+
| LAYER 1: CLIENT COCKPIT & PRESENTATION (Next.js 14 App Router, Tailwind CSS, Lucide Icons)       |
|  - Patient Intake Modal: Drag-and-drop PDF dropzone + manual vitals & symptoms fallback           |
|  - Live Clinical Triage Kanban Board (3 Dynamic Severity Lanes):                                 |
|      🔴 EMERGENCY (Critical / Immediate Resuscitation / Glowing Pulse)                           |
|      🟡 URGENT (Rapid Assessment / Time-Sensitive Intervention)                                  |
|      🟢 ROUTINE (Standard Outpatient Consultation)                                               |
|  - Doctor Audit Drawer: Longitudinal summary, RAG citation cards, matched similarity scores       |
|  - Real-Time Intake Analytics Banner: Active patient count, emergency ratio, triage latency (1.4s)|
+--------------------------------------------------------------------------------------------------+
                                                 │
                                         REST API (HTTP/JSON)
                                                 ▼
+--------------------------------------------------------------------------------------------------+
| LAYER 2: BUSINESS LOGIC & RAG PIPELINE (FastAPI / Python 3.11 / Pydantic v2)                     |
|  - `pdf_parser.py`: Safe in-memory byte stream extraction via `pypdf` (Zero local disk leaks)   |
|  - `rag_engine.py`: Google Gemini `text-embedding-004` embedding generation                      |
|  - Supabase RPC Query: Cosine similarity vector search over `clinical_guidelines` table           |
|  - Deterministic LLM Structurer: `Gemini 1.5 Flash` with strict Pydantic JSON Schema enforcement |
|  - Input Validation & Guardrails: Sanitizes prompt injection and hallucination boundaries        |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                        PostgreSQL / RPC Client
                                                 ▼
+--------------------------------------------------------------------------------------------------+
| LAYER 3: PERSISTENCE & VECTOR KNOWLEDGE BASE (Supabase PostgreSQL + pgvector)                   |
|  - `clinical_guidelines`: Vector-indexed (768-dim, IVFFlat / HNSW) emergency triage protocols    |
|  - `triage_records`: Immutable patient assessment history, red flags, specialist & booking slots |
|  - `match_guidelines`: Dedicated PostgreSQL RPC for thresholded cosine distance retrieval        |
+--------------------------------------------------------------------------------------------------+
```

---

## 📂 3. COMPLETE PROJECT TOPOLOGY

```text
pulseai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── triage.py             # L1: REST endpoints for intake ingestion & queries
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Pydantic Settings reading .env
│   │   │   └── database.py           # Supabase client singleton
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── assessment.py         # Pydantic contract for Gemini structured output
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── pdf_parser.py         # Ingests PDF streams via pypdf
│   │   │   └── rag_engine.py         # Vector similarity search & Gemini 1.5 Flash caller
│   │   ├── __init__.py
│   │   └── main.py                   # FastAPI app with CORS middleware & health check
│   ├── scripts/
│   │   └── seed_kb.py                # Seeds clinical guidelines with embeddings into Supabase
│   ├── sql/
│   │   └── schema.sql                # Complete pgvector DDL, indexes, tables, and RPC function
│   ├── requirements.txt              # Python runtime dependencies
│   └── Dockerfile                    # Multi-stage container build
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Clean modern medical UI shell with navbar
│   │   │   ├── page.tsx              # Main Clinical Cockpit & Live Triage Kanban Board
│   │   │   └── globals.css           # Tailwind base styles and pulse animations
│   │   ├── components/
│   │   │   ├── IntakeModal.tsx       # Drag-and-drop PDF uploader + symptom intake form
│   │   │   ├── TriageKanban.tsx      # Interactive 3-column board (EMERGENCY / URGENT / ROUTINE)
│   │   │   ├── TriageCard.tsx        # Card with pulse animations, vital tags, and auto-book slot
│   │   │   └── PatientDrawer.tsx     # Slide-out audit drawer showing RAG citations & AI reasoning
│   │   ├── lib/
│   │   │   └── api.ts                # Typed fetch client connecting to FastAPI backend
│   │   └── types/
│   │       └── triage.ts             # TypeScript interfaces mirroring backend Pydantic schemas
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── next.config.js
│
├── .env.example
├── docker-compose.yml
└── README.md                         # Complete setup guide, 60s demo script, and ATS bullet points
```

---

## 🗄️ 4. DATABASE & VECTOR SCHEMA SPECIFICATION (`backend/sql/schema.sql`)

```sql
-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clinical Guidelines Knowledge Base
CREATE TABLE IF NOT EXISTS clinical_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    guideline_text TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    source_reference VARCHAR(255) DEFAULT 'WHO / NHS Clinical Triage Protocol',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- IVFFlat index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS clinical_guidelines_embedding_idx 
ON clinical_guidelines 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Triage Records Table
CREATE TABLE IF NOT EXISTS triage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    raw_symptoms TEXT,
    extracted_pdf_text TEXT,
    triage_level VARCHAR(20) NOT NULL CHECK (triage_level IN ('EMERGENCY', 'URGENT', 'ROUTINE')),
    clinical_summary TEXT NOT NULL,
    key_red_flags JSONB DEFAULT '[]'::jsonb,
    recommended_specialist VARCHAR(100) NOT NULL,
    suggested_time_slot VARCHAR(100) NOT NULL,
    rationale TEXT NOT NULL,
    guideline_citations JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'RESOLVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cosine Distance Vector Match RPC
CREATE OR REPLACE FUNCTION match_guidelines (
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.4,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    category VARCHAR,
    guideline_text TEXT,
    source_reference VARCHAR,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cg.id,
        cg.category,
        cg.guideline_text,
        cg.source_reference,
        1 - (cg.embedding <=> query_embedding) AS similarity
    FROM clinical_guidelines cg
    WHERE 1 - (cg.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
```

---

## 🧠 5. BACKEND SERVICES & SCHEMAS

### A. Pydantic Structured Contracts (`backend/app/schemas/assessment.py`)
```python
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class GuidelineCitation(BaseModel):
    category: str = Field(..., description="Clinical category of the matched guideline")
    excerpt: str = Field(..., description="Relevant text excerpt from guideline")
    similarity_score: float = Field(..., description="Vector cosine similarity score")

class TriageAssessment(BaseModel):
    triage_level: Literal["EMERGENCY", "URGENT", "ROUTINE"] = Field(
        ...,
        description="Deterministic clinical triage urgency level"
    )
    clinical_summary: str = Field(
        ...,
        description="Concise 2-3 sentence clinical overview of patient condition"
    )
    key_red_flags: List[str] = Field(
        default_factory=list,
        description="High-risk biomarkers or symptom indicators detected"
    )
    recommended_specialist: str = Field(
        ...,
        description="Recommended medical specialty (e.g., Cardiologist, Pulmonologist, Neurologist, General Physician)"
    )
    suggested_time_slot: str = Field(
        ...,
        description="Suggested appointment timeframe (e.g., Immediate (0 min), Within 2 Hours, Next Available Slot)"
    )
    rationale: str = Field(
        ...,
        description="Clinical reasoning grounding the decision against matched guidelines"
    )
    citations: Optional[List[GuidelineCitation]] = Field(
        default_factory=list,
        description="Retrieved guideline citations backing the diagnosis"
    )
```

### B. PDF Parser (`backend/app/services/pdf_parser.py`)
```python
import io
from pypdf import PdfReader

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Safely extracts all text from an in-memory PDF byte stream."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = []
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_text.append(text.strip())
        return "\n".join(extracted_text)
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")
```

### C. Gemini RAG Engine (`backend/app/services/rag_engine.py`)
```python
import google.generativeai as genai
from app.core.config import settings
from app.core.database import get_supabase_client
from app.schemas.assessment import TriageAssessment, GuidelineCitation

genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_embedding(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_query"
    )
    return result["embedding"]

async def run_triage_rag(patient_name: str, age: int, gender: str, symptoms: str, pdf_text: str = "") -> dict:
    combined_query = f"Patient {patient_name}, Age {age}, {gender}. Symptoms: {symptoms}. Lab Findings: {pdf_text[:1000]}"
    query_vector = generate_embedding(combined_query)
    
    # Query Supabase Vector RPC
    supabase = get_supabase_client()
    response = supabase.rpc("match_guidelines", {
        "query_embedding": query_vector,
        "match_threshold": 0.35,
        "match_count": 3
    }).execute()
    
    guidelines = response.data or []
    context_str = "\n\n".join([
        f"[{g.get('category')}] {g.get('guideline_text')} (Ref: {g.get('source_reference')})"
        for g in guidelines
    ])
    
    prompt = f"""You are PulseAI, an expert clinical triage copilot.
Assess the patient below based strictly on the provided verified Clinical Guidelines.

[VERIFIED CLINICAL GUIDELINES]
{context_str}

[PATIENT INTAKE DATA]
Name: {patient_name}
Age: {age} | Gender: {gender}
Reported Symptoms: {symptoms}
Lab Report Text: {pdf_text}

Classify urgency as EMERGENCY, URGENT, or ROUTINE. Highlight red flags, assign specialist, and suggest time slot."""

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": TriageAssessment,
            "temperature": 0.1,
        }
    )
    
    llm_res = model.generate_content(prompt)
    assessment = TriageAssessment.model_validate_json(llm_res.text)
    
    citations = [
        GuidelineCitation(
            category=g.get("category", "General"),
            excerpt=g.get("guideline_text", "")[:200] + "...",
            similarity_score=round(float(g.get("similarity", 0.0)), 3)
        )
        for g in guidelines
    ]
    assessment.citations = citations
    
    # Persist record in Supabase
    record = supabase.table("triage_records").insert({
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
        "guideline_citations": [c.model_dump() for c in citations]
    }).execute()
    
    return {
        "id": record.data[0]["id"] if record.data else None,
        **assessment.model_dump()
    }
```

---

## 💻 6. FRONTEND DESIGN & KANBAN SPECIFICATION

### Components:
1. **IntakeModal (`IntakeModal.tsx`):** Drag-and-drop PDF dropzone (validates `.pdf`), quick intake form fields (Patient Name, Age, Gender, Freeform Symptoms). Shows processing state (`"Extracting text & matching guidelines in vector space..."`).
2. **TriageKanban (`TriageKanban.tsx`):** 3 visual columns with count pills:
   - 🔴 **EMERGENCY** (Red border, pulsing heart icon, glowing ambient card background).
   - 🟡 **URGENT** (Amber border, clock icon, priority warning tags).
   - 🟢 **ROUTINE** (Emerald border, check icon, standard queue tags).
3. **TriageCard (`TriageCard.tsx`):** Card displaying patient name, age/gender badge, top red flag tags, assigned specialist pill, and auto-book slot.
4. **PatientDrawer (`PatientDrawer.tsx`):** Slide-out panel presenting full AI Clinical Synthesis, complete red flag breakdown, and expandable **RAG Citation Cards** displaying matched similarity score % and exact clinical protocol text.

---

## 🧪 7. SEED DATA FIXTURES (`backend/scripts/seed_kb.py`)

Includes 5 real emergency triage rules:
1. **Cardiovascular Emergency:** Troponin-I elevation > 0.04 ng/mL or crushing substernal chest pain with diaphoresis $\rightarrow$ `EMERGENCY` (Immediate Cardiology).
2. **Sepsis Alert:** qSOFA score $\ge$ 2 (RR $\ge$ 22, altered mentation, SBP $\le$ 100) or high fever + elevated WBC > 15,000 $\rightarrow$ `EMERGENCY` (Immediate Critical Care).
3. **Acute Respiratory Distress:** SpO2 < 92% on room air with stridor or accessory muscle usage $\rightarrow$ `EMERGENCY` (Immediate Pulmonology).
4. **Subacute Neurological / Stroke:** Sudden unilateral weakness or speech difficulty $\rightarrow$ `EMERGENCY` (Immediate Stroke Team).
5. **Routine Outpatient:** Chronic mild symptoms, routine checkups, normal vitals $\rightarrow$ `ROUTINE` (General Physician / Next Available Slot).

---

## ⚡ 8. ENVIRONMENT VARIABLES (`.env.example`)

```ini
# Backend (FastAPI)
PORT=8000
ENVIRONMENT=production
GEMINI_API_KEY=AIzaSy...your-google-ai-studio-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGci...your-supabase-service-role-or-anon-key

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 9. 100% FREE-TIER CLOUD DEPLOYMENT GUIDE

1. **Database:** Create free project on **[Supabase.com](https://supabase.com)** $\rightarrow$ Run `schema.sql` in SQL Editor $\rightarrow$ Copy URL & Anon/Service Key.
2. **Backend API:** Connect repo to **[Render.com](https://render.com)** $\rightarrow$ Deploy `pulseai/backend` as Web Service $\rightarrow$ Set Environment Variables.
3. **Frontend UI:** Connect repo to **[Vercel.com](https://vercel.com)** $\rightarrow$ Set Root Directory to `pulseai/frontend` $\rightarrow$ Set `NEXT_PUBLIC_API_URL` to Render backend URL.

---

*PulseAI Master Specification is locked and ready for full execution.*