import fs from 'node:fs';
import path from 'node:path';
import { discoverNarConfirmedNonRunning } from './nar-non-running-discovery.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function japanDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
function dateRange(start, days) {
  const cursor = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: days }, () => {
    const value = cursor.toISOString().slice(0, 10);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    return value;
  });
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

const output = arg('output');
const days = Number(arg('days', '30'));
const asOf = arg('as-of', japanDate());
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const generatedAt = new Date().toISOString();
const dates = dateRange(asOf, days);
let discovery = { records: [], diagnostics: [] };
try {
  discovery = await discoverNarConfirmedNonRunning({ dates, checkedAt: generatedAt });
} catch (error) {
  discovery = {
    records: [],
    diagnostics: [{
      source_url: 'https://www.keiba.go.jp/jranet/topics/',
      status: 'discovery_failed',
      error: String(error?.message ?? error),
    }],
  };
}

const canonicalIds = new Set((readJson(canonicalPath).meetings ?? []).map((row) => row.meeting_id));
const accepted = discovery.records.filter((row) => canonicalIds.has(row.meeting_id));
const unmatched = discovery.records.filter((row) => !canonicalIds.has(row.meeting_id));
const failures = discovery.diagnostics.filter((row) => ['index_fetch_failed', 'discovery_failed'].includes(row.status));

const artifact = {
  schema_version: 'nar-non-running-evidence-v1',
  generated_at: generatedAt,
  window: { start_date: asOf, days },
  acquisition_attempt: {
    attempted_at: generatedAt,
    status: failures.length ? 'network_error' : 'success',
    source_id: 'nar-jranet-explicit-non-running',
    route_id: null,
    error_code: failures.length ? 'fetch_error' : null,
  },
  meeting_presence_records: accepted,
  unmatched_records: unmatched,
  diagnostics: discovery.diagnostics,
};

const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  confirmed_non_running_count: accepted.length,
  unmatched_count: unmatched.length,
  index_failure_count: failures.length,
}));
