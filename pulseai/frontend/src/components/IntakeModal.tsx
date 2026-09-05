'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, AlertCircle, Sparkles, Loader2, HeartPulse, User } from 'lucide-react';
import { IntakeFormData, TriageRecord } from '@/types/triage';
import { submitIntakeForm } from '@/lib/api';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRecord: TriageRecord) => void;
}

export default function IntakeModal({ isOpen, onClose, onSuccess }: IntakeModalProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    patient_name: '',
    age: 35,
    gender: 'Male',
    symptoms: '',
    file: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith('.pdf')) {
        setFormData((prev) => ({ ...prev, file: droppedFile }));
        setErrorMessage(null);
      } else {
        setErrorMessage('Only PDF diagnostic and lab report files are supported.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setFormData((prev) => ({ ...prev, file: selectedFile }));
        setErrorMessage(null);
      } else {
        setErrorMessage('Only PDF diagnostic and lab report files are supported.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_name.trim()) {
      setErrorMessage('Please provide patient name.');
      return;
    }
    if (!formData.symptoms.trim() && !formData.file) {
      setErrorMessage('Please enter symptoms/vitals or upload a diagnostic PDF report.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      setPipelineStep('Ingesting PDF stream & extracting clinical text...');
      setTimeout(() => setPipelineStep('Generating 768-dim embedding & searching pgvector...'), 400);
      setTimeout(() => setPipelineStep('Synthesizing Gemini 1.5 Flash structured triage assessment...'), 900);

      const newRecord = await submitIntakeForm(formData);
      onSuccess(newRecord);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during triage processing.');
    } finally {
      setIsLoading(false);
      setPipelineStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0f172a] border border-slate-700/80 shadow-2xl p-6 sm:p-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">New Patient Intake & Triage</h2>
              <p className="text-xs text-slate-400">Upload lab PDF or input raw symptoms for instant RAG vector triage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 flex items-center space-x-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-sm text-rose-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Intake Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Patient Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Age (Years) *
              </label>
              <input
                type="number"
                min="0"
                max="130"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`rounded-xl py-2 text-sm font-medium transition border ${
                    formData.gender === g
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop PDF Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Diagnostic Lab Report / ECG (PDF Stream)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition cursor-pointer ${
                isDragging
                  ? 'border-rose-500 bg-rose-950/20'
                  : formData.file
                  ? 'border-emerald-500/60 bg-emerald-950/10'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {formData.file ? (
                <div className="flex items-center space-x-3 text-emerald-400">
                  <FileText className="h-7 w-7" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">{formData.file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(formData.file.size / (1024 * 1024)).toFixed(2)} MB • Ready for in-memory stream extraction
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-300">
                    Drag and drop lab PDF here, or <span className="text-rose-400 hover:underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Accepts CBC, ECG, Troponin, Metabolic panel, or imaging reports (PDF max 25MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Symptoms & Vitals Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Reported Symptoms, Chief Complaint & Vitals
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 54yo reporting severe substernal crushing chest pain radiating to left jaw for 45 mins. Diaphoretic, SpO2: 94%, BP: 140/90, Pulse: 110 bpm."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-3.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Submission Footer with Live Pipeline Telemetry */}
          <div className="pt-2">
            {isLoading ? (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-center space-y-2">
                <div className="flex items-center justify-center space-x-2 text-rose-400 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{pipelineStep}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/40 hover:from-rose-500 hover:to-rose-400 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Execute RAG Triage</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
