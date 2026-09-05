-- ============================================================================
-- PulseAI Clinical Triage & Knowledge Base Schema (pgvector + PostgreSQL)
-- Target: Supabase / PostgreSQL 15+
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running migration
-- DROP TABLE IF EXISTS triage_records CASCADE;
-- DROP TABLE IF EXISTS clinical_guidelines CASCADE;

-- 3. Clinical Guidelines Knowledge Base
-- Stores WHO, NHS, and Emergency Medicine triage protocols with 768-dim embeddings
CREATE TABLE IF NOT EXISTS clinical_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    guideline_text TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    source_reference VARCHAR(255) DEFAULT 'WHO / NHS Clinical Triage Protocol',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Fast Cosine Similarity Vector Index (IVFFlat)
CREATE INDEX IF NOT EXISTS clinical_guidelines_embedding_idx 
ON clinical_guidelines 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Triage Records Table
-- Immutable audit log of patient intakes, AI classifications, red flags, and appointment slots
CREATE TABLE IF NOT EXISTS triage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name VARCHAR(150) NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 130),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    raw_symptoms TEXT NOT NULL,
    extracted_pdf_text TEXT,
    triage_level VARCHAR(20) NOT NULL CHECK (triage_level IN ('EMERGENCY', 'URGENT', 'ROUTINE')),
    clinical_summary TEXT NOT NULL,
    key_red_flags JSONB DEFAULT '[]'::jsonb NOT NULL,
    recommended_specialist VARCHAR(100) NOT NULL,
    suggested_time_slot VARCHAR(100) NOT NULL,
    rationale TEXT NOT NULL,
    guideline_citations JSONB DEFAULT '[]'::jsonb NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'RESOLVED')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast ordering on dashboard
CREATE INDEX IF NOT EXISTS triage_records_created_at_idx ON triage_records (created_at DESC);
CREATE INDEX IF NOT EXISTS triage_records_triage_level_idx ON triage_records (triage_level);

-- 6. Cosine Similarity Vector Search RPC Function
CREATE OR REPLACE FUNCTION match_guidelines (
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.35,
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
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cg.id,
        cg.category,
        cg.guideline_text,
        cg.source_reference,
        (1 - (cg.embedding <=> query_embedding))::FLOAT AS similarity
    FROM clinical_guidelines cg
    WHERE (1 - (cg.embedding <=> query_embedding)) > match_threshold
    ORDER BY cg.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
