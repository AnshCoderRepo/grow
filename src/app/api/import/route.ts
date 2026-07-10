import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { CRMLead, ImportSummary, RawCSVData } from '../../types';
import { autoMapFields, simulateAIMapping } from '../../mockMapper';

// Force dynamic to ensure environment variables are loaded at runtime
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();
    const customMappingsStr = formData.get('mappings') as string | null;
    const customMappings: Record<string, string> | undefined = customMappingsStr
      ? JSON.parse(customMappingsStr)
      : undefined;

    // Parse CSV server-side using PapaParse
    const parseResult = Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        { error: `Parsing error: ${parseResult.errors[0].message}` },
        { status: 400 }
      );
    }

    const headers = parseResult.meta.fields || [];
    const rows = parseResult.data;
    const rawCSVData: RawCSVData = { headers, rows };

    // Check whether a Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    const isMockMode = !apiKey || apiKey.trim() === '';

    if (isMockMode) {
      console.warn(
        'GEMINI_API_KEY not configured – falling back to heuristic mock extraction.'
      );
      const mockResult = await simulateAIMapping(rawCSVData, customMappings);
      return NextResponse.json(mockResult);
    }

    // ----------------------------------------------------------------
    // AI Extraction – batch processing with Gemini
    // ----------------------------------------------------------------
    // We use require() here so the import is deferred to runtime only
    // (avoids build-time static analysis issues with optional packages).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const BATCH_SIZE = 30;
    const records: CRMLead[] = [];
    const skippedRecords: ImportSummary['skippedRecords'] = [];

    // Sleep utility to help respect free-tier rate limits (e.g., 15 RPM)
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let partialError: string | undefined = undefined;

    try {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      if (i > 0) {
        await sleep(4200); // ~4.2s delay between batches (keeps it under 15 requests per minute)
      }
      const batchRows = rows.slice(i, i + BATCH_SIZE);
      const batchWithIndex = batchRows.map((row, idx) => ({
        __row_index: i + idx + 1,
        ...row,
      }));

      const mappingHint = customMappings
        ? `\nUser-defined column mappings (respect these strictly):\n${JSON.stringify(customMappings, null, 2)}\n`
        : '';

      const systemPrompt = `You are an expert CRM Data Extraction Agent.
Convert the following raw CSV rows into standard GrowEasy CRM records.

CSV headers: ${JSON.stringify(headers)}${mappingHint}

Batch rows (with 1-based row index): ${JSON.stringify(batchWithIndex)}

CRM fields to extract:
- created_at: Lead creation date (must be convertible using JavaScript: new Date(created_at))
- name: Lead name (default to "Unnamed Lead" if absent)
- email: Primary email
- country_code: Country code
- mobile_without_country_code: Mobile number
- company: Company name
- city: City
- state: State
- country: Country
- lead_owner: Lead owner
- crm_status: Lead status
- crm_note: Notes/remarks
- data_source: Source
- possession_time: Property possession time
- description: Additional description

Validation rules:
1. Allowed CRM Status Values (use ONE of): GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE
2. Allowed Data Source Values (use ONE of): leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. (If none match confidently, leave it blank).
3. CRM Notes: Use crm_note for remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, or any useful info that doesn't fit elsewhere.
4. Multiple Emails/Mobile: Use the first one for the main field and append remaining to crm_note.
5. Skip Invalid Records: If a record contains NEITHER email NOR mobile number, then SKIP that record (explain why).
6. Each record must remain a single CSV row. Avoid introducing unintended line breaks. Escape them appropriately (e.g. \\n).

Respond with ONLY a JSON code block. No explanation. Format:
\`\`\`json
{
  "extractedRecords": [
    {
      "created_at": "string",
      "name": "string",
      "email": "string",
      "country_code": "string",
      "mobile_without_country_code": "string",
      "company": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "lead_owner": "string",
      "crm_status": "string",
      "crm_note": "string",
      "data_source": "string",
      "possession_time": "string",
      "description": "string"
    }
  ],
  "skippedRecords": [
    {
      "rowIndex": 0,
      "reason": "string",
      "rowData": {}
    }
  ]
}
\`\`\``;

      let retryCount = 0;
      let success = false;

      while (!success && retryCount < 2) {
        try {
          const response = await model.generateContent(systemPrompt);
          const rawText: string = response.response.text();

          // Parse JSON from markdown fence or bare JSON object
          const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
          const bareMatch = rawText.match(/(\{[\s\S]*\})/);
          const jsonStr = fenceMatch ? fenceMatch[1].trim() : bareMatch ? bareMatch[1].trim() : null;
          if (!jsonStr) throw new Error('No JSON found in AI response');
          const result = JSON.parse(jsonStr);

          if (Array.isArray(result.extractedRecords)) {
            result.extractedRecords.forEach((rec: Record<string, string>) => {
              records.push({
                id: `lead_${Math.random().toString(36).substr(2, 9)}`,
                created_at: rec.created_at || new Date().toISOString(),
                name: rec.name || 'Unnamed Lead',
                email: rec.email || '',
                country_code: rec.country_code || '',
                mobile_without_country_code: rec.mobile_without_country_code || '',
                company: rec.company || '',
                city: rec.city || '',
                state: rec.state || '',
                country: rec.country || '',
                lead_owner: rec.lead_owner || '',
                crm_status: rec.crm_status || '',
                crm_note: rec.crm_note || '',
                data_source: rec.data_source || '',
                possession_time: rec.possession_time || '',
                description: rec.description || ''
              });
            });
          }

          if (Array.isArray(result.skippedRecords)) {
            result.skippedRecords.forEach((skip: { rowIndex: number; reason: string; rowData: Record<string, string> }) => {
              const origRow = batchWithIndex.find(
                (r) => r.__row_index === skip.rowIndex
              );
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { __row_index, ...cleanRow } = origRow ?? {};
              skippedRecords.push({
                rowIndex: skip.rowIndex,
                reason: skip.reason || 'Missing required fields',
                rowData: cleanRow,
              });
            });
          }
          success = true;
        } catch (batchErr: any) {
          // Check for 429 Too Many Requests
          if (batchErr.message && batchErr.message.includes('429 Too Many Requests')) {
            retryCount++;
            if (retryCount < 2) {
              let delayMs = 35000; // Default 35s
              const retryMatch = batchErr.message.match(/retry in (\d+(?:\.\d+)?)s/i);
              if (retryMatch && retryMatch[1]) {
                delayMs = (parseFloat(retryMatch[1]) + 1) * 1000;
              }
              console.warn(`Batch ${i / BATCH_SIZE + 1} hit rate limit. Retrying in ${delayMs / 1000}s...`);
              await sleep(delayMs);
              continue;
            }
          }
          
          // Batch AI call failed (or retries exhausted) – fall back to heuristics for this batch only
          console.error(
            `Batch ${i / BATCH_SIZE + 1} AI extraction failed after ${retryCount} retries, using mock fallback:`,
            batchErr
          );
          const fallback = await simulateAIMapping(
            { headers, rows: batchRows },
            customMappings
          );
          records.push(...fallback.records);
          skippedRecords.push(
            ...fallback.skippedRecords.map((s) => ({
              ...s,
              rowIndex: s.rowIndex + i,
            }))
          );
          success = true; // Proceed to next batch via fallback
        }
      }
      }
    } catch (unexpectedErr: any) {
      console.error('Unexpected error during batch processing:', unexpectedErr);
      partialError = unexpectedErr.message || 'Unexpected processing error';
    }

    const summary: ImportSummary = {
      totalRows: rows.length,
      importedCount: records.length,
      skippedCount: skippedRecords.length,
      records,
      skippedRecords,
      fieldMappings: customMappings ?? autoMapFields(headers),
      partialError,
    };

    return NextResponse.json(summary);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('CSV Import API error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
