import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const OUTPUT = 'data/candidates/nar-horizon-extension-2026-09-17-approved.json';
const REVIEWED_AT = '2026-08-19T16:04:00Z';
const REVIEWER = 'badjoke-lab';
const START_DATE = '2026-09-16';
const END_DATE_EXCLUSIVE = '2026-09-18';
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
assert(batch.batch_id === 'due-job-plan-2026-08-19-due-japan-nar-coverage-gap-001-run-001', 'NAR review batch identity differs');
assert(batch.generated_at === '2026-08-19T04:02:59.790Z', 'NAR review batch timestamp differs');
assert(batch.review?.status === 'needs_review', 'NAR review batch must begin at needs_review');
assert(batch.review?.promotion_eligible === false, 'source NAR review batch must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'source NAR review batch canonical write must remain disabled');
assert(batch.review?.public_write === 'disabled', 'source NAR review batch public write must remain disabled');
assert(batch.review?.raw_source_storage === 'disabled', 'raw source storage must remain disabled');
assert(batch.schedule_source?.source_id === 'nar-monthly-schedule-grid', 'NAR schedule source differs');
assert(batch.requested_scope?.start_date === START_DATE, 'NAR requested start date differs');
assert(batch.requested_scope?.end_date_exclusive === END_DATE_EXCLUSIVE, 'NAR requested end date differs');
assert(batch.requested_scope?.timezone === 'Asia/Tokyo', 'NAR requested timezone differs');
assert(Array.isArray(batch.scheduled_meetings) && batch.scheduled_meetings.length === 8, 'NAR scheduled meeting count differs');
assert(new Date(REVIEWED_AT) >= new Date(batch.generated_at), 'review must not precede source generation');

const records = batch.scheduled_meetings
  .filter((meeting) => meeting.date >= START_DATE && meeting.date < END_DATE_EXCLUSIVE)
  .map((meeting) => ({
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
    notes: 'Approved from the official NAR September 2026 monthly schedule. Meeting date and racecourse only; race times and programme detail remain pending.',
  }))
  .sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));

assert(records.length === 8, 'reviewed extension must contain exactly eight meetings');
assert(records[0].date === START_DATE, `extension first date differs: ${records[0].date}`);
assert(records.at(-1).date === '2026-09-17', `extension final date differs: ${records.at(-1).date}`);
assert(new Set(records.map((record) => record.meeting_id)).size === records.length, 'NAR meeting IDs must be unique');

const expectedIds = [
  'nar-monbetsu-racecourse-2026-09-16',
  'nar-nagoya-racecourse-2026-09-16',
  'nar-oi-racecourse-2026-09-16',
  'nar-sonoda-racecourse-2026-09-16',
  'nar-monbetsu-racecourse-2026-09-17',
  'nar-nagoya-racecourse-2026-09-17',
  'nar-oi-racecourse-2026-09-17',
  'nar-sonoda-racecourse-2026-09-17',
];
assert(JSON.stringify(records.map((record) => record.meeting_id)) === JSON.stringify(expectedIds), 'reviewed NAR meeting identity set differs');

for (const [index, record] of records.entries()) {
  assertSafeRankC(record, `records[${index}]`);
  assert(new URL(record.source.official_url).hostname === 'www.keiba.go.jp', `${record.meeting_id} source hostname differs`);
}

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-september-2026-horizon-extension-reviewed-schedule-promotion-v1',
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
    summary: `Approved ${records.length} Rank C NAR meeting identities from the official September 2026 monthly schedule; no race times, rows, participants, betting, or result data.`,
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
  source_batch_promotion_eligible: batch.review.promotion_eligible,
  public_write: false,
}));
