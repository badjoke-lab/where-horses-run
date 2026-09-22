import fs from 'node:fs';
import path from 'node:path';
import {
  SOREC_PROGRAMME_REUNION_URL,
  SOREC_SOURCE_ID,
  SOREC_SYSTEM_ID,
  SOREC_TIMEZONE,
  buildSorecProgrammeCandidate,
} from './sorec-programme-reunion-core.mjs';
import {
  SOREC_NON_RUNNING_CALENDAR_URL,
  buildSorecConfirmedNonRunningRecords,
} from './sorec-non-running-evidence.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SOREC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

async function fetchHtml(url, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function canonicalMeetings(file) {
  if (!fs.existsSync(file)) return [];
  const dataset = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(dataset?.meetings) ? dataset.meetings : [];
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
const nonRunningFixture = arg('non-running-fixture');
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
const html = fixture
  ? fs.readFileSync(path.resolve(fixture), 'utf8')
  : await fetchHtml(SOREC_PROGRAMME_REUNION_URL, 'SOREC Programme Réunion');
const { candidate, diagnostics } = buildSorecProgrammeCandidate({
  html,
  checkedAt: generatedAt,
  startDate,
  endDateExclusive,
});

if (diagnostics.unknown_venues.length > 0) {
  throw new Error(`SOREC unknown venue(s) in requested window: ${JSON.stringify(diagnostics.unknown_venues)}`);
}
if (diagnostics.parse_failures.length > 0) {
  throw new Error(`SOREC parse failure(s) in requested window: ${JSON.stringify(diagnostics.parse_failures)}`);
}

let meetingPresenceRecords = [];
let nonRunningDiagnostics = {
  status: 'not_checked',
  source_url: SOREC_NON_RUNNING_CALENDAR_URL,
  confirmed_non_running_count: 0,
};
try {
  const nonRunningHtml = nonRunningFixture
    ? fs.readFileSync(path.resolve(nonRunningFixture), 'utf8')
    : await fetchHtml(SOREC_NON_RUNNING_CALENDAR_URL, 'SOREC status-bearing calendar');
  const nonRunning = buildSorecConfirmedNonRunningRecords({
    html: nonRunningHtml,
    canonicalMeetings: canonicalMeetings(canonicalPath),
    sourceUrl: SOREC_NON_RUNNING_CALENDAR_URL,
    checkedAt: generatedAt,
    startDate,
    endDateExclusive,
  });
  meetingPresenceRecords = nonRunning.meeting_presence_records;
  nonRunningDiagnostics = {
    status: 'success',
    source_url: SOREC_NON_RUNNING_CALENDAR_URL,
    confirmed_non_running_count: meetingPresenceRecords.length,
    ...nonRunning.diagnostics,
  };
} catch (error) {
  nonRunningDiagnostics = {
    status: 'source_error',
    source_url: SOREC_NON_RUNNING_CALENDAR_URL,
    confirmed_non_running_count: 0,
    error: error instanceof Error ? error.message : String(error),
  };
}

const rankCounts = Object.fromEntries(
  ['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, candidate.records.filter((record) => record.capability_rank === rank).length]),
);

const artifact = {
  schema_version: 'sorec-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'morocco',
  authority_id: 'sorec',
  racing_system_id: SOREC_SYSTEM_ID,
  timezone: SOREC_TIMEZONE,
  source_id: SOREC_SOURCE_ID,
  collection_target_rank: 'best_available',
  raw_body_retained: false,
  discovery: {
    method: 'official_programme_reunion_index',
    schedule_source_id: SOREC_SOURCE_ID,
    schedule_source_url: SOREC_PROGRAMME_REUNION_URL,
    source_row_count: diagnostics.source_row_count,
    rank_counts: rankCounts,
    non_running_source_id: 'sorec-calendar-explicit-postponement',
    non_running_source_url: SOREC_NON_RUNNING_CALENDAR_URL,
    non_running_source_status: nonRunningDiagnostics.status,
  },
  window: {
    start_date: startDate,
    end_date_exclusive: endDateExclusive,
    days,
    coverage_claim: 'source_visible_partial',
    coverage_note: 'Programme Réunion is positive evidence only. Absence is never cancellation. The separate official calendar contributes only bounded explicit REPOR postponement evidence when safely bound to one canonical meeting.',
  },
  records: candidate.records,
  meeting_presence_records: meetingPresenceRecords,
  diagnostics: {
    ...diagnostics,
    non_running: nonRunningDiagnostics,
  },
};

const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  source_url: SOREC_PROGRAMME_REUNION_URL,
  source_row_count: diagnostics.source_row_count,
  start_date: startDate,
  end_date_exclusive: endDateExclusive,
  meetings_emitted: artifact.records.length,
  confirmed_non_running_count: meetingPresenceRecords.length,
  non_running_source_status: nonRunningDiagnostics.status,
  rank_counts: rankCounts,
  unknown_venues: diagnostics.unknown_venues.length,
  parse_failures: diagnostics.parse_failures.length,
  collection_target_rank: artifact.collection_target_rank,
  coverage_claim: artifact.window.coverage_claim,
}));
