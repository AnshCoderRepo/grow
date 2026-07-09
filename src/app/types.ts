export interface RawCSVData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface CRMLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle?: string;
  source?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Sale Done' | 'Not Dialed' | 'Good Lead';
  quality: string;
  leadOwner: string;
  dateCreated: string;
  estimatedValue?: string;
  notes?: string;
}

export interface ImportSummary {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  records: CRMLead[];
  skippedRecords: Array<{
    rowIndex: number;
    reason: string;
    rowData: Record<string, string>;
  }>;
  fieldMappings: Record<string, string>; // Maps CRM fields to CSV headers
}
