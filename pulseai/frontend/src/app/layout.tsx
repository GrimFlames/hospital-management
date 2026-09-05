import './globals.css';
import type { Metadata } from 'next';
import { Activity, ShieldAlert, Sparkles, Stethoscope, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PulseAI — Clinical Triage & Patient Intelligence Copilot',
  description: 'Production-grade AI triage engine leveraging RAG vector search and structured Gemini LLM function calling.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
        {/* Top Clinical Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0c1222]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-lg shadow-rose-950/40">
                <Activity className="h-5 w-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-tight text-white">Pulse<span className="text-rose-500">AI</span></span>
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">v1.0 Copilot</span>
                </div>
                <p className="text-xs text-slate-400">Clinical Emergency Triage & RAG Intelligence</p>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="hidden sm:flex items-center space-x-2 rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-slate-300">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                <span>Supabase pgvector (768-dim)</span>
              </div>
              <div className="flex items-center space-x-2 rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Gemini 1.5 Flash</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
