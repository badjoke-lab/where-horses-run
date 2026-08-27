import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const OUTPUT = 'data/candidates/nar-regular-refresh-2026-08-29-saga-a-plus-approved.json';
const REVIEWED_AT = '2026-08-27T06:31:00Z';
const REVIEWER = 'badjoke-lab';
const SOURCE_BATCH_ID = 'due-job-plan-2026-08-27-due-japan-nar-regular-refresh-001-run-001';
const SOURCE_GENERATED_AT = '2026-08-27T06:29:43.009Z';
const PROMOTION_TARGET = 'canonical-timetable-v0';

const COMPLETE_DETAIL_IDS = [
  'nar-funabashi-racecourse-2026-08-28',
  'nar-kasamatsu-racecourse-2026-08-28',
  'nar-saga-racecourse-2026-08-29',
  'nar-sonoda-racecourse-2026-08-28',
].sort();
const APPROVED_ID = 'nar-saga-racecourse-2026-08-29';
const VERIFIED_NOOP_IDS = COMPLETE_DETAIL_IDS.filter((id) => id !== APPROVED_ID);
const EXPECTED = { rows: 9, first: '16:30', last: '20:50' };
const FORBIDDEN_KEYS = new Set([
  'horse_name', 'jockey', 'trainer', 'odds', 'payout', 'result',
  'prediction', 'raw_html', 'stream_url',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(relativePath) {
  const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function writeJson(relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function assertNoForbiddenKeys(value, location = 'record') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert(!FORBIDDEN_KEYS.has(key.toLowerCase()), `${location} contains forbidden key ${key}`);
    assertNoForbiddenKeys(child, `${location}.${key}`);
  }
}

function publicRows(candidate) {
  const rows = candidate.timetable_rows ?? [];
  const completeness = candidate.meeting_completeness ?? {};
  assert(Number.isInteger(completeness.expected_race_count) && completeness.expected_race_count > 0, `${candidate.candidate_id} expected race count missing`);
  assert(rows.length === completeness.expected_race_count, `${candidate.candidate_id} timetable row count differs`);
  assert(completeness.observed_race_count === rows.length, `${candidate.candidate_id} observed race count differs`);
  assert(completeness.continuous_race_numbers === true, `${candidate.candidate_id} race numbers are not continuous`);
  assert(completeness.all_a_plus_fields_complete === true, `${candidate.candidate_id} is not A+ complete`);
  return rows.map((row, index) => {
    assert(row.race_number === index + 1, `${candidate.candidate_id} Race ${index + 1} number differs`);
    for (const field of ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      assert(row[field] !== null && row[field] !== '', `${candidate.candidate_id} Race ${index + 1} missing ${field}`);
    }
    return {
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: row.distance_m,
      surface: row.surface,
      course_label: row.course_label,
    };
  });
}

function canonicalPublicRows(detail) {
  return (detail?.timetable_rows ?? []).map((row) => ({
    label: row.label,
    post_time_local: row.post_time_local,
    race_name: row.race_name,
    distance_m: row.distance_m,
    surface: row.surface,
    course_label: row.course_label,
  }));
}

function assertSourceCandidate(candidate) {
  assert(candidate.schema_version === 'nar-incremental-detail-candidate-v2', `${candidate.candidate_id} detail schema differs`);
  assert(candidate.candidate_rank === 'A+', `${candidate.candidate_id} candidate rank differs`);
  assert(candidate.review?.status === 'needs_review', `${candidate.candidate_id} review status differs`);
  assert(candidate.review?.promotion_eligible === false, `${candidate.candidate_id} promotion boundary differs`);
  assert(candidate.source?.source_id === 'nar-official-race-list-and-deba-table', `${candidate.candidate_id} source ID differs`);
  assert(candidate.source?.list_http_status === 200, `${candidate.candidate_id} race-list HTTP status differs`);
  assert(candidate.source?.storage_policy === 'public_safe_extracted_fields_only_no_raw_html', `${candidate.candidate_id} storage policy differs`);
  assert(new URL(candidate.source.official_race_list_url).hostname === 'www.keiba.go.jp', `${candidate.candidate_id} source hostname differs`);
}

assert(INPUT, 'WHR_NAR_REVIEW_BATCH is required');
const batch = readJson(INPUT);
assert(batch.schema_version === 'nar-incremental-batch-v2', 'NAR review batch schema differs');
assert(batch.batch_id === SOURCE_BATCH_ID, 'NAR review batch identity differs');
assert(batch.generated_at === SOURCE_GENERATED_AT, 'NAR review batch timestamp differs');
assert(batch.work_id === 'WHR-CAL-JAPAN-NAR-A-PLUS', 'NAR Work ID differs');
assert(batch.collection_mode === 'date_window', 'NAR collection mode differs');
assert(batch.requested_scope?.start_date === '2026-08-28', 'NAR requested start date differs');
assert(batch.requested_scope?.end_date_exclusive === '2026-09-11', 'NAR requested end date differs');
assert(batch.requested_scope?.timezone === 'Asia/Tokyo', 'NAR requested timezone differs');
assert(batch.review?.status === 'needs_review', 'NAR source review status differs');
assert(batch.review?.promotion_eligible === false, 'NAR source must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'NAR canonical write boundary differs');
assert(batch.review?.public_write === 'disabled', 'NAR public write boundary differs');
assert(batch.review?.raw_source_storage === 'disabled', 'NAR raw-storage boundary differs');
assert((batch.scheduled_meetings ?? []).length === 48, 'NAR scheduled meeting count differs');
assert((batch.detail_candidates ?? []).length === 4, 'NAR complete detail candidate count differs');
assert((batch.schedule_candidates ?? []).length === 44, 'NAR schedule-only candidate count differs');
assert((batch.detail_blockers ?? []).length === 44, 'NAR detail blocker count differs');
assert((batch.schedule_errors ?? []).length === 0, 'NAR schedule errors must remain zero');
assert(new Date(REVIEWED_AT) >= new Date(batch.generated_at), 'review must not precede source generation');

const actualIds = batch.detail_candidates.map((candidate) => candidate.candidate_id).sort();
assert(JSON.stringify(actualIds) === JSON.stringify(COMPLETE_DETAIL_IDS), `complete A+ identity set differs: ${JSON.stringify(actualIds)}`);
const candidatesById = new Map(batch.detail_candidates.map((candidate) => [candidate.candidate_id, candidate]));
for (const candidate of batch.detail_candidates) assertSourceCandidate(candidate);

const canonicalMeetings = readJson('data/generated/timetable/canonical/meetings.json');
const canonicalDetails = readJson('data/generated/timetable/canonical/meeting-details.json');
const meetingById = new Map(canonicalMeetings.meetings.map((row) => [row.meeting_id, row]));
const detailById = new Map(canonicalDetails.details.map((row) => [row.meeting_id, row]));

for (const id of VERIFIED_NOOP_IDS) {
  const rows = publicRows(candidatesById.get(id));
  const meeting = meetingById.get(id);
  const detail = detailById.get(id);
  assert(meeting?.capability_rank === 'A+', `${id} is not canonical A+`);
  assert(detail?.capability_rank === 'A+', `${id} is not canonical A+ detail`);
  assert(meeting.first_race_time_local === rows[0].post_time_local, `${id} first race time changed`);
  assert(meeting.last_race_time_local === rows.at(-1).post_time_local, `${id} last race time changed`);
  assert(JSON.stringify(canonicalPublicRows(detail)) === JSON.stringify(rows), `${id} public-safe timetable fields changed`);
}

const candidate = candidatesById.get(APPROVED_ID);
const rows = publicRows(candidate);
assert(rows.length === EXPECTED.rows, `${APPROVED_ID} reviewed row count differs`);
assert(rows[0].post_time_local === EXPECTED.first, `${APPROVED_ID} reviewed first race time differs`);
assert(rows.at(-1).post_time_local === EXPECTED.last, `${APPROVED_ID} reviewed last race time differs`);
const currentMeeting = meetingById.get(APPROVED_ID);
const currentDetail = detailById.get(APPROVED_ID);
const prePromotionState = currentMeeting?.capability_rank === 'C'
  && currentMeeting.first_race_time_local === null
  && currentMeeting.last_race_time_local === null
  && !currentDetail;
const postPromotionState = currentMeeting?.capability_rank === 'A+'
  && currentMeeting.first_race_time_local === EXPECTED.first
  && currentMeeting.last_race_time_local === EXPECTED.last
  && currentDetail?.capability_rank === 'A+'
  && JSON.stringify(canonicalPublicRows(currentDetail)) === JSON.stringify(rows);
assert(prePromotionState || postPromotionState, `${APPROVED_ID} current canonical state is neither exact C/no-detail prestate nor exact promoted A+`);

const record = {
  candidate_id: `approved-${candidate.candidate_id}`,
  meeting_id: candidate.candidate_id,
  country_id: candidate.country_id,
  authority_id: candidate.authority_id,
  racing_system_id: candidate.racing_system_id,
  racecourse_id: candidate.racecourse_id,
  date: candidate.date,
  timezone: candidate.timezone,
  capability_rank: 'A+',
  first_race_time_local: rows[0].post_time_local,
  last_race_time_local: rows.at(-1).post_time_local,
  timetable_rows: rows,
  source: {
    source_id: 'nar-race-list-deba-table',
    official_url: candidate.source.official_race_list_url,
    checked_at: batch.generated_at,
    extraction_method: 'adapter_candidate',
  },
  confidence: 'high',
  review_status: 'approved',
  notes: 'Approved from the exact pinned August 27 NAR regular-refresh rerun after current-canonical comparison. Only public-safe A+ timetable fields are promoted.',
};
assertNoForbiddenKeys(record);

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-regular-refresh-2026-08-29-saga-reviewed-detail-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-race-list-deba-table',
  candidate_window: {
    start_date: '2026-08-29',
    end_date_exclusive: '2026-08-30',
    timezone: 'Asia/Tokyo',
  },
  records: [record],
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Reviewed all four complete-detail records from the pinned August 27 NAR rerun: three are exact canonical A+ no-ops and Saga 2026-08-29 is the single approved C-to-A+ delta. The remaining 44 schedule-only records remain unapproved.',
    promotion_target: PROMOTION_TARGET,
  },
};

writeJson(OUTPUT, output);
console.log(JSON.stringify({
  input: INPUT,
  output: OUTPUT,
  complete_detail_records: COMPLETE_DETAIL_IDS.length,
  verified_noop_records: VERIFIED_NOOP_IDS.length,
  approved_records: 1,
  approved_race_rows: rows.length,
  retained_unapproved_schedule_only_records: batch.schedule_candidates.length,
  publication_rank: 'A+',
  public_write: false,
}));
