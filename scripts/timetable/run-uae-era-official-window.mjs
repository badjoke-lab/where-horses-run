import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { discoverUaeEraCurrentSeasonFixtures } from './uae-era-current-season-discovery.mjs';

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

const discovery = await discoverUaeEraCurrentSeasonFixtures({ startDate: asOf, days });
const generatedAt = new Date().toISOString();
const records = [];
for (const fixture of discovery.fixtures) {
  const detail = collectDetail(fixture);
  const classification = detail?.classification ?? null;
  const usableDetail = detail && (detail.source_errors ?? []).length === 0 && ['B', 'B+', 'A', 'A+'].includes(classification?.rank);
  const capabilityRank = usableDetail ? classification.rank : 'C';
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
      source_id: usableDetail ? detail.source?.source_id ?? 'era-racecard-public-timetable' : discovery.schedule_source_id ?? 'era-season-calendar',
      official_url: usableDetail
        ? detail.observations?.[0]?.source_url ?? fixture.official_source_url ?? discovery.source_url
        : fixture.official_source_url ?? discovery.source_url,
    },
    detail_observation: {
      status: usableDetail ? 'available' : detail ? 'source_error' : 'not_published',
      race_count: usableDetail ? detail.meeting?.race_count ?? 0 : 0,
      conflicts: [],
    },
  });
}

const artifact = {
  schema_version: 'uae-era-official-window-candidates-v1',
  generated_at: generatedAt,
  source: 'era',
  country: 'United Arab Emirates',
  timezone: 'Asia/Dubai',
  discovery: {
    method: 'official_current_season_calendar_plus_racecards',
    schedule_source_id: discovery.schedule_source_id ?? 'era-season-calendar',
    schedule_source_url: discovery.source_url,
    official_fixture_count: discovery.fixtures.length,
  },
  window: { start_date: asOf, end_date_exclusive: discovery.end_date_exclusive, days },
  records,
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  start_date: asOf,
  end_date_exclusive: discovery.end_date_exclusive,
  official_fixture_count: records.length,
  rank_counts: Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((row) => row.capability_rank === rank).length])),
}));
