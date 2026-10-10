import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildUaeEraDiscoveryFailureArtifact, discoverUaeEraCurrentSeasonFixtures } from './uae-era-current-season-discovery.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function dubaiDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function collectDetail(fixture) {
  const result = spawnSync(process.execPath, [
    'scripts/timetable/collect-uae-era-detail-artifacts.mjs',
    `--date=${fixture.date}`,
    `--racecourse-id=${fixture.racecourse_id}`,
  ], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (result.error || result.status !== 0) return null;
  try { return JSON.parse(result.stdout); } catch { return null; }
}

const output = arg('output');
const days = Number(arg('days', '30'));
const asOf = arg('as-of', dubaiDate());
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error('--days must be 1..90');

const generatedAt = new Date().toISOString();
let discovery;
try {
  discovery = await discoverUaeEraCurrentSeasonFixtures({ startDate: asOf, days });
} catch (error) {
  const artifact = buildUaeEraDiscoveryFailureArtifact({ startDate: asOf, days, generatedAt, error });
  const absolute = path.resolve(output);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({
    output,
    start_date: asOf,
    end_date_exclusive: artifact.window.end_date_exclusive,
    official_fixture_count: 0,
    confirmed_non_running_count: 0,
    rank_counts: { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 },
    source_errors: artifact.diagnostics.source_errors.length,
    acquisition_status: artifact.acquisition_attempt.status,
    preserved_verified_state: true,
  }));
  process.exit(0);
}
const records = [];
const meetingPresenceRecords = [];
for (const fixture of discovery.fixtures) {
  const detail = collectDetail(fixture);
  const classification = detail?.classification ?? null;
  if (detail?.presence_observation?.state === 'confirmed_non_running') meetingPresenceRecords.push(detail.presence_observation);
  const usableDetail = detail && (detail.source_errors ?? []).length === 0 && ['B', 'B+', 'A', 'A+'].includes(classification?.rank);
  const pendingPublication = detail?.publication_status === 'not_published';
  const capabilityRank = usableDetail ? classification.rank : 'C';
  const scheduleUrl = fixture.source?.official_url ?? discovery.official_url;
  records.push({
    ...fixture,
    country_id: 'united-arab-emirates',
    authority_id: 'emirates-racing-authority',
    racing_system_id: 'uae-national-racing-system',
    timezone: 'Asia/Dubai',
    capability_rank: capabilityRank,
    first_race_time_local: usableDetail ? classification.first_race_time_local ?? null : null,
    last_race_time_local: usableDetail ? classification.last_race_time_local ?? null : null,
    timetable_rows: usableDetail ? classification.timetable_rows ?? [] : [],
    source: {
      source_id: usableDetail ? detail.source?.source_id ?? 'era-racecard-public-timetable' : 'era-season-calendar',
      official_url: usableDetail
        ? detail.observations?.[0]?.source_url ?? scheduleUrl
        : scheduleUrl,
    },
    detail_observation: {
      status: usableDetail ? 'available' : pendingPublication ? 'not_published' : detail ? 'source_error' : 'not_published',
      ...(usableDetail ? { evaluated_capability_rank: 'A' } : {}),
      race_count: usableDetail ? detail.meeting?.race_count ?? 0 : 0,
      conflicts: [],
    },
  });
}

const artifact = {
  schema_version: 'uae-era-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'united-arab-emirates',
  authority_id: 'emirates-racing-authority',
  racing_system_id: 'uae-national-racing-system',
  source_id: 'era-season-calendar',
  source: 'era',
  country: 'United Arab Emirates',
  timezone: 'Asia/Dubai',
  acquisition_attempt: {
    attempted_at: generatedAt,
    status: 'success',
    source_id: 'era-season-calendar',
    route_id: 'era-current-season-calendar',
    error_code: null,
  },
  discovery: {
    method: 'official_current_season_calendar_plus_racecards',
    schedule_source_id: 'era-season-calendar',
    schedule_source_url: discovery.official_url,
    fetched_url: discovery.fetched_url,
    official_fixture_count: discovery.fixtures.length,
    route_attempts: discovery.route_attempts ?? [],
  },
  window: { start_date: asOf, end_date_exclusive: discovery.end_date_exclusive, days, coverage_claim: 'official_source_visible_horizon' },
  records,
  meeting_presence_records: meetingPresenceRecords,
  diagnostics: { source_errors: [], parse_failures: [], unknown_venues: [] },
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  start_date: asOf,
  end_date_exclusive: discovery.end_date_exclusive,
  official_fixture_count: records.length,
  confirmed_non_running_count: meetingPresenceRecords.length,
  rank_counts: Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((row) => row.capability_rank === rank).length])),
}));
