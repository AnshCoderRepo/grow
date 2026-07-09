import { RawCSVData, CRMLead, ImportSummary } from './types';

// Helper to normalize strings for comparison
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

// Intelligent fuzzy mapping rules (simulating the AI mapping heuristic)
const mappingRules: Record<string, string[]> = {
  name: ['name', 'fullname', 'fname', 'firstname', 'lname', 'lastname', 'leadname', 'customer', 'contactname', 'client', 'clientname'],
  email: ['email', 'emailaddress', 'mail', 'emailid', 'e-mail'],
  phone: ['phone', 'phonenumber', 'tel', 'telephone', 'mobile', 'cell', 'contactnumber', 'contactno', 'ph', 'mobilewithoutcountrycode', 'contact'],
  countryCode: ['countrycode', 'cc', 'phonecode', 'dialcode'],
  company: ['company', 'companyname', 'organization', 'org', 'business', 'employer', 'firm'],
  jobTitle: ['jobtitle', 'job', 'role', 'title', 'position', 'designation'],
  estimatedValue: ['value', 'dealvalue', 'revenue', 'estimatedvalue', 'budget', 'worth', 'amount', 'price', 'estimatedbudget'],
  notes: ['notes', 'note', 'comment', 'comments', 'message', 'description', 'feedback', 'details', 'remarks', 'crmnote'],
  dateCreated: ['createdat', 'createdtime', 'saledate', 'datecreated', 'date'],
  status: ['crmstatus', 'status', 'leadstatus'],
  leadOwner: ['leadowner', 'owner', 'representative', 'rep']
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
        const phoneVal = mappings['phone'] ? row[mappings['phone']] : '';
        const countryCodeVal = mappings['countryCode'] ? row[mappings['countryCode']] : '';
        const companyVal = mappings['company'] ? row[mappings['company']] : '';
        const jobTitleVal = mappings['jobTitle'] ? row[mappings['jobTitle']] : '';
        const valueVal = mappings['estimatedValue'] ? row[mappings['estimatedValue']] : '';
        const notesVal = mappings['notes'] ? row[mappings['notes']] : '';
        const dateVal = mappings['dateCreated'] ? row[mappings['dateCreated']] : '';
        const statusVal = mappings['status'] ? row[mappings['status']] : '';
        const ownerVal = mappings['leadOwner'] ? row[mappings['leadOwner']] : '';

        // Validation logic: Skip rows that have neither Name, Email, nor Phone
        if (!nameVal && !emailVal && !phoneVal) {
          skippedRecords.push({
            rowIndex: index + 1,
            reason: 'Row lacks basic contact details (Name, Email, or Phone).',
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

        // Combine country code and phone
        let fullPhone = phoneVal;
        if (countryCodeVal && phoneVal) {
          const cleanCC = countryCodeVal.replace(/[^0-9]/g, '');
          const cleanPhone = phoneVal.replace(/[^0-9]/g, '');
          fullPhone = `+${cleanCC}${cleanPhone}`;
        } else if (phoneVal) {
          fullPhone = phoneVal.startsWith('+') ? phoneVal : `+1${phoneVal.replace(/[^0-9]/g, '')}`;
        }

        // Parse status to match screenshot categories: Sale Done, Not Dialed, Good Lead
        let resolvedStatus: CRMLead['status'] = 'Not Dialed';
        const normStatus = statusVal.toLowerCase();
        if (normStatus.includes('done') || normStatus.includes('sale') || normStatus.includes('won')) {
          resolvedStatus = 'Sale Done';
        } else if (normStatus.includes('good') || normStatus.includes('qualified') || normStatus.includes('hot')) {
          resolvedStatus = 'Good Lead';
        } else if (normStatus.includes('contacted') || normStatus.includes('dialed')) {
          resolvedStatus = 'Contacted';
        }

        // Date Created formatting
        let formattedDate = 'Jun 23, 2026, 2:37 PM';
        if (dateVal) {
          formattedDate = dateVal;
        }

        // Create CRM record
        records.push({
          id: `lead_${Math.random().toString(36).substr(2, 9)}`,
          name: nameVal || 'Unnamed Lead',
          email: emailVal || 'N/A',
          phone: fullPhone || '—',
          company: companyVal || '—',
          jobTitle: jobTitleVal || '—',
          source: source,
          status: resolvedStatus,
          quality: resolvedStatus === 'Good Lead' ? 'High' : '—',
          leadOwner: ownerVal ? ownerVal.trim().charAt(0).toUpperCase() : ['P', 'A', 'K', 'M'][Math.floor(Math.random() * 4)],
          dateCreated: formattedDate,
          estimatedValue: valueVal ? `$${parseFloat(valueVal.replace(/[^0-9.]/g, '') || '0').toLocaleString()}` : undefined,
          notes: notesVal || undefined
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
