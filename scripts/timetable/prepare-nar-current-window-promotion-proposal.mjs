import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAuthoritySourceInventoryV1 } from './load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { promoteApprovedCandidateV1 } from './pipeline-v1/promotion-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const batchArg = argument('batch');
const reportArg = argument('report');
const coverageArg = argument('coverage');
const retriesArg = argument('retries');
const outputArg = argument('output-dir');
if (!batchArg || !reportArg || !coverageArg || !retriesArg || !outputArg) {
  throw new Error('--batch=<path>, --report=<path>, --coverage=<path>, --retries=<path>, and --output-dir=<path> are required');
}

function externalPath(value, label) {
  const absolute = path.resolve(value);
  const relative = path.relative(root, absolute);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) throw new Error(`${label} must remain outside the repository`);
  return absolute;
}
function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}
function sha256File(absolutePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}
function sha256Json(value) {
  return crypto.createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function nextDate(date) {
  const parsed = new Date(`${date}T00:00:00Z`);
  assert(!Number.isNaN(parsed.getTime()), `invalid date ${date}`);
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}

const batchPath = externalPath(batchArg, 'batch');
const reportPath = externalPath(reportArg, 'report');
const coveragePath = externalPath(coverageArg, 'coverage');
const retriesPath = externalPath(retriesArg, 'retries');
const outputDir = externalPath(outputArg, 'output-dir');
const review = JSON.parse(fs.readFileSync(path.join(root, 'data/reviews/nar-current-window-a-plus-review-v1.json'), 'utf8'));
const resultAudit = JSON.parse(fs.readFileSync(path.join(root, review.source_result_ref), 'utf8'));
const batch = readJson(batchPath);
const report = readJson(reportPath);
const coverage = readJson(coveragePath);
const retries = readJson(retriesPath);

assert(review.schema_version === 'calendar-nar-current-window-a-plus-review-v1', 'review schema differs');
assert(review.work_id === 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-PROMOTION-REVIEW', 'review Work ID differs');
assert(review.implementation_unit === 'NAR-CURRENT-WINDOW-PROMOTION-01', 'review implementation unit differs');
assert(review.review?.status === 'approved' && review.review?.promotion_target === 'canonical-timetable-v0', 'review decision is not approved for Canonical proposal');
assert(review.review?.approval_scope === 'exact_a_plus_subset_only', 'review approval scope differs');
assert(Object.values(review.side_effect_boundary ?? {}).every((value) => value === false), 'review side-effect boundary differs');

for (const [label, absolutePath, expected] of [
  ['batch', batchPath, review.source_artifact.file_sha256.batch_json],
  ['report', reportPath, review.source_artifact.file_sha256.collection_report_json],
  ['coverage', coveragePath, review.source_artifact.file_sha256.coverage_observation_json],
  ['retries', retriesPath, review.source_artifact.file_sha256.retry_targets_json],
]) {
  assert(sha256File(absolutePath) === expected, `${label} SHA-256 differs`);
}
assert(batch.schema_version === 'nar-incremental-batch-v2', 'source batch schema differs');
assert(report.schema_version === 'nar-incremental-collection-report-v2', 'collection report schema differs');
assert(coverage.schema_version === 'calendar-coverage-observation-v1', 'coverage schema differs');
assert(retries.schema_version === 'nar-incremental-retry-targets-v2', 'retry schema differs');
assert(batch.batch_id === review.source_artifact.batch_id, 'source batch ID differs');
assert(batch.generated_at === review.source_artifact.generated_at, 'source generated_at differs');
assert(report.batch_id === batch.batch_id && coverage.run_id === batch.batch_id && retries.batch_id === batch.batch_id, 'artifact batch identity differs');
assert(report.generated_at === batch.generated_at && coverage.checked_at === batch.generated_at && retries.generated_at === batch.generated_at, 'artifact timestamps differ');
assert(exact(report.requested_scope, batch.requested_scope) && exact(coverage.requested_scope, batch.requested_scope) && exact(retries.requested_scope, batch.requested_scope), 'artifact requested scopes differ');
assert(batch.collection_mode === 'selected_meetings' && batch.requested_scope?.kind === 'selected_meetings', 'source batch must use selected_meetings');
assert(batch.review?.status === 'needs_review' && batch.review?.promotion_eligible === false, 'source batch review boundary differs');
assert(batch.review?.canonical_write === 'disabled' && batch.review?.public_write === 'disabled' && batch.review?.raw_source_storage === 'disabled', 'source batch write/storage boundary differs');
assert(coverage.coverage_claim === 'source_window_complete' && (coverage.source_errors ?? []).length === 0, 'source coverage differs');
assert(report.scheduled_meetings === 66 && report.complete_detail_candidates === 15 && report.schedule_only_candidates === 51 && report.detail_blockers === 51 && report.schedule_errors === 0, 'source result counts differ');
assert((retries.meeting_targets ?? []).length === 51, 'retry target count differs');
assert(resultAudit.result?.a_plus_candidate_count === 15 && resultAudit.result?.retry_target_count === 51, 'source result audit counts differ');

const approvedIds = [...review.approved_meeting_ids].sort();
const sourceDetailIds = (batch.detail_candidates ?? []).map((candidate) => candidate.candidate_id).sort();
const unresolvedIds = [...(coverage.unresolved_meeting_ids ?? [])].sort();
assert(approvedIds.length === 15 && new Set(approvedIds).size === 15, 'approved meeting IDs must contain 15 unique IDs');
assert(exact(approvedIds, sourceDetailIds), 'approved meeting IDs differ from source A+ candidates');
assert(exact(approvedIds, [...resultAudit.resolved_meeting_ids].sort()), 'approved meeting IDs differ from result audit');
assert(exact(unresolvedIds, [...resultAudit.unresolved_meeting_ids].sort()), 'unresolved meeting IDs differ from result audit');
assert(exact(unresolvedIds, [...(retries.meeting_targets ?? [])].sort()), 'unresolved and retry target IDs differ');
assert(approvedIds.every((id) => !unresolvedIds.includes(id)), 'approved and unresolved sets overlap');

let totalRaceRows = 0;
const records = (batch.detail_candidates ?? []).map((candidate) => {
  assert(candidate.schema_version === 'nar-incremental-detail-candidate-v2', `${candidate.candidate_id} schema differs`);
  assert(candidate.candidate_rank === 'A+', `${candidate.candidate_id} rank differs`);
  assert(candidate.review?.status === 'needs_review' && candidate.review?.promotion_eligible === false, `${candidate.candidate_id} source review state differs`);
  assert(candidate.meeting_completeness?.all_a_plus_fields_complete === true, `${candidate.candidate_id} completeness differs`);
  const rows = candidate.timetable_rows ?? [];
  assert(rows.length === candidate.meeting_completeness.expected_race_count && rows.length > 0, `${candidate.candidate_id} row count differs`);
  const publicRows = rows.map((row, index) => {
    const raceNumber = index + 1;
    assert(row.race_number === raceNumber && row.label === `Race ${raceNumber}`, `${candidate.candidate_id} race sequence differs`);
    for (const field of ['post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      assert(row[field] !== null && row[field] !== '', `${candidate.candidate_id} Race ${raceNumber} missing ${field}`);
    }
    assert(String(row.source_trace?.list_url ?? '').startsWith('https://www.keiba.go.jp/'), `${candidate.candidate_id} list URL differs`);
    assert(String(row.source_trace?.detail_url ?? '').startsWith('https://www.keiba.go.jp/'), `${candidate.candidate_id} detail URL differs`);
    return {
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: row.distance_m,
      surface: row.surface,
      course_label: row.course_label,
    };
  });
  totalRaceRows += publicRows.length;
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
    first_race_time_local: publicRows[0].post_time_local,
    last_race_time_local: publicRows.at(-1).post_time_local,
    timetable_rows: publicRows,
    source: {
      source_id: 'nar-race-list-deba-table',
      official_url: candidate.source.official_race_list_url,
      checked_at: batch.generated_at,
      extraction_method: 'adapter_candidate',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: 'Approved from the pinned NAR current-window selected-meeting artifact. Only meeting identity and the six public-safe A+ timetable fields are included.',
  };
}).sort((left, right) => `${left.date}:${left.racecourse_id}:${left.meeting_id}`.localeCompare(`${right.date}:${right.racecourse_id}:${right.meeting_id}`));
assert(records.length === 15 && totalRaceRows === 180, 'approved record or race-row count differs');
assert(review.review_checks?.meeting_count === records.length && review.review_checks?.race_row_count === totalRaceRows, 'review check counts differ');

const dates = records.map((record) => record.date).sort();
const approvedCandidate = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-current-window-reviewed-detail-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-race-list-deba-table',
  candidate_window: {
    start_date: dates[0],
    end_date_exclusive: nextDate(dates.at(-1)),
    timezone: 'Asia/Tokyo',
  },
  records,
  review: {
    status: 'approved',
    reviewed_at: review.review.reviewed_at,
    reviewer: review.review.reviewer,
    summary: `Approved exactly ${records.length} complete A+ NAR records from pinned current-window batch ${batch.batch_id}; 51 C retry targets remain excluded.`,
    promotion_target: review.review.promotion_target,
  },
};

const canonicalMeetings = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meetings.json'), 'utf8'));
const canonicalDetails = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meeting-details.json'), 'utf8'));
const promotion = promoteApprovedCandidateV1({
  candidate: approvedCandidate,
  meetingsDataset: canonicalMeetings,
  detailsDataset: canonicalDetails,
  authorityInventory: loadAuthoritySourceInventoryV1(root),
  readinessRegistry: loadCalendarReadinessV1(root),
  inputPath: 'data/candidates/nar-current-window-a-plus-approved.json',
});
assert(promotion.summary.promoted_meeting_ids.length === 15 && promotion.summary.promoted_detail_ids.length === 15, 'promotion proposal count differs');
assert(exact([...promotion.summary.promoted_meeting_ids].sort(), approvedIds), 'promotion proposal meeting IDs differ');

fs.mkdirSync(outputDir, { recursive: true });
for (const [name, value] of Object.entries({
  'approved-candidate.json': approvedCandidate,
  'proposed-canonical-meetings.json': promotion.meetingsDataset,
  'proposed-canonical-meeting-details.json': promotion.detailsDataset,
  'promotion-summary.json': promotion.summary,
})) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}
const proposal = {
  schema_version: 'calendar-nar-current-window-promotion-proposal-v1',
  work_id: review.work_id,
  implementation_unit: review.implementation_unit,
  source_artifact: structuredClone(review.source_artifact),
  approved_meeting_count: records.length,
  approved_race_row_count: totalRaceRows,
  excluded_c_retry_target_count: unresolvedIds.length,
  approved_candidate_sha256: sha256Json(approvedCandidate),
  proposed_meetings_sha256: sha256Json(promotion.meetingsDataset),
  proposed_details_sha256: sha256Json(promotion.detailsDataset),
  promoted_meeting_ids: structuredClone(promotion.summary.promoted_meeting_ids),
  reviewer: review.review.reviewer,
  reviewed_at: review.review.reviewed_at,
  mutation_boundary: {
    repository_write: false,
    canonical_write: false,
    public_write: false,
    publication_effect: 'none',
    human_merge_required: true
  }
};
fs.writeFileSync(path.join(outputDir, 'promotion-proposal.json'), `${JSON.stringify(proposal, null, 2)}\n`);
console.log(JSON.stringify({
  schema_version: 'calendar-nar-current-window-promotion-proposal-summary-v1',
  approved_meeting_count: records.length,
  approved_race_row_count: totalRaceRows,
  excluded_c_retry_target_count: unresolvedIds.length,
  first_date: dates[0],
  last_date: dates.at(-1),
  approved_candidate_sha256: proposal.approved_candidate_sha256,
  proposed_meetings_sha256: proposal.proposed_meetings_sha256,
  proposed_details_sha256: proposal.proposed_details_sha256,
  canonical_write: false,
  public_write: false,
  human_merge_required: true
}, null, 2));
