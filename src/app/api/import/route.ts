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
- created_at         : Lead creation date (ISO 8601 preferred)
- name               : Full name (default to "Unnamed Lead" if absent)
- email              : Primary email – must be a valid format
- country_code       : Country dial code (e.g. +91, +1)
- mobile_without_country_code : Mobile number without dial code
- company            : Company or organisation
- city               : City
- state              : State / province
- country            : Country
- lead_owner         : Owner email or identifier
- crm_status         : Map to one of: "Sale Done" | "Good Lead" | "Not Dialed"
- crm_note           : Notes / remarks
- data_source        : Traffic source (e.g. Google Ads, Facebook, Manual)
- possession_time    : Property possession time if present
- description        : Any additional description

Validation rules:
1. Skip rows that have NO name AND NO email AND NO phone – explain why.
2. Skip rows where an email is present but syntactically invalid – explain why.

Respond with ONLY a JSON code block. No explanation, no extra text. Example format:
\`\`\`json
{
  "extractedRecords": [
    {
      "name": "string",
      "email": "string",
      "phone": "string",
      "company": "string",
      "status": "Sale Done | Good Lead | Not Dialed",
      "leadOwner": "string",
      "dateCreated": "string",
      "estimatedValue": "string",
      "notes": "string",
      "quality": "string",
      "source": "string"
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
              name: rec.name || 'Unnamed Lead',
              email: rec.email || 'N/A',
              phone: rec.phone || '—',
              company: rec.company || '—',
              jobTitle: '—',
              source: rec.source || 'AI CSV Import',
              status: (rec.status as CRMLead['status']) || 'Not Dialed',
              quality: rec.quality || '—',
              leadOwner: rec.leadOwner || 'A',
              dateCreated: rec.dateCreated || new Date().toLocaleString(),
              estimatedValue: rec.estimatedValue || undefined,
              notes: rec.notes || undefined,
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
      } catch (batchErr) {
        // Batch AI call failed – fall back to heuristics for this batch only
        console.error(
          `Batch ${i / BATCH_SIZE + 1} AI extraction failed, using mock fallback:`,
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
      }
    }

    const summary: ImportSummary = {
      totalRows: rows.length,
      importedCount: records.length,
      skippedCount: skippedRecords.length,
      records,
      skippedRecords,
      fieldMappings: customMappings ?? autoMapFields(headers),
    };

    return NextResponse.json(summary);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('CSV Import API error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
