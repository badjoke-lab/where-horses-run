import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  SWEDEN_AUTHORITY_ID,
  SWEDEN_CALENDAR_PDF_URL,
  SWEDEN_CALENDAR_URL,
  SWEDEN_SOURCE_ID,
  SWEDEN_SYSTEM_ID,
  SWEDEN_TIMEZONE,
  buildSwedenMeetingRecord,
  parseSwedenCalendarText,
} from './sweden-svensk-galopp-core.mjs';

function arg(name, fallback = null) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}
function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}
function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SWEDEN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function inWindow(date, start, end) {
  return date >= start && date < end;
}
function write(file, value) {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}
async function getPdfText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept: 'application/pdf,*/*;q=0.8',
      'accept-language': 'sv-SE,sv;q=0.9,en;q=0.7',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || String.fromCharCode(...bytes.slice(0, 4)) !== '%PDF') {
    throw new Error('Svensk Galopp calendar response is not PDF');
  }
  const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
  const lines = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const value = item.str.replace(/\s+/g, ' ').trim();
      if (value) line += `${line ? ' ' : ''}${value}`;
      if (item.hasEOL && line) {
        lines.push(line);
        line = '';
      }
    }
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

const output = arg('output');
const days = Number(arg('days', '30'));
const start = arg('as-of', localDate());
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');
const end = plusDays(start, days);
const generatedAt = new Date().toISOString();

let allRows = [];
const sourceErrors = [];
const parseFailures = [];
let attemptStatus = 'success';
try {
  const text = await getPdfText(SWEDEN_CALENDAR_PDF_URL);
  const parsed = parseSwedenCalendarText(text, { sourceUrl: SWEDEN_CALENDAR_PDF_URL });
  allRows = parsed.records;
  parseFailures.push(...parsed.parse_failures);
} catch (error) {
  attemptStatus = 'network_error';
  sourceErrors.push({
    stage: 'calendar_pdf',
    source_url: SWEDEN_CALENDAR_PDF_URL,
    error: String(error?.message ?? error),
  });
}

const rows = allRows.filter((row) => inWindow(row.date, start, end));
const records = rows.map((row) => buildSwedenMeetingRecord(row, { checkedAt: generatedAt }));
const rankCounts = Object.fromEntries(
  ['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]),
);
const completionCounts = Object.fromEntries(
  ['promoted', 'complete_current_best_available', 'pending_publication', 'retry_required', 'implementation_gap', 'not_applicable']
    .map((name) => [name, records.filter((record) => record.acquisition_completion?.disposition === name).length]),
);

const artifact = {
  schema_version: 'sweden-svensk-galopp-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'sweden',
  authority_id: SWEDEN_AUTHORITY_ID,
  racing_system_id: SWEDEN_SYSTEM_ID,
  timezone: SWEDEN_TIMEZONE,
  source_id: SWEDEN_SOURCE_ID,
  collection_target_rank: 'best_available',
  raw_body_retained: false,
  acquisition_attempt: {
    attempted_at: generatedAt,
    status: attemptStatus,
    source_id: SWEDEN_SOURCE_ID,
    route_id: 'svensk-galopp-2026-calendar-pdf',
    error_code: sourceErrors.length ? 'calendar_fetch_failed' : null,
  },
  discovery: {
    method: 'official_svensk_galopp_2026_calendar_pdf',
    source_url: SWEDEN_CALENDAR_PDF_URL,
    calendar_landing_url: SWEDEN_CALENDAR_URL,
    annual_rows: allRows.length,
    rank_counts: rankCounts,
    completion_counts: completionCounts,
  },
  window: {
    start_date: start,
    end_date_exclusive: end,
    days,
    coverage_claim: sourceErrors.length ? 'acquisition_failed_preserve_verified_state' : 'official_annual_calendar_source_visible_horizon',
    coverage_note: 'The official Svensk Galopp 2026 race-day calendar is the meeting-date and venue mother set. Its generic calendar time is not treated as a verified first-race post time. Current event pages may later promote individual meetings when an explicit Första starttid is connected. Source absence or acquisition failure never confirms non-running.',
  },
  records,
  diagnostics: {
    source_errors: sourceErrors,
    parse_failures: parseFailures,
    unknown_venues: [],
    source_warnings: [],
  },
};
write(output, artifact);
console.log(JSON.stringify({
  output,
  start_date: start,
  end_date_exclusive: end,
  annual_rows: allRows.length,
  meetings_emitted: records.length,
  rank_counts: rankCounts,
  completion_counts: completionCounts,
  source_errors: sourceErrors.length,
  parse_failures: parseFailures.length,
  raw_body_retained: false,
}));
