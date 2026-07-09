import { buildBaneiControlPlaneBridgeV1 } from './banei-control-plane-bridge.mjs';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import {
  validateCollectionResultManifestV1,
  validateCollectionResultManifestAgainstCoverageV1,
} from './collection-result-manifest-validation.mjs';
import {
  buildReviewQueueEntryFromManifestV1,
  validateReviewQueueV1,
} from './review-queue-validation.mjs';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const EXECUTOR_ID = 'banei-schedule-detail-actions';
const OUTPUT_MODEL = 'banei-actions-schedule-detail-batch';

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function meetingsFromScheduleInput(scheduleInput) {
  if (scheduleInput?.schema_version !== 'banei-full-month-candidate-set-v1'
    && scheduleInput?.schema_version !== 'banei-control-plane-bridge-fixture-v1') {
    throw new Error(`unsupported Banei schedule input schema ${scheduleInput?.schema_version}`);
  }
  if (!Array.isArray(scheduleInput.meetings)) throw new Error('Banei schedule input meetings missing');
  return [...scheduleInput.meetings].sort((left, right) => left.date.localeCompare(right.date));
}

function selectScheduleTargets(scheduleInput, execution) {
  const meetings = meetingsFromScheduleInput(scheduleInput);
  if (execution.collection_mode === 'date_window') {
    const { start_date: startDate, end_date_exclusive: endDateExclusive } = execution.requested_scope;
    return meetings.filter((meeting) => startDate <= meeting.date && meeting.date < endDateExclusive);
  }
  if (execution.collection_mode === 'selected_meetings') {
    const byId = new Map(meetings.map((meeting) => [meeting.meeting_id, meeting]));
    return execution.requested_scope.meeting_ids.map((meetingId) => {
      const meeting = byId.get(meetingId);
      if (!meeting) throw new Error(`selected Banei meeting missing from schedule inventory: ${meetingId}`);
      return meeting;
    }).sort((left, right) => left.meeting_id.localeCompare(right.meeting_id));
  }
  throw new Error(`unsupported Banei execution mode ${execution.collection_mode}`);
}

function filteredScheduleInput(scheduleInput, targets) {
  return {
    ...structuredClone(scheduleInput),
    meetings: structuredClone(targets),
  };
}

function candidateWindow(execution, targets) {
  if (execution.collection_mode === 'date_window') {
    return {
      start_date: execution.requested_scope.start_date,
      end_date_exclusive: execution.requested_scope.end_date_exclusive,
      timezone: execution.requested_scope.timezone,
    };
  }
  const dates = targets.map((meeting) => meeting.date).sort();
  return {
    start_date: dates[0],
    end_date_exclusive: addDays(dates.at(-1), 1),
    timezone: 'Asia/Tokyo',
  };
}

function rankCounts(records) {
  const counts = { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 };
  for (const record of records) {
    if (!RANKS.includes(record.capability_rank)) throw new Error(`unsupported Banei merged rank ${record.capability_rank}`);
    counts[record.capability_rank] += 1;
  }
  return counts;
}

function assertExecution(execution) {
  if (execution?.schema_version !== 'calendar-runner-execution-v1') throw new Error('Banei execution schema mismatch');
  if (execution.system_id !== 'japan-banei-system') throw new Error('Banei Actions executor requires japan-banei-system');
  if (execution.runner_used !== 'github_actions') throw new Error('Banei Actions executor requires github_actions runner');
  if (execution.executor_id !== EXECUTOR_ID) throw new Error(`Banei executor_id must be ${EXECUTOR_ID}`);
  if (!['date_window', 'selected_meetings'].includes(execution.collection_mode)) {
    throw new Error(`Banei Actions executor does not support ${execution.collection_mode}`);
  }
  if (execution.source_route?.schedule_source_id !== 'banei-official-schedule') throw new Error('Banei execution schedule source differs');
  if (execution.source_route?.detail_source_id !== 'nar-banei-race-list-deba-table') throw new Error('Banei execution detail source differs');
  if (execution.source_route?.schedule_adapter_id !== 'japan-banei-dry-run-adapter') throw new Error('Banei execution schedule adapter differs');
  if (execution.source_route?.detail_adapter_id !== 'banei-nar-race-list-detail-v1') throw new Error('Banei execution detail adapter differs');
}

function assertDetailArtifacts(execution, detailCandidate, detailCoverage, detailReport) {
  if (detailCandidate?.schema_version !== 'timetable-candidate-v1') throw new Error('Banei detail candidate schema mismatch');
  if (detailCandidate.adapter_id !== 'banei-nar-race-list-detail-v1') throw new Error('Banei detail candidate adapter differs');
  if (detailCandidate.review?.status !== 'needs_review') throw new Error('Banei detail candidate must remain needs_review');
  if (detailCoverage?.schema_version !== 'calendar-coverage-observation-v1') throw new Error('Banei detail Coverage schema mismatch');
  if (detailCoverage.system_id !== execution.system_id) throw new Error('Banei detail Coverage system differs');
  if (detailCoverage.collection_mode !== execution.collection_mode) throw new Error('Banei detail Coverage collection mode differs');
  if (detailReport?.schema_version !== 'banei-detail-window-collection-report-v1') throw new Error('Banei detail report schema mismatch');
  if (detailReport.batch_id !== execution.batch_id) throw new Error('Banei detail report batch_id differs');
  if (detailReport.collection_mode !== execution.collection_mode) throw new Error('Banei detail report mode differs');
  const coverageValidation = validateCoverageObservation(detailCoverage);
  if (!coverageValidation.valid) throw new Error(`Banei detail Coverage invalid: ${coverageValidation.errors.join('; ')}`);
}

export function buildBaneiActionsArtifactsV1({
  execution,
  schedule_input: scheduleInput,
  detail_candidate: detailCandidate,
  detail_coverage: detailCoverage,
  detail_report: detailReport,
}) {
  assertExecution(execution);
  assertDetailArtifacts(execution, detailCandidate, detailCoverage, detailReport);
  const targets = selectScheduleTargets(scheduleInput, execution);
  if (targets.length === 0) throw new Error('Banei execution scope selected no schedule meetings');
  if (detailCoverage.records_discovered !== targets.length) {
    throw new Error(`Banei detail discovered count ${detailCoverage.records_discovered} differs from schedule targets ${targets.length}`);
  }

  const scheduleBridge = buildBaneiControlPlaneBridgeV1(filteredScheduleInput(scheduleInput, targets), {
    campaign_id: execution.campaign_id,
    job_id: execution.job_id,
    batch_id: execution.batch_id,
    run_id: execution.batch_id,
  });
  const fallbackByMeeting = new Map(scheduleBridge.candidate.records.map((record) => [record.meeting_id, record]));
  const detailByMeeting = new Map();
  for (const record of detailCandidate.records) {
    if (!fallbackByMeeting.has(record.meeting_id)) throw new Error(`Banei detail candidate outside execution scope: ${record.meeting_id}`);
    if (record.capability_rank !== 'A+') throw new Error(`Banei detail candidate must be A+: ${record.meeting_id}`);
    if (detailByMeeting.has(record.meeting_id)) throw new Error(`duplicate Banei detail candidate ${record.meeting_id}`);
    detailByMeeting.set(record.meeting_id, record);
  }

  const mergedRecords = [...fallbackByMeeting.keys()]
    .sort()
    .map((meetingId) => structuredClone(detailByMeeting.get(meetingId) ?? fallbackByMeeting.get(meetingId)));
  const counts = rankCounts(mergedRecords);
  if (mergedRecords.length !== detailCoverage.records_discovered) throw new Error('Banei merged record count differs from Coverage records_discovered');
  if (detailByMeeting.size !== detailCoverage.records_updated) throw new Error('Banei A+ detail count differs from Coverage records_updated');

  const outputDirRelative = `data/generated/timetable/actions-multi-job/${execution.batch_id}`;
  const candidateRef = `${outputDirRelative}/candidates.json`;
  const coverageRef = `${outputDirRelative}/coverage-observation.json`;
  const manifestRef = `${outputDirRelative}/result-manifest.json`;
  const reportRef = `${outputDirRelative}/collection-report.json`;
  const reviewQueueRef = `${outputDirRelative}/review-queue.json`;

  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: detailCandidate.generated_at,
    adapter_id: 'banei-actions-schedule-detail-v1',
    country_id: 'japan',
    authority_id: 'banei-tokachi',
    source_id: 'banei-official-schedule',
    candidate_window: candidateWindow(execution, targets),
    records: mergedRecords,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Banei Actions batch combines schedule-layer C/B/B+ fallback with complete A+ detail records. Human review remains required.',
      promotion_target: null,
    },
  };

  const coverage = structuredClone(detailCoverage);
  coverage.run_id = execution.batch_id;
  const normalizedRequestedScope = execution.collection_mode === 'selected_meetings'
    ? { kind: 'selected_meetings', meeting_ids: structuredClone(execution.requested_scope.meeting_ids), timezone: 'Asia/Tokyo' }
    : { kind: 'date_window', ...structuredClone(execution.requested_scope) };
  if (!exact(coverage.requested_scope, normalizedRequestedScope)) {
    throw new Error('Banei detail Coverage requested_scope differs from execution scope');
  }
  const coverageValidation = validateCoverageObservation(coverage);
  if (!coverageValidation.valid) throw new Error(`Banei normalized Coverage invalid: ${coverageValidation.errors.join('; ')}`);

  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: execution.campaign_id,
    job_id: execution.job_id,
    batch_id: execution.batch_id,
    system_id: execution.system_id,
    runner_used: execution.runner_used,
    requested_scope: structuredClone(execution.requested_scope),
    observed_scope: structuredClone(coverage.observed_scope),
    coverage_claim: coverage.coverage_claim,
    records_discovered: coverage.records_discovered,
    records_updated: coverage.records_updated,
    rank_counts: counts,
    unresolved_dates: structuredClone(coverage.unresolved_dates),
    unresolved_meeting_ids: structuredClone(coverage.unresolved_meeting_ids),
    source_errors: structuredClone(coverage.source_errors),
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
  if (manifestErrors.length) throw new Error(`Banei Actions Manifest invalid: ${manifestErrors.join('; ')}`);

  const reviewQueue = {
    schema_version: 'calendar-review-queue-v1',
    generated_at: detailCandidate.generated_at,
    entries: [buildReviewQueueEntryFromManifestV1(manifest, {
      review_state: 'review_ready',
      promotion_state: 'not_ready',
      manifest_ref: manifestRef,
    })],
  };
  const reviewErrors = validateReviewQueueV1(reviewQueue);
  if (reviewErrors.length) throw new Error(`Banei Actions Review Queue invalid: ${reviewErrors.join('; ')}`);

  const report = {
    schema_version: 'calendar-actions-banei-schedule-detail-report-v1',
    batch_id: execution.batch_id,
    campaign_id: execution.campaign_id,
    job_id: execution.job_id,
    system_id: execution.system_id,
    runner_used: execution.runner_used,
    collection_mode: execution.collection_mode,
    requested_scope: structuredClone(execution.requested_scope),
    records_discovered: coverage.records_discovered,
    records_updated: coverage.records_updated,
    rank_counts: counts,
    coverage_claim: coverage.coverage_claim,
    unresolved_meeting_count: coverage.unresolved_meeting_ids.length,
    source_error_count: coverage.source_errors.length,
    candidate_ref: candidateRef,
    coverage_observation_ref: coverageRef,
    result_manifest_ref: manifestRef,
    review_queue_ref: reviewQueueRef,
    publication_effect: 'none',
  };

  return {
    schema_version: OUTPUT_MODEL,
    execution: structuredClone(execution),
    candidate,
    coverage_observation: coverage,
    result_manifest: manifest,
    review_queue: reviewQueue,
    collection_report: report,
    artifact_refs: {
      candidate: candidateRef,
      coverage_observation: coverageRef,
      result_manifest: manifestRef,
      review_queue: reviewQueueRef,
      collection_report: reportRef,
    },
  };
}

export const baneiActionsExecutorV1Contract = Object.freeze({
  executor_id: EXECUTOR_ID,
  output_model: OUTPUT_MODEL,
  supported_collection_modes: Object.freeze(['date_window', 'selected_meetings']),
  ranks: RANKS,
});
