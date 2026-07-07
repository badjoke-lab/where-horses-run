import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = 'data/candidates/nar-incremental-batches/july-2026-08-through-31-run-001/batch.json';
const reportPath = 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/collection-report.json';
const coveragePath = 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/coverage-observation.json';
const reviewPath = 'data/reviews/nar-incremental-v2-july-remainder-review.json';
const detailOutputPath = 'data/candidates/nar-incremental-v2-july-remainder-a-plus-approved.json';
const scheduleOutputPath = 'data/candidates/nar-incremental-v2-july-remainder-c-approved.json';
const detailSourceId = 'nar-race-list-deba-table';
const scheduleSourceId = 'nar-monthly-schedule-grid';
const checkOnly = process.argv.includes('--check');

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}
function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}
function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}
function equalJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function gitBlobSha(text) {
  const content = Buffer.from(text, 'utf8');
  const header = Buffer.from(`blob ${content.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(content).digest('hex');
}
function rankCounts(detailCandidates, scheduleCandidates) {
  return { C: scheduleCandidates.length, 'A+': detailCandidates.length };
}
function publicRows(candidate) {
  const rows = candidate.timetable_rows ?? [];
  assert(rows.length > 0, `${candidate.candidate_id} has no timetable rows`);
  assert(rows.length === candidate.meeting_completeness?.expected_race_count, `${candidate.candidate_id} row count differs`);
  assert(candidate.meeting_completeness?.all_a_plus_fields_complete === true, `${candidate.candidate_id} is not A+ complete`);
  return rows.map((row, index) => {
    const raceNumber = index + 1;
    assert(row.race_number === raceNumber, `${candidate.candidate_id} race numbers are not continuous`);
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

const sourceText = readText(sourcePath);
const source = JSON.parse(sourceText);
const report = readJson(reportPath);
const coverage = readJson(coveragePath);
const review = readJson(reviewPath);

assert(source.schema_version === 'nar-incremental-batch-v2', 'unexpected source batch schema');
assert(report.schema_version === 'nar-incremental-collection-report-v2', 'unexpected collection report schema');
assert(coverage.schema_version === 'calendar-coverage-observation-v1', 'unexpected Coverage Observation schema');
assert(review.schema_version === 'nar-incremental-v2-review-decision-v1', 'unexpected review decision schema');
assert(source.work_id === 'WHR-CAL-JAPAN-NAR-A-PLUS', 'unexpected source Work ID');
assert(review.work_id === source.work_id, 'review Work ID differs');
assert(review.source_batch_path === sourcePath, 'review source path differs');
assert(review.source_batch_blob_sha === gitBlobSha(sourceText), 'review source batch blob SHA differs');
assert(review.source_generated_at === source.generated_at, 'review source generated_at differs');
assert(review.batch_id === source.batch_id, 'review batch ID differs');
assert(equalJson(review.requested_scope, source.requested_scope), 'review requested scope differs');
assert(report.batch_id === source.batch_id && coverage.run_id === source.batch_id, 'batch/report/coverage identity differs');
assert(report.generated_at === source.generated_at && coverage.checked_at === source.generated_at, 'batch/report/coverage timestamp differs');
assert(equalJson(report.requested_scope, source.requested_scope), 'report requested scope differs');
assert(equalJson(coverage.requested_scope, source.requested_scope), 'coverage requested scope differs');
assert(source.collection_mode === 'date_window', 'approved v2 batch must use date_window mode');
assert(source.requested_scope?.kind === 'date_window', 'approved source scope must be date_window');
assert(source.review?.status === 'needs_review' && source.review?.promotion_eligible === false, 'source batch must remain review-only');
assert(source.review?.canonical_write === 'disabled' && source.review?.public_write === 'disabled', 'source batch write boundary differs');
assert(source.review?.raw_source_storage === 'disabled', 'source raw-storage boundary differs');
assert(review.review?.status === 'approved', 'review decision is not approved');
assert(typeof review.review?.reviewer === 'string' && review.review.reviewer, 'reviewer is required');
assert(!Number.isNaN(Date.parse(review.review?.reviewed_at)), 'reviewed_at must be valid');
assert(Date.parse(source.generated_at) <= Date.parse(review.review.reviewed_at), 'review predates source generation');
assert(review.review?.promotion_target === 'canonical-timetable-v0', 'promotion target differs');
assert(review.approval_scope === 'entire_pinned_batch', 'approval scope must cover the entire pinned batch');
assert((source.schedule_errors ?? []).length === 0, 'schedule errors must be zero for approval');
assert(coverage.coverage_claim === 'source_window_complete', 'schedule source window must be complete');
assert((coverage.source_errors ?? []).length === 0, 'Coverage Observation source errors must be zero');

for (const [key, expected] of Object.entries(review.expected_counts ?? {})) {
  assert(report[key] === expected, `review expected count differs for ${key}`);
}

const scheduledMeetings = source.scheduled_meetings ?? [];
const detailCandidates = source.detail_candidates ?? [];
const scheduleCandidates = source.schedule_candidates ?? [];
const detailBlockers = source.detail_blockers ?? [];

assert(scheduledMeetings.length === report.scheduled_meetings, 'scheduled meeting count differs');
assert(detailCandidates.length === report.complete_detail_candidates, 'detail candidate count differs');
assert(scheduleCandidates.length === report.schedule_only_candidates, 'schedule candidate count differs');
assert(detailBlockers.length === report.detail_blockers, 'detail blocker count differs');
assert(equalJson(rankCounts(detailCandidates, scheduleCandidates), review.approved_rank_counts), 'approved rank counts differ');

const scheduledIds = sorted(scheduledMeetings.map((meeting) => meeting.meeting_id));
const detailIds = sorted(detailCandidates.map((candidate) => candidate.candidate_id));
const scheduleIds = sorted(scheduleCandidates.map((candidate) => candidate.meeting_id));
const detailSet = new Set(detailIds);
const scheduleSet = new Set(scheduleIds);
assert(scheduledIds.length === new Set(scheduledIds).size, 'scheduled meeting IDs must be unique');
assert(detailIds.length === detailSet.size, 'detail candidate IDs must be unique');
assert(scheduleIds.length === scheduleSet.size, 'schedule candidate meeting IDs must be unique');
for (const id of detailIds) assert(!scheduleSet.has(id), `meeting appears in both detail and schedule candidate sets: ${id}`);
assert(equalJson(scheduledIds, sorted([...detailIds, ...scheduleIds])), 'detail and schedule candidate union must exactly equal scheduled meeting set');
assert(equalJson(scheduleIds, sorted(coverage.unresolved_meeting_ids ?? [])), 'schedule candidate IDs must equal unresolved meeting IDs');

const detailRecords = detailCandidates.map((candidate) => {
  assert(candidate.schema_version === 'nar-incremental-detail-candidate-v2', `${candidate.candidate_id} detail schema differs`);
  assert(candidate.candidate_rank === 'A+', `${candidate.candidate_id} candidate rank differs`);
  assert(candidate.review?.status === 'needs_review' && candidate.review?.promotion_eligible === false, `${candidate.candidate_id} source detail review state differs`);
  const rows = publicRows(candidate);
  return {
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
      source_id: detailSourceId,
      official_url: candidate.source.official_race_list_url,
      checked_at: source.generated_at,
      extraction_method: 'adapter_candidate',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: 'Approved from the pinned NAR incremental v2 detail candidate set. Only meeting identity and the six approved A+ timetable fields are promoted.',
  };
});

const scheduleRecords = scheduleCandidates.map((candidate) => {
  assert(candidate.schema_version === 'nar-schedule-meeting-candidate-v1', `${candidate.meeting_id} schedule schema differs`);
  assert(candidate.capability_rank === 'C', `${candidate.meeting_id} schedule rank differs`);
  assert(candidate.review?.status === 'needs_review' && candidate.review?.promotion_eligible === false, `${candidate.meeting_id} source schedule review state differs`);
  assert(['scheduled_pending_details', 'detail_retry_required'].includes(candidate.schedule_state), `${candidate.meeting_id} schedule state differs`);
  return {
    candidate_id: `approved-${candidate.meeting_id}`,
    meeting_id: candidate.meeting_id,
    country_id: candidate.country_id,
    authority_id: candidate.authority_id,
    racing_system_id: candidate.racing_system_id,
    racecourse_id: candidate.racecourse_id,
    date: candidate.date,
    timezone: candidate.timezone,
    capability_rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: scheduleSourceId,
      official_url: candidate.source.official_schedule_url,
      checked_at: source.generated_at,
      extraction_method: 'adapter_candidate',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: `Approved from the pinned NAR monthly schedule-grid evidence. Timetable detail remains pending under source state ${candidate.schedule_state}.`,
  };
});

const bySortKey = (a, b) => `${a.date}:${a.racecourse_id}:${a.meeting_id}`.localeCompare(`${b.date}:${b.racecourse_id}:${b.meeting_id}`);
detailRecords.sort(bySortKey);
scheduleRecords.sort(bySortKey);

function envelope({ adapterId, sourceId, records, summary }) {
  return {
    schema_version: 'timetable-candidate-v1',
    generated_at: source.generated_at,
    adapter_id: adapterId,
    country_id: 'japan',
    authority_id: 'nar-local-government-racing',
    source_id: sourceId,
    candidate_window: {
      start_date: source.requested_scope.start_date,
      end_date_exclusive: source.requested_scope.end_date_exclusive,
      timezone: source.requested_scope.timezone,
    },
    records,
    review: {
      status: review.review.status,
      reviewed_at: review.review.reviewed_at,
      reviewer: review.review.reviewer,
      summary,
      promotion_target: review.review.promotion_target,
    },
  };
}

const detailOutput = envelope({
  adapterId: 'nar-incremental-v2-reviewed-detail-promotion-v1',
  sourceId: detailSourceId,
  records: detailRecords,
  summary: `Approved ${detailRecords.length} complete A+ NAR detail records from pinned batch ${source.batch_id}.`,
});
const scheduleOutput = envelope({
  adapterId: 'nar-incremental-v2-reviewed-schedule-promotion-v1',
  sourceId: scheduleSourceId,
  records: scheduleRecords,
  summary: `Approved ${scheduleRecords.length} C-level NAR schedule records from pinned batch ${source.batch_id}; timetable detail remains pending review and retry.`,
});

function writeOrCheck(relativePath, value) {
  const content = serialize(value);
  const absolutePath = path.join(root, relativePath);
  if (checkOnly) {
    assert(fs.existsSync(absolutePath), `missing generated approved candidate: ${relativePath}`);
    assert(fs.readFileSync(absolutePath, 'utf8') === content, `generated approved candidate is stale: ${relativePath}`);
    return;
  }
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

writeOrCheck(detailOutputPath, detailOutput);
writeOrCheck(scheduleOutputPath, scheduleOutput);
console.log(`NAR_INCREMENTAL_V2_REVIEWED_PROMOTION_CANDIDATES: ${checkOnly ? 'pass' : 'wrote'} detail=${detailRecords.length} schedule=${scheduleRecords.length}`);
