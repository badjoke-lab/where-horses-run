import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import {
  validateCollectionResultManifestV1,
  validateCollectionResultManifestAgainstCoverageV1,
} from './collection-result-manifest-validation.mjs';
import {
  buildReviewQueueEntryFromManifestV1,
  validateReviewQueueV1,
} from './review-queue-validation.mjs';

const SYSTEM_ID = 'uae-national-racing-system';
const COUNTRY_ID = 'united-arab-emirates';
const AUTHORITY_ID = 'emirates-racing-authority';
const SOURCE_ID = 'era-racecard-public-timetable';
const ADAPTER_ID = 'uae-era-racecard-detail-artifact-v1';
const EXECUTOR_ID = 'uae-era-detail-actions';
const OUTPUT_MODEL = 'uae-era-detail-actions-batch';
const TIMEZONE = 'Asia/Dubai';
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const MEETING_ID_PATTERN = /^uae-(.+)-(\d{4}-\d{2}-\d{2})$/;

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseMeetingId(meetingId) {
  const match = String(meetingId ?? '').match(MEETING_ID_PATTERN);
  if (!match) throw new Error(`invalid UAE meeting ID ${meetingId}`);
  const racecourseId = match[1];
  const date = match[2];
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`invalid UAE meeting date ${date}`);
  }
  return { meeting_id: meetingId, racecourse_id: racecourseId, date };
}

function assertExecution(execution) {
  if (execution?.schema_version !== 'calendar-runner-execution-v1') throw new Error('UAE detail execution schema mismatch');
  if (execution.system_id !== SYSTEM_ID) throw new Error(`UAE detail executor requires ${SYSTEM_ID}`);
  if (execution.runner_used !== 'github_actions') throw new Error('UAE detail executor requires github_actions');
  if (execution.executor_id !== EXECUTOR_ID) throw new Error(`UAE detail executor_id must be ${EXECUTOR_ID}`);
  if (execution.collection_mode !== 'selected_meetings') throw new Error('UAE detail executor requires selected_meetings');
  if (execution.rank_strategy !== 'target_rank' || execution.target_rank !== 'A') {
    throw new Error('UAE detail retry requires target_rank A');
  }
  if (execution.reason !== 'rank_upgrade_retry') throw new Error('UAE detail executor requires rank_upgrade_retry reason');
  if (execution.source_route?.schedule_source_id !== 'era-season-calendar') throw new Error('UAE schedule source route differs');
  if (execution.source_route?.detail_source_id !== SOURCE_ID) throw new Error('UAE detail source route differs');
  if (execution.source_route?.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') throw new Error('UAE schedule adapter route differs');
  if (execution.source_route?.detail_adapter_id !== ADAPTER_ID) throw new Error('UAE detail adapter route differs');
  if (Object.values(execution.side_effect_boundary ?? {}).some((value) => value !== false)) {
    throw new Error('UAE detail execution side-effect boundary must remain all false');
  }
  const meetingIds = execution.requested_scope?.meeting_ids;
  if (!Array.isArray(meetingIds) || meetingIds.length === 0 || new Set(meetingIds).size !== meetingIds.length) {
    throw new Error('UAE detail execution requires unique selected meeting IDs');
  }
  meetingIds.forEach(parseMeetingId);
}

function clampRank(rank) {
  if (!RANK_INDEX.has(rank)) throw new Error(`unsupported UAE detail rank ${rank}`);
  return rank === 'A+' ? 'A' : rank;
}

function publicTimetableRows(classification, rank) {
  if (rank !== 'A') return [];
  return (classification.timetable_rows ?? []).map((row, index) => ({
    race_number: index + 1,
    label: row.label ?? `Race ${index + 1}`,
    post_time_local: row.post_time_local,
  }));
}

function candidateRecord(target, result, checkedAt) {
  const classification = result?.classification ?? {
    rank: 'C',
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
  };
  const rank = clampRank(classification.rank);
  const timetableRows = publicTimetableRows(classification, rank);
  if (rank === 'A' && timetableRows.length < 2) throw new Error(`${target.meeting_id}: A rank requires complete timetable rows`);
  return {
    candidate_id: `candidate-${target.meeting_id}`,
    meeting_id: target.meeting_id,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racing_system_id: SYSTEM_ID,
    racecourse_id: target.racecourse_id,
    date: target.date,
    timezone: TIMEZONE,
    capability_rank: rank,
    first_race_time_local: rank === 'C' ? null : classification.first_race_time_local,
    last_race_time_local: ['B+', 'A'].includes(rank) ? classification.last_race_time_local : null,
    timetable_rows: timetableRows,
    source: {
      source_id: SOURCE_ID,
      official_url: `https://emiratesracing.com/racecard/${target.date}/1/declarations`,
      checked_at: checkedAt,
      extraction_method: 'public_racecard_parser',
    },
    confidence: rank === 'A' ? 'high' : rank === 'C' ? 'low' : 'medium',
    review_status: 'needs_review',
    notes: rank === 'C'
      ? 'ERA racecard detail was not source-visible or did not satisfy a higher reviewed rank. The existing C-level season schedule remains the fallback.'
      : `ERA racecard detail retry produced reviewed ${rank}-level timing evidence. Human review and separate Promotion Validation remain required.`,
  };
}

function rankCounts(records) {
  const counts = { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 };
  for (const record of records) counts[record.capability_rank] += 1;
  return counts;
}

function normalizedSourceErrors(result, meetingId) {
  return (result?.source_errors ?? []).map((error) => ({
    code: ['source_unavailable', 'parser_failure', 'rate_limited', 'unexpected_response', 'other'].includes(error.code)
      ? error.code
      : 'other',
    scope_ref: meetingId,
    message: String(error.message ?? 'UAE detail retry failed closed.').slice(0, 500),
  }));
}

export function buildUaeEraDetailActionsArtifactsV1({ execution, meeting_results: meetingResults, checked_at: checkedAt }) {
  assertExecution(execution);
  if (typeof checkedAt !== 'string' || Number.isNaN(Date.parse(checkedAt))) throw new Error('checked_at must be a valid date-time');
  if (!Array.isArray(meetingResults)) throw new Error('meeting_results must be an array');

  const targets = execution.requested_scope.meeting_ids.map(parseMeetingId);
  const resultById = new Map();
  for (const result of meetingResults) {
    if (!execution.requested_scope.meeting_ids.includes(result?.meeting_id)) throw new Error(`UAE detail result outside execution scope: ${result?.meeting_id}`);
    if (resultById.has(result.meeting_id)) throw new Error(`duplicate UAE detail result ${result.meeting_id}`);
    resultById.set(result.meeting_id, result);
  }

  const records = targets.map((target) => candidateRecord(target, resultById.get(target.meeting_id), checkedAt));
  const counts = rankCounts(records);
  const unresolvedMeetingIds = records.filter((record) => record.capability_rank === 'C').map((record) => record.meeting_id);
  const sourceErrors = targets.flatMap((target) => normalizedSourceErrors(resultById.get(target.meeting_id), target.meeting_id));
  const recordsUpdated = records.length - unresolvedMeetingIds.length;
  const coverageClaim = recordsUpdated === records.length && sourceErrors.length === 0
    ? 'source_window_complete'
    : recordsUpdated > 0 ? 'partial' : 'none';
  const scope = {
    kind: 'selected_meetings',
    meeting_ids: structuredClone(execution.requested_scope.meeting_ids),
    timezone: TIMEZONE,
  };
  const outputDir = `data/generated/timetable/actions-multi-job/${execution.batch_id}`;
  const candidateRef = `${outputDir}/candidates.json`;
  const coverageRef = `${outputDir}/coverage-observation.json`;
  const manifestRef = `${outputDir}/result-manifest.json`;
  const reportRef = `${outputDir}/collection-report.json`;
  const reviewQueueRef = `${outputDir}/review-queue.json`;

  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: checkedAt,
    adapter_id: ADAPTER_ID,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    source_id: SOURCE_ID,
    candidate_window: {
      start_date: targets.map((target) => target.date).sort()[0],
      end_date_exclusive: (() => {
        const latest = targets.map((target) => target.date).sort().at(-1);
        const value = new Date(`${latest}T00:00:00Z`);
        value.setUTCDate(value.getUTCDate() + 1);
        return value.toISOString().slice(0, 10);
      })(),
      timezone: TIMEZONE,
    },
    records,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'UAE selected-meeting detail retry. C fallback is preserved when the official ERA racecard is not yet source-visible. Human review remains required.',
      promotion_target: null,
    },
  };

  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: execution.batch_id,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    checked_at: checkedAt,
    requested_scope: structuredClone(scope),
    observed_scope: structuredClone(scope),
    collection_mode: 'selected_meetings',
    records_discovered: records.length,
    records_updated: recordsUpdated,
    unresolved_dates: [],
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };
  const coverageValidation = validateCoverageObservation(coverage);
  if (!coverageValidation.valid) throw new Error(`UAE detail Coverage invalid: ${coverageValidation.errors.join('; ')}`);

  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: execution.campaign_id,
    job_id: execution.job_id,
    batch_id: execution.batch_id,
    system_id: SYSTEM_ID,
    runner_used: execution.runner_used,
    requested_scope: structuredClone(execution.requested_scope),
    observed_scope: structuredClone(scope),
    coverage_claim: coverageClaim,
    records_discovered: records.length,
    records_updated: recordsUpdated,
    rank_counts: counts,
    unresolved_dates: [],
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    artifact_refs: {
      candidate_ref: candidateRef,
      coverage_observation_ref: coverageRef,
      collection_report_ref: reportRef,
    },
  };
  const manifestErrors = [
    ...validateCollectionResultManifestV1(manifest),
    ...validateCollectionResultManifestAgainstCoverageV1(manifest, coverage),
  ];
  if (manifestErrors.length) throw new Error(`UAE detail Manifest invalid: ${manifestErrors.join('; ')}`);

  const reviewQueue = {
    schema_version: 'calendar-review-queue-v1',
    generated_at: checkedAt,
    entries: [buildReviewQueueEntryFromManifestV1(manifest, {
      review_state: recordsUpdated > 0 ? 'review_ready' : 'not_ready',
      promotion_state: 'not_ready',
      manifest_ref: manifestRef,
    })],
  };
  const reviewErrors = validateReviewQueueV1(reviewQueue);
  if (reviewErrors.length) throw new Error(`UAE detail Review Queue invalid: ${reviewErrors.join('; ')}`);

  const report = {
    schema_version: 'calendar-actions-uae-era-detail-report-v1',
    work_id: 'WHR-CAL-UAE-ERA-DETAIL-RECOVERY',
    implementation_unit: 'UAE-DETAIL-RECOVERY-02',
    batch_id: execution.batch_id,
    campaign_id: execution.campaign_id,
    job_id: execution.job_id,
    system_id: SYSTEM_ID,
    runner_used: execution.runner_used,
    collection_mode: execution.collection_mode,
    requested_scope: structuredClone(execution.requested_scope),
    records_discovered: records.length,
    records_updated: recordsUpdated,
    rank_counts: counts,
    coverage_claim: coverageClaim,
    unresolved_meeting_count: unresolvedMeetingIds.length,
    source_error_count: sourceErrors.length,
    candidate_ref: candidateRef,
    coverage_observation_ref: coverageRef,
    result_manifest_ref: manifestRef,
    review_queue_ref: reviewQueueRef,
    raw_html_stored: false,
    canonical_write: false,
    public_write: false,
    publication_effect: 'none',
  };

  if (!exact(manifest.requested_scope, execution.requested_scope)) throw new Error('UAE detail Manifest scope differs from execution');
  return {
    schema_version: OUTPUT_MODEL,
    execution: structuredClone(execution),
    candidate,
    coverage_observation: coverage,
    result_manifest: manifest,
    review_queue: reviewQueue,
    collection_report: report,
  };
}

export const uaeEraDetailActionsExecutorV1Contract = Object.freeze({
  executor_id: EXECUTOR_ID,
  output_model: OUTPUT_MODEL,
  supported_collection_modes: Object.freeze(['selected_meetings']),
  ranks: Object.freeze(['C', 'B', 'B+', 'A']),
  timezone: TIMEZONE,
});
