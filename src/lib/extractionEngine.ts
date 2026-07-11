/**
 * GrowEasy Universal Extraction Engine
 *
 * A dual-layer, quota-free CSV field mapping and data extraction engine.
 * Works with all common CSV export formats:
 *   - Facebook Lead Ads exports
 *   - Google Ads Lead Form exports
 *   - Excel / manually created spreadsheets
 *   - Real Estate CRM exports
 *   - Marketing agency CSVs
 *   - Sales reports
 *
 * Layer 1 - Header Semantics: fuzzy-scored synonym matching on column headers
 * Layer 2 - Value Pattern Detection: samples real cell values with regex/heuristics
 *
 * The highest-confidence mapping wins per CRM field.
 */

import { RawCSVData, CRMLead, ImportSummary } from '../app/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldMapping {
  csvHeader: string;
  confidence: number; // 0-1
  source: 'header' | 'value-pattern' | 'custom';
}

export type ScoredMappings = Record<string, FieldMapping>;

// ---------------------------------------------------------------------------
// Layer 1 - Header Semantics
// ---------------------------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const HEADER_SYNONYMS: Record<string, string[]> = {
  created_at: [
    'createdat', 'createdtime', 'saledate', 'datecreated', 'date',
    'time', 'timestamp', 'entrydate', 'leaddate', 'dateadded',
    'datetime', 'registrationdate', 'submitteddate', 'submissiondate',
    'leadcreateddate', 'creationdate', 'addeddate', 'enquirydate',
    'enquiryat', 'capturedat', 'capturedate',
  ],
  name: [
    'name', 'fullname',
    'leadname', 'customer', 'contactname', 'client', 'clientname',
    'prospectname', 'candidatename', 'personname', 'customername',
    // Facebook Lead Ads — combined name headers only (not first/last separately)
    'full_name', 'yourname', 'leadfullname', 'contactfullname',
    'your_full_name', 'respondentsname',
  ],
  email: [
    'email', 'emailaddress', 'mail', 'emailid', 'email1', 'primaryemail',
    'workemail', 'personalemail', 'contactemail',
    // Facebook Lead Ads / Google Ads
    'emailaddress', 'youremailaddress', 'your_email_address', 'workemail',
    'businessemail', 'email2', 'secondaryemail', 'alternatemail',
    'alternativeemail',
  ],
  country_code: [
    'countrycode', 'cc', 'phonecode', 'dialcode', 'isdcode',
    'isd', 'callingcode', 'intlcode', 'countrycallingcode',
  ],
  mobile_without_country_code: [
    'phone', 'phonenumber', 'tel', 'telephone', 'mobile', 'cell',
    'contactnumber', 'contactno', 'ph', 'mobilewithoutcountrycode',
    'contact', 'number', 'mobileno', 'cellphone', 'whatsapp',
    'whatsappnumber', 'mobilenumber', 'phoneno', 'mob',
    // Facebook Lead Ads / Google Ads
    'phone_number', 'yourphonenumber', 'your_phone_number',
    'mobilephone', 'workphone', 'cellnumber', 'phoneno2',
    'phone2', 'alternatenumber', 'alternatephone', 'alternateno',
    'secondaryphone', 'secondarymobile', 'contactphone',
  ],
  company: [
    'company', 'companyname', 'organization', 'org', 'business',
    'employer', 'firm', 'organisation', 'workplace',
    // Facebook Lead Ads
    'company_name', 'jobcompanyname', 'workcompany', 'businessname',
    'companynamefield',
  ],
  city: [
    'city', 'location', 'town', 'district', 'locality', 'area', 'place',
    // Facebook / real estate
    'yourcity', 'leadcity', 'propertycity', 'preferredcity',
    'projectcity', 'residencecity',
  ],
  state: [
    'state', 'province', 'region', 'statename', 'stateprovince',
    // Facebook / real estate
    'yourstate', 'leadstate', 'propertystate', 'preferredstate',
  ],
  country: [
    'country', 'nation', 'countryname',
    // Facebook
    'yourcountry', 'leadcountry', 'residencecountry',
  ],
  lead_owner: [
    'leadowner', 'owner', 'representative', 'rep', 'assignedto',
    'agent', 'salesrep', 'salesperson', 'assignee', 'handler',
    'managedby', 'accountmanager', 'relationship_manager', 'rm',
    'bdm', 'channelpartner',
  ],
  crm_status: [
    'crmstatus', 'status', 'leadstatus', 'stage', 'disposition',
    'callstatus', 'outcome', 'result', 'dealstage', 'pipeline',
    'leadquality', 'qualificationstatus', 'calldisposition',
    'leadstage', 'leaddisposition',
  ],
  crm_note: [
    'notes', 'note', 'comment', 'comments', 'message', 'description',
    'feedback', 'details', 'remarks', 'crmnote', 'observations',
    'additionalinfo', 'extrainfo', 'memo', 'annotation',
    // Facebook Lead Ads / real estate
    'whatareyoulookingfor', 'anymessage', 'yourmessage',
    'query', 'requirement', 'propertyrequirement', 'yourquery',
    'requirements', 'inquiry', 'enquiry', 'additionalrequirements',
    'specificrequirements',
  ],
  data_source: [
    'datasource', 'source', 'leadsource', 'traffic', 'medium',
    'channel', 'campaign', 'origin', 'referrer', 'platform',
    // Google Ads Lead Form / Facebook
    'adname', 'ad_name', 'campaignname', 'campaign_name',
    'formname', 'form_name', 'utmsource', 'utm_source',
    'utmmedium', 'utm_medium', 'utmcampaign', 'utm_campaign',
    'adset', 'adsetname',
  ],
  possession_time: [
    'possession', 'possessiontime', 'moveindate',
    'possessiondate', 'handovertime', 'expectedpossession',
    // Real estate / lead forms — use full specific strings to avoid substring collision with 'time'
    'moveintimeline', 'expectedmovein', 'movein',
    'whendoyouneed', 'whendoyouplantobuy', 'purchasetimeline',
    'buyingtimeline', 'moveinschedule', 'propertytimeline',
    'possessiontime', 'handoverdate', 'deliverytimeline',
  ],
  description: [
    'description', 'desc', 'about', 'info', 'requirements',
    'projectname', 'projectdetails', 'interest',
    // Real estate
    'budget', 'budgetrange', 'propertytype', 'projectinterest',
    'bhktype', 'propertyconfiguration', 'unittype',
  ],
};

// Fields that can have multiple columns feeding into them (overflow → crm_note)
const OVERFLOW_FIELDS: Set<string> = new Set([
  'email', 'mobile_without_country_code',
]);

// Fields whose extra columns should be merged (not overflow)
const MERGE_FIELDS: Set<string> = new Set([
  'crm_note',
]);

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function scoreHeader(header: string, synonyms: string[]): number {
  const h = norm(header);
  let best = 0;
  for (const syn of synonyms) {
    if (h === syn) return 10;
    if (h.startsWith(syn) || h.endsWith(syn) || syn.startsWith(h) || syn.endsWith(h)) best = Math.max(best, 7);
    else if (h.includes(syn) || syn.includes(h)) best = Math.max(best, 5);
    else if (levenshtein(h, syn) <= 2) best = Math.max(best, 3);
  }
  return best;
}

// ---------------------------------------------------------------------------
// First Name + Last Name Detection
// (runs BEFORE header mapping to exclude these columns from general competition)
// ---------------------------------------------------------------------------

const FIRST_NAME_SYNONYMS = ['firstname', 'fname', 'givenname'];
const LAST_NAME_SYNONYMS  = ['lastname', 'lname', 'surname', 'familyname'];

/**
 * Detects first-name and last-name only columns (NOT combined name columns).
 * Uses strict matching: exact match OR the header starts with/is the synonym,
 * but does NOT use endsWith (prevents "fullname".endsWith("lname") false positive).
 */
function detectNameColumns(headers: string[]): { firstNameCol: string | null; lastNameCol: string | null } {
  let firstNameCol: string | null = null;
  let lastNameCol: string | null = null;

  for (const h of headers) {
    const n = norm(h);
    // Exact match OR starts-with (e.g. "firstname_1") — NOT endsWith
    if (!firstNameCol && FIRST_NAME_SYNONYMS.some(s => n === s || n.startsWith(s + '_') || n === 'first')) {
      firstNameCol = h;
    }
    if (!lastNameCol && LAST_NAME_SYNONYMS.some(s => n === s || n.startsWith(s + '_') || n === 'last')) {
      lastNameCol = h;
    }
  }

  return { firstNameCol, lastNameCol };
}

/**
 * Returns the best-scored header for each CRM field using a globally optimal
 * greedy assignment: computes all (field × header) scores first, then assigns
 * the highest-scoring pair globally (not first-come-first-served per field).
 * This prevents low-priority fields from stealing headers from high-confidence matches.
 */
function headerSemanticMapping(
  headers: string[],
  excludeHeaders: Set<string> = new Set()
): {
  primary: ScoredMappings;
  overflow: Record<string, string[]>;
  mergeExtra: Record<string, string[]>;
} {
  const primary: ScoredMappings = {};
  const overflow: Record<string, string[]> = {};
  const mergeExtra: Record<string, string[]> = {};

  const allFields = [
    'email', 'mobile_without_country_code', 'country_code', 'created_at',
    'crm_status', 'data_source', 'lead_owner', 'possession_time',
    'name', 'company', 'city', 'state', 'country', 'crm_note', 'description',
  ];

  // Build the full score matrix: scores[field][header] = score
  const eligibleHeaders = headers.filter(h => !excludeHeaders.has(h));
  const scoreMatrix: Record<string, Record<string, number>> = {};
  for (const field of allFields) {
    scoreMatrix[field] = {};
    const synonyms = HEADER_SYNONYMS[field] ?? [];
    for (const header of eligibleHeaders) {
      scoreMatrix[field][header] = scoreHeader(header, synonyms);
    }
  }

  // Globally greedy assignment: repeatedly pick the (field, header) pair
  // with the highest score, assign it, then remove both from future consideration.
  const assignedHeaders = new Set<string>();
  const assignedFields = new Set<string>();
  const MIN_SCORE = 3;

  while (true) {
    let bestScore = MIN_SCORE - 1;
    let bestField = '';
    let bestHeader = '';

    for (const field of allFields) {
      if (assignedFields.has(field)) continue;
      for (const header of eligibleHeaders) {
        if (assignedHeaders.has(header)) continue;
        const score = scoreMatrix[field][header] ?? 0;
        if (score > bestScore) {
          bestScore = score;
          bestField = field;
          bestHeader = header;
        }
      }
    }

    if (!bestField) break; // no more assignable pairs

    primary[bestField] = { csvHeader: bestHeader, confidence: bestScore / 10, source: 'header' };
    assignedHeaders.add(bestHeader);
    assignedFields.add(bestField);
  }

  // Second pass: find overflow/merge headers (secondary matches for overflow & merge fields)
  const allUsed = new Set([...assignedHeaders]);
  for (const field of allFields) {
    if (!OVERFLOW_FIELDS.has(field) && !MERGE_FIELDS.has(field)) continue;
    const synonyms = HEADER_SYNONYMS[field] ?? [];
    const extras: string[] = [];

    for (const header of eligibleHeaders) {
      if (allUsed.has(header)) continue;
      const score = scoreHeader(header, synonyms);
      if (score >= MIN_SCORE) {
        extras.push(header);
        allUsed.add(header);
      }
    }

    if (extras.length > 0) {
      if (MERGE_FIELDS.has(field)) {
        mergeExtra[field] = extras;
      } else {
        overflow[field] = extras;
      }
    }
  }

  return { primary, overflow, mergeExtra };
}

// ---------------------------------------------------------------------------
// Layer 2 - Value Pattern Detection
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PURE_DIGITS_RE = /^\d{7,12}$/;
const DATE_RE = /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}[-\s]\w{3,9}[-\s]\d{2,4})/i;
const STATUS_KEYWORDS = [
  'sale', 'done', 'won', 'closed', 'converted',
  'bad', 'junk', 'unqualified', 'invalid',
  'good', 'hot', 'qualified', 'interested', 'warm',
  'not', 'missed', 'connected', 'dialed', 'follow',
];

function scoreValuePattern(field: string, values: string[]): number {
  const nonEmpty = values.filter(v => v?.trim());
  if (nonEmpty.length === 0) return 0;
  const hit = (fn: (v: string) => boolean) => nonEmpty.filter(fn).length / nonEmpty.length;

  switch (field) {
    case 'email':
      return hit(v => EMAIL_RE.test(v.trim())) * 0.95;
    case 'mobile_without_country_code':
      return hit(v => PURE_DIGITS_RE.test(v.replace(/[\s\-().+]/g, ''))) * 0.85;
    case 'country_code':
      return hit(v => { const c = v.replace(/[\s\-+]/g, ''); return /^\d{1,4}$/.test(c) && parseInt(c) <= 9999; }) * 0.75;
    case 'created_at':
      return hit(v => DATE_RE.test(v.trim()) || !isNaN(Date.parse(v))) * 0.85;
    case 'name':
      return hit(v => /^[A-Za-z\s'.,-]{3,60}$/.test(v.trim()) && v.trim().split(/\s+/).length >= 2) * 0.7;
    case 'crm_status':
      return hit(v => STATUS_KEYWORDS.some(kw => v.toLowerCase().includes(kw))) * 0.8;
    default:
      return 0;
  }
}

function valuePatternMapping(
  headers: string[],
  sampleRows: Record<string, string>[],
  excludeHeaders: Set<string> = new Set()
): ScoredMappings {
  const result: ScoredMappings = {};
  const usedHeaders = new Set<string>();
  const fieldsToInfer = ['email', 'mobile_without_country_code', 'country_code', 'created_at', 'name', 'crm_status'];

  for (const field of fieldsToInfer) {
    let bestHeader = '';
    let bestScore = 0;

    for (const header of headers) {
      if (usedHeaders.has(header) || excludeHeaders.has(header)) continue;
      const values = sampleRows.map(r => r[header] ?? '');
      const score = scoreValuePattern(field, values);
      if (score > bestScore) { bestScore = score; bestHeader = header; }
    }

    if (bestHeader && bestScore >= 0.5) {
      result[field] = { csvHeader: bestHeader, confidence: bestScore, source: 'value-pattern' };
      usedHeaders.add(bestHeader);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Combined Mapping
// ---------------------------------------------------------------------------

export function smartMapFields(
  headers: string[],
  sampleRows: Record<string, string>[],
  customMappings?: Record<string, string>
): Record<string, string> {
  // Detect first/last name columns first — exclude them from general mapping
  // so they don't accidentally score for 'name' via substring matches.
  const { firstNameCol, lastNameCol } = detectNameColumns(headers);
  const nameExcludes = new Set<string>([
    ...(firstNameCol ? [firstNameCol] : []),
    ...(lastNameCol  ? [lastNameCol]  : []),
  ]);

  const { primary: layer1, overflow, mergeExtra } = headerSemanticMapping(headers, nameExcludes);
  const layer2 = valuePatternMapping(headers, sampleRows, nameExcludes);
  const merged: Record<string, string> = {};
  const allFields = new Set([...Object.keys(layer1), ...Object.keys(layer2)]);

  for (const field of allFields) {
    const l1 = layer1[field];
    const l2 = layer2[field];
    if (l1 && l2) {
      merged[field] = l1.confidence >= l2.confidence ? l1.csvHeader : l2.csvHeader;
    } else if (l1) {
      merged[field] = l1.csvHeader;
    } else if (l2) {
      merged[field] = l2.csvHeader;
    }
  }

  if (customMappings) Object.assign(merged, customMappings);

  // Attach overflow and merge metadata to the returned mapping
  // Store as special keys so extractRecords can access them
  if (Object.keys(overflow).length > 0) {
    (merged as any).__overflow__ = overflow;
  }
  if (Object.keys(mergeExtra).length > 0) {
    (merged as any).__mergeExtra__ = mergeExtra;
  }
  // Store name split columns so extractRecords can use them
  if (firstNameCol) (merged as any).__firstNameCol__ = firstNameCol;
  if (lastNameCol)  (merged as any).__lastNameCol__  = lastNameCol;

  return merged;
}

// ---------------------------------------------------------------------------
// Value Normalization
// ---------------------------------------------------------------------------

function normalizePhone(raw: string): { phone: string; countryCode: string } {
  const cleaned = raw.trim();
  const withPlusCC = cleaned.match(/^\+(\d{1,4})[\s\-.]?(\d{6,12})$/);
  if (withPlusCC) return { countryCode: withPlusCC[1], phone: withPlusCC[2] };
  const pure = cleaned.replace(/[\s\-().]/g, '');
  if (/^0\d{9,11}$/.test(pure)) return { countryCode: '', phone: pure.slice(1) };
  return { countryCode: '', phone: pure };
}

function normalizeDate(raw: string): string {
  if (!raw?.trim()) return new Date().toISOString();
  const indianDate = raw.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (indianDate) {
    const [, d, m, y] = indianDate;
    const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? raw : parsed.toISOString();
}

function resolveStatus(raw: string): string {
  const s = raw.toLowerCase();
  // BAD_LEAD — check before SALE_DONE to catch "not interested"
  if (/\bnot interested\b|bad lead|bad_lead|junk|unqualif|invalid|spam|fraud|fake|duplicate|\btest lead\b|wrong number|do not call|\bdnc\b/.test(s)) return 'BAD_LEAD';
  // GOOD_LEAD_FOLLOW_UP — check before SALE_DONE so "site visit done" goes here
  if (/site visit|good|hot|qualif|interest|warm|follow|callback|prospect|revisit|potential/.test(s)) return 'GOOD_LEAD_FOLLOW_UP';
  // SALE_DONE
  if (/\bsale\b|\bsold\b|won|closed|convert|booked|booking|agreement|token paid|allotment|registered|payment received|deal done|deal closed/.test(s)) return 'SALE_DONE';
  // DID_NOT_CONNECT — fallback for anything connection-failure related
  if (/not dial|not reach|no answer|ring|busy|unanswer|switched off|switched_off|not connect|did not connect|not reachable|not picked/.test(s)) return 'DID_NOT_CONNECT';
  return 'DID_NOT_CONNECT';
}

const ALLOWED_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

function resolveSource(raw: string, headerContext: string): string {
  const check = (s: string) => ALLOWED_SOURCES.find(src => src.replace(/_/g, '') === s.replace(/[^a-z0-9]/g, ''));
  if (raw) { const m = check(raw.toLowerCase()); if (m) return m; }
  const ctx = headerContext.toLowerCase().replace(/[^a-z]/g, '');
  return ALLOWED_SOURCES.find(src => ctx.includes(src.replace(/_/g, ''))) ?? '';
}

/**
 * Make a string CSV-safe: escape internal quotes and replace newlines with \n literal.
 */
function csvSafe(s: string): string {
  return s.replace(/\r\n/g, '\\n').replace(/\r/g, '\\n').replace(/\n/g, '\\n');
}

/**
 * Split a cell value that may contain multiple emails/phones separated by
 * comma, semicolon, pipe, or space+and.
 */
function splitMultiValue(raw: string): string[] {
  return raw
    .split(/[;,|]|\s+and\s+/i)
    .map(v => v.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Core Record Extraction
// ---------------------------------------------------------------------------

function extractRecords(
  data: RawCSVData,
  mappings: Record<string, string>
): { records: CRMLead[]; skippedRecords: ImportSummary['skippedRecords'] } {
  const records: CRMLead[] = [];
  const skippedRecords: ImportSummary['skippedRecords'] = [];
  const headerContext = data.headers.join(' ');

  // Pull out metadata attached by smartMapFields
  const overflowMeta: Record<string, string[]> = (mappings as any).__overflow__ ?? {};
  const mergeExtraMeta: Record<string, string[]> = (mappings as any).__mergeExtra__ ?? {};
  const firstNameCol: string | null = (mappings as any).__firstNameCol__ ?? null;
  const lastNameCol: string | null  = (mappings as any).__lastNameCol__  ?? null;

  // hasSeparateNames: true when we have first/last cols AND no proper combined name mapping
  const primaryNameCol = mappings['name'];
  const nameColIsSplit = primaryNameCol === firstNameCol || primaryNameCol === lastNameCol;
  const hasSeparateNames = (firstNameCol || lastNameCol) && (!primaryNameCol || nameColIsSplit);

  data.rows.forEach((row, index) => {
    const get = (field: string) => (mappings[field] ? row[mappings[field]] : '') ?? '';

    // ── Name resolution ──────────────────────────────────────────────────
    let nameVal = get('name').trim();
    if (!nameVal && hasSeparateNames) {
      const first = (firstNameCol ? row[firstNameCol] : '').trim();
      const last  = (lastNameCol  ? row[lastNameCol]  : '').trim();
      nameVal = [first, last].filter(Boolean).join(' ');
    }

    // ── Phone resolution ─────────────────────────────────────────────────
    const rawPhone = get('mobile_without_country_code').trim();
    const rawCC = get('country_code').trim();
    let phoneNorm = rawPhone;
    let ccNorm = rawCC;

    // Handle multi-value in a single phone cell (e.g. "9876543210; 9876543211")
    let extraPhones: string[] = [];
    if (rawPhone) {
      const parts = splitMultiValue(rawPhone);
      if (parts.length > 1) {
        extraPhones = parts.slice(1);
        phoneNorm = parts[0].replace(/[\s\-().]/g, '');
      }
    }

    if (!rawCC && phoneNorm) {
      const split = normalizePhone(phoneNorm);
      phoneNorm = split.phone;
      ccNorm = split.countryCode;
    } else {
      phoneNorm = phoneNorm.replace(/[\s\-().]/g, '');
    }

    // Collect overflow phone columns
    for (const overflowCol of overflowMeta['mobile_without_country_code'] ?? []) {
      const val = (row[overflowCol] ?? '').trim();
      if (val) {
        splitMultiValue(val).forEach(v => {
          const cleaned = v.replace(/[\s\-().]/g, '');
          if (cleaned) extraPhones.push(cleaned);
        });
      }
    }

    // ── Email resolution ─────────────────────────────────────────────────
    let rawEmail = get('email').trim();
    let extraEmails: string[] = [];

    // Handle multi-value in a single email cell
    if (rawEmail) {
      const parts = splitMultiValue(rawEmail);
      if (parts.length > 1) {
        extraEmails = parts.slice(1).filter(e => EMAIL_RE.test(e));
        rawEmail = parts[0];
      }
    }

    // Collect overflow email columns
    for (const overflowCol of overflowMeta['email'] ?? []) {
      const val = (row[overflowCol] ?? '').trim();
      if (val) {
        splitMultiValue(val).forEach(e => {
          if (EMAIL_RE.test(e)) extraEmails.push(e);
        });
      }
    }

    // ── Validation ───────────────────────────────────────────────────────
    // Rule #7: skip only if neither email nor phone exist
    const hasPhone = Boolean(phoneNorm);
    const hasEmail = Boolean(rawEmail);

    if (!hasEmail && !hasPhone) {
      skippedRecords.push({ rowIndex: index + 1, reason: 'Row lacks both Email and Phone.', rowData: row });
      return;
    }

    // Invalid email format: don't skip if we have a phone — move to crm_note instead
    let emailVal = rawEmail;
    let invalidEmailNote = '';
    if (rawEmail && !EMAIL_RE.test(rawEmail)) {
      if (!hasPhone) {
        skippedRecords.push({ rowIndex: index + 1, reason: `Invalid email format: "${rawEmail}"`, rowData: row });
        return;
      }
      invalidEmailNote = `Invalid email: ${rawEmail}`;
      emailVal = '';
    }

    // ── crm_note assembly ────────────────────────────────────────────────
    let noteVal = get('crm_note').trim();

    // Merge extra crm_note columns
    for (const extraCol of mergeExtraMeta['crm_note'] ?? []) {
      const extra = (row[extraCol] ?? '').trim();
      if (extra) noteVal = noteVal ? `${noteVal} | ${extra}` : extra;
    }

    // Append overflow emails
    for (const e of extraEmails) {
      noteVal = noteVal ? `${noteVal} | Extra email: ${e}` : `Extra email: ${e}`;
    }

    // Append overflow phones
    for (const p of extraPhones) {
      noteVal = noteVal ? `${noteVal} | Extra phone: ${p}` : `Extra phone: ${p}`;
    }

    // Append invalid email note
    if (invalidEmailNote) {
      noteVal = noteVal ? `${noteVal} | ${invalidEmailNote}` : invalidEmailNote;
    }

    // CSV-safe note
    noteVal = csvSafe(noteVal);

    // ── Build record ─────────────────────────────────────────────────────
    records.push({
      id: `lead_${Math.random().toString(36).substring(2, 11)}`,
      created_at: normalizeDate(get('created_at').trim()),
      name: nameVal || 'Unnamed Lead',
      email: emailVal,
      country_code: ccNorm,
      mobile_without_country_code: phoneNorm,
      company: get('company').trim(),
      city: get('city').trim(),
      state: get('state').trim(),
      country: get('country').trim(),
      lead_owner: get('lead_owner').trim(),
      crm_status: resolveStatus(get('crm_status').trim()),
      crm_note: noteVal,
      data_source: resolveSource(get('data_source').trim(), headerContext),
      possession_time: get('possession_time').trim(),
      description: get('description').trim(),
    });
  });

  return { records, skippedRecords };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Main entry point. Drop-in replacement for simulateAIMapping.
 * No external API calls. No quota. Instant.
 */
export function runExtractionEngine(
  data: RawCSVData,
  customMappings?: Record<string, string>
): ImportSummary {
  const sampleRows = data.rows.slice(0, 15);
  const mappings = smartMapFields(data.headers, sampleRows, customMappings);
  const { records, skippedRecords } = extractRecords(data, mappings);

  // Strip internal metadata keys before returning
  const cleanMappings = Object.fromEntries(
    Object.entries(mappings).filter(([k]) => !k.startsWith('__'))
  );

  return {
    totalRows: data.rows.length,
    importedCount: records.length,
    skippedCount: skippedRecords.length,
    records,
    skippedRecords,
    fieldMappings: cleanMappings,
  };
}

/** Header-only mapping convenience export (for ImportModal preview). */
export function autoMapFieldsFromEngine(
  headers: string[],
  sampleRows: Record<string, string>[] = []
): Record<string, string> {
  return smartMapFields(headers, sampleRows);
}
