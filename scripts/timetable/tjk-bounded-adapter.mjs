import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_MEETING_SUMMARY = path.join(ROOT, 'docs/timetable-source-tests/03-turkey/turkey-fixed-three-meeting-summary.tsv');
export const DEFAULT_RACE_EVIDENCE = path.join(ROOT, 'docs/timetable-source-tests/03-turkey/turkey-fixed-three-race-evidence.tsv');
export const DEFAULT_REVALIDATION = path.join(ROOT, 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json');
export const DEFAULT_OUTPUT = path.join(ROOT, 'data/candidates/tjk-bounded-reviewed-fixture-v1.json');

const CURRENT_ROUTE = '/TR/YarisSever/Info/Page/GunlukYarisProgrami';
const SUPERSEDED_ROUTE = '/TR/YarisSever/Info/Sehir/GunlukYarisProgrami';
const RACECOURSE_IDS = new Map([
  ['Adana', 'adana-racecourse'],
  ['Antalya', 'antalya-racecourse'],
  ['İzmir', 'izmir-racecourse'],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseTsv(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '').trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.filter(Boolean).map((line) => {
    const cells = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function normalizeDailyUrl(rawUrl, revalidation) {
  if (!rawUrl.includes(SUPERSEDED_ROUTE)) throw new Error(`fixture URL does not use the reviewed superseded route: ${rawUrl}`);
  const normalized = rawUrl.replace(SUPERSEDED_ROUTE, CURRENT_ROUTE);
  const url = new URL(normalized);
  if (url.origin !== 'https://www.tjk.org') throw new Error('unexpected TJK source origin');
  if (url.pathname !== CURRENT_ROUTE) throw new Error('TJK current daily route mismatch');
  for (const parameter of revalidation.route_revalidation.daily_parameters_preserved) {
    if (!url.searchParams.has(parameter)) throw new Error(`missing reviewed TJK daily parameter: ${parameter}`);
  }
  if (normalized.includes(SUPERSEDED_ROUTE)) throw new Error('superseded TJK route leaked into candidate');
  return normalized;
}

function technicalRank(rows) {
  const completeTimes = rows.every((row) => /^\d{2}:\d{2}$/.test(row.post_time_local));
  const completeSummary = rows.every((row) => Number.isInteger(row.distance_m) && row.distance_m > 0 && row.surface.length > 0);
  if (completeTimes && completeSummary) return 'A+';
  if (completeTimes) return 'A';
  return 'C';
}

export function buildTjkBoundedCandidate({
  meetingSummaryPath = DEFAULT_MEETING_SUMMARY,
  raceEvidencePath = DEFAULT_RACE_EVIDENCE,
  revalidationPath = DEFAULT_REVALIDATION,
} = {}) {
  const revalidation = readJson(revalidationPath);
  if (revalidation?.authority_id !== 'turkiye-jokey-kulubu') throw new Error('unexpected TJK authority');
  if (revalidation?.technical_capability_rank !== 'A+') throw new Error('TJK technical capability must remain A+');
  if (revalidation?.public_ceiling !== 'A') throw new Error('TJK public ceiling must remain A');
  if (revalidation?.decision?.adapter_daily_route !== CURRENT_ROUTE) throw new Error('TJK adapter must use the revalidated Info/Page route');
  if (revalidation?.current_observation?.current_day_daily_body_verified !== false) throw new Error('bounded fixture adapter must not claim a fresh current-day body');

  const meetings = parseTsv(meetingSummaryPath);
  const evidence = parseTsv(raceEvidencePath);
  const byMeeting = new Map();
  for (const row of evidence) {
    const key = `${row.racecourse}|${row.city_id}|${row.meeting_date}|${row.official_source_url}`;
    const list = byMeeting.get(key) ?? [];
    list.push({
      race_number: Number(row.race_number),
      post_time_local: row.post_time_local,
      distance_m: Number(row.distance_m),
      surface: row.surface,
    });
    byMeeting.set(key, list);
  }

  const records = meetings.map((meeting) => {
    const key = `${meeting.racecourse}|${meeting.city_id}|${meeting.meeting_date}|${meeting.official_source_url}`;
    const rows = [...(byMeeting.get(key) ?? [])].sort((a, b) => a.race_number - b.race_number);
    const racecourseId = RACECOURSE_IDS.get(meeting.racecourse);
    if (!racecourseId) throw new Error(`unreviewed fixture racecourse: ${meeting.racecourse}`);
    if (rows.length !== Number(meeting.race_count)) throw new Error(`fixture race count mismatch: ${meeting.racecourse} ${meeting.meeting_date}`);
    rows.forEach((row, index) => {
      if (row.race_number !== index + 1) throw new Error(`non-contiguous Race 1-N evidence: ${meeting.racecourse} ${meeting.meeting_date}`);
    });
    const capabilityRank = technicalRank(rows);
    const meetingId = `tjk-${racecourseId}-${meeting.meeting_date}`;
    return {
      candidate_id: `candidate-${meetingId}`,
      meeting_id: meetingId,
      country_id: 'turkey',
      authority_id: 'turkiye-jokey-kulubu',
      racing_system_id: 'tjk-national-racing-system',
      racecourse_id: racecourseId,
      racecourse_label: meeting.racecourse,
      source_venue_id: meeting.city_id,
      date: meeting.meeting_date,
      timezone: 'Europe/Istanbul',
      capability_rank: capabilityRank,
      publication_ceiling: 'A',
      first_race_time_local: rows[0]?.post_time_local ?? null,
      last_race_time_local: rows.at(-1)?.post_time_local ?? null,
      timetable_rows: rows,
      source: {
        source_id: 'tjk-daily-programme',
        official_url: normalizeDailyUrl(meeting.official_source_url, revalidation),
        checked_at: revalidation.checked_date,
        extraction_method: 'reviewed_deterministic_fixture',
      },
      confidence: 'high',
      review_status: 'pending',
      notes: 'Reviewed deterministic TJK fixture projected onto the revalidated Info/Page daily route. Technical capability is evidence-derived; any public output remains capped at A and requires separate human review.',
    };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id));

  const raceCount = records.reduce((sum, record) => sum + record.timetable_rows.length, 0);
  return {
    schema_version: 'timetable-candidate-v1',
    generated_at: `${revalidation.checked_date}T00:00:00Z`,
    adapter_id: 'tjk-bounded-reviewed-fixture-v1',
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    source_id: 'tjk-daily-programme',
    technical_capability_rank: 'A+',
    publication_ceiling: 'A',
    candidate_window: {
      start_date: records[0].date,
      end_date_exclusive: '2024-12-20',
      timezone: 'Europe/Istanbul',
    },
    fixture_evidence: {
      meeting_summary: path.relative(ROOT, meetingSummaryPath),
      race_evidence: path.relative(ROOT, raceEvidencePath),
      source_revalidation: path.relative(ROOT, revalidationPath),
      meeting_count: records.length,
      race_count: raceCount,
    },
    records,
    review: {
      status: 'pending',
      reviewed_at: null,
      reviewer: null,
      summary: 'Candidate-only TJK bounded adapter output from reviewed deterministic fixture evidence. No Canonical/public write is authorized.',
      promotion_target: 'separate-human-reviewed-unit',
    },
    publication_effect: 'none',
  };
}

export function loadTjkBoundedCandidate() {
  return buildTjkBoundedCandidate();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = loadTjkBoundedCandidate();
  const check = process.argv.includes('--check');
  if (check) {
    const committed = readJson(DEFAULT_OUTPUT);
    if (JSON.stringify(output) !== JSON.stringify(committed)) throw new Error('committed TJK bounded candidate differs from deterministic adapter output');
  } else {
    fs.mkdirSync(path.dirname(DEFAULT_OUTPUT), { recursive: true });
    fs.writeFileSync(DEFAULT_OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  }
  console.log(`TJK_BOUNDED_ADAPTER: ${check ? 'check-pass' : 'written'}`);
  console.log(`CANDIDATE_MEETINGS: ${output.records.length}`);
  console.log(`CANDIDATE_RACES: ${output.fixture_evidence.race_count}`);
  console.log('PUBLICATION_EFFECT: none');
}
