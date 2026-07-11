/**
 * mockMapper.ts — thin compatibility shim
 *
 * Delegates all field mapping and data extraction to the custom
 * GrowEasy Extraction Engine (src/lib/extractionEngine.ts).
 *
 * This file keeps the same exported function signatures so that
 * ImportModal (client-side preview) and existing tests work without changes.
 */

import { RawCSVData, ImportSummary } from './types';
import { autoMapFieldsFromEngine, runExtractionEngine } from '../lib/extractionEngine';

/**
 * Map CSV headers to CRM fields.
 * Used by ImportModal for the field-mapping preview step.
 */
export function autoMapFields(
  headers: string[],
  sampleRows: Record<string, string>[] = []
): Record<string, string> {
  return autoMapFieldsFromEngine(headers, sampleRows);
}

/**
 * Run full extraction (mapping + normalization + validation).
 * Returns a Promise to maintain backward-compatibility with callers
 * that use `.then()` or `await`.
 *
 * NOTE: No artificial delay — the engine is instant.
 */
export function simulateAIMapping(
  data: RawCSVData,
  customMappings?: Record<string, string>
): Promise<ImportSummary> {
  return Promise.resolve(runExtractionEngine(data, customMappings));
}

