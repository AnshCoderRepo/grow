import { RawCSVData, CRMLead, ImportSummary } from './types';

// Helper to normalize strings for comparison
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

// Intelligent fuzzy mapping rules (simulating the AI mapping heuristic)
const mappingRules: Record<string, string[]> = {
  created_at: ['createdat', 'createdtime', 'saledate', 'datecreated', 'date', 'time', 'timestamp'],
  name: ['name', 'fullname', 'fname', 'firstname', 'lname', 'lastname', 'leadname', 'customer', 'contactname', 'client', 'clientname'],
  email: ['email', 'emailaddress', 'mail', 'emailid', 'e-mail'],
  country_code: ['countrycode', 'cc', 'phonecode', 'dialcode'],
  mobile_without_country_code: ['phone', 'phonenumber', 'tel', 'telephone', 'mobile', 'cell', 'contactnumber', 'contactno', 'ph', 'mobilewithoutcountrycode', 'contact', 'number'],
  company: ['company', 'companyname', 'organization', 'org', 'business', 'employer', 'firm'],
  city: ['city', 'location', 'town'],
  state: ['state', 'province', 'region'],
  country: ['country', 'nation'],
  lead_owner: ['leadowner', 'owner', 'representative', 'rep', 'assignedto', 'agent'],
  crm_status: ['crmstatus', 'status', 'leadstatus', 'stage'],
  crm_note: ['notes', 'note', 'comment', 'comments', 'message', 'description', 'feedback', 'details', 'remarks', 'crmnote'],
  data_source: ['datasource', 'source', 'leadsource', 'traffic', 'medium', 'channel'],
  possession_time: ['possession', 'possessiontime', 'timeline'],
  description: ['description', 'desc', 'about', 'info']
};

export function autoMapFields(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};

  Object.entries(mappingRules).forEach(([crmField, synonyms]) => {
    let bestMatch = '';
    let highestScore = 0;

    headers.forEach((header) => {
      const normalizedHeader = normalize(header);
      
      // Exact match
      if (synonyms.includes(normalizedHeader)) {
        bestMatch = header;
        highestScore = 3;
      } 
      // Substring match
      else if (highestScore < 2 && synonyms.some(syn => normalizedHeader.includes(syn) || syn.includes(normalizedHeader))) {
        bestMatch = header;
        highestScore = 2;
      }
    });

    if (bestMatch) {
      mappings[crmField] = bestMatch;
    }
  });

  return mappings;
}

export function simulateAIMapping(data: RawCSVData, customMappings?: Record<string, string>): Promise<ImportSummary> {
  return new Promise((resolve) => {
    // Simulate a slight delay for the "AI Analysis" processing feel (1.5 seconds)
    setTimeout(() => {
      const mappings = customMappings || autoMapFields(data.headers);
      const records: CRMLead[] = [];
      const skippedRecords: ImportSummary['skippedRecords'] = [];

      // Determine source from headers or fallback
      let source = 'CSV Import';
      const headerStr = data.headers.join(' ').toLowerCase();
      if (headerStr.includes('facebook') || headerStr.includes('fb')) {
        source = 'Facebook Leads';
      } else if (headerStr.includes('google') || headerStr.includes('gclid') || headerStr.includes('ad')) {
        source = 'Google Ads';
      } else if (headerStr.includes('realestate') || headerStr.includes('property') || headerStr.includes('mls')) {
        source = 'Real Estate CRM';
      }

      data.rows.forEach((row, index) => {
        // Retrieve values based on mapping
        const nameVal = mappings['name'] ? row[mappings['name']] : '';
        const emailVal = mappings['email'] ? row[mappings['email']] : '';
        const phoneVal = mappings['mobile_without_country_code'] ? row[mappings['mobile_without_country_code']] : '';
        const countryCodeVal = mappings['country_code'] ? row[mappings['country_code']] : '';
        const companyVal = mappings['company'] ? row[mappings['company']] : '';
        const cityVal = mappings['city'] ? row[mappings['city']] : '';
        const stateVal = mappings['state'] ? row[mappings['state']] : '';
        const countryVal = mappings['country'] ? row[mappings['country']] : '';
        const ownerVal = mappings['lead_owner'] ? row[mappings['lead_owner']] : '';
        const statusVal = mappings['crm_status'] ? row[mappings['crm_status']] : '';
        const notesVal = mappings['crm_note'] ? row[mappings['crm_note']] : '';
        const sourceVal = mappings['data_source'] ? row[mappings['data_source']] : '';
        const possessionVal = mappings['possession_time'] ? row[mappings['possession_time']] : '';
        const descVal = mappings['description'] ? row[mappings['description']] : '';
        const dateVal = mappings['created_at'] ? row[mappings['created_at']] : '';

        // Validation logic: Skip rows that have neither Email nor Phone
        if (!emailVal && !phoneVal) {
          skippedRecords.push({
            rowIndex: index + 1,
            reason: 'Row lacks both Email and Phone.',
            rowData: row
          });
          return;
        }

        // Email validation: if email is present, check basic format
        if (emailVal && !emailVal.includes('@')) {
          skippedRecords.push({
            rowIndex: index + 1,
            reason: `Invalid email format: "${emailVal}"`,
            rowData: row
          });
          return;
        }

        // Parse status to match strictly: 'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'
        let resolvedStatus = 'DID_NOT_CONNECT';
        const normStatus = statusVal.toLowerCase();
        if (normStatus.includes('done') || normStatus.includes('sale') || normStatus.includes('won')) {
          resolvedStatus = 'SALE_DONE';
        } else if (normStatus.includes('bad') || normStatus.includes('unqualified') || normStatus.includes('junk')) {
          resolvedStatus = 'BAD_LEAD';
        } else if (normStatus.includes('good') || normStatus.includes('qualified') || normStatus.includes('hot')) {
          resolvedStatus = 'GOOD_LEAD_FOLLOW_UP';
        }

        // Date Created formatting
        let formattedDate = new Date().toISOString();
        if (dateVal) {
          formattedDate = dateVal;
        }

        // Validate sourceVal to allowed data sources
        const allowedSources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
        let resolvedSource = '';
        if (sourceVal) {
          const matchedSource = allowedSources.find(src => src.toLowerCase().replace(/_/g, '') === sourceVal.toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (matchedSource) {
            resolvedSource = matchedSource;
          }
        }
        if (!resolvedSource) {
          // Fallback guess from CSV contents
          const matchedSource = allowedSources.find(src => headerStr.replace(/_/g, '').includes(src.replace(/_/g, '')) || source.toLowerCase().replace(/ /g, '').includes(src.replace(/_/g, '')));
          if (matchedSource) resolvedSource = matchedSource;
        }

        // Create CRM record
        records.push({
          id: `lead_${Math.random().toString(36).substr(2, 9)}`,
          created_at: formattedDate,
          name: nameVal || 'Unnamed Lead',
          email: emailVal || '',
          country_code: countryCodeVal || '',
          mobile_without_country_code: phoneVal || '',
          company: companyVal || '',
          city: cityVal || '',
          state: stateVal || '',
          country: countryVal || '',
          lead_owner: ownerVal ? ownerVal.trim() : ['test@gmail.com', 'owner@groweasy.com'][Math.floor(Math.random() * 2)],
          crm_status: resolvedStatus,
          crm_note: notesVal || '',
          data_source: resolvedSource,
          possession_time: possessionVal || '',
          description: descVal || ''
        });
      });

      resolve({
        totalRows: data.rows.length,
        importedCount: records.length,
        skippedCount: skippedRecords.length,
        records,
        skippedRecords,
        fieldMappings: mappings
      });
    }, 2000);
  });
}
