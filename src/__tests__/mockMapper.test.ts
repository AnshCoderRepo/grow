import { describe, it, expect } from 'vitest';
import { autoMapFields, simulateAIMapping } from '../app/mockMapper';
import { RawCSVData } from '../app/types';

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
        { name: 'Missing Contacts', email: '', phone: '' }, // Should be skipped
        { name: 'Only Email', email: 'email@example.com', phone: '' }, // Valid
        { name: 'Only Phone', email: '', phone: '1234567890' } // Valid
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
        { name: 'Lead 1', email: 'l1@test.com', phone: '11', status: 'won deal' }, // SALE_DONE
        { name: 'Lead 2', email: 'l2@test.com', phone: '22', status: 'hot lead' }, // GOOD_LEAD_FOLLOW_UP
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
