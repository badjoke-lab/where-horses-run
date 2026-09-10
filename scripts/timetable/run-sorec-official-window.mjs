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
  SOREC_CURRENT_MEETING_FALLBACK_URL,
  enrichSorecRecordFromCurrentMeeting,
} from './sorec-current-meeting-enrichment.mjs';

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

async function fetchText(url, accept = 'text/html,application/xhtml+xml') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)',
        accept,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    return { text: await response.text(), finalUrl: response.url || url };
  } finally {
    clearTimeout(timer);
  }
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
const currentMeetingFixture = arg('current-meeting-fixture');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
const html = fixture
  ? fs.readFileSync(path.resolve(fixture), 'utf8')
  : (await fetchText(SOREC_PROGRAMME_REUNION_URL)).text;
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

const acquisition = {
  policy: 'retry_every_refresh_until_a_plus',
  lower_rank_is_terminal: false,
  eligible_lower_rank_meetings: candidate.records.filter((record) => record.capability_rank !== 'A+').length,
  detail_routes_published: 0,
  detail_routes_attempted: 0,
  detail_routes_succeeded: 0,
  detail_routes_failed: [],
  detail_routes_pending_publication: [],
};

let currentMeeting = null;
if (candidate.records.some((record) => record.capability_rank !== 'A+')) {
  acquisition.detail_routes_attempted += 1;
  try {
    currentMeeting = currentMeetingFixture
      ? { text: fs.readFileSync(path.resolve(currentMeetingFixture), 'utf8'), finalUrl: SOREC_CURRENT_MEETING_FALLBACK_URL }
      : await fetchText(SOREC_CURRENT_MEETING_FALLBACK_URL);
    acquisition.detail_routes_published += 1;
  } catch (error) {
    acquisition.detail_routes_failed.push({ route: 'turf-fr-sorec-derived-current-meeting', error: error.message });
  }
}

candidate.records = candidate.records.map((record) => {
  if (record.capability_rank === 'A+') return record;
  if (!currentMeeting) {
    acquisition.detail_routes_pending_publication.push(record.meeting_id);
    return record;
  }
  try {
    const enriched = enrichSorecRecordFromCurrentMeeting(record, { html: currentMeeting.text, enrichmentUrl: currentMeeting.finalUrl });
    if (!enriched) {
      acquisition.detail_routes_pending_publication.push(record.meeting_id);
      return record;
    }
    acquisition.detail_routes_succeeded += 1;
    return enriched;
  } catch (error) {
    acquisition.detail_routes_failed.push({ meeting_id: record.meeting_id, route: 'turf-fr-sorec-derived-current-meeting', error: error.message });
    return record;
  }
});

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
    method: 'official_programme_reunion_index_then_current_detail_enrichment',
    schedule_source_id: SOREC_SOURCE_ID,
    schedule_source_url: SOREC_PROGRAMME_REUNION_URL,
    source_row_count: diagnostics.source_row_count,
    rank_counts: rankCounts,
  },
  acquisition,
  window: {
    start_date: startDate,
    end_date_exclusive: endDateExclusive,
    days,
    coverage_claim: 'source_visible_partial',
    coverage_note: 'The official Programme Réunion index supplies meeting identity. Every refresh re-runs discovery and retries lower-rank meetings against the configured current-detail route; a prior C/B/B+/A never suppresses a later retry.',
  },
  records: candidate.records,
  diagnostics: { ...diagnostics, ...acquisition },
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
  rank_counts: rankCounts,
  unknown_venues: diagnostics.unknown_venues.length,
  parse_failures: diagnostics.parse_failures.length,
  detail_routes_attempted: acquisition.detail_routes_attempted,
  detail_routes_succeeded: acquisition.detail_routes_succeeded,
  detail_routes_pending_publication: acquisition.detail_routes_pending_publication.length,
  collection_target_rank: artifact.collection_target_rank,
  coverage_claim: artifact.window.coverage_claim,
}));
