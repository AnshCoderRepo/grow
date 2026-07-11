'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { X, RefreshCw } from 'lucide-react';
import { RawCSVData, CRMLead, ImportSummary } from '../../app/types';
import { autoMapFields } from '../../app/mockMapper';
import DropZone from './DropZone';
import CSVPreview from './CSVPreview';
import Processing from './Processing';
import Summary from './Summary';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (records: CRMLead[], summary: ImportSummary) => void;
}

const SAMPLE_CSV_CONTENT = `created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note
29-06-2026 10:00,Rahil Mohammad,rahil@test.com,91,9579290001,Tech Solutions,Mumbai,MH,India,R,Sale Done,Highly interested
29-06-2026 10:00,Tarvinder Pal,tarvinderpal@beauty.com,91,5613620002,Beauty Inc,Delhi,DL,India,T,Not Dialed,Follow up next week
29-06-2026 10:00,Dhruv Bisht,dhruv@bisht.org,91,9711560003,Bisht Ventures,Noida,UP,India,D,Good Lead,Ready to buy
29-06-2026 10:00,Amit Raheja,raheja@gmail.com,91,9990110004,Raheja Corp,Gurugram,HR,India,A,Good Lead,Needs customization
29-06-2026 10:00,Amit Shetty,shetty@yahoo.com,91,8040710005,Shetty Logistics,Bangalore,KA,India,A,Not Dialed,No answer
29-06-2026 10:00,Amit Singh,singh@outlook.com,91,7838090006,Singh Industries,Punjab,PB,India,S,Not Dialed,Call in evening
29-06-2026 10:00,Incomplete Lead Record,,,91,9999900007,Incomplete Ltd,,,,Not Dialed,Missing email and name
29-06-2026 10:00,Bad Email Lead,bad_email_format,91,9999900008,Bad Format Ltd,,,,Not Dialed,Invalid email address`;

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [modalStep, setModalStep] = useState<'upload' | 'preview' | 'processing' | 'summary'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [rawData, setRawData] = useState<RawCSVData | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [showMappingEditor, setShowMappingEditor] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // File drag & drop handlers
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
    setUploadError(null);
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    if (!file.name.endsWith('.csv')) {
      setUploadError('Invalid format. Please upload a valid CSV file.');
      return;
    }
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(2) + ' KB');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setUploadError(`Parsing Error: ${results.errors[0].message}`);
          return;
        }
        const headers = results.meta.fields || [];
        const data: RawCSVData = {
          headers,
          rows: results.data as Record<string, string>[]
        };
        setRawData(data);
        setMappings(autoMapFields(headers));
        setModalStep('preview');
      },
      error: (err) => {
        setUploadError(`Failed to read CSV file: ${err.message}`);
      }
    });
  };

  const loadSampleCSV = () => {
    const demoFile = new File([SAMPLE_CSV_CONTENT], 'CRM_leads_import_29th_june.csv', { type: 'text/csv' });
    setSelectedFile(demoFile);
    setFileName('CRM_leads_import_29th_june.csv');
    setFileSize('2.58 KB');
    setUploadError(null);

    Papa.parse(SAMPLE_CSV_CONTENT, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data: RawCSVData = {
          headers,
          rows: results.data as Record<string, string>[]
        };
        setRawData(data);
        setMappings(autoMapFields(headers));
        setModalStep('preview');
      }
    });
  };

  const downloadSampleTemplateFile = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'GrowEasy_Lead_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMappingChange = (crmKey: string, csvHeader: string) => {
    setMappings(prev => ({
      ...prev,
      [crmKey]: csvHeader
    }));
  };

  const confirmCSVImport = async () => {
    if (!rawData || !selectedFile) return;
    setModalStep('processing');
    setProcessingStage(0);

    const stepsCount = 4;
    for (let i = 0; i < stepsCount; i++) {
      await new Promise(res => setTimeout(res, 550));
      setProcessingStage(i + 1);
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('mappings', JSON.stringify(mappings));

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import CSV');
      }

      const result: ImportSummary = await response.json();
      setImportSummary(result);
      onImportComplete(result.records, result);
      setModalStep('summary');
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during backend import');
      setModalStep('preview');
    }
  };

  const handleClose = () => {
    // Reset states
    setModalStep('upload');
    setFileName('');
    setFileSize('');
    setRawData(null);
    setMappings({});
    setImportSummary(null);
    setUploadError(null);
    setShowMappingEditor(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-8 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">Import Leads via CSV</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Upload a CSV file to bulk import leads into your system.
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {modalStep === 'upload' && (
            <DropZone 
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onBrowseClick={() => fileInputRef.current?.click()}
              uploadError={uploadError}
              downloadSampleTemplateFile={downloadSampleTemplateFile}
            />
          )}

          {modalStep === 'preview' && rawData && (
            <CSVPreview 
              fileName={fileName}
              fileSize={fileSize}
              rawData={rawData}
              mappings={mappings}
              onMappingChange={handleMappingChange}
              onRemoveFile={() => setModalStep('upload')}
              showMappingEditor={showMappingEditor}
              setShowMappingEditor={setShowMappingEditor}
            />
          )}

          {modalStep === 'processing' && (
            <Processing processingStage={processingStage} />
          )}

          {modalStep === 'summary' && importSummary && (
            <Summary importSummary={importSummary} />
          )}
        </div>

        {/* hidden file selector */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv"
          className="hidden" 
        />

        {/* Modal Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3.5">
          {modalStep === 'upload' && (
            <>
              <button 
                onClick={handleClose}
                className="px-6 py-2.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-[#F2994A] hover:bg-[#e0893a] text-white font-bold text-xs rounded-lg transition-all shadow-sm shadow-[#F2994A]/25 cursor-pointer"
              >
                Browse CSV File
              </button>
            </>
          )}

          {modalStep === 'preview' && (
            <>
              <button 
                onClick={() => setModalStep('upload')}
                className="px-6 py-2.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCSVImport}
                className="px-6 py-2.5 bg-[#F2994A] hover:bg-[#e0893a] text-white font-bold text-xs rounded-lg transition-all shadow-sm shadow-[#F2994A]/25 cursor-pointer"
              >
                Confirm Import
              </button>
            </>
          )}

          {modalStep === 'processing' && (
            <button 
              disabled
              className="px-6 py-2.5 bg-slate-200 text-slate-400 font-bold text-xs rounded-lg transition-all cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Processing...
            </button>
          )}

          {modalStep === 'summary' && (
            <button 
              onClick={handleClose}
              className="px-6 py-2.5 bg-[#F2994A] hover:bg-[#e0893a] text-white font-bold text-xs rounded-lg transition-all shadow-sm shadow-[#F2994A]/25 cursor-pointer"
            >
              Done (View Leads)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
