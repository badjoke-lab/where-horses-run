import fs from 'node:fs';
import path from 'node:path';
import {
  ENTRY_URL,
  SCHEMA,
  TIMEZONE,
  detectRaceSchedule,
  discoverFromIndexHtml,
  turkeyDate,
} from './tjk-current-future-candidates.mjs';

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function tjkDate(iso) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function dailyIndexUrl(iso) {
  const url = new URL(ENTRY_URL);
  url.searchParams.set('QueryParameter_Tarih', tjkDate(iso));
  url.searchParams.set('SehirAdi', 'Karma');
  return url.href;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`TJK programme page fetch failed: HTTP ${response.status} ${url}`);
  return response.text();
}

async function enrichBestAvailable(candidate) {
  try {
    const html = await fetchHtml(candidate.source_url);
    const detected = detectRaceSchedule(html);
    if (detected.schedule.length === 0) {
      return {
        ...candidate,
        detail_observation: {
          status: detected.conflicts.length ? 'conflict' : 'not_published',
          race_count: 0,
          conflicts: detected.conflicts,
        },
      };
    }
    return {
      ...candidate,
      capability_rank: 'A',
      first_race_time_local: detected.schedule[0].post_time_local,
      last_race_time_local: detected.schedule.at(-1).post_time_local,
      timetable_rows: detected.schedule,
      detail_observation: { status: 'available', race_count: detected.schedule.length, conflicts: [] },
    };
  } catch {
    return {
      ...candidate,
      detail_observation: { status: 'source_error', race_count: 0, conflicts: [] },
    };
  }
}

function parseArgs(argv) {
  const read = (name, fallback = null) => {
    const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const output = read('output');
  const days = Number(read('days', '30'));
  if (!output) throw new Error('Usage: node scripts/timetable/run-tjk-current-best-available.mjs --output <path> [--days 30]');
  if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be an integer from 1 to 62');
  return { output, days };
}

const { output, days } = parseArgs(process.argv.slice(2));
const now = new Date();
const startDate = turkeyDate(now);
const endDateExclusive = addDays(startDate, days);
const retrievedAt = now.toISOString();
const discoveredRecords = [];
let indexPagesFetched = 0;

for (let offset = 0; offset < days; offset += 1) {
  const date = addDays(startDate, offset);
  const pageUrl = dailyIndexUrl(date);
  const html = await fetchHtml(pageUrl);
  indexPagesFetched += 1;
  const discovered = discoverFromIndexHtml(html, pageUrl, startDate);
  discoveredRecords.push(...discovered.candidates.filter((record) => record.date === date));
}

const byId = new Map();
for (const record of discoveredRecords) {
  if (!byId.has(record.candidate_id)) byId.set(record.candidate_id, record);
}
const discoveredCandidates = [...byId.values()]
  .filter((record) => record.date >= startDate && record.date < endDateExclusive)
  .sort((a, b) => a.date.localeCompare(b.date) || a.racecourse.localeCompare(b.racecourse, 'tr'));

const candidates = [];
for (const candidate of discoveredCandidates) candidates.push(await enrichBestAvailable(candidate));

const rankCounts = {
  C: candidates.filter((record) => record.capability_rank === 'C').length,
  A: candidates.filter((record) => record.capability_rank === 'A').length,
};
const artifact = {
  schema: SCHEMA,
  source: 'tjk',
  country: 'Turkey',
  timezone: TIMEZONE,
  entry_url: ENTRY_URL,
  retrieved_at: retrievedAt,
  effective_today: startDate,
  technical_capability_rank: 'A+',
  publication_ceiling: 'A',
  collection_target_rank: 'best_available',
  raw_body_retained: false,
  disposition: {
    target: 'candidate_only',
    requires_review: true,
    canonical_write: false,
    public_write: false,
  },
  discovery: {
    method: 'official_programme_page_anchors_plus_page_discovered_detail',
    window_method: 'explicit_parameterized_daily_index_pages',
    index_pages_fetched: indexPagesFetched,
    detail_pages_attempted: candidates.length,
    discovered_before_window_filter: discoveredRecords.length,
    rank_counts: rankCounts,
  },
  candidates,
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days },
};

const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  start_date: startDate,
  end_date_exclusive: endDateExclusive,
  index_pages_fetched: indexPagesFetched,
  candidates: candidates.length,
  rank_counts: rankCounts,
}, null, 2));
