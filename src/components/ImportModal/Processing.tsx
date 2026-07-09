'use client';

import React from 'react';
import { Sparkles, Check, RefreshCw } from 'lucide-react';

interface ProcessingProps {
  processingStage: number;
}

export default function Processing({ processingStage }: ProcessingProps) {
  const steps = [
    'Matching source columns with GrowEasy layout',
    'Normalizing phone numbers and country codes',
    'Running email format filters and row checks',
    'Constructing new CRM records'
  ];

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
      </div>

      <h4 className="font-bold text-slate-800 text-base mb-1">Mapping leads via AI Agent</h4>
      <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed mb-6">
        GrowEasy is reading header layouts, scoring field synonyms, and running validation routines.
      </p>

      {/* Processing Status Checklist */}
      <div className="w-full max-w-sm bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-3 text-left">
        {steps.map((stepText, idx) => {
          const done = processingStage > idx;
          const active = processingStage === idx;
          return (
            <div key={idx} className="flex items-center gap-2.5">
              {done ? (
                <div className="h-4.5 w-4.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Check className="h-3 w-3" />
                </div>
              ) : active ? (
                <div className="h-4.5 w-4.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                </div>
              ) : (
                <div className="h-4.5 w-4.5 rounded-full bg-white border border-slate-100 flex items-center justify-center" />
              )}
              <span className={`text-[11px] font-bold ${
                done ? 'text-slate-400 line-through' : active ? 'text-emerald-700' : 'text-slate-400'
              }`}>
                {stepText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
