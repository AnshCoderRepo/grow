'use client';

import React from 'react';
import { FileText, X, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { RawCSVData } from '../../app/types';

interface CSVPreviewProps {
  fileName: string;
  fileSize: string;
  rawData: RawCSVData;
  mappings: Record<string, string>;
  onMappingChange: (crmKey: string, csvHeader: string) => void;
  onRemoveFile: () => void;
  showMappingEditor: boolean;
  setShowMappingEditor: (show: boolean) => void;
}

export default function CSVPreview({
  fileName,
  fileSize,
  rawData,
  mappings,
  onMappingChange,
  onRemoveFile,
  showMappingEditor,
  setShowMappingEditor
}: CSVPreviewProps) {
  const crmFields = [
    { key: 'created_at', label: 'created_at (Lead Date)', required: false },
    { key: 'name', label: 'name (Lead Name)', required: false },
    { key: 'email', label: 'email (Email)', required: false },
    { key: 'country_code', label: 'country_code (Country Code)', required: false },
    { key: 'mobile_without_country_code', label: 'mobile_without_country_code (Mobile)', required: false },
    { key: 'company', label: 'company (Company)', required: false },
    { key: 'city', label: 'city (City)', required: false },
    { key: 'state', label: 'state (State)', required: false },
    { key: 'country', label: 'country (Country)', required: false },
    { key: 'lead_owner', label: 'lead_owner (Owner)', required: false },
    { key: 'crm_status', label: 'crm_status (Status)', required: false },
    { key: 'crm_note', label: 'crm_note (Notes/Remarks)', required: false },
    { key: 'data_source', label: 'data_source (Source)', required: false },
    { key: 'possession_time', label: 'possession_time (Possession)', required: false },
    { key: 'description', label: 'description (Description)', required: false }
  ];

  return (
    <div className="space-y-6">
      {/* File Badge */}
      <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-[#E8F5F2] flex items-center justify-center text-emerald-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block truncate max-w-sm">{fileName}</span>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{fileSize}</span>
          </div>
        </div>
        <button 
          onClick={onRemoveFile}
          className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* AI Mapping Panel Toggle */}
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowMappingEditor(!showMappingEditor)}
          className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors border-b border-slate-100"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
            AI Auto-Mapping Mapping Results (Click to expand/edit)
          </span>
          {showMappingEditor ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showMappingEditor && (
          <div className="p-4 grid grid-cols-2 gap-3 bg-white">
            {crmFields.map(f => {
              const matched = mappings[f.key] || '';
              return (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={matched}
                    onChange={(e) => onMappingChange(f.key, e.target.value)}
                    className="border border-slate-200 rounded-lg p-2 text-xs font-semibold bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Ignored / Empty --</option>
                    {rawData.headers.map(hdr => (
                      <option key={hdr} value={hdr}>{hdr}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Raw Data Preview Table */}
      <div className="border border-slate-100 rounded-xl overflow-hidden bg-[#FAFBFD] shadow-inner max-h-72 overflow-y-auto">
        <table className="w-full text-left border-collapse text-[11px] font-medium text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10">
            <tr>
              {rawData.headers.map(header => (
                <th key={header} className="py-2.5 px-4 font-bold text-slate-400 bg-slate-50">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rawData.rows.slice(0, 8).map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                {rawData.headers.map(header => (
                  <td key={header} className="py-2 px-4 truncate max-w-[150px]" title={row[header]}>
                    {row[header] || <span className="text-slate-300 italic">empty</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
