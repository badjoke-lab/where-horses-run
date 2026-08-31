import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const OUTPUT = 'data/candidates/nar-regular-refresh-2026-09-01-through-2026-09-04-a-plus-approved.json';
const REVIEWED_AT = '2026-08-31T09:14:00Z';
const REVIEWER = 'badjoke-lab';
const SOURCE_BATCH_ID = 'due-job-plan-2026-08-31-due-japan-nar-regular-refresh-001-run-001';
const SOURCE_GENERATED_AT = '2026-08-31T09:07:17.010Z';
const PROMOTION_TARGET = 'canonical-timetable-v0';

const COMPLETE_DETAIL_IDS = [
  'nar-kanazawa-racecourse-2026-09-01',
  'nar-monbetsu-racecourse-2026-09-01',
  'nar-monbetsu-racecourse-2026-09-02',
  'nar-morioka-racecourse-2026-09-01',
  'nar-nagoya-racecourse-2026-09-01',
  'nar-nagoya-racecourse-2026-09-02',
  'nar-nagoya-racecourse-2026-09-03',
  'nar-oi-racecourse-2026-09-01',
  'nar-oi-racecourse-2026-09-02',
  'nar-oi-racecourse-2026-09-03',
  'nar-sonoda-racecourse-2026-09-02',
  'nar-sonoda-racecourse-2026-09-03',
  'nar-sonoda-racecourse-2026-09-04',
].sort();

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
assert(batch.requested_scope?.start_date === '2026-09-01', 'NAR requested start date differs');
assert(batch.requested_scope?.end_date_exclusive === '2026-09-15', 'NAR requested end date differs');
assert(batch.requested_scope?.timezone === 'Asia/Tokyo', 'NAR requested timezone differs');
assert(batch.review?.status === 'needs_review', 'NAR source review status differs');
assert(batch.review?.promotion_eligible === false, 'NAR source must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'NAR canonical write boundary differs');
assert(batch.review?.public_write === 'disabled', 'NAR public write boundary differs');
assert(batch.review?.raw_source_storage === 'disabled', 'NAR raw-storage boundary differs');
assert((batch.scheduled_meetings ?? []).length === 50, 'NAR scheduled meeting count differs');
assert((batch.detail_candidates ?? []).length === 13, 'NAR complete detail candidate count differs');
assert((batch.schedule_candidates ?? []).length === 37, 'NAR schedule-only candidate count differs');
assert((batch.detail_blockers ?? []).length === 37, 'NAR detail blocker count differs');
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

const approvedIds = [];
const noOpIds = [];
for (const id of COMPLETE_DETAIL_IDS) {
  const rows = publicRows(candidatesById.get(id));
  const meeting = meetingById.get(id);
  const detail = detailById.get(id);
  const prePromotionState = meeting?.capability_rank === 'C'
    && meeting.first_race_time_local === null
    && meeting.last_race_time_local === null
    && !detail;
  const postPromotionState = meeting?.capability_rank === 'A+'
    && meeting.first_race_time_local === rows[0].post_time_local
    && meeting.last_race_time_local === rows.at(-1).post_time_local
    && detail?.capability_rank === 'A+'
    && JSON.stringify(canonicalPublicRows(detail)) === JSON.stringify(rows);
  assert(prePromotionState || postPromotionState, `${id} current canonical state is neither exact C/no-detail prestate nor exact promoted A+`);
  if (prePromotionState) approvedIds.push(id);
  else noOpIds.push(id);
}
assert(approvedIds.length > 0, 'no C-to-A+ deltas remain in the reviewed thirteen-record batch');

const records = approvedIds.map((id) => {
  const candidate = candidatesById.get(id);
  const rows = publicRows(candidate);
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
    notes: 'Approved from the exact pinned August 31 NAR regular-refresh batch after current-canonical comparison. Only public-safe A+ timetable fields are promoted.',
  };
  assertNoForbiddenKeys(record);
  return record;
});

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-regular-refresh-2026-09-01-through-2026-09-04-thirteen-reviewed-detail-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-race-list-deba-table',
  candidate_window: {
    start_date: '2026-09-01',
    end_date_exclusive: '2026-09-05',
    timezone: 'Asia/Tokyo',
  },
  records,
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: `Reviewed all thirteen complete-detail records from the pinned August 31 NAR regular-refresh batch: ${approvedIds.length} exact C-to-A+ deltas approved and ${noOpIds.length} exact A+ no-ops retained. The remaining 37 schedule-only records remain unapproved.`,
    promotion_target: PROMOTION_TARGET,
  },
};

writeJson(OUTPUT, output);
console.log(JSON.stringify({
  input: INPUT,
  output: OUTPUT,
  complete_detail_records: COMPLETE_DETAIL_IDS.length,
  approved_records: records.length,
  verified_noop_records: noOpIds.length,
  approved_ids: approvedIds,
  noop_ids: noOpIds,
  approved_race_rows: records.reduce((sum, record) => sum + record.timetable_rows.length, 0),
  retained_unapproved_schedule_only_records: batch.schedule_candidates.length,
  publication_rank: 'A+',
  public_write: false,
}));
