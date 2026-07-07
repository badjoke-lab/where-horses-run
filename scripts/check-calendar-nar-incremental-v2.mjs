import fs from 'node:fs';
import path from 'node:path';
import { batchPaths } from './timetable/nar-incremental-v2-core.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
let batchId = null;
let allowEmpty = false;
for (const value of process.argv.slice(2)) {
  if (value === '--allow-empty') allowEmpty = true;
  else if (value.startsWith('--batch-id=')) batchId = value.slice('--batch-id='.length);
  else throw new Error(`Unknown argument: ${value}`);
}
if (!batchId) throw new Error('--batch-id is required.');

const paths = batchPaths(batchId);
const files = Object.values(paths);
const existing = files.filter((file) => fs.existsSync(path.join(root, file)));
if (existing.length === 0 && allowEmpty) {
  console.log('CALENDAR_NAR_INCREMENTAL_V2: empty-allowed');
  process.exit(0);
}
if (existing.length !== files.length) fail(`batch output set is incomplete: ${existing.length}/${files.length}.`);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function unique(values) {
  return [...new Set(values)].sort();
}
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

if (existing.length === files.length) {
  const candidates = readJson(paths.candidates);
  const report = readJson(paths.report);
  const coverage = readJson(paths.coverage);
  const retries = readJson(paths.retries);

  if (candidates.schema_version !== 'nar-incremental-batch-v2') fail('candidate batch schema differs.');
  if (report.schema_version !== 'nar-incremental-collection-report-v2') fail('report schema differs.');
  if (retries.schema_version !== 'nar-incremental-retry-targets-v2') fail('retry schema differs.');
  if (candidates.batch_id !== batchId || report.batch_id !== batchId || retries.batch_id !== batchId || coverage.run_id !== batchId) fail('batch ID differs across artifacts.');
  if (candidates.generated_at !== report.generated_at || report.generated_at !== coverage.checked_at || coverage.checked_at !== retries.generated_at) fail('artifact timestamps differ.');
  if (candidates.collection_mode !== report.collection_mode || report.collection_mode !== coverage.collection_mode) fail('collection mode differs.');
  if (!same(candidates.requested_scope, report.requested_scope) || !same(report.requested_scope, coverage.requested_scope) || !same(coverage.requested_scope, retries.requested_scope)) fail('requested scope differs across artifacts.');
  if (candidates.review?.status !== 'needs_review' || candidates.review?.promotion_eligible !== false) fail('candidate review boundary differs.');
  if (candidates.review?.canonical_write !== 'disabled' || candidates.review?.public_write !== 'disabled' || candidates.review?.raw_source_storage !== 'disabled') fail('candidate write boundary differs.');
  if (report.publication_effect !== 'none' || report.canonical_write !== 'disabled' || report.public_write !== 'disabled') fail('report write boundary differs.');
  if (retries.scheduled_retry !== 'disabled' || retries.canonical_write !== 'disabled' || retries.public_write !== 'disabled') fail('retry write boundary differs.');

  const coverageResult = validateCoverageObservation(coverage);
  if (!coverageResult.valid) fail(`Coverage Observation invalid: ${coverageResult.errors.join(' | ')}`);
  if (!same(coverage.unresolved_dates, retries.date_targets)) fail('coverage/retry date targets differ.');
  if (!same(coverage.unresolved_meeting_ids, retries.meeting_targets)) fail('coverage/retry meeting targets differ.');

  const scheduledIds = unique((candidates.scheduled_meetings ?? []).map((meeting) => meeting.meeting_id));
  const detailIds = unique((candidates.detail_candidates ?? []).map((meeting) => meeting.candidate_id));
  const scheduleIds = unique((candidates.schedule_candidates ?? []).map((meeting) => meeting.meeting_id));
  const detailBlockerIds = unique((candidates.detail_blockers ?? []).map((meeting) => meeting.meeting_id));
  if (scheduledIds.length !== (candidates.scheduled_meetings ?? []).length) fail('scheduled meeting IDs must be unique.');
  if (detailIds.length !== (candidates.detail_candidates ?? []).length) fail('detail candidate IDs must be unique.');
  if (scheduleIds.length !== (candidates.schedule_candidates ?? []).length) fail('schedule candidate meeting IDs must be unique.');
  if (detailBlockerIds.length !== (candidates.detail_blockers ?? []).length) fail('detail blocker meeting IDs must be unique.');
  if (detailIds.some((meetingId) => scheduleIds.includes(meetingId))) fail('same meeting cannot be both A+ detail candidate and C schedule candidate.');

  if (candidates.collection_mode === 'date_window') {
    const resolvedIds = unique([...detailIds, ...scheduleIds]);
    if (!same(scheduledIds, resolvedIds)) fail('date-window scheduled meetings must resolve exactly to A+ or C candidates.');
  }

  for (const candidate of candidates.detail_candidates ?? []) {
    if (candidate.schema_version !== 'nar-incremental-detail-candidate-v2') fail(`detail candidate schema differs: ${candidate.candidate_id}.`);
    if (candidate.candidate_rank !== 'A+') fail(`detail candidate rank differs: ${candidate.candidate_id}.`);
    if (candidate.meeting_completeness?.all_a_plus_fields_complete !== true) fail(`detail candidate is not A+ complete: ${candidate.candidate_id}.`);
    if (candidate.review?.status !== 'needs_review' || candidate.review?.promotion_eligible !== false) fail(`detail candidate review boundary differs: ${candidate.candidate_id}.`);
  }

  for (const candidate of candidates.schedule_candidates ?? []) {
    if (candidate.schema_version !== 'nar-schedule-meeting-candidate-v1') fail(`schedule candidate schema differs: ${candidate.meeting_id}.`);
    if (candidate.capability_rank !== 'C') fail(`schedule candidate rank differs: ${candidate.meeting_id}.`);
    if (!['scheduled_pending_details', 'detail_retry_required'].includes(candidate.schedule_state)) fail(`schedule state differs: ${candidate.meeting_id}.`);
    if (candidate.review?.status !== 'needs_review' || candidate.review?.promotion_eligible !== false) fail(`schedule candidate review boundary differs: ${candidate.meeting_id}.`);
  }

  if (report.scheduled_meetings !== scheduledIds.length) fail('report scheduled meeting count differs.');
  if (report.complete_detail_candidates !== detailIds.length) fail('report detail candidate count differs.');
  if (report.schedule_only_candidates !== scheduleIds.length) fail('report schedule-only candidate count differs.');
  if (report.detail_blockers !== detailBlockerIds.length) fail('report detail blocker count differs.');

  const expectedRetryIds = unique(scheduleIds);
  if (candidates.collection_mode === 'date_window' && !same(coverage.unresolved_meeting_ids, expectedRetryIds)) fail('date-window unresolved meeting IDs must equal C schedule candidates.');
}

const v1HistoricalPath = 'data/candidates/nar-incremental-meeting-candidates.json';
if (!fs.existsSync(path.join(root, v1HistoricalPath))) fail('historical v1 incremental candidate file must remain present and immutable.');

const collectorSource = fs.readFileSync(path.join(root, 'scripts/timetable/collect-nar-incremental-v2.mjs'), 'utf8');
for (const marker of ['normalize-nar-schedule-aware-month.mjs', 'assertImmutableOutputs', 'aggregateScheduleAwareRuns', 'buildScheduleAwareArtifacts']) {
  if (!collectorSource.includes(marker)) fail(`v2 collector missing ${marker}.`);
}
for (const forbidden of ['data/generated/timetable/canonical/', 'data/generated/timetable/public/']) {
  if (collectorSource.includes(forbidden)) fail(`v2 collector crosses publication boundary with ${forbidden}.`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_INCREMENTAL_V2: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_INCREMENTAL_V2: pass');
console.log(`BATCH_ID: ${batchId}`);
console.log('IMMUTABLE_BATCH_OUTPUTS: enforced');
console.log('SCHEDULE_CANDIDATE_RANK: C');
console.log('DETAIL_CANDIDATE_RANK: A+');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
