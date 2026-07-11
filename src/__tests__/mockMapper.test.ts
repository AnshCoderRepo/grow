import { describe, it, expect } from 'vitest';
import { autoMapFields, simulateAIMapping } from '../app/mockMapper';
import { smartMapFields, runExtractionEngine } from '../lib/extractionEngine';
import { RawCSVData } from '../app/types';

// ---------------------------------------------------------------------------
// Existing tests — run through the extraction engine via the mockMapper shim
// ---------------------------------------------------------------------------

describe('Heuristic CSV Auto-Mapper', () => {
  it('correctly maps CRM fields based on synonym lists', () => {
    const headers = ['Full Name', 'E-mail ID', 'Mobile Number', 'Company Name', 'Created Date'];
    const mappings = autoMapFields(headers);

    expect(mappings['name']).toBe('Full Name');
    expect(mappings['email']).toBe('E-mail ID');
    expect(mappings['mobile_without_country_code']).toBe('Mobile Number');
    expect(mappings['company']).toBe('Company Name');
    expect(mappings['created_at']).toBe('Created Date');
  });

  it('skips rows lacking both email and phone contact details', async () => {
    const rawData: RawCSVData = {
      headers: ['name', 'email', 'phone'],
      rows: [
        { name: 'John Doe', email: 'john@example.com', phone: '9876543210' }, // Valid
        { name: 'Missing Contacts', email: '', phone: '' },                   // Skipped
        { name: 'Only Email', email: 'email@example.com', phone: '' },        // Valid
        { name: 'Only Phone', email: '', phone: '1234567890' }                // Valid
      ]
    };

    const summary = await simulateAIMapping(rawData);
    expect(summary.importedCount).toBe(3);
    expect(summary.skippedCount).toBe(1);
    expect(summary.skippedRecords[0].reason).toContain('Row lacks both Email and Phone');
  });

  it('correctly resolves and normalizes lead statuses', async () => {
    const rawData: RawCSVData = {
      headers: ['name', 'email', 'phone', 'status'],
      rows: [
        { name: 'Lead 1', email: 'l1@test.com', phone: '11', status: 'won deal' },     // SALE_DONE
        { name: 'Lead 2', email: 'l2@test.com', phone: '22', status: 'hot lead' },     // GOOD_LEAD_FOLLOW_UP
        { name: 'Lead 3', email: 'l3@test.com', phone: '33', status: 'unqualified' }, // BAD_LEAD
        { name: 'Lead 4', email: 'l4@test.com', phone: '44', status: 'not connected' } // DID_NOT_CONNECT
      ]
    };

    const summary = await simulateAIMapping(rawData);
    const leads = summary.records;

    expect(leads[0].crm_status).toBe('SALE_DONE');
    expect(leads[1].crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(leads[2].crm_status).toBe('BAD_LEAD');
    expect(leads[3].crm_status).toBe('DID_NOT_CONNECT');
  });
});

// ---------------------------------------------------------------------------
// Extraction Engine — core capabilities
// ---------------------------------------------------------------------------

describe('GrowEasy Extraction Engine — Value Pattern Detection', () => {
  it('detects email column from cell values even with ambiguous header', () => {
    const headers = ['Info1', 'Info2', 'Info3'];
    const sampleRows = [
      { Info1: 'Rahil', Info2: 'rahil@test.com', Info3: '9876500001' },
      { Info1: 'Amit',  Info2: 'amit@company.org', Info3: '9876500002' },
      { Info1: 'Priya', Info2: 'priya@xyz.in',     Info3: '9876500003' },
    ];
    const mappings = smartMapFields(headers, sampleRows);
    expect(mappings['email']).toBe('Info2');
    expect(mappings['mobile_without_country_code']).toBe('Info3');
  });

  it('auto-splits combined +CC-phone into country_code and mobile fields', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone'],
      rows: [
        { name: 'Test User', email: 'test@example.com', phone: '+91-9876543210' },
        { name: 'Test User 2', email: 'test2@example.com', phone: '+1-4085551234' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].country_code).toBe('91');
    expect(result.records[0].mobile_without_country_code).toBe('9876543210');
    expect(result.records[1].country_code).toBe('1');
    expect(result.records[1].mobile_without_country_code).toBe('4085551234');
  });

  it('normalizes Indian DD-MM-YYYY date format to ISO 8601', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'date'],
      rows: [
        { name: 'User', email: 'u@test.com', phone: '9999999999', date: '29-06-2026' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].created_at).toContain('2026-06-29');
  });

  it('handles expanded status keywords: booked, callback, fraud, junk', () => {
    const rawData: RawCSVData = {
      headers: ['name', 'email', 'phone', 'status'],
      rows: [
        { name: 'A', email: 'a@t.com', phone: '1111111111', status: 'booked' },
        { name: 'B', email: 'b@t.com', phone: '2222222222', status: 'callback' },
        { name: 'C', email: 'c@t.com', phone: '3333333333', status: 'fraud' },
        { name: 'D', email: 'd@t.com', phone: '4444444444', status: 'junk' },
      ],
    };
    const result = runExtractionEngine(rawData);
    expect(result.records[0].crm_status).toBe('SALE_DONE');           // booked
    expect(result.records[1].crm_status).toBe('GOOD_LEAD_FOLLOW_UP'); // callback
    expect(result.records[2].crm_status).toBe('BAD_LEAD');            // fraud
    expect(result.records[3].crm_status).toBe('BAD_LEAD');            // junk
  });
});

// ---------------------------------------------------------------------------
// Bad Email + Valid Phone — keep record, move email to crm_note
// ---------------------------------------------------------------------------

describe('GrowEasy Extraction Engine — Bad Email + Valid Phone', () => {
  it('keeps record with valid phone even if email is malformed, moves bad email to crm_note', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone'],
      rows: [
        { name: 'Bad Email User', email: 'not-an-email', phone: '9876500001' },
      ],
    };
    const result = runExtractionEngine(data);
    // Record should be kept (has valid phone)
    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    // email field should be blank
    expect(result.records[0].email).toBe('');
    // bad email should appear in crm_note
    expect(result.records[0].crm_note).toContain('not-an-email');
  });

  it('still skips a record with bad email AND no phone', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone'],
      rows: [
        { name: 'No Contact', email: 'not-an-email', phone: '' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.skippedCount).toBe(1);
    expect(result.skippedRecords[0].reason).toContain('Invalid email format');
  });
});

// ---------------------------------------------------------------------------
// Facebook Lead Ads Export Format
// ---------------------------------------------------------------------------

describe('Facebook Lead Ads export format', () => {
  it('maps Facebook Lead Ads headers correctly', () => {
    const headers = ['full_name', 'phone_number', 'your_email_address', 'city', 'what_are_you_looking_for'];
    const mappings = autoMapFields(headers);

    expect(mappings['name']).toBe('full_name');
    expect(mappings['mobile_without_country_code']).toBe('phone_number');
    expect(mappings['email']).toBe('your_email_address');
    expect(mappings['city']).toBe('city');
    expect(mappings['crm_note']).toBe('what_are_you_looking_for');
  });

  it('extracts records from a Facebook Lead Ads style CSV', () => {
    const data: RawCSVData = {
      headers: ['full_name', 'phone_number', 'your_email_address', 'city', 'what_are_you_looking_for', 'ad_name'],
      rows: [
        {
          full_name: 'Ananya Sharma',
          phone_number: '9876543210',
          your_email_address: 'ananya@gmail.com',
          city: 'Bangalore',
          what_are_you_looking_for: 'Looking for 2BHK apartment',
          ad_name: 'eden_park',
        },
        {
          full_name: 'Vikram Nair',
          phone_number: '9876543211',
          your_email_address: 'vikram@company.com',
          city: 'Mumbai',
          what_are_you_looking_for: 'Need ready to move flat',
          ad_name: 'meridian_tower',
        },
      ],
    };

    const result = runExtractionEngine(data);
    expect(result.importedCount).toBe(2);

    const lead = result.records[0];
    expect(lead.name).toBe('Ananya Sharma');
    expect(lead.email).toBe('ananya@gmail.com');
    expect(lead.mobile_without_country_code).toBe('9876543210');
    expect(lead.city).toBe('Bangalore');
    expect(lead.crm_note).toContain('2BHK apartment');
    expect(lead.data_source).toBe('eden_park');
  });
});

// ---------------------------------------------------------------------------
// First Name + Last Name column merging
// ---------------------------------------------------------------------------

describe('First Name + Last Name merging', () => {
  it('concatenates first_name and last_name when no combined name column exists', () => {
    const data: RawCSVData = {
      headers: ['first_name', 'last_name', 'email', 'phone'],
      rows: [
        { first_name: 'Rahul', last_name: 'Verma', email: 'rahul@test.com', phone: '9876543210' },
        { first_name: 'Priya', last_name: 'Singh', email: 'priya@test.com', phone: '9876543211' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].name).toBe('Rahul Verma');
    expect(result.records[1].name).toBe('Priya Singh');
  });

  it('uses combined name column when both combined and separate columns exist', () => {
    const data: RawCSVData = {
      headers: ['name', 'first_name', 'last_name', 'email', 'phone'],
      rows: [
        {
          name: 'Full Name Col',
          first_name: 'First',
          last_name: 'Last',
          email: 'test@test.com',
          phone: '9876543210',
        },
      ],
    };
    const result = runExtractionEngine(data);
    // Combined 'name' column should win
    expect(result.records[0].name).toBe('Full Name Col');
  });

  it('handles fname + lname headers', () => {
    const data: RawCSVData = {
      headers: ['fname', 'lname', 'email'],
      rows: [
        { fname: 'Amit', lname: 'Patel', email: 'amit@patel.com' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].name).toBe('Amit Patel');
  });
});

// ---------------------------------------------------------------------------
// Multiple Emails / Phones → crm_note overflow
// ---------------------------------------------------------------------------

describe('Multiple email / phone columns → crm_note overflow', () => {
  it('puts secondary email column value into crm_note', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'email2', 'phone'],
      rows: [
        {
          name: 'Multi Email User',
          email: 'primary@test.com',
          email2: 'secondary@test.com',
          phone: '9876543210',
        },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].email).toBe('primary@test.com');
    expect(result.records[0].crm_note).toContain('secondary@test.com');
  });

  it('puts secondary phone column value into crm_note', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'alternate_phone'],
      rows: [
        {
          name: 'Multi Phone User',
          email: 'user@test.com',
          phone: '9876543210',
          alternate_phone: '8765432109',
        },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].mobile_without_country_code).toBe('9876543210');
    expect(result.records[0].crm_note).toContain('8765432109');
  });

  it('splits semicolon-separated emails in a single cell', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone'],
      rows: [
        {
          name: 'Dual Email Cell',
          email: 'first@test.com; second@test.com',
          phone: '9876543210',
        },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].email).toBe('first@test.com');
    expect(result.records[0].crm_note).toContain('second@test.com');
  });

  it('splits comma-separated phones in a single cell', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone'],
      rows: [
        {
          name: 'Dual Phone Cell',
          email: 'user@test.com',
          phone: '9876543210, 8765432109',
        },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].mobile_without_country_code).toBe('9876543210');
    expect(result.records[0].crm_note).toContain('8765432109');
  });
});

// ---------------------------------------------------------------------------
// Multiple note columns → crm_note merging
// ---------------------------------------------------------------------------

describe('Multiple note-like columns → crm_note merging', () => {
  it('merges remarks + comments into crm_note separated by |', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'remarks', 'comments'],
      rows: [
        {
          name: 'Note User',
          email: 'note@test.com',
          phone: '9876543210',
          remarks: 'Interested in 3BHK',
          comments: 'Follow up on Monday',
        },
      ],
    };
    const result = runExtractionEngine(data);
    const note = result.records[0].crm_note;
    expect(note).toContain('Interested in 3BHK');
    expect(note).toContain('Follow up on Monday');
  });
});

// ---------------------------------------------------------------------------
// Expanded Status Keywords
// ---------------------------------------------------------------------------

describe('Expanded status keyword mapping', () => {
  it('maps real-estate specific statuses correctly', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'status'],
      rows: [
        { name: 'A', email: 'a@t.com', phone: '1111111111', status: 'agreement signed' },
        { name: 'B', email: 'b@t.com', phone: '2222222222', status: 'token paid' },
        { name: 'C', email: 'c@t.com', phone: '3333333333', status: 'site visit done' },
        { name: 'D', email: 'd@t.com', phone: '4444444444', status: 'prospect' },
        { name: 'E', email: 'e@t.com', phone: '5555555555', status: 'duplicate' },
        { name: 'F', email: 'f@t.com', phone: '6666666666', status: 'wrong number' },
        { name: 'G', email: 'g@t.com', phone: '7777777777', status: 'not dialed' },
        { name: 'H', email: 'h@t.com', phone: '8888888888', status: 'not reachable' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].crm_status).toBe('SALE_DONE');            // agreement signed
    expect(result.records[1].crm_status).toBe('SALE_DONE');            // token paid
    expect(result.records[2].crm_status).toBe('GOOD_LEAD_FOLLOW_UP'); // site visit done
    expect(result.records[3].crm_status).toBe('GOOD_LEAD_FOLLOW_UP'); // prospect
    expect(result.records[4].crm_status).toBe('BAD_LEAD');            // duplicate
    expect(result.records[5].crm_status).toBe('BAD_LEAD');            // wrong number
    expect(result.records[6].crm_status).toBe('DID_NOT_CONNECT');     // not dialed
    expect(result.records[7].crm_status).toBe('DID_NOT_CONNECT');     // not reachable
  });

  it('maps "not interested" to BAD_LEAD', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'status'],
      rows: [
        { name: 'NI', email: 'ni@t.com', phone: '1234567890', status: 'not interested' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].crm_status).toBe('BAD_LEAD');
  });
});

// ---------------------------------------------------------------------------
// Google Ads Lead Form Export
// ---------------------------------------------------------------------------

describe('Google Ads Lead Form export format', () => {
  it('maps Google Ads campaign/ad headers to data_source', () => {
    const headers = ['Campaign Name', 'Ad Name', 'Full Name', 'Phone Number', 'Email'];
    const mappings = autoMapFields(headers);

    expect(mappings['name']).toBe('Full Name');
    expect(mappings['mobile_without_country_code']).toBe('Phone Number');
    expect(mappings['email']).toBe('Email');
    // Campaign Name or Ad Name should map to data_source
    const ds = mappings['data_source'];
    expect(['Campaign Name', 'Ad Name']).toContain(ds);
  });

  it('extracts records from a Google Ads style CSV', () => {
    const data: RawCSVData = {
      headers: ['Full Name', 'Email', 'Phone Number', 'City', 'Campaign Name', 'Budget'],
      rows: [
        {
          'Full Name': 'Sunita Mehra',
          Email: 'sunita@gmail.com',
          'Phone Number': '9876543212',
          City: 'Hyderabad',
          'Campaign Name': 'sarjapur_plots',
          Budget: '50L-80L',
        },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.importedCount).toBe(1);
    const lead = result.records[0];
    expect(lead.name).toBe('Sunita Mehra');
    expect(lead.email).toBe('sunita@gmail.com');
    expect(lead.mobile_without_country_code).toBe('9876543212');
    expect(lead.city).toBe('Hyderabad');
    expect(lead.data_source).toBe('sarjapur_plots');
  });
});

// ---------------------------------------------------------------------------
// CSV crm_note Safety (newlines / line breaks)
// ---------------------------------------------------------------------------

describe('CSV safety — crm_note escaping', () => {
  it('escapes newlines in crm_note to prevent CSV row breaks', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'notes'],
      rows: [
        {
          name: 'Newline User',
          email: 'nl@test.com',
          phone: '9876543210',
          notes: 'First line\nSecond line\nThird line',
        },
      ],
    };
    const result = runExtractionEngine(data);
    const note = result.records[0].crm_note;
    // Must not contain real newlines
    expect(note).not.toMatch(/\n/);
    // Should contain escaped newlines
    expect(note).toContain('\\n');
  });
});

// ---------------------------------------------------------------------------
// Real Estate CRM Export
// ---------------------------------------------------------------------------

describe('Real Estate CRM export format', () => {
  it('maps real estate specific headers: possession_time, property_requirement, budget', () => {
    const headers = [
      'Lead Name', 'Mobile', 'Email ID', 'City', 'Property Requirement',
      'Move In Timeline', 'Budget Range', 'Lead Status', 'Remarks', 'Lead Source'
    ];
    const mappings = autoMapFields(headers);

    expect(mappings['name']).toBe('Lead Name');
    expect(mappings['mobile_without_country_code']).toBe('Mobile');
    expect(mappings['email']).toBe('Email ID');
    expect(mappings['city']).toBe('City');
    expect(mappings['crm_note']).toBe('Property Requirement');
    expect(mappings['possession_time']).toBe('Move In Timeline');
    expect(mappings['crm_status']).toBe('Lead Status');
  });

  it('extracts a full real estate CRM record correctly', () => {
    const data: RawCSVData = {
      headers: ['Lead Name', 'Mobile', 'Email ID', 'City', 'Move In Timeline', 'Lead Status', 'Remarks'],
      rows: [
        {
          'Lead Name': 'Deepak Joshi',
          Mobile: '9123456789',
          'Email ID': 'deepak@outlook.com',
          City: 'Pune',
          'Move In Timeline': 'Within 6 months',
          'Lead Status': 'site visit done',
          Remarks: 'Very interested in 3BHK, budget 80L',
        },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.importedCount).toBe(1);
    const lead = result.records[0];
    expect(lead.name).toBe('Deepak Joshi');
    expect(lead.possession_time).toBe('Within 6 months');
    expect(lead.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(lead.crm_note).toContain('3BHK');
  });
});

// ---------------------------------------------------------------------------
// Marketing Agency CSV (UTM params as data_source)
// ---------------------------------------------------------------------------

describe('Marketing agency CSV with UTM parameters', () => {
  it('maps utm_source column to data_source', () => {
    const headers = ['Name', 'Email', 'Phone', 'utm_source', 'utm_medium', 'utm_campaign'];
    const mappings = autoMapFields(headers);
    expect(mappings['data_source']).toBe('utm_source');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('handles completely empty rows gracefully', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone'],
      rows: [
        { name: '', email: '', phone: '' },
        { name: 'Real User', email: 'real@test.com', phone: '9876543210' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
  });

  it('handles missing name with only first_name supplied', () => {
    const data: RawCSVData = {
      headers: ['first_name', 'email', 'phone'],
      rows: [
        { first_name: 'Arjun', email: 'arjun@test.com', phone: '9876543210' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].name).toBe('Arjun');
  });

  it('fieldMappings in result does not expose internal __ keys', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'email2'],
      rows: [
        { name: 'User', email: 'u@test.com', phone: '9876543210', email2: 'u2@test.com' },
      ],
    };
    const result = runExtractionEngine(data);
    const keys = Object.keys(result.fieldMappings);
    expect(keys.every(k => !k.startsWith('__'))).toBe(true);
  });

  it('data_source stays blank when no allowed source matches', () => {
    const data: RawCSVData = {
      headers: ['name', 'email', 'phone', 'source'],
      rows: [
        { name: 'User', email: 'u@test.com', phone: '9876543210', source: 'unknown_portal' },
      ],
    };
    const result = runExtractionEngine(data);
    expect(result.records[0].data_source).toBe('');
  });
});
