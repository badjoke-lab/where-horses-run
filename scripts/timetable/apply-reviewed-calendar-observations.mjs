import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((value, index) => [value, index]));
const MANIFEST_PATH = 'data/static/calendar-reviewed-public-observations.json';
const CANONICAL_PATH = 'data/generated/timetable/canonical/meetings.json';
const CANONICAL_DETAILS_PATH = 'data/generated/timetable/canonical/meeting-details.json';
const PUBLIC_PATH = 'data/generated/timetable/public/meeting-list.json';
const PUBLIC_DETAILS_PATH = 'data/generated/timetable/public/meeting-details.json';
const ARTIFACT_PATH = '.calendar-unified/reviewed-public-observations.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
function rank(value) {
  return RANK_INDEX.get(value) ?? -1;
}
function assertHttps(url, meetingId) {
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error(`reviewed observation missing HTTPS official source for ${meetingId}`);
  }
}
function normalizeMeetingDetail(meeting, detail, origin) {
  if (!meeting?.meeting_id) throw new Error(`reviewed supplement ${origin} has no meeting_id`);
  if (!RANK_INDEX.has(meeting.capability_rank)) {
    throw new Error(`reviewed supplement ${origin} has invalid rank for ${meeting.meeting_id}`);
  }
  const officialSourceUrl = meeting.official_source_url ?? detail?.official_source_url ?? null;
  assertHttps(officialSourceUrl, meeting.meeting_id);
  if (meeting.source_status && meeting.source_status !== 'verified') {
    throw new Error(`reviewed supplement ${origin} is not verified for ${meeting.meeting_id}`);
  }
  return {
    ...meeting,
    official_source_url: officialSourceUrl,
    source_id: `reviewed-public:${origin}`,
    source_label: 'Human-reviewed official timetable observation',
    reviewed: true,
    ...(Array.isArray(detail?.timetable_rows) ? { timetable_rows: detail.timetable_rows } : {}),
  };
}
function normalizeKawasaki(data, origin) {
  if (data.schema_version !== 'reviewed-public-timetable-detail-supplement-v2') {
    throw new Error(`unexpected Kawasaki reviewed schema in ${origin}: ${data.schema_version}`);
  }
  if (!Array.isArray(data.meetings)) throw new Error(`Kawasaki reviewed supplement ${origin} has no meetings`);
  return data.meetings.map((item) => {
    if (!item?.date || !Array.isArray(item.timetable_rows) || item.timetable_rows.length === 0) {
      throw new Error(`malformed Kawasaki reviewed meeting in ${origin}`);
    }
    const meetingId = `nar-kawasaki-racecourse-${item.date}`;
    assertHttps(item.source_url, meetingId);
    return {
      meeting_id: meetingId,
      country_id: 'japan',
      authority_id: 'nar-local-government-racing',
      racecourse_id: 'kawasaki-racecourse',
      date: item.date,
      timezone: 'Asia/Tokyo',
      capability_rank: 'A+',
      first_race_time_local: item.timetable_rows[0]?.post_time_local ?? null,
      last_race_time_local: item.timetable_rows.at(-1)?.post_time_local ?? null,
      official_source_url: item.source_url,
      source_id: `reviewed-public:${origin}`,
      source_label: 'Human-reviewed official timetable observation',
      source_status: 'verified',
      reviewed: true,
      timetable_rows: item.timetable_rows,
    };
  });
}
function recordsFromSupplement(spec) {
  const data = readJson(spec.path);
  if (spec.mode === 'meeting_detail') {
    if (data.schema_version !== 'reviewed-public-timetable-detail-supplement-v1') {
      throw new Error(`unexpected reviewed schema in ${spec.path}: ${data.schema_version}`);
    }
    return [normalizeMeetingDetail(data.meeting, data.detail, spec.path)];
  }
  if (spec.mode === 'records') {
    if (data.schema_version !== 'reviewed-public-timetable-detail-supplement-v1' || !Array.isArray(data.records)) {
      throw new Error(`unexpected reviewed records schema in ${spec.path}`);
    }
    return data.records.map(({ meeting, detail }) => normalizeMeetingDetail(meeting, detail, spec.path));
  }
  if (spec.mode === 'kawasaki_meetings') return normalizeKawasaki(data, spec.path);
  throw new Error(`unknown reviewed supplement mode ${spec.mode} for ${spec.path}`);
}

const manifest = readJson(MANIFEST_PATH);
if (manifest.schema_version !== 'reviewed-calendar-public-observations-v1') {
  throw new Error(`unsupported reviewed Calendar manifest schema: ${manifest.schema_version}`);
}

const reviewedById = new Map();
function addReviewed(record, origin) {
  if (!record?.meeting_id || !RANK_INDEX.has(record.capability_rank)) {
    throw new Error(`invalid reviewed Calendar observation from ${origin}`);
  }
  assertHttps(record.official_source_url, record.meeting_id);
  if (reviewedById.has(record.meeting_id)) {
    throw new Error(`duplicate reviewed Calendar observation for ${record.meeting_id}`);
  }
  reviewedById.set(record.meeting_id, {
    ...record,
    source_id: record.source_id ?? `reviewed-public:${origin}`,
    source_label: record.source_label ?? 'Human-reviewed official timetable observation',
    source_status: 'verified',
    reviewed: true,
  });
}

for (const spec of manifest.supplements ?? []) {
  for (const record of recordsFromSupplement(spec)) addReviewed(record, spec.path);
}
for (const record of manifest.records ?? []) addReviewed(record, MANIFEST_PATH);

const canonical = readJson(CANONICAL_PATH);
const canonicalDetails = readJson(CANONICAL_DETAILS_PATH);
const publicList = readJson(PUBLIC_PATH);
const publicDetails = readJson(PUBLIC_DETAILS_PATH);
const canonicalById = new Map((canonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const canonicalDetailsById = new Map((canonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const publicById = new Map((publicList.meetings ?? []).map((row) => [row.meeting_id, row]));
const publicDetailsById = new Map((publicDetails.details ?? []).map((row) => [row.meeting_id, row]));

const selected = [];
const outcomes = { registered: reviewedById.size, apply: 0, already_preserved: 0 };
for (const record of reviewedById.values()) {
  const previous = canonicalById.get(record.meeting_id);
  if (!previous) {
    throw new Error(`reviewed Calendar observation has no canonical mother-set meeting: ${record.meeting_id}`);
  }
  const previousPublic = publicById.get(record.meeting_id);
  const needsHigherRank = rank(previous.capability_rank) < rank(record.capability_rank);
  const needsPublicRepair = !previousPublic || rank(previousPublic.effective_public_rank) < rank(record.capability_rank);
  const needsDetailRepair = rank(record.capability_rank) >= rank('A')
    && (!canonicalDetailsById.has(record.meeting_id) || !publicDetailsById.has(record.meeting_id));
  const needsTimeRepair = rank(record.capability_rank) >= rank('B')
    && (record.first_race_time_local && previous.first_race_time_local !== record.first_race_time_local
      || record.capability_rank === 'B+' && record.last_race_time_local && previous.last_race_time_local !== record.last_race_time_local);
  if (needsHigherRank || needsPublicRepair || needsDetailRepair || needsTimeRepair) {
    selected.push(record);
    outcomes.apply += 1;
  } else {
    outcomes.already_preserved += 1;
  }
}

writeJson(ARTIFACT_PATH, {
  schema_version: 'reviewed-calendar-official-observation-artifact-v1',
  generated_at: new Date().toISOString(),
  source_id: 'reviewed-calendar-public-observations',
  records: selected,
});

const apply = spawnSync(process.execPath, [
  'scripts/timetable/apply-official-rolling-observations.mjs',
  `--artifact=${ARTIFACT_PATH}`,
], { stdio: 'inherit' });
if (apply.status !== 0) process.exit(apply.status ?? 1);

const finalCanonical = readJson(CANONICAL_PATH);
const finalCanonicalDetails = readJson(CANONICAL_DETAILS_PATH);
const finalPublic = readJson(PUBLIC_PATH);
const finalPublicDetails = readJson(PUBLIC_DETAILS_PATH);
const finalCanonicalById = new Map((finalCanonical.meetings ?? []).map((row) => [row.meeting_id, row]));
const finalCanonicalDetailsById = new Map((finalCanonicalDetails.details ?? []).map((row) => [row.meeting_id, row]));
const finalPublicById = new Map((finalPublic.meetings ?? []).map((row) => [row.meeting_id, row]));
const finalPublicDetailsById = new Map((finalPublicDetails.details ?? []).map((row) => [row.meeting_id, row]));

for (const record of reviewedById.values()) {
  const meeting = finalCanonicalById.get(record.meeting_id);
  const publicMeeting = finalPublicById.get(record.meeting_id);
  if (!meeting || rank(meeting.capability_rank) < rank(record.capability_rank)) {
    throw new Error(`reviewed canonical rank was not preserved for ${record.meeting_id}`);
  }
  if (!publicMeeting || rank(publicMeeting.effective_public_rank) < rank(record.capability_rank)) {
    throw new Error(`reviewed public rank was not preserved for ${record.meeting_id}`);
  }
  if (rank(record.capability_rank) >= rank('A')) {
    if (!finalCanonicalDetailsById.has(record.meeting_id) || !finalPublicDetailsById.has(record.meeting_id)) {
      throw new Error(`reviewed race detail was not preserved for ${record.meeting_id}`);
    }
  }
}

console.log(JSON.stringify({ manifest: MANIFEST_PATH, artifact: ARTIFACT_PATH, outcomes }));
