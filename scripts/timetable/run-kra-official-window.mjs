import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  currentSeoulWeekBounds,
  generateKraPlanMeetings,
  parseKraOperationPlan,
  parseKraRegistrationDates,
  validateKraGeneratedPlan,
} from './kra-operation-plan-core.mjs';

const OFFICIAL_PLAN_URL = 'https://race.kra.co.kr/raceoper/RaceoperView.do?Sub=1&meet=1';
const DETAIL_CHILD_TIMEOUT_MS = 60_000;
const TRACK = Object.freeze({
  seoul: {
    racecourse_id: 'seoul-racecourse', detail_supported: true, meet_code: '1',
    registration_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=1',
  },
  busan: {
    racecourse_id: 'busan-gyeongnam-racecourse', detail_supported: true, meet_code: '3',
    registration_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=3',
  },
  yeongcheon: { racecourse_id: 'yeongcheon-racecourse', detail_supported: false, meet_code: null, registration_url: null },
  jeju: {
    racecourse_id: 'jeju-racecourse', detail_supported: true, meet_code: '2',
    registration_url: 'https://race.kra.co.kr/chulmainfo/RegistStateList.do?meet=2',
  },
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

function trackKey(racecourseId) {
  return Object.entries(TRACK).find(([, value]) => value.racecourse_id === racecourseId)?.[0] ?? null;
}

async function fetchKraHtml(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.6',
      'user-agent': 'WhereHorsesRun/1.0 public timetable acquisition',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`KRA official request failed: ${response.status} ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const ascii = new TextDecoder('windows-1252').decode(bytes.slice(0, Math.min(bytes.length, 8192)));
  const charset = ascii.match(/charset\s*=\s*["']?([^"'\s;/>]+)/i)?.[1]?.toLowerCase() ?? 'euc-kr';
  try { return new TextDecoder(charset).decode(bytes); }
  catch { return new TextDecoder('euc-kr').decode(bytes); }
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
    return { detail: null, status: result.error.code === 'ETIMEDOUT' ? 'timeout' : 'error' };
  }
  if (result.status !== 0) return { detail: null, status: 'unavailable' };
  try { return { detail: JSON.parse(result.stdout), status: 'success' }; }
  catch { return { detail: null, status: 'invalid_json' }; }
}

async function registrationProbe(key) {
  const config = TRACK[key];
  if (!config.detail_supported || !config.registration_url) return { status: 'unsupported', dates: [] };
  try {
    const html = await fetchKraHtml(config.registration_url);
    return { status: 'success', dates: parseKraRegistrationDates(html) };
  } catch (error) {
    return {
      status: 'fallback_full_detail',
      dates: [],
      error: String(error?.message ?? error).slice(0, 300),
    };
  }
}

const output = arg('output');
const days = Number(arg('days', '30'));
const liveSeoulDate = seoulDate();
const startDate = arg('as-of', liveSeoulDate);
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const planHtml = await fetchKraHtml(OFFICIAL_PLAN_URL);
const plan = parseKraOperationPlan(planHtml);
if (!startDate.startsWith(`${plan.year}-`)) {
  throw new Error(`KRA official operation plan is for ${plan.year}, not requested window ${startDate}; refusing stale-year inference`);
}
const annual = generateKraPlanMeetings(plan, TRACK);
const annualCounts = validateKraGeneratedPlan(annual, plan, TRACK);
const endDateExclusive = plusDays(startDate, days);
const windowRows = annual.filter((row) => row.date >= startDate && row.date < endDateExclusive);

const probeEntries = await Promise.all(Object.keys(TRACK).map(async (key) => [key, await registrationProbe(key)]));
const publicationProbes = Object.fromEntries(probeEntries);
const currentWeek = currentSeoulWeekBounds();
const isLiveWindow = startDate === liveSeoulDate;

function detailEligible(schedule, key) {
  if (!isLiveWindow) return true;
  if (schedule.date >= currentWeek.monday && schedule.date <= currentWeek.sunday) return true;
  const probe = publicationProbes[key];
  if (!probe || probe.status !== 'success') return true;
  return probe.dates.includes(schedule.date);
}

const records = [];
const detailCollection = {
  child_timeout_ms: DETAIL_CHILD_TIMEOUT_MS,
  attempted: 0,
  succeeded: 0,
  timed_out: 0,
  unavailable: 0,
  skipped_not_published: 0,
};
for (const schedule of windowRows) {
  const key = trackKey(schedule.racecourse_id);
  if (!key || !TRACK[key].detail_supported) {
    records.push(schedule);
    continue;
  }
  if (!detailEligible(schedule, key)) {
    detailCollection.skipped_not_published += 1;
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
    method: 'official_operation_plan_dynamic_week_pattern_plus_registration_gated_todayrace',
    schedule_source_id: 'kra-annual-race-operation-plan',
    schedule_source_url: OFFICIAL_PLAN_URL,
    official_plan_year: plan.year,
    annual_day_counts: annualCounts,
    publication_probe: Object.fromEntries(Object.entries(publicationProbes).map(([key, probe]) => [key, {
      status: probe.status,
      published_dates_in_window: probe.dates.filter((date) => date >= startDate && date < endDateExclusive),
      ...(probe.error ? { error: probe.error } : {}),
    }])),
    detail_collection: detailCollection,
  },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days },
  records,
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  official_plan_year: plan.year,
  start_date: startDate,
  end_date_exclusive: endDateExclusive,
  official_fixture_count: records.length,
  rank_counts: Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((row) => row.capability_rank === rank).length])),
  publication_probe: Object.fromEntries(Object.entries(publicationProbes).map(([key, probe]) => [key, probe.status])),
  detail_collection: detailCollection,
}));
