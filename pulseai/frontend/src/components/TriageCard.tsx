'use client';

import React from 'react';
import { TriageRecord } from '@/types/triage';
import { AlertTriangle, Clock, Stethoscope, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TriageCardProps {
  record: TriageRecord;
  onClick: () => void;
}

export default function TriageCard({ record, onClick }: TriageCardProps) {
  const isEmergency = record.triage_level === 'EMERGENCY';
  const isUrgent = record.triage_level === 'URGENT';

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-lg hover:translate-y-[-2px] ${
        isEmergency
          ? 'glass-card-emergency hover:border-rose-500/60 shadow-rose-950/20'
          : isUrgent
          ? 'glass-card-urgent hover:border-amber-500/50 shadow-amber-950/20'
          : 'glass-card-routine hover:border-emerald-500/50 shadow-emerald-950/10'
      }`}
    >
      {/* Top Patient Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-100 group-hover:text-rose-300 transition text-base">
              {record.patient_name}
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400">
              {record.age}y • {record.gender}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            {record.raw_symptoms}
          </p>
        </div>

        {/* Severity Badge Indicator */}
        <div className="flex items-center">
          {isEmergency && (
            <span className="relative flex h-3 w-3 mr-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
            </span>
          )}
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isEmergency
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : isUrgent
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {record.triage_level}
          </span>
        </div>
      </div>

      {/* Clinical Summary */}
      <div className="my-3 rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
          {record.clinical_summary}
        </p>
      </div>

      {/* Red Flags List (If any) */}
      {record.key_red_flags && record.key_red_flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {record.key_red_flags.slice(0, 2).map((flag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center space-x-1 rounded-lg bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 text-[11px] font-medium text-rose-300"
            >
              <AlertTriangle className="h-3 w-3 text-rose-400 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{flag}</span>
            </span>
          ))}
          {record.key_red_flags.length > 2 && (
            <span className="rounded-lg bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-400">
              +{record.key_red_flags.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Footer Specialist & Slot */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
          <Stethoscope className="h-3.5 w-3.5 text-indigo-400" />
          <span className="truncate max-w-[150px]">{record.recommended_specialist}</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-slate-400">
            <Clock className="h-3 w-3 text-slate-500" />
            <span className="text-[11px]">{record.suggested_time_slot.split('(')[0]}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition" />
        </div>
      </div>
    </div>
  );
}
