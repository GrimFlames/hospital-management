'use client';

import React, { useState } from 'react';
import { TriageRecord, TriageLevel } from '@/types/triage';
import TriageCard from './TriageCard';
import { AlertCircle, CheckCircle2, Clock, Search, Filter, ShieldAlert } from 'lucide-react';

interface TriageKanbanProps {
  records: TriageRecord[];
  onSelectRecord: (record: TriageRecord) => void;
}

export default function TriageKanban({ records, onSelectRecord }: TriageKanbanProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.patient_name.toLowerCase().includes(query) ||
      r.clinical_summary.toLowerCase().includes(query) ||
      r.recommended_specialist.toLowerCase().includes(query) ||
      (r.raw_symptoms && r.raw_symptoms.toLowerCase().includes(query))
    );
  });

  const emergencyList = filteredRecords.filter((r) => r.triage_level === 'EMERGENCY');
  const urgentList = filteredRecords.filter((r) => r.triage_level === 'URGENT');
  const routineList = filteredRecords.filter((r) => r.triage_level === 'ROUTINE');

  const columns: {
    level: TriageLevel;
    title: string;
    description: string;
    items: TriageRecord[];
    borderColor: string;
    badgeColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      level: 'EMERGENCY',
      title: 'Emergency Resuscitation',
      description: 'Immediate clinical intervention (< 15 mins)',
      items: emergencyList,
      borderColor: 'border-rose-500/40',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
    },
    {
      level: 'URGENT',
      title: 'Urgent Care Queue',
      description: 'Time-critical workup within 2 hours',
      items: urgentList,
      borderColor: 'border-amber-500/40',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Clock className="h-4 w-4 text-amber-400" />,
    },
    {
      level: 'ROUTINE',
      title: 'Routine Outpatient',
      description: 'Standard outpatient scheduling',
      items: routineList,
      borderColor: 'border-emerald-500/40',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search triaged patients, specialists, biomarkers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-900/80 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <span>Active Patient Queue: <strong className="text-white">{filteredRecords.length} total</strong></span>
        </div>
      </div>

      {/* 3-Lane Kanban Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.level}
            className={`flex flex-col rounded-2xl bg-slate-950/60 border ${col.borderColor} p-4 sm:p-5 min-h-[550px] shadow-xl`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  {col.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{col.title}</h3>
                  <p className="text-[11px] text-slate-400">{col.description}</p>
                </div>
              </div>
              
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${col.badgeColor}`}>
                {col.items.length}
              </span>
            </div>

            {/* Cards Stack */}
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              {col.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 p-8 text-center my-auto">
                  <div className="rounded-full bg-slate-900/80 p-3 mb-3 text-slate-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">No {col.level.toLowerCase()} cases</p>
                  <p className="text-[11px] text-slate-600 mt-1">Queue is currently clear</p>
                </div>
              ) : (
                col.items.map((record) => (
                  <TriageCard
                    key={record.id}
                    record={record}
                    onClick={() => onSelectRecord(record)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
