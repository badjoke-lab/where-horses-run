import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const OFFICIAL_PLAN_URL = 'https://race.kra.co.kr/raceoper/RaceoperView.do?Sub=1&meet=1';
const DETAIL_CHILD_TIMEOUT_MS = 60_000;
const PLAN_2026 = Object.freeze({
  year: 2026,
  season_start: '2026-01-02',
  season_end_inclusive: '2026-12-27',
  closures: [
    ['2026-02-20', '2026-02-22'],
    ['2026-07-31', '2026-08-02'],
    ['2026-09-25', '2026-09-27'],
  ],
  yeongcheon_start: '2026-09-13',
  yeongcheon_end_inclusive: '2026-12-06',
  holiday_mondays: ['2026-03-02', '2026-08-17', '2026-10-05'],
  expected_days: { seoul: 101, busan: 86, yeongcheon: 12, jeju: 101 },
});
const TRACK = Object.freeze({
  seoul: { racecourse_id: 'seoul-racecourse', detail_supported: true },
  busan: { racecourse_id: 'busan-gyeongnam-racecourse', detail_supported: true },
  yeongcheon: { racecourse_id: 'yeongcheon-racecourse', detail_supported: false },
  jeju: { racecourse_id: 'jeju-racecourse', detail_supported: true },
});

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function seoulDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}
function eachDate(start, endInclusive) {
  const rows = [];
  for (let cursor = start; cursor <= endInclusive; cursor = plusDays(cursor, 1)) rows.push(cursor);
  return rows;
}
function inClosure(date) {
  return PLAN_2026.closures.some(([start, end]) => date >= start && date <= end);
}
function generatedPlanMeetings() {
  const rows = [];
  const add = (date, key) => rows.push({
    meeting_id: `kra-${TRACK[key].racecourse_id}-${date}`,
    country_id: 'south-korea',
    authority_id: 'korea-racing-authority',
    racing_system_id: 'kra-national-racing-system',
    racecourse_id: TRACK[key].racecourse_id,
    date,
    timezone: 'Asia/Seoul',
    capability_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: { source_id: 'kra-annual-race-operation-plan', official_url: OFFICIAL_PLAN_URL },
    detail_observation: { status: 'not_published', race_count: 0, conflicts: [] },
  });
  for (const date of eachDate(PLAN_2026.season_start, PLAN_2026.season_end_inclusive)) {
    if (inClosure(date)) continue;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 5) { add(date, 'busan'); add(date, 'jeju'); }
    if (weekday === 6) { add(date, 'seoul'); add(date, 'jeju'); }
    if (weekday === 0) {
      add(date, 'seoul');
      if (date >= PLAN_2026.yeongcheon_start && date <= PLAN_2026.yeongcheon_end_inclusive) add(date, 'yeongcheon');
      else add(date, 'busan');
    }
    if (PLAN_2026.holiday_mondays.includes(date)) { add(date, 'seoul'); add(date, 'jeju'); }
  }
  return rows;
}
function trackKey(racecourseId) {
  return Object.entries(TRACK).find(([, value]) => value.racecourse_id === racecourseId)?.[0] ?? null;
}
function validatePlan(rows, html) {
  if (!html.includes('2026') || !html.includes('9.13') || !html.includes('12.6') || !html.includes('9.25') || !html.includes('9.27')) {
    throw new Error('KRA official operation-plan fingerprint changed; refusing inferred mother set');
  }
  const counts = { seoul: 0, busan: 0, yeongcheon: 0, jeju: 0 };
  for (const row of rows) counts[trackKey(row.racecourse_id)] += 1;
  for (const [key, expected] of Object.entries(PLAN_2026.expected_days)) {
    if (counts[key] !== expected) throw new Error(`KRA official-plan generated ${key} day count ${counts[key]} != ${expected}`);
    if (!html.includes(`${expected}日`) && !html.includes(`${expected}일`)) throw new Error(`KRA official page no longer exposes expected ${key} day count ${expected}`);
  }
  return counts;
}
async function fetchOfficialPlan() {
  const response = await fetch(OFFICIAL_PLAN_URL, {
    headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'WhereHorsesRun/1.0 public timetable acquisition' },
    redirect: 'follow', signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`KRA official plan request failed: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const ascii = new TextDecoder('windows-1252').decode(bytes.slice(0, Math.min(bytes.length, 8192)));
  const charset = ascii.match(/charset\s*=\s*["']?([^"'\s;/>]+)/i)?.[1]?.toLowerCase() ?? 'euc-kr';
  try { return new TextDecoder(charset).decode(bytes); } catch { return new TextDecoder('euc-kr').decode(bytes); }
}
function collectDetail(meeting) {
  const key = trackKey(meeting.racecourse_id);
  if (!key || !TRACK[key].detail_supported) return { detail: null, status: 'unsupported' };
  const result = spawnSync(process.execPath, [
    'scripts/timetable/collect-kra-todayrace.mjs',
    `--date=${meeting.date}`,
    `--racecourse-id=${meeting.racecourse_id}`,
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
    timeout: DETAIL_CHILD_TIMEOUT_MS,
    killSignal: 'SIGKILL',
  });
  if (result.error) {
    return {
      detail: null,
      status: result.error.code === 'ETIMEDOUT' ? 'timeout' : 'error',
    };
  }
  if (result.status !== 0) return { detail: null, status: 'unavailable' };
  try { return { detail: JSON.parse(result.stdout), status: 'success' }; }
  catch { return { detail: null, status: 'invalid_json' }; }
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', seoulDate());
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');
if (!startDate.startsWith(`${PLAN_2026.year}-`)) throw new Error('KRA annual-plan parser currently has no verified plan for this year');

const html = await fetchOfficialPlan();
const annual = generatedPlanMeetings();
const annualCounts = validatePlan(annual, html);
const endDateExclusive = plusDays(startDate, days);
const windowRows = annual.filter((row) => row.date >= startDate && row.date < endDateExclusive);
const records = [];
const detailCollection = {
  child_timeout_ms: DETAIL_CHILD_TIMEOUT_MS,
  attempted: 0,
  succeeded: 0,
  timed_out: 0,
  unavailable: 0,
};
for (const schedule of windowRows) {
  const key = trackKey(schedule.racecourse_id);
  if (!key || !TRACK[key].detail_supported) {
    records.push(schedule);
    continue;
  }
  detailCollection.attempted += 1;
  const collected = collectDetail(schedule);
  if (collected.status === 'success') detailCollection.succeeded += 1;
  else if (collected.status === 'timeout') detailCollection.timed_out += 1;
  else detailCollection.unavailable += 1;

  const detail = collected.detail;
  if (!detail || !['B', 'B+', 'A', 'A+'].includes(detail.capability_rank)) {
    records.push(schedule);
    continue;
  }
  records.push({
    ...schedule,
    capability_rank: detail.capability_rank,
    first_race_time_local: detail.first_race_time_local ?? null,
    last_race_time_local: detail.last_race_time_local ?? null,
    timetable_rows: detail.timetable_rows ?? [],
    source: detail.source ?? schedule.source,
    detail_observation: { status: 'available', race_count: detail.classifier?.race_count ?? 0, conflicts: [] },
  });
}
const generatedAt = new Date().toISOString();
const artifact = {
  schema_version: 'kra-official-window-candidates-v1',
  generated_at: generatedAt,
  source: 'kra',
  country_id: 'south-korea',
  authority_id: 'korea-racing-authority',
  racing_system_id: 'kra-national-racing-system',
  timezone: 'Asia/Seoul',
  discovery: {
    method: 'official_annual_operation_plan_validated_week_pattern_plus_todayrace',
    schedule_source_id: 'kra-annual-race-operation-plan',
    schedule_source_url: OFFICIAL_PLAN_URL,
    annual_day_counts: annualCounts,
    detail_collection: detailCollection,
  },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days },
  records,
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output, start_date: startDate, end_date_exclusive: endDateExclusive,
  official_fixture_count: records.length,
  rank_counts: Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((row) => row.capability_rank === rank).length])),
  detail_collection: detailCollection,
}));
