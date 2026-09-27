import fs from 'node:fs';
import path from 'node:path';
import {
  ESTONIA_AUTHORITY_ID,
  ESTONIA_CALENDAR_URL,
  ESTONIA_SOURCE_ID,
  ESTONIA_SYSTEM_ID,
  ESTONIA_TIMEZONE,
  buildEstoniaMeetingRecord,
  parseEstoniaAnnualCalendar,
} from './estonia-tuula-core.mjs';

function arg(name, fallback = null) {
  const prefix = '--' + name + '=';
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function plusDays(date, count) {
  const value = new Date(date + 'T00:00:00Z');
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ESTONIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

function write(file, value) {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n');
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language': 'et-EE,et;q=0.9,en;q=0.6',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return { html: await response.text(), url: response.url || url };
}

function rankCounts(records) {
  return Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]));
}

function completionCounts(records) {
  return Object.fromEntries(
    ['promoted', 'complete_current_best_available', 'pending_publication', 'retry_required', 'implementation_gap', 'not_applicable']
      .map((name) => [name, records.filter((record) => record.acquisition_completion?.disposition === name).length]),
  );
}

const output = arg('output');
const days = Number(arg('days', '30'));
const start = arg('as-of', localDate());
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');
const end = plusDays(start, days);
const generatedAt = new Date().toISOString();

let sourceUrl = ESTONIA_CALENDAR_URL;
let allRows = [];
const sourceErrors = [];
const parseFailures = [];
let attemptStatus = 'success';

try {
  const fetched = await fetchHtml(ESTONIA_CALENDAR_URL);
  sourceUrl = fetched.url;
  allRows = parseEstoniaAnnualCalendar(fetched.html, { sourceUrl: fetched.url });
  if (allRows.length === 0) {
    parseFailures.push({ code: 'no_racing_dates_parsed', source_url: fetched.url });
    attemptStatus = 'parse_error';
  }
} catch (error) {
  sourceErrors.push({ stage: 'annual_calendar_html', source_url: ESTONIA_CALENDAR_URL, error: String(error?.message ?? error) });
  attemptStatus = 'network_error';
}

const rows = allRows.filter((row) => row.date >= start && row.date < end);
const records = rows.map((row) => buildEstoniaMeetingRecord(row, { checkedAt: generatedAt }));

const artifact = {
  schema_version: 'estonia-tuula-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'estonia',
  authority_id: ESTONIA_AUTHORITY_ID,
  racing_system_id: ESTONIA_SYSTEM_ID,
  timezone: ESTONIA_TIMEZONE,
  source_id: ESTONIA_SOURCE_ID,
  collection_target_rank: 'best_available',
  raw_body_retained: false,
  acquisition_attempt: {
    attempted_at: generatedAt,
    status: attemptStatus,
    source_id: ESTONIA_SOURCE_ID,
    route_id: 'hipodroom-2026-event-calendar-html',
    error_code: sourceErrors.length ? 'annual_calendar_fetch_failed' : (parseFailures.length ? 'annual_calendar_parse_failed' : null),
  },
  discovery: {
    method: 'official_annual_event_calendar_html',
    source_url: sourceUrl,
    annual_racing_rows: allRows.length,
    rank_counts: rankCounts(records),
    completion_counts: completionCounts(records),
  },
  window: {
    start_date: start,
    end_date_exclusive: end,
    days,
    coverage_claim: sourceErrors.length || parseFailures.length ? 'acquisition_failed_preserve_verified_state' : 'official_annual_calendar',
    coverage_note: 'The official Hipodroom 2026 event calendar is treated as the meeting-date mother set for the reviewed Tuula scope. Explicit non-racing entries are excluded; source failure does not prove non-running.',
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
  annual_racing_rows: allRows.length,
  meetings_emitted: records.length,
  dates: records.map((record) => record.date),
  rank_counts: rankCounts(records),
  completion_counts: completionCounts(records),
  source_errors: sourceErrors.length,
  parse_failures: parseFailures.length,
  raw_body_retained: false,
}));
