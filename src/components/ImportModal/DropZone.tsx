'use client';

import React from 'react';
import { Upload, Info, FileText, Sparkles, FileSpreadsheet, AlertTriangle } from 'lucide-react';

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
        onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowseClick}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all ${
          isDragging 
            ? 'border-accent-lime bg-accent-lime/10' 
            : 'border-border-color bg-surface hover:bg-background hover:border-accent-lime/50'
        }`}
      >
        {/* Icon */}
        <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
          isDragging ? 'bg-accent-lime/20 text-accent-lime' : 'bg-background text-text-muted shadow-sm shadow-black/10'
        }`}>
          <FileSpreadsheet className="h-8 w-8" />
        </div>

        <p className="text-sm font-bold text-foreground mb-1">
          Drag and drop your CSV file here
        </p>
        <p className="text-xs text-text-muted mb-6">
          or click to browse from your computer
        </p>

        {/* Pill constraint */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted bg-background px-4 py-2 rounded-lg shadow-sm border border-border-color">
          <Info className="h-3 w-3 text-text-muted" />
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
