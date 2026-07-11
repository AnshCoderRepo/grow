'use client';

import React from 'react';
import { Upload, Info, FileText, Sparkles } from 'lucide-react';

interface DropZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowseClick: () => void;
  uploadError: string | null;
  downloadSampleTemplateFile: () => void;
}

export default function DropZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
  uploadError,
  downloadSampleTemplateFile
}: DropZoneProps) {
  return (
    <div className="space-y-6">
      {/* Dropzone Container */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowseClick}
        className={`relative cursor-pointer overflow-hidden rounded-xl border border-dashed p-8 text-center transition-all flex flex-col items-center justify-center group ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-50/5' 
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
      >
        {/* Icon */}
        <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-105 transition-transform">
          <Upload className="h-5 w-5" />
        </div>

        <h4 className="font-bold text-sm text-slate-800 mb-1">Drop your CSV file here</h4>
        <p className="text-xs font-semibold text-slate-400 mb-4">or click to browse files</p>

        {/* Pill constraint */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
          <Info className="h-3 w-3 text-slate-400" />
          Supported file: .csv (max 5MB)
        </div>
      </div>

      {/* Headers Hint Box */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
        <p className="text-[10px] font-medium text-slate-400 leading-normal max-w-lg mx-auto">
          Required headers: <span className="font-mono text-slate-600">created_at</span>, <span className="font-mono text-slate-600">name</span>, <span className="font-mono text-slate-600">email</span>, <span className="font-mono text-slate-600">country_code</span>, <span className="font-mono text-slate-600">mobile_without_country_code</span>, <span className="font-mono text-slate-600">company</span>, <span className="font-mono text-slate-600">city</span>, <span className="font-mono text-slate-600">state</span>, <span className="font-mono text-slate-600">country</span>, <span className="font-mono text-slate-600">lead_owner</span>, <span className="font-mono text-slate-600">crm_status</span>, <span className="font-mono text-slate-600">crm_note</span>. Template includes default + custom CRM fields to reduce upload errors.
        </p>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          {uploadError}
        </div>
      )}

      {/* Sample Template Buttons */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={(e) => { e.stopPropagation(); downloadSampleTemplateFile(); }}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer bg-white"
        >
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          Download Sample CSV Template
        </button>
      </div>
    </div>
  );
}
// Helper to import AlertTriangle to prevent syntax errors
import { AlertTriangle } from 'lucide-react';
