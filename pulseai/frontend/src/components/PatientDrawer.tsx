'use client';

import React, { useState } from 'react';
import { TriageRecord } from '@/types/triage';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Clock, 
  Stethoscope, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Trash2,
  ExternalLink,
  Activity
} from 'lucide-react';
import { confirmAppointment, deleteRecord } from '@/lib/api';

interface PatientDrawerProps {
  record: TriageRecord | null;
  onClose: () => void;
  onUpdate: (updatedRecord: TriageRecord) => void;
  onDelete: (deletedId: string) => void;
}

export default function PatientDrawer({ record, onClose, onUpdate, onDelete }: PatientDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!record) return null;

  const isEmergency = record.triage_level === 'EMERGENCY';
  const isUrgent = record.triage_level === 'URGENT';

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      const updated = await confirmAppointment(record.id, 'CONFIRMED');
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete triage record for ${record.patient_name}?`)) {
      try {
        await deleteRecord(record.id);
        onDelete(record.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete record:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-[#0d1322] border-l border-slate-800 p-6 sm:p-8 text-slate-100 shadow-2xl flex flex-col overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isEmergency
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : isUrgent
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                }`}
              >
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-white">{record.patient_name}</h3>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isEmergency
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : isUrgent
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    }`}
                  >
                    {record.triage_level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {record.id.slice(0, 8)}... • {record.age} years old • {record.gender} • Status: <span className="font-semibold text-slate-200">{record.status}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            
            {/* Auto-Populated Appointment Action Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-900/40 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-sm">
                    <Stethoscope className="h-4 w-4" />
                    <span>Recommended Specialist: {record.recommended_specialist}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Suggested Timeframe: <strong className="text-white">{record.suggested_time_slot}</strong></span>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={isUpdating || record.status === 'CONFIRMED'}
                  className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    record.status === 'CONFIRMED'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/40'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{record.status === 'CONFIRMED' ? 'Slot Confirmed' : 'Confirm Appointment Slot'}</span>
                </button>
              </div>
            </div>

            {/* AI Clinical Summary & Red Flags */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-4 w-4 text-rose-400" />
                <span>AI Clinical Synthesis & Triage Rationale</span>
              </div>
              
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {record.clinical_summary}
                </p>
                <div className="border-t border-slate-800/80 pt-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Clinical Reasoning: </strong>
                    {record.rationale}
                  </p>
                </div>
              </div>
            </div>

            {/* Red Flags Alert Box */}
            {record.key_red_flags && record.key_red_flags.length > 0 && (
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                  Identified Red Flags & Critical Biomarkers ({record.key_red_flags.length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {record.key_red_flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 px-3.5 py-2.5 text-xs text-rose-200"
                    >
                      <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RAG Vector Knowledge Base Citations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <span>Grounding Medical Guidelines (pgvector RAG Citations)</span>
                </span>
                <span className="text-[11px] text-slate-500">Cosine Similarity Grounding</span>
              </div>

              <div className="space-y-3">
                {record.guideline_citations && record.guideline_citations.length > 0 ? (
                  record.guideline_citations.map((cite, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-indigo-300">{cite.category}</span>
                        <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-bold text-indigo-300">
                          {Math.round(cite.similarity_score * 100)}% Vector Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{cite.excerpt}"
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2">
                        <span>Source: {cite.source_reference || 'WHO / NHS Clinical Triage Protocol'}</span>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No external guideline citations attached to this record.</p>
                )}
              </div>
            </div>

            {/* Raw Symptoms & Extracted Lab Report */}
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 space-y-3">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reported Intake Symptoms
                </span>
                <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {record.raw_symptoms}
                </p>
              </div>

              {record.extracted_pdf_text && (
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Extracted Lab PDF Text Stream
                  </span>
                  <div className="max-h-32 overflow-y-auto rounded-lg bg-slate-950/80 p-2.5 text-[11px] text-slate-400 font-mono border border-slate-800 leading-relaxed">
                    {record.extracted_pdf_text}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="border-t border-slate-800 pt-4 mt-6 flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Record</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-medium text-white transition"
            >
              Close Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
