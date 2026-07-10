export interface RawCSVData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface CRMLead {
  id: string; // Internal frontend usage
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string; // 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE'
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
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
  partialError?: string;
}
