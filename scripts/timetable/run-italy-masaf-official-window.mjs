import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  ITALY_AUTHORITY_ID,
  ITALY_GALLOP_SYSTEM_ID,
  ITALY_NORMATIVE_INDEX_URL,
  ITALY_SOURCE_ID,
  ITALY_TIMEZONE,
  ITALY_TROT_SYSTEM_ID,
  buildItalyMasafMeetingRecord,
  parseItalyMasafCalendarAttachmentUrl,
  parseItalyMasafCalendarPages,
  parseItalyMasafLatestCalendarPageUrl,
} from './italy-masaf-core.mjs';

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
    timeZone: ITALY_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function inWindow(date, start, end) { return date >= start && date < end; }
function write(file, value) {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}
async function getText(url, accept = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5') {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept,
      'accept-language': 'it-IT,it;q=0.9,en;q=0.7',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { text: await response.text(), url: response.url || url };
}
async function getPdfPages(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept: 'application/pdf,*/*;q=0.8',
      'accept-language': 'it-IT,it;q=0.9,en;q=0.7',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || String.fromCharCode(...bytes.slice(0, 4)) !== '%PDF') throw new Error('MASAF calendar response is not PDF');
  const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push({
      page_number: pageNumber,
      items: content.items.filter((item) => 'str' in item).map((item) => ({
        str: item.str,
        x: item.transform?.[4],
        y: item.transform?.[5],
        width: item.width,
        height: item.height,
      })),
    });
  }
  return pages;
}
function rankCounts(records) {
  return Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]));
}
function completionCounts(records) {
  return Object.fromEntries(['promoted', 'complete_current_best_available', 'pending_publication', 'retry_required', 'implementation_gap', 'not_applicable']
    .map((name) => [name, records.filter((record) => record.acquisition_completion?.disposition === name).length]));
}
function artifactFor({ systemId, records, start, end, days, generatedAt, sourceUrl, calendarPageUrl, amendmentDate, sourceErrors, parseFailures, unknownVenues }) {
  return {
    schema_version: 'italy-masaf-official-window-candidates-v1',
    generated_at: generatedAt,
    country_id: 'italy',
    authority_id: ITALY_AUTHORITY_ID,
    racing_system_id: systemId,
    timezone: ITALY_TIMEZONE,
    source_id: ITALY_SOURCE_ID,
    collection_target_rank: 'best_available',
    raw_body_retained: false,
    acquisition_attempt: {
      attempted_at: generatedAt,
      status: sourceErrors.length ? 'network_error' : 'success',
      source_id: ITALY_SOURCE_ID,
      route_id: 'masaf-national-calendar-pdf',
      error_code: sourceErrors.length ? 'calendar_fetch_failed' : null,
    },
    discovery: {
      method: 'masaf_2026_normative_index_latest_calendar_amendment_plus_pdf',
      normative_index_url: ITALY_NORMATIVE_INDEX_URL,
      calendar_page_url: calendarPageUrl,
      schedule_source_url: sourceUrl,
      amendment_date: amendmentDate,
      parsed_rows_all_systems: null,
      rank_counts: rankCounts(records),
      completion_counts: completionCounts(records),
    },
    window: {
      start_date: start,
      end_date_exclusive: end,
      days,
      coverage_claim: sourceErrors.length ? 'acquisition_failed_preserve_verified_state' : 'official_national_calendar_source_visible_horizon',
      coverage_note: 'The latest discovered official MASAF 2026 national racing calendar is the meeting-date and physical-racecourse mother set. Trot and gallop contexts are retained separately; obstacle-coded days are retained in the MASAF gallop system and mixed-coded days are represented in both systems. No first-race or per-race post time is inferred. Source omission, acquisition failure, or parser failure never proves non-running.',
    },
    records,
    diagnostics: {
      source_errors: sourceErrors,
      parse_failures: parseFailures,
      unknown_venues: unknownVenues,
      source_warnings: [],
    },
  };
}

const gallopOutput = arg('gallop-output');
const trotOutput = arg('trot-output');
const days = Number(arg('days', '30'));
const start = arg('as-of', localDate());
if (!gallopOutput || !trotOutput) throw new Error('--gallop-output=<path> and --trot-output=<path> are required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');
const end = plusDays(start, days);
const generatedAt = new Date().toISOString();

const sourceErrors = [];
let parseFailures = [];
let unknownVenues = [];
let allRows = [];
let scheduleSourceUrl = null;
let calendarPageUrl = null;
let amendmentDate = null;

try {
  const index = await getText(ITALY_NORMATIVE_INDEX_URL);
  const discovered = parseItalyMasafLatestCalendarPageUrl(index.text, { baseUrl: index.url });
  calendarPageUrl = discovered.url;
  amendmentDate = discovered.iso;
  const page = await getText(calendarPageUrl);
  scheduleSourceUrl = parseItalyMasafCalendarAttachmentUrl(page.text, { baseUrl: page.url });
  const pages = await getPdfPages(scheduleSourceUrl);
  const parsed = parseItalyMasafCalendarPages(pages, { year: Number(start.slice(0, 4)), sourceUrl: scheduleSourceUrl });
  allRows = parsed.records;
  parseFailures = parsed.parse_failures;
  unknownVenues = parsed.unknown_venues;
} catch (error) {
  sourceErrors.push({
    stage: 'masaf_calendar_discovery_or_pdf',
    source_url: scheduleSourceUrl ?? calendarPageUrl ?? ITALY_NORMATIVE_INDEX_URL,
    error: String(error?.message ?? error),
  });
}

const rows = allRows.filter((row) => inWindow(row.date, start, end));
const allRecords = rows.map((row) => buildItalyMasafMeetingRecord(row, { checkedAt: generatedAt }));
const gallopRecords = allRecords.filter((record) => record.racing_system_id === ITALY_GALLOP_SYSTEM_ID);
const trotRecords = allRecords.filter((record) => record.racing_system_id === ITALY_TROT_SYSTEM_ID);

const gallopArtifact = artifactFor({
  systemId: ITALY_GALLOP_SYSTEM_ID, records: gallopRecords, start, end, days, generatedAt,
  sourceUrl: scheduleSourceUrl, calendarPageUrl, amendmentDate, sourceErrors, parseFailures, unknownVenues,
});
const trotArtifact = artifactFor({
  systemId: ITALY_TROT_SYSTEM_ID, records: trotRecords, start, end, days, generatedAt,
  sourceUrl: scheduleSourceUrl, calendarPageUrl, amendmentDate, sourceErrors, parseFailures, unknownVenues,
});
gallopArtifact.discovery.parsed_rows_all_systems = allRows.length;
trotArtifact.discovery.parsed_rows_all_systems = allRows.length;

write(gallopOutput, gallopArtifact);
write(trotOutput, trotArtifact);
console.log(JSON.stringify({
  gallop_output: gallopOutput,
  trot_output: trotOutput,
  start_date: start,
  end_date_exclusive: end,
  amendment_date: amendmentDate,
  schedule_source_url: scheduleSourceUrl,
  parsed_rows_all_systems: allRows.length,
  gallop_meetings_emitted: gallopRecords.length,
  trot_meetings_emitted: trotRecords.length,
  gallop_rank_counts: rankCounts(gallopRecords),
  trot_rank_counts: rankCounts(trotRecords),
  gallop_completion_counts: completionCounts(gallopRecords),
  trot_completion_counts: completionCounts(trotRecords),
  source_errors: sourceErrors.length,
  parse_failures: parseFailures.length,
  unknown_venues: unknownVenues.length,
  raw_body_retained: false,
}));
