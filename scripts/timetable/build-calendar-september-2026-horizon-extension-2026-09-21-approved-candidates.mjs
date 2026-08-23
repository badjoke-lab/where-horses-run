import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const OUTPUT = 'data/candidates/nar-horizon-extension-2026-09-21-approved.json';
const REVIEWED_AT = '2026-08-23T04:31:00Z';
const REVIEWER = 'badjoke-lab';
const START_DATE = '2026-09-21';
const END_DATE_EXCLUSIVE = '2026-09-22';
const PROMOTION_TARGET = 'canonical-timetable-v0';

function readJson(relativePath) {
  const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function writeJson(relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSafeRankC(record, label) {
  assert(record.capability_rank === 'C', `${label} must remain Rank C`);
  assert(record.first_race_time_local === null, `${label} must not claim first race time`);
  assert(record.last_race_time_local === null, `${label} must not claim last race time`);
  assert(Array.isArray(record.timetable_rows) && record.timetable_rows.length === 0, `${label} must not contain timetable rows`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of [
    'horse_name', 'jockey', 'trainer', 'odds', 'payout', 'result', 'prediction',
    'post_position', 'gate', 'weight_carried', 'raw_html', 'stream_url', 'race_list_url',
  ]) {
    assert(!serialized.includes(forbidden), `${label} contains forbidden field ${forbidden}`);
  }
}

assert(INPUT, 'WHR_NAR_REVIEW_BATCH is required');
const batch = readJson(INPUT);
assert(batch.schema_version === 'nar-incremental-batch-v2', 'NAR review batch schema differs');
assert(batch.batch_id === 'due-job-plan-2026-08-23-due-japan-nar-coverage-gap-001-run-001', 'NAR review batch identity differs');
assert(batch.generated_at === '2026-08-23T04:04:59.489Z', 'NAR review batch timestamp differs');
assert(batch.work_id === 'WHR-CAL-JAPAN-NAR-A-PLUS', 'NAR review Work ID differs');
assert(batch.collection_mode === 'date_window', 'NAR collection mode differs');
assert(batch.review?.status === 'needs_review', 'NAR review batch must begin at needs_review');
assert(batch.review?.promotion_eligible === false, 'source NAR review batch must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'source NAR review batch canonical write must remain disabled');
assert(batch.review?.public_write === 'disabled', 'source NAR review batch public write must remain disabled');
assert(batch.review?.raw_source_storage === 'disabled', 'raw source storage must remain disabled');
assert(batch.schedule_source?.source_id === 'nar-monthly-schedule-grid', 'NAR schedule source differs');
assert(batch.requested_scope?.kind === 'date_window', 'NAR requested scope kind differs');
assert(batch.requested_scope?.start_date === START_DATE, 'NAR requested start date differs');
assert(batch.requested_scope?.end_date_exclusive === END_DATE_EXCLUSIVE, 'NAR requested end date differs');
assert(batch.requested_scope?.timezone === 'Asia/Tokyo', 'NAR requested timezone differs');
assert(Array.isArray(batch.scheduled_meetings) && batch.scheduled_meetings.length === 3, 'NAR scheduled meeting count differs');
assert(Array.isArray(batch.schedule_candidates) && batch.schedule_candidates.length === 3, 'NAR schedule candidate count differs');
assert(Array.isArray(batch.detail_candidates) && batch.detail_candidates.length === 0, 'NAR detail candidates must remain empty');
assert(Array.isArray(batch.detail_blockers) && batch.detail_blockers.length === 3, 'NAR detail blocker count differs');
assert(Array.isArray(batch.schedule_errors) && batch.schedule_errors.length === 0, 'NAR schedule errors must remain empty');
const expectedIds = [
  'nar-kanazawa-racecourse-2026-09-21',
  'nar-mizusawa-racecourse-2026-09-21',
  'nar-saga-racecourse-2026-09-21',
];
assert(JSON.stringify(batch.scheduled_meetings.map((meeting) => meeting.meeting_id)) === JSON.stringify(expectedIds), 'NAR scheduled meeting identities differ');
assert(JSON.stringify(batch.schedule_candidates.map((candidate) => candidate.meeting_id)) === JSON.stringify(expectedIds), 'NAR schedule candidate identities differ');
assert(JSON.stringify(batch.detail_blockers.map((blocker) => blocker.meeting_id)) === JSON.stringify(expectedIds), 'NAR detail blocker identities differ');
for (const candidate of batch.schedule_candidates) {
  assert(candidate.capability_rank === 'C', `${candidate.meeting_id}: source schedule candidate rank differs`);
  assert(candidate.schedule_state === 'scheduled_pending_details', `${candidate.meeting_id}: schedule state differs`);
  assert(candidate.detail_status === 'parser_failure', `${candidate.meeting_id}: detail status differs`);
}
for (const blocker of batch.detail_blockers) {
  assert(blocker.status === 'parser_failure', `${blocker.meeting_id}: NAR detail blocker status differs`);
  assert(blocker.list_http_status === 200, `${blocker.meeting_id}: list HTTP status differs`);
  assert(blocker.blockers?.some((entry) => entry.reason === 'race_number_discovery_incomplete'), `${blocker.meeting_id}: expected race-number discovery blocker missing`);
}
assert(new Date(REVIEWED_AT) >= new Date(batch.generated_at), 'review must not precede source generation');

const records = batch.scheduled_meetings.map((meeting) => ({
  candidate_id: `approved-${meeting.meeting_id}`,
  meeting_id: meeting.meeting_id,
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: meeting.racecourse_id,
  date: meeting.date,
  timezone: 'Asia/Tokyo',
  capability_rank: 'C',
  first_race_time_local: null,
  last_race_time_local: null,
  timetable_rows: [],
  source: {
    source_id: 'nar-monthly-schedule-grid',
    official_url: meeting.official_schedule_url,
    checked_at: batch.generated_at,
    extraction_method: 'adapter_candidate',
  },
  confidence: 'high',
  review_status: 'approved',
  notes: 'Approved from the official NAR September 2026 monthly schedule. Meeting date and racecourse only; race times and programme detail remain pending after detail parser failure.',
}));

assert(JSON.stringify(records.map((record) => record.meeting_id)) === JSON.stringify(expectedIds), 'reviewed NAR meeting identity set differs');
assert(records.every((record) => record.date === START_DATE), 'extension date differs');
for (const [index, record] of records.entries()) {
  assertSafeRankC(record, `records[${index}]`);
  assert(new URL(record.source.official_url).hostname === 'www.keiba.go.jp', `${record.meeting_id} source hostname differs`);
}

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-september-2026-horizon-extension-2026-09-21-reviewed-schedule-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-monthly-schedule-grid',
  candidate_window: {
    start_date: START_DATE,
    end_date_exclusive: END_DATE_EXCLUSIVE,
    timezone: 'Asia/Tokyo',
  },
  records,
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Approved three Rank C NAR meeting identities for September 21 from the official September 2026 monthly schedule; no race times, rows, participants, betting, or result data.',
    promotion_target: PROMOTION_TARGET,
  },
};

writeJson(OUTPUT, output);
console.log(JSON.stringify({
  input: INPUT,
  output: OUTPUT,
  approved_records: records.length,
  first_date: records[0].date,
  last_date: records.at(-1).date,
  publication_rank: 'C',
  detail_statuses: batch.detail_blockers.map((blocker) => blocker.status),
  source_batch_promotion_eligible: batch.review.promotion_eligible,
  public_write: false,
}));
