import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const generatedAt = '2026-06-07T03:30:00.000Z';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function slug(value) {
  return String(value ?? 'unknown')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function asDate(value) {
  return String(value ?? '').slice(0, 10);
}

function asTime(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : null;
}

function sourceStatusFromLegacy(value) {
  if (value === 'source-reviewed' || value === 'verified') return 'verified';
  if (value === 'stale') return 'stale';
  return 'partial';
}

function displayStatusFromLegacy(value) {
  if (value === 'displayable') return 'displayable';
  return 'partial';
}

function authorityFromRecord(record) {
  if (record.authority_id) return record.authority_id;
  const map = {
    'japan-jra-home': 'jra',
    'hong-kong-hkjc-home': 'hkjc',
    'uae-era-home': 'emirates-racing-authority',
    'japan-nar-home': 'nar-local-government-racing',
    'japan-banei-monthly-schedule': 'banei-tokachi',
  };
  return map[record.source_id] ?? record.source_id ?? 'unknown-authority';
}

function meetingPrefix(record) {
  const authority = authorityFromRecord(record);
  const map = {
    jra: 'jra',
    hkjc: 'hkjc',
    'emirates-racing-authority': 'era',
    'nar-local-government-racing': 'nar',
    'banei-tokachi': 'banei',
  };
  return map[authority] ?? slug(authority);
}

function rankFromSummary(record) {
  if (record.capability_rank) return record.capability_rank;
  return asTime(record.start_time_local) ? 'B' : 'C';
}

function normalizeSourceTrace(record, extractionMethod, normalizedFromPath) {
  return {
    source_id: record.source_id,
    route_id: record.route_id ?? null,
    source_status: sourceStatusFromLegacy(record.source_status ?? record.status),
    official_source_url: record.official_source_url ?? record.source_url,
    source_label: record.source_label ?? null,
    extraction_method: extractionMethod,
    source_snapshot_path: record.source_snapshot_path ?? null,
    normalized_from_path: normalizedFromPath,
  };
}

function normalizeFreshness(record, generatedAtValue) {
  const lastChecked = record.last_checked_date || asDate(record.last_checked_at) || asDate(generatedAtValue);
  return {
    last_checked_date: lastChecked,
    generated_at: generatedAtValue ?? null,
    stale_after_date: null,
    freshness_note: null,
  };
}

function makeMeetingId(record, racecourseId) {
  if (record.meeting_id) return record.meeting_id;
  return `${meetingPrefix(record)}-${racecourseId}-${record.date}`;
}

function fromLegacyRecord(record, generatedAtValue, sourcePath) {
  const firstRaceTime = record.first_race_time_local ?? asTime(record.start_time_local);
  const racecourseId = record.racecourse_id ?? `${slug(record.racecourse_name)}-racecourse`;
  return {
    meeting_id: makeMeetingId(record, racecourseId),
    country_id: record.country_id,
    authority_id: authorityFromRecord(record),
    racecourse_id: racecourseId,
    date: record.date,
    timezone: record.timezone,
    capability_rank: rankFromSummary(record),
    display_status: displayStatusFromLegacy(record.display_status ?? record.status),
    first_race_time_local: firstRaceTime,
    last_race_time_local: record.last_race_time_local ?? null,
    source_trace: normalizeSourceTrace(record, 'manual_seed', sourcePath),
    freshness: normalizeFreshness(record, generatedAtValue),
    notes: record.notes ?? null,
  };
}

function fromNormalizedRecord(record, sourcePath) {
  return {
    meeting_id: record.meeting_id,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: record.capability_rank,
    display_status: record.display_status,
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local,
    source_trace: normalizeSourceTrace(record, 'manual_review', sourcePath),
    freshness: normalizeFreshness(record, null),
    notes: record.notes ?? null,
  };
}

function detailFromRows(value) {
  return value;
}

const timetableSeed = readJson('data/generated/timetables.json');
const japanActive = readJson('data/generated/japan-active-timetable-records.json');
const normalized = readJson('data/generated/normalized-timetable.json');
const hkjcDetails = readJson('data/generated/timetable/hkjc-normalized-meeting-details.sample.json');

const meetingMap = new Map();
for (const record of timetableSeed.records ?? []) {
  const canonical = fromLegacyRecord(record, timetableSeed.generated_at, 'data/generated/timetables.json');
  meetingMap.set(canonical.meeting_id, canonical);
}
for (const record of japanActive.records ?? []) {
  const canonical = fromLegacyRecord(record, japanActive.generated_at, 'data/generated/japan-active-timetable-records.json');
  meetingMap.set(canonical.meeting_id, canonical);
}
for (const record of normalized.records ?? []) {
  const canonical = fromNormalizedRecord(record, 'data/generated/normalized-timetable.json');
  meetingMap.set(canonical.meeting_id, canonical);
}

const jraTokyoDetailRows = [
  ['Race 1', '10:05'], ['Race 2', '10:35'], ['Race 3', '11:05'], ['Race 4', '11:35'],
  ['Race 5', '12:25'], ['Race 6', '12:55'], ['Race 7', '13:25'], ['Race 8', '13:55'],
  ['Race 9', '14:30'], ['Race 10', '15:05'], ['Race 11', '15:45'], ['Race 12', '16:30'],
].map(([label, post_time_local]) => ({
  label,
  post_time_local,
  race_name: null,
  distance_m: null,
  surface: null,
  course_label: null,
  metadata_status: 'verified',
  source_label: 'Official source',
}));

const details = [
  detailFromRows({
    meeting_id: 'jra-tokyo-racecourse-2026-06-07',
    country_id: 'japan',
    authority_id: 'jra',
    racecourse_id: 'tokyo-racecourse',
    date: '2026-06-07',
    timezone: 'Asia/Tokyo',
    capability_rank: 'A',
    source_trace: {
      source_id: 'jra-calendar',
      route_id: 'jra-calendar-status-route',
      source_status: 'verified',
      official_source_url: 'https://jra.jp/keiba/calendar2026/2026/6/0607.html',
      source_label: 'Official source',
      extraction_method: 'manual_review',
      source_snapshot_path: null,
      normalized_from_path: 'src/data/normalizedTimetableMeetingDetails.ts',
    },
    freshness: {
      last_checked_date: '2026-06-06',
      generated_at: generatedAt,
      stale_after_date: null,
      freshness_note: 'Transitional detail rows converted to canonical until source-specific JRA acquisition exists.',
    },
    timetable_rows: jraTokyoDetailRows,
    summary_note: 'Public-safe JRA A-level detail rows converted from the transitional detail module. Only race labels and post times are stored.',
  }),
  ...(hkjcDetails.details ?? []).map((detail) => detailFromRows({
    meeting_id: detail.meeting_id,
    country_id: 'hong-kong',
    authority_id: 'hkjc',
    racecourse_id: 'sha-tin-racecourse',
    date: '2026-06-07',
    timezone: 'Asia/Hong_Kong',
    capability_rank: 'A+',
    source_trace: {
      source_id: 'hkjc-racecard-source-snapshot',
      route_id: 'hkjc-racecard-route',
      source_status: 'verified',
      official_source_url: 'https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx',
      source_label: 'Official source',
      extraction_method: 'snapshot',
      source_snapshot_path: hkjcDetails.source_snapshot,
      normalized_from_path: 'data/generated/timetable/hkjc-normalized-meeting-details.sample.json',
    },
    freshness: {
      last_checked_date: '2026-06-06',
      generated_at: generatedAt,
      stale_after_date: null,
      freshness_note: 'HKJC transitional sample converted to canonical detail rows.',
    },
    timetable_rows: detail.timetable_rows.map((row) => ({
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name ?? null,
      distance_m: row.distance_m ?? null,
      surface: row.surface ?? null,
      course_label: row.course_label ?? null,
      metadata_status: row.metadata_status ?? 'verified',
      source_label: row.detail_source_label ?? 'Official source',
    })),
    summary_note: detail.summary_note,
  })),
];

const meetings = [...meetingMap.values()].sort((a, b) =>
  `${a.date}:${a.country_id}:${a.racecourse_id}`.localeCompare(`${b.date}:${b.country_id}:${b.racecourse_id}`),
);

writeJson('data/generated/timetable/canonical/meetings.json', {
  schema_version: 'canonical-timetable-v0',
  generated_at: generatedAt,
  input_sources: [
    'data/generated/timetables.json',
    'data/generated/japan-active-timetable-records.json',
    'data/generated/normalized-timetable.json',
  ],
  meetings,
});

writeJson('data/generated/timetable/canonical/meeting-details.json', {
  schema_version: 'canonical-meeting-details-v0',
  generated_at: generatedAt,
  input_sources: [
    'src/data/normalizedTimetableMeetingDetails.ts',
    'data/generated/timetable/hkjc-normalized-meeting-details.sample.json',
  ],
  details,
});

console.log(`[canonical] wrote ${meetings.length} meetings and ${details.length} meeting detail records`);
