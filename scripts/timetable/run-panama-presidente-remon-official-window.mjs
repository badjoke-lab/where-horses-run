import fs from 'node:fs';
import path from 'node:path';
import {
  PANAMA_AUTHORITY_ID,
  PANAMA_PROGRAMME_URL,
  PANAMA_SOURCE_ID,
  PANAMA_SYSTEM_ID,
  PANAMA_TIMEZONE,
  buildPanamaMeetingRecord,
  parsePanamaProgrammePage,
} from './panama-presidente-remon-core.mjs';

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
    timeZone: PANAMA_TIMEZONE,
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
async function getHtml(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language': 'es-PA,es;q=0.9,en;q=0.6',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { html: await response.text(), url: response.url || url };
}

const output = arg('output');
const days = Number(arg('days', '30'));
const start = arg('as-of', localDate());
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');
const end = plusDays(start, days);
const generatedAt = new Date().toISOString();

let sourceUrl = PANAMA_PROGRAMME_URL;
let allRows = [];
const sourceErrors = [];
const parseFailures = [];
let attemptStatus = 'success';
try {
  const fetched = await getHtml(PANAMA_PROGRAMME_URL);
  sourceUrl = fetched.url;
  allRows = parsePanamaProgrammePage(fetched.html, { sourceUrl: fetched.url });
  if (allRows.length === 0) {
    parseFailures.push({ code: 'no_programa_oficial_events_parsed', source_url: fetched.url });
    attemptStatus = 'parse_error';
  }
} catch (error) {
  attemptStatus = 'network_error';
  sourceErrors.push({
    stage: 'programme_calendar_html',
    source_url: PANAMA_PROGRAMME_URL,
    error: String(error?.message ?? error),
  });
}

const rows = allRows.filter((row) => inWindow(row.date, start, end));
const records = rows.map((row) => buildPanamaMeetingRecord(row, { checkedAt: generatedAt }));
const rankCounts = Object.fromEntries(
  ['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]),
);
const completionCounts = Object.fromEntries(
  ['promoted', 'complete_current_best_available', 'pending_publication', 'retry_required', 'implementation_gap', 'not_applicable']
    .map((name) => [name, records.filter((record) => record.acquisition_completion?.disposition === name).length]),
);

const artifact = {
  schema_version: 'panama-presidente-remon-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'panama',
  authority_id: PANAMA_AUTHORITY_ID,
  racing_system_id: PANAMA_SYSTEM_ID,
  timezone: PANAMA_TIMEZONE,
  source_id: PANAMA_SOURCE_ID,
  collection_target_rank: 'best_available',
  raw_body_retained: false,
  acquisition_attempt: {
    attempted_at: generatedAt,
    status: attemptStatus,
    source_id: PANAMA_SOURCE_ID,
    route_id: 'presidente-remon-programa-oficial-category-html',
    error_code: sourceErrors.length ? 'programme_calendar_fetch_failed' : (parseFailures.length ? 'programme_calendar_parse_failed' : null),
  },
  discovery: {
    method: 'official_programa_oficial_calendar_html',
    source_url: sourceUrl,
    source_visible_rows: allRows.length,
    rank_counts: rankCounts,
    completion_counts: completionCounts,
  },
  window: {
    start_date: start,
    end_date_exclusive: end,
    days,
    coverage_claim: sourceErrors.length || parseFailures.length
      ? 'acquisition_failed_preserve_verified_state'
      : 'official_source_visible_horizon',
    coverage_note: 'The official Programa Oficial category supplies meeting-date identity for Hipódromo Presidente Remón at rank C. The category is a source-visible published horizon, not proof that unlisted future dates are non-running. Event/operating hours are not race post times and are never promoted.',
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
  source_visible_rows: allRows.length,
  meetings_emitted: records.length,
  rank_counts: rankCounts,
  completion_counts: completionCounts,
  source_errors: sourceErrors.length,
  parse_failures: parseFailures.length,
  raw_body_retained: false,
}));
