'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { ImportSummary } from '../../app/types';

interface SummaryProps {
  importSummary: ImportSummary;
}

export default function Summary({ importSummary }: SummaryProps) {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="text-center py-4">
        <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3 shadow-md shadow-emerald-500/5">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h4 className="font-extrabold text-slate-800 text-lg">Leads Extracted Successfully!</h4>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Your CSV data has been converted to the standard CRM layout using AI heuristics.
        </p>
      </div>

      {importSummary.partialError && (
        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-800">Import Incomplete</h4>
            <p className="text-xs text-amber-700 mt-1">
              The import was halted early due to an unexpected issue: <span className="font-mono bg-amber-100 px-1 rounded">{importSummary.partialError}</span>.
              However, we saved the leads that were successfully processed up to that point.
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Scanned</span>
          <span className="text-xl font-black text-slate-800 block mt-1">{importSummary.totalRows}</span>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-100/60 rounded-xl text-center text-emerald-700">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Imported CRM Leads</span>
          <span className="text-xl font-black text-emerald-600 block mt-1">{importSummary.importedCount}</span>
        </div>
        <div className="p-4 bg-red-50 border border-red-100/60 rounded-xl text-center text-red-700">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Skipped Records</span>
          <span className="text-xl font-black text-red-500 block mt-1">{importSummary.skippedCount}</span>
        </div>
      </div>

      {/* Toggle list report */}
      {importSummary.skippedCount > 0 && (
        <div className="border border-red-100 bg-red-50/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
            <span className="text-xs font-bold text-red-700">Skipped Records Report</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-2.5">
            {importSummary.skippedRecords.map((skip, idx) => (
              <div key={idx} className="bg-white border border-red-100/50 p-2.5 rounded-lg flex items-start gap-2.5 text-[10px]">
                <span className="font-mono bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded leading-none">
                  Row {skip.rowIndex}
                </span>
                <div>
                  <p className="font-bold text-slate-700">{skip.reason}</p>
                  <p className="text-slate-400 font-mono mt-0.5 max-w-[400px] truncate">{JSON.stringify(skip.rowData)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
