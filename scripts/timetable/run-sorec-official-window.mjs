import fs from 'node:fs';
import path from 'node:path';
import {
  SOREC_PROGRAMME_REUNION_URL,
  SOREC_SOURCE_ID,
  SOREC_SYSTEM_ID,
  SOREC_TIMEZONE,
  buildSorecRankCCandidate,
} from './sorec-programme-reunion-core.mjs';

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

async function fetchOfficialHtml() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(SOREC_PROGRAMME_REUNION_URL, {
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`SOREC Programme Réunion returned HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
const html = fixture ? fs.readFileSync(path.resolve(fixture), 'utf8') : await fetchOfficialHtml();
const { candidate, diagnostics } = buildSorecRankCCandidate({
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
if (!fixture && candidate.records.length === 0) {
  throw new Error(`SOREC Programme Réunion exposed no recognized meeting in ${startDate}..${endDateExclusive}`);
}

const artifact = {
  schema_version: 'sorec-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'morocco',
  authority_id: 'sorec',
  racing_system_id: SOREC_SYSTEM_ID,
  timezone: SOREC_TIMEZONE,
  source_id: SOREC_SOURCE_ID,
  discovery: {
    method: 'official_programme_reunion_index',
    schedule_source_id: SOREC_SOURCE_ID,
    schedule_source_url: SOREC_PROGRAMME_REUNION_URL,
    public_rank_ceiling: 'C',
  },
  window: {
    start_date: startDate,
    end_date_exclusive: endDateExclusive,
    days,
    coverage_claim: 'source_visible_partial',
    coverage_note: 'The Programme Réunion index is used only for meeting identities currently exposed by SOREC; absence is not treated as proof of no meeting across the full requested window.',
  },
  records: candidate.records,
  diagnostics,
};

const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  source_url: SOREC_PROGRAMME_REUNION_URL,
  start_date: startDate,
  end_date_exclusive: endDateExclusive,
  meetings_emitted: artifact.records.length,
  unknown_venues: diagnostics.unknown_venues.length,
  parse_failures: diagnostics.parse_failures.length,
  capability_rank: 'C',
  coverage_claim: artifact.window.coverage_claim,
}));
