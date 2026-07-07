import { createHash } from 'node:crypto';
import fs from 'node:fs';

export const paths = Object.freeze({
  batch: 'data/candidates/nar-incremental-batches/july-2026-08-through-31-run-001/batch.json',
  report: 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/collection-report.json',
  coverage: 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/coverage-observation.json',
  retries: 'data/generated/timetable/nar-incremental-batches/july-2026-08-through-31-run-001/retry-targets.json',
  review: 'data/reviews/nar-incremental-v2-july-remainder-review.json',
  detailOutput: 'data/candidates/nar-incremental-v2-july-remainder-a-plus-approved.json',
  scheduleOutput: 'data/candidates/nar-incremental-v2-july-remainder-c-approved.json'
});

const readText = (file) => fs.readFileSync(file, 'utf8');
const readJson = (file) => JSON.parse(readText(file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sorted = (values) => [...values].sort((a, b) => a.localeCompare(b));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function gitBlobSha(text) {
  const content = Buffer.from(text, 'utf8');
  const header = Buffer.from(`blob ${content.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(content).digest('hex');
}

export function loadReviewedNarV2Context() {
  const batchText = readText(paths.batch);
  const batch = JSON.parse(batchText);
  const report = readJson(paths.report);
  const coverage = readJson(paths.coverage);
  const retries = readJson(paths.retries);
  const review = readJson(paths.review);

  assert(batch.schema_version === 'nar-incremental-batch-v2', 'unexpected batch schema');
  assert(review.schema_version === 'nar-incremental-v2-review-decision-v1', 'unexpected review schema');
  assert(batch.batch_id === review.batch_id, 'review batch ID differs');
  assert(review.source_batch_path === paths.batch, 'review source path differs');
  assert(review.source_batch_blob_sha === gitBlobSha(batchText), 'review source blob SHA differs');
  assert(review.source_generated_at === batch.generated_at, 'review source timestamp differs');
  assert(same(review.requested_scope, batch.requested_scope), 'review scope differs');
  assert(report.batch_id === batch.batch_id && coverage.run_id === batch.batch_id && retries.batch_id === batch.batch_id, 'artifact batch IDs differ');
  assert(review.review?.status === 'approved', 'review decision is not approved');
  assert(Date.parse(batch.generated_at) <= Date.parse(review.review.reviewed_at), 'review predates batch');
  assert(review.review?.promotion_target === 'canonical-timetable-v0', 'promotion target differs');
  assert(batch.review?.status === 'needs_review' && batch.review?.promotion_eligible === false, 'source batch review boundary differs');
  assert(batch.review?.canonical_write === 'disabled' && batch.review?.public_write === 'disabled', 'source batch write boundary differs');
  assert((batch.schedule_errors ?? []).length === 0, 'source batch has schedule errors');

  for (const [key, expected] of Object.entries(review.expected_counts ?? {})) {
    assert(report[key] === expected, `expected count differs for ${key}`);
  }

  const detailCandidates = batch.detail_candidates ?? [];
  const scheduleCandidates = batch.schedule_candidates ?? [];
  const detailIds = sorted(detailCandidates.map((x) => x.candidate_id));
  const scheduleIds = sorted(scheduleCandidates.map((x) => x.meeting_id));
  const detailSelection = review.approved_selection?.detail_candidates;
  const scheduleSelection = review.approved_selection?.schedule_candidates;
  assert(detailSelection?.selection === 'all_records_in_pinned_batch_category', 'detail selection rule differs');
  assert(scheduleSelection?.selection === 'all_records_in_pinned_batch_category', 'schedule selection rule differs');
  assert(detailSelection?.required_rank === 'A+' && detailSelection?.expected_count === detailIds.length, 'detail selection count/rank differs');
  assert(scheduleSelection?.required_rank === 'C' && scheduleSelection?.expected_count === scheduleIds.length, 'schedule selection count/rank differs');
  assert(detailIds.length === 11 && scheduleIds.length === 71, 'reviewed counts differ');
  assert(new Set([...detailIds, ...scheduleIds]).size === 82, 'reviewed IDs are not unique');
  assert(coverage.coverage_claim === 'source_window_complete', 'schedule coverage claim differs');
  assert((coverage.source_errors ?? []).length === 0, 'coverage has source errors');
  assert(same(sorted(coverage.unresolved_meeting_ids ?? []), scheduleIds), 'coverage unresolved IDs differ');
  assert(same(sorted(retries.meeting_targets ?? []), scheduleIds), 'retry meeting IDs differ');

  return { batch, report, coverage, retries, review, detailCandidates, scheduleCandidates };
}

export function writeOrCheck(file, value, checkOnly) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (checkOnly) {
    assert(fs.existsSync(file), `missing output ${file}`);
    assert(fs.readFileSync(file, 'utf8') === content, `stale output ${file}`);
    return;
  }
  fs.writeFileSync(file, content);
}
