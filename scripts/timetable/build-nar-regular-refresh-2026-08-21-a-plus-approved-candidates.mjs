import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const REVIEW_PATH = 'data/reviews/nar-regular-refresh-2026-08-21-a-plus-review.json';
const OUTPUT = 'data/candidates/nar-regular-refresh-2026-08-21-a-plus-approved.json';
const SOURCE_ID = 'nar-race-list-deba-table';
const checkOnly = process.argv.includes('--check');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function readText(filePath) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  return fs.readFileSync(fullPath, 'utf8');
}
function readJson(filePath) {
  return JSON.parse(readText(filePath));
}
function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function gitBlobSha(text) {
  const content = Buffer.from(text, 'utf8');
  const header = Buffer.from(`blob ${content.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(content).digest('hex');
}
function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

assert(INPUT, 'WHR_NAR_REVIEW_BATCH is required');
const sourceText = readText(INPUT);
const batch = JSON.parse(sourceText);
const review = readJson(REVIEW_PATH);

assert(review.schema_version === 'nar-selected-detail-review-decision-v1', 'review schema differs');
assert(review.work_id === 'WHR-CAL-JAPAN-NAR-A-PLUS', 'review Work ID differs');
assert(review.source_pull_request === 559, 'review source PR differs');
assert(review.source_evidence_head === 'a7593c76222f78495cb1a9ae1a1779f3fcd1a725', 'review evidence head differs');
assert(review.source_batch_path === 'data/candidates/nar-incremental-batches/due-job-plan-2026-08-21-due-japan-nar-regular-refresh-001-run-001/batch.json', 'review source batch path differs');
assert(review.source_batch_blob_sha === '89410debbd648e1264933df37b0ef246945a1873', 'review source blob pin differs');
assert(gitBlobSha(sourceText) === review.source_batch_blob_sha, 'source batch blob SHA differs from reviewed pin');
assert(review.source_generated_at === '2026-08-21T04:38:58.183Z', 'review source timestamp differs');
assert(review.batch_id === 'due-job-plan-2026-08-21-due-japan-nar-regular-refresh-001-run-001', 'review batch identity differs');
assert(review.approval_scope === 'selected_detail_candidates_only', 'review approval scope differs');
assert(review.schedule_candidate_approval === 'none', 'schedule candidates must remain unapproved');
assert(review.review?.status === 'approved', 'review is not approved');
assert(review.review?.reviewer === 'badjoke-lab', 'reviewer differs');
assert(review.review?.promotion_target === 'canonical-timetable-v0', 'promotion target differs');
assert(!Number.isNaN(Date.parse(review.review?.reviewed_at)), 'reviewed_at is invalid');

assert(batch.schema_version === 'nar-incremental-batch-v2', 'source batch schema differs');
assert(batch.work_id === review.work_id, 'source Work ID differs');
assert(batch.batch_id === review.batch_id, 'source batch ID differs');
assert(batch.generated_at === review.source_generated_at, 'source generated_at differs');
assert(exact(batch.requested_scope, review.requested_scope), 'source requested scope differs');
assert(batch.collection_mode === 'date_window', 'source collection mode differs');
assert(batch.review?.status === 'needs_review', 'source batch must remain needs_review');
assert(batch.review?.promotion_eligible === false, 'source batch must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'source canonical write boundary differs');
assert(batch.review?.public_write === 'disabled', 'source public write boundary differs');
assert(batch.review?.raw_source_storage === 'disabled', 'source raw storage boundary differs');
assert(Date.parse(review.review.reviewed_at) >= Date.parse(batch.generated_at), 'review predates source generation');
assert(Array.isArray(batch.schedule_candidates), 'source schedule candidates missing');
assert(Array.isArray(batch.detail_candidates), 'source detail candidates missing');

const selectedIds = review.selected_detail_candidate_ids ?? [];
assert(selectedIds.length === review.expected_selected_count, 'selected detail count differs');
assert(selectedIds.length === new Set(selectedIds).size, 'selected detail IDs must be unique');
const expectedIds = [
  'nar-kanazawa-racecourse-2026-08-23',
  'nar-kanazawa-racecourse-2026-08-24',
  'nar-kanazawa-racecourse-2026-08-25',
  'nar-morioka-racecourse-2026-08-23',
  'nar-saga-racecourse-2026-08-22',
  'nar-saga-racecourse-2026-08-23',
];
assert(exact(selectedIds, expectedIds), 'selected detail identity set differs');

const sourceById = new Map((batch.detail_candidates ?? []).map((candidate) => [candidate.candidate_id, candidate]));
const records = selectedIds.map((meetingId) => {
  const candidate = sourceById.get(meetingId);
  assert(candidate, `${meetingId}: selected source detail candidate missing`);
  assert(candidate.schema_version === 'nar-incremental-detail-candidate-v2', `${meetingId}: detail schema differs`);
  assert(candidate.work_id === review.work_id, `${meetingId}: Work ID differs`);
  assert(candidate.candidate_rank === 'A+', `${meetingId}: candidate rank differs`);
  assert(candidate.review?.status === 'needs_review' && candidate.review?.promotion_eligible === false, `${meetingId}: source candidate review boundary differs`);
  assert(candidate.meeting_completeness?.continuous_race_numbers === true, `${meetingId}: race numbers are not continuous`);
  assert(candidate.meeting_completeness?.all_a_plus_fields_complete === true, `${meetingId}: A+ completeness differs`);
  const expectedRaceCount = candidate.meeting_completeness?.expected_race_count;
  assert(Number.isInteger(expectedRaceCount) && expectedRaceCount > 0, `${meetingId}: expected race count is invalid`);
  assert(candidate.meeting_completeness?.observed_race_count === expectedRaceCount, `${meetingId}: observed race count differs`);
  const rows = candidate.timetable_rows ?? [];
  assert(rows.length === expectedRaceCount, `${meetingId}: timetable row count differs`);
  const publicRows = rows.map((row, index) => {
    const raceNumber = index + 1;
    assert(row.race_number === raceNumber, `${meetingId}: Race ${raceNumber} numbering differs`);
    for (const field of ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      assert(row[field] !== null && row[field] !== '', `${meetingId}: Race ${raceNumber} missing ${field}`);
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
  assert(candidate.source?.source_id === 'nar-official-race-list-and-deba-table', `${meetingId}: source ID differs`);
  assert(candidate.source?.list_http_status === 200, `${meetingId}: race-list HTTP status differs`);
  assert(candidate.source?.storage_policy === 'public_safe_extracted_fields_only_no_raw_html', `${meetingId}: storage policy differs`);
  const officialUrl = candidate.source?.official_race_list_url;
  assert(typeof officialUrl === 'string' && new URL(officialUrl).hostname === 'www.keiba.go.jp', `${meetingId}: official URL differs`);
  return {
    candidate_id: `approved-${meetingId}`,
    meeting_id: meetingId,
    country_id: candidate.country_id,
    authority_id: candidate.authority_id,
    racing_system_id: candidate.racing_system_id,
    racecourse_id: candidate.racecourse_id,
    date: candidate.date,
    timezone: candidate.timezone,
    capability_rank: 'A+',
    first_race_time_local: publicRows[0].post_time_local,
    last_race_time_local: publicRows.at(-1).post_time_local,
    timetable_rows: publicRows,
    source: {
      source_id: SOURCE_ID,
      official_url: officialUrl,
      checked_at: batch.generated_at,
      extraction_method: 'adapter_candidate',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: 'Approved from the pinned NAR August 21 regular-refresh detail candidate. Only meeting identity and the six public-safe A+ timetable fields are promoted.',
  };
});

records.sort((a, b) => `${a.date}:${a.racecourse_id}:${a.meeting_id}`.localeCompare(`${b.date}:${b.racecourse_id}:${b.meeting_id}`));
assert(exact(sorted(records.map((record) => record.meeting_id)), sorted(expectedIds)), 'approved record identity set differs');

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-regular-refresh-2026-08-21-reviewed-detail-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: SOURCE_ID,
  candidate_window: {
    start_date: batch.requested_scope.start_date,
    end_date_exclusive: batch.requested_scope.end_date_exclusive,
    timezone: batch.requested_scope.timezone,
  },
  records,
  review: {
    status: 'approved',
    reviewed_at: review.review.reviewed_at,
    reviewer: review.review.reviewer,
    summary: review.review.summary,
    promotion_target: review.review.promotion_target,
  },
};

const outputPath = path.join(root, OUTPUT);
const content = serialize(output);
if (checkOnly) {
  assert(fs.existsSync(outputPath), `approved candidate missing: ${OUTPUT}`);
  assert(fs.readFileSync(outputPath, 'utf8') === content, `approved candidate is stale: ${OUTPUT}`);
  console.log(`NAR_REGULAR_REFRESH_A_PLUS_CANDIDATE: pass records=${records.length}`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);
console.log(JSON.stringify({ output: OUTPUT, approved_records: records.length, approved_ids: records.map((record) => record.meeting_id), source_blob_sha: gitBlobSha(sourceText), schedule_candidates_approved: 0 }));
