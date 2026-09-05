export type TriageLevel = 'EMERGENCY' | 'URGENT' | 'ROUTINE';
export type RecordStatus = 'PENDING' | 'CONFIRMED' | 'RESOLVED';

export interface GuidelineCitation {
  category: string;
  excerpt: string;
  source_reference?: string;
  similarity_score: number;
}

export interface TriageRecord {
  id: string;
  patient_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  raw_symptoms: string;
  extracted_pdf_text?: string | null;
  triage_level: TriageLevel;
  clinical_summary: string;
  key_red_flags: string[];
  recommended_specialist: string;
  suggested_time_slot: string;
  rationale: string;
  guideline_citations: GuidelineCitation[];
  status: RecordStatus;
  created_at: string;
}

export interface IntakeFormData {
  patient_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  symptoms: string;
  file?: File | null;
}
