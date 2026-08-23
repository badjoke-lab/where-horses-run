import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const OUTPUT = 'data/candidates/nar-regular-refresh-2026-08-26-a-plus-approved.json';
const REVIEWED_AT = '2026-08-23T04:38:00Z';
const REVIEWER = 'badjoke-lab';
const SOURCE_BATCH_ID = 'due-job-plan-2026-08-23-due-japan-nar-regular-refresh-001-run-001';
const SOURCE_GENERATED_AT = '2026-08-23T04:04:59.493Z';
const SOURCE_BLOB_SHA = '8c8e58a4c612588a1c76faf345092aab02773a87';
const SOURCE_START_DATE = '2026-08-24';
const SOURCE_END_DATE_EXCLUSIVE = '2026-09-07';
const PROMOTION_TARGET = 'canonical-timetable-v0';
const ALL_DETAIL_IDS = [
  'nar-funabashi-racecourse-2026-08-24',
  'nar-funabashi-racecourse-2026-08-25',
  'nar-kanazawa-racecourse-2026-08-24',
  'nar-kanazawa-racecourse-2026-08-25',
  'nar-kasamatsu-racecourse-2026-08-25',
  'nar-kasamatsu-racecourse-2026-08-26',
  'nar-monbetsu-racecourse-2026-08-25',
  'nar-morioka-racecourse-2026-08-24',
  'nar-morioka-racecourse-2026-08-25',
  'nar-nagoya-racecourse-2026-08-24',
].sort();
const ALREADY_REVIEWED_IDS = [
  'nar-funabashi-racecourse-2026-08-24',
  'nar-funabashi-racecourse-2026-08-25',
  'nar-kanazawa-racecourse-2026-08-24',
  'nar-kanazawa-racecourse-2026-08-25',
  'nar-kasamatsu-racecourse-2026-08-25',
  'nar-monbetsu-racecourse-2026-08-25',
  'nar-morioka-racecourse-2026-08-24',
  'nar-morioka-racecourse-2026-08-25',
  'nar-nagoya-racecourse-2026-08-24',
].sort();
const APPROVED_ID = 'nar-kasamatsu-racecourse-2026-08-26';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitBlobSha(text) {
  const content = Buffer.from(text, 'utf8');
  const header = Buffer.from(`blob ${content.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(content).digest('hex');
}

function readText(inputPath) {
  const fullPath = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  return fs.readFileSync(fullPath, 'utf8');
}

function writeJson(relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function publicRows(candidate) {
  const rows = candidate.timetable_rows ?? [];
  assert(rows.length === 10, `${candidate.candidate_id} must contain exactly 10 timetable rows`);
  assert(candidate.meeting_completeness?.expected_race_count === rows.length, `${candidate.candidate_id} expected race count differs`);
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
assert(batch.requested_scope?.start_date === SOURCE_START_DATE, 'NAR requested start date differs');
assert(batch.requested_scope?.end_date_exclusive === SOURCE_END_DATE_EXCLUSIVE, 'NAR requested end date differs');
assert(batch.requested_scope?.timezone === 'Asia/Tokyo', 'NAR requested timezone differs');
assert(batch.review?.status === 'needs_review', 'NAR source review status differs');
assert(batch.review?.promotion_eligible === false, 'NAR source must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'NAR source canonical write boundary differs');
assert(batch.review?.public_write === 'disabled', 'NAR source public write boundary differs');
assert(batch.review?.raw_source_storage === 'disabled', 'NAR source raw-storage boundary differs');
assert(batch.detail_source?.source_id === 'nar-race-list-deba-table', 'NAR detail source differs');
assert((batch.scheduled_meetings ?? []).length === 49, 'NAR scheduled meeting count differs');
assert((batch.detail_candidates ?? []).length === 10, 'NAR complete detail candidate count differs');
assert((batch.schedule_candidates ?? []).length === 39, 'NAR schedule-only candidate count differs');
assert((batch.detail_blockers ?? []).length === 39, 'NAR detail blocker count differs');
assert((batch.schedule_errors ?? []).length === 0, 'NAR schedule errors must remain zero');
assert(new Date(REVIEWED_AT) >= new Date(batch.generated_at), 'review must not precede source generation');

const actualIds = batch.detail_candidates.map((candidate) => candidate.candidate_id).sort();
assert(JSON.stringify(actualIds) === JSON.stringify(ALL_DETAIL_IDS), `complete A+ identity set differs: ${JSON.stringify(actualIds)}`);
const partitionIds = [...ALREADY_REVIEWED_IDS, APPROVED_ID].sort();
assert(JSON.stringify(partitionIds) === JSON.stringify(ALL_DETAIL_IDS), 'review partition does not exactly cover the complete A+ set');

const candidate = batch.detail_candidates.find((record) => record.candidate_id === APPROVED_ID);
assert(candidate, 'newly reviewed Kasamatsu August 26 A+ candidate is missing');
assert(candidate.schema_version === 'nar-incremental-detail-candidate-v2', 'Kasamatsu detail schema differs');
assert(candidate.candidate_rank === 'A+', 'Kasamatsu candidate rank differs');
assert(candidate.review?.status === 'needs_review', 'Kasamatsu source review status differs');
assert(candidate.review?.promotion_eligible === false, 'Kasamatsu source promotion boundary differs');
assert(candidate.source?.source_id === 'nar-official-race-list-and-deba-table', 'Kasamatsu source ID differs');
assert(candidate.source?.list_http_status === 200, 'Kasamatsu race-list HTTP status differs');
assert(candidate.source?.storage_policy === 'public_safe_extracted_fields_only_no_raw_html', 'Kasamatsu storage policy differs');
assert(new URL(candidate.source.official_race_list_url).hostname === 'www.keiba.go.jp', 'Kasamatsu source hostname differs');
const rows = publicRows(candidate);
assert(rows[0].post_time_local === '11:55', 'Kasamatsu first race time differs');
assert(rows.at(-1).post_time_local === '17:00', 'Kasamatsu last race time differs');

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
  notes: 'Approved from the pinned August 23 NAR regular-refresh complete detail candidate set. Only meeting identity and the six public-safe A+ timetable fields are promoted.',
};
const serialized = JSON.stringify(record).toLowerCase();
for (const forbidden of ['horse_name', 'jockey', 'trainer', 'odds', 'payout', 'result', 'prediction', 'raw_html', 'stream_url']) {
  assert(!serialized.includes(forbidden), `Kasamatsu candidate contains forbidden field ${forbidden}`);
}

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-regular-refresh-2026-08-26-reviewed-detail-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-race-list-deba-table',
  candidate_window: {
    start_date: '2026-08-26',
    end_date_exclusive: '2026-08-27',
    timezone: 'Asia/Tokyo',
  },
  records: [record],
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Approved the one newly complete A+ NAR detail record, Kasamatsu August 26, from the pinned August 23 regular-refresh batch. The other nine complete records were already reviewed and the remaining 39 schedule-only records stay unapproved.',
    promotion_target: PROMOTION_TARGET,
  },
};

writeJson(OUTPUT, output);
console.log(JSON.stringify({
  input: INPUT,
  source_blob_sha: SOURCE_BLOB_SHA,
  output: OUTPUT,
  approved_records: 1,
  approved_race_rows: rows.length,
  first_race_time_local: record.first_race_time_local,
  last_race_time_local: record.last_race_time_local,
  retained_already_reviewed_complete_records: ALREADY_REVIEWED_IDS.length,
  retained_unapproved_schedule_only_records: batch.schedule_candidates.length,
  publication_rank: 'A+',
  public_write: false,
}));
