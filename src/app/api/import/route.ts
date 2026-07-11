import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { RawCSVData } from '../../types';
import { runExtractionEngine } from '../../../lib/extractionEngine';

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

    // Run the custom GrowEasy extraction engine — no external API, no quota limits
    const result = runExtractionEngine(rawCSVData, customMappings);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('CSV Import API error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
