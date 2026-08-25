import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const OUTPUT = 'data/candidates/nar-regular-refresh-2026-08-27-monbetsu-a-plus-approved.json';
const REVIEWED_AT = '2026-08-25T01:45:00Z';
const REVIEWER = 'badjoke-lab';
const SOURCE_BATCH_ID = 'due-job-plan-2026-08-24-due-japan-nar-regular-refresh-001-run-001';
const SOURCE_GENERATED_AT = '2026-08-25T01:32:33.555Z';
const SOURCE_BLOB_SHA = '76b677008ca13cb34ef4787d07adf24bf912ea1f';
const PROMOTION_TARGET = 'canonical-timetable-v0';
const APPROVED_ID = 'nar-monbetsu-racecourse-2026-08-27';

const ALL_DETAIL_IDS = [
  'nar-funabashi-racecourse-2026-08-25',
  'nar-funabashi-racecourse-2026-08-26',
  'nar-funabashi-racecourse-2026-08-27',
  'nar-kanazawa-racecourse-2026-08-25',
  'nar-kasamatsu-racecourse-2026-08-25',
  'nar-kasamatsu-racecourse-2026-08-26',
  'nar-kasamatsu-racecourse-2026-08-27',
  'nar-monbetsu-racecourse-2026-08-25',
  'nar-monbetsu-racecourse-2026-08-26',
  'nar-monbetsu-racecourse-2026-08-27',
  'nar-morioka-racecourse-2026-08-25',
  'nar-sonoda-racecourse-2026-08-26',
  'nar-sonoda-racecourse-2026-08-27',
  'nar-sonoda-racecourse-2026-08-28',
].sort();

const VERIFIED_NOOP_IDS = ALL_DETAIL_IDS.filter((id) => id !== APPROVED_ID).sort();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitBlobSha(text) {
  const body = Buffer.from(text, 'utf8');
  const header = Buffer.from(`blob ${body.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(body).digest('hex');
}

function readText(inputPath) {
  const fullPath = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  return fs.readFileSync(fullPath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function publicRows(candidate) {
  const rows = candidate.timetable_rows ?? [];
  const expected = candidate.meeting_completeness?.expected_race_count;
  assert(Number.isInteger(expected) && expected > 0, `${candidate.candidate_id} expected race count missing`);
  assert(rows.length === expected, `${candidate.candidate_id} timetable row count differs`);
  assert(candidate.meeting_completeness?.observed_race_count === rows.length, `${candidate.candidate_id} observed race count differs`);
  assert(candidate.meeting_completeness?.continuous_race_numbers === true, `${candidate.candidate_id} race numbers are not continuous`);
  assert(candidate.meeting_completeness?.all_a_plus_fields_complete === true, `${candidate.candidate_id} is not A+ complete`);
  return rows.map((row, index) => {
    const raceNumber = index + 1;
    assert(row.race_number === raceNumber, `${candidate.candidate_id} race number ${raceNumber} differs`);
    for (const field of ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      assert(row[field] !== null && row[field] !== '', `${candidate.candidate_id} Race ${raceNumber} missing ${field}`);
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
  assert(candidate.review?.status === 'needs_review', `${candidate.candidate_id} source review status differs`);
  assert(candidate.review?.promotion_eligible === false, `${candidate.candidate_id} source promotion boundary differs`);
  assert(candidate.source?.source_id === 'nar-official-race-list-and-deba-table', `${candidate.candidate_id} source ID differs`);
  assert(candidate.source?.list_http_status === 200, `${candidate.candidate_id} race-list HTTP status differs`);
  assert(candidate.source?.storage_policy === 'public_safe_extracted_fields_only_no_raw_html', `${candidate.candidate_id} storage policy differs`);
  assert(new URL(candidate.source.official_race_list_url).hostname === 'www.keiba.go.jp', `${candidate.candidate_id} source hostname differs`);
}

assert(INPUT, 'WHR_NAR_REVIEW_BATCH is required');
const sourceText = readText(INPUT);
const batch = JSON.parse(sourceText);
assert(gitBlobSha(sourceText) === SOURCE_BLOB_SHA, 'NAR regular-refresh source blob SHA differs');
assert(batch.schema_version === 'nar-incremental-batch-v2', 'NAR review batch schema differs');
assert(batch.batch_id === SOURCE_BATCH_ID, 'NAR review batch identity differs');
assert(batch.generated_at === SOURCE_GENERATED_AT, 'NAR review batch timestamp differs');
assert(batch.work_id === 'WHR-CAL-JAPAN-NAR-A-PLUS', 'NAR review Work ID differs');
assert(batch.collection_mode === 'date_window', 'NAR collection mode differs');
assert(batch.requested_scope?.kind === 'date_window', 'NAR requested scope kind differs');
assert(batch.requested_scope?.start_date === '2026-08-25', 'NAR requested start date differs');
assert(batch.requested_scope?.end_date_exclusive === '2026-09-08', 'NAR requested end date differs');
assert(batch.requested_scope?.timezone === 'Asia/Tokyo', 'NAR requested timezone differs');
assert(batch.review?.status === 'needs_review', 'NAR source review status differs');
assert(batch.review?.promotion_eligible === false, 'NAR source must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'NAR source canonical write boundary differs');
assert(batch.review?.public_write === 'disabled', 'NAR source public write boundary differs');
assert(batch.review?.raw_source_storage === 'disabled', 'NAR source raw-storage boundary differs');
assert(batch.detail_source?.source_id === 'nar-race-list-deba-table', 'NAR detail source differs');
assert((batch.scheduled_meetings ?? []).length === 48, 'NAR scheduled meeting count differs');
assert((batch.detail_candidates ?? []).length === 14, 'NAR complete detail candidate count differs');
assert((batch.schedule_candidates ?? []).length === 34, 'NAR schedule-only candidate count differs');
assert((batch.detail_blockers ?? []).length === 34, 'NAR detail blocker count differs');
assert((batch.schedule_errors ?? []).length === 0, 'NAR schedule errors must remain zero');
assert(new Date(REVIEWED_AT) >= new Date(batch.generated_at), 'review must not precede source generation');

const actualIds = batch.detail_candidates.map((candidate) => candidate.candidate_id).sort();
assert(JSON.stringify(actualIds) === JSON.stringify(ALL_DETAIL_IDS), `complete A+ identity set differs: ${JSON.stringify(actualIds)}`);
assert(VERIFIED_NOOP_IDS.length === 13, `expected 13 exact no-ops, got ${VERIFIED_NOOP_IDS.length}`);

const candidatesById = new Map(batch.detail_candidates.map((candidate) => [candidate.candidate_id, candidate]));
for (const candidate of batch.detail_candidates) assertSourceCandidate(candidate);

const canonicalMeetings = readJson('data/generated/timetable/canonical/meetings.json');
const canonicalDetails = readJson('data/generated/timetable/canonical/meeting-details.json');
const canonicalMeetingById = new Map(canonicalMeetings.meetings.map((row) => [row.meeting_id, row]));
const canonicalDetailById = new Map(canonicalDetails.details.map((row) => [row.meeting_id, row]));

for (const id of VERIFIED_NOOP_IDS) {
  const sourceCandidate = candidatesById.get(id);
  const rows = publicRows(sourceCandidate);
  const meeting = canonicalMeetingById.get(id);
  const detail = canonicalDetailById.get(id);
  assert(meeting?.capability_rank === 'A+', `${id} is not canonical A+`);
  assert(detail?.capability_rank === 'A+', `${id} is not canonical A+ detail`);
  assert(meeting.first_race_time_local === rows[0].post_time_local, `${id} first race time changed`);
  assert(meeting.last_race_time_local === rows.at(-1).post_time_local, `${id} last race time changed`);
  assert(JSON.stringify(canonicalPublicRows(detail)) === JSON.stringify(rows), `${id} public-safe timetable fields changed`);
}

const candidate = candidatesById.get(APPROVED_ID);
assert(candidate, `${APPROVED_ID} reviewed source missing`);
const rows = publicRows(candidate);
assert(rows.length === 12, `${APPROVED_ID} reviewed row count differs`);
assert(rows[0].post_time_local === '14:20', `${APPROVED_ID} reviewed first race time differs`);
assert(rows.at(-1).post_time_local === '20:35', `${APPROVED_ID} reviewed last race time differs`);
const currentMeeting = canonicalMeetingById.get(APPROVED_ID);
const currentDetail = canonicalDetailById.get(APPROVED_ID);
const prePromotionState = currentMeeting?.capability_rank === 'C' && !currentDetail;
const postPromotionState = currentMeeting?.capability_rank === 'A+'
  && currentDetail?.capability_rank === 'A+'
  && currentMeeting.first_race_time_local === '14:20'
  && currentMeeting.last_race_time_local === '20:35'
  && JSON.stringify(canonicalPublicRows(currentDetail)) === JSON.stringify(rows);
assert(prePromotionState || postPromotionState, `${APPROVED_ID} current canonical state is neither exact pre-promotion C nor exact promoted A+`);

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
  notes: 'Approved from the pinned August 25 NAR regular-refresh rerun after exact current-canonical comparison. Thirteen complete-detail meetings are exact no-ops; only Monbetsu 2026-08-27 is a C-to-A+ delta. Only public-safe A+ timetable fields are promoted.',
};

const serialized = JSON.stringify(record).toLowerCase();
for (const forbidden of ['horse_name', 'jockey', 'trainer', 'odds', 'payout', 'result', 'prediction', 'raw_html', 'stream_url']) {
  assert(!serialized.includes(forbidden), `${APPROVED_ID} contains forbidden field ${forbidden}`);
}

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-regular-refresh-2026-08-27-monbetsu-reviewed-detail-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-race-list-deba-table',
  candidate_window: {
    start_date: '2026-08-27',
    end_date_exclusive: '2026-08-28',
    timezone: 'Asia/Tokyo',
  },
  records: [record],
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Approved exactly one C-to-A+ NAR detail promotion from the pinned August 25 rerun. Thirteen complete-detail records were verified exact no-ops against current canonical A+; 34 schedule-only records remain unapproved.',
    promotion_target: PROMOTION_TARGET,
  },
};

assert(output.records.length === 1, `expected 1 reviewed delta record, got ${output.records.length}`);
assert(output.records.reduce((sum, item) => sum + item.timetable_rows.length, 0) === 12, 'reviewed race-row total differs');
writeJson(OUTPUT, output);
console.log(JSON.stringify({
  input: INPUT,
  source_blob_sha: SOURCE_BLOB_SHA,
  output: OUTPUT,
  complete_detail_records: ALL_DETAIL_IDS.length,
  verified_noop_records: VERIFIED_NOOP_IDS.length,
  approved_records: 1,
  approved_race_rows: 12,
  retained_unapproved_schedule_only_records: batch.schedule_candidates.length,
  publication_rank: 'A+',
}, null, 2));
