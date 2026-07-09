import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1, validateCollectionResultManifestAgainstCoverageV1 } from './collection-result-manifest-validation.mjs';
import { buildReviewQueueEntryFromManifestV1, validateReviewQueueV1 } from './review-queue-validation.mjs';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const TARGET_RANK = 'A+';

function rankCounts() {
  return { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 };
}

function classifyScheduleMeeting(meeting) {
  const first = meeting.first_race_time_local ?? null;
  const last = meeting.last_race_time_local ?? null;
  if (last !== null && first === null) {
    throw new Error(`${meeting.meeting_id}: last race time cannot exist without first race time`);
  }
  if (first !== null && last !== null) return 'B+';
  if (first !== null) return 'B';
  return 'C';
}

function confidenceFor(rank) {
  if (rank === 'C') return 'low';
  return 'medium';
}

function assertBridgeInput(input) {
  if (input?.schema_version !== 'banei-control-plane-bridge-fixture-v1'
    && input?.schema_version !== 'banei-full-month-candidate-set-v1') {
    throw new Error('unsupported Banei bridge input schema');
  }
  if (!Array.isArray(input.meetings) || input.meetings.length === 0) {
    throw new Error('Banei bridge input must contain meetings');
  }
  if (!input.generated_at || Number.isNaN(Date.parse(input.generated_at))) {
    throw new Error('Banei bridge generated_at is invalid');
  }
}

function bridgeWindow(input) {
  if (input.month_start && input.month_end_exclusive) {
    return {
      start_date: input.month_start,
      end_date_exclusive: input.month_end_exclusive,
      timezone: 'Asia/Tokyo',
    };
  }
  if (input.month_start && input.month_end) {
    const date = new Date(`${input.month_end}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return {
      start_date: input.month_start,
      end_date_exclusive: date.toISOString().slice(0, 10),
      timezone: 'Asia/Tokyo',
    };
  }
  throw new Error('Banei bridge input does not define a usable month window');
}

function sourceMetadata(input) {
  const source = input.source ?? {};
  const sourceId = source.source_id ?? 'banei-official-schedule';
  const officialUrl = source.official_schedule_url ?? input.official_schedule_url;
  if (sourceId !== 'banei-official-schedule') throw new Error('Banei source_id differs');
  if (typeof officialUrl !== 'string' || !officialUrl.startsWith('https://')) {
    throw new Error('Banei official schedule URL is required');
  }
  return { sourceId, officialUrl };
}

export function buildBaneiControlPlaneBridgeV1(input, {
  campaign_id = 'banei-july-control-plane-bridge',
  job_id = 'banei-july-reviewed-import-job-001',
  batch_id = 'banei-july-reviewed-import-batch-001',
  run_id = 'banei-july-control-plane-bridge-run-001',
} = {}) {
  assertBridgeInput(input);
  const window = bridgeWindow(input);
  const source = sourceMetadata(input);
  const counts = rankCounts();
  const records = [];
  const unresolvedMeetingIds = [];
  const seen = new Set();

  for (const meeting of [...input.meetings].sort((a, b) => a.date.localeCompare(b.date))) {
    if (seen.has(meeting.meeting_id)) throw new Error(`duplicate Banei meeting_id ${meeting.meeting_id}`);
    seen.add(meeting.meeting_id);
    if (meeting.country_id !== 'japan'
      || meeting.authority_id !== 'banei-tokachi'
      || meeting.racing_system_id !== 'japan-banei-system'
      || meeting.racecourse_id !== 'obihiro-racecourse'
      || meeting.timezone !== 'Asia/Tokyo') {
      throw new Error(`${meeting.meeting_id}: Banei identity boundary differs`);
    }
    if (!(window.start_date <= meeting.date && meeting.date < window.end_date_exclusive)) {
      throw new Error(`${meeting.meeting_id}: meeting date lies outside bridge window`);
    }
    const rank = classifyScheduleMeeting(meeting);
    counts[rank] += 1;
    if (rank !== TARGET_RANK) unresolvedMeetingIds.push(meeting.meeting_id);
    records.push({
      candidate_id: `candidate-${meeting.meeting_id}`,
      meeting_id: meeting.meeting_id,
      country_id: meeting.country_id,
      authority_id: meeting.authority_id,
      racing_system_id: meeting.racing_system_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.date,
      timezone: meeting.timezone,
      capability_rank: rank,
      first_race_time_local: meeting.first_race_time_local ?? null,
      last_race_time_local: meeting.last_race_time_local ?? null,
      timetable_rows: [],
      source: {
        source_id: source.sourceId,
        official_url: source.officialUrl,
        checked_at: input.generated_at,
        extraction_method: 'adapter_candidate',
      },
      confidence: confidenceFor(rank),
      review_status: 'needs_review',
      notes: 'Banei schedule-layer bridge record. No flat-racing surface/course assumptions and no automatic promotion.',
    });
  }

  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: input.generated_at,
    adapter_id: 'japan-banei-dry-run-adapter',
    country_id: 'japan',
    authority_id: 'banei-tokachi',
    source_id: source.sourceId,
    candidate_window: structuredClone(window),
    records,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'Banei schedule foundation normalized to shared C/B/B+ review semantics. A/A+ are not inferred.',
      promotion_target: null,
    },
  };

  const coverageClaim = unresolvedMeetingIds.length > 0 ? 'partial' : 'source_window_complete';
  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id,
    system_id: 'japan-banei-system',
    source_id: source.sourceId,
    checked_at: input.generated_at,
    requested_scope: {
      kind: 'date_window',
      start_date: window.start_date,
      end_date_exclusive: window.end_date_exclusive,
      timezone: window.timezone,
    },
    observed_scope: {
      kind: 'date_window',
      start_date: window.start_date,
      end_date_exclusive: window.end_date_exclusive,
      timezone: window.timezone,
    },
    collection_mode: 'date_window',
    records_discovered: records.length,
    records_updated: records.length,
    unresolved_dates: [],
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: [],
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };
  const coverageValidation = validateCoverageObservation(coverage);
  if (!coverageValidation.valid) {
    throw new Error(`Banei Coverage Observation invalid: ${coverageValidation.errors.join('; ')}`);
  }

  const manifestRef = `data/generated/timetable/banei-control-plane/${batch_id}/result-manifest.json`;
  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id,
    job_id,
    batch_id,
    system_id: 'japan-banei-system',
    runner_used: 'reviewed_import',
    requested_scope: {
      start_date: window.start_date,
      end_date_exclusive: window.end_date_exclusive,
      timezone: window.timezone,
    },
    observed_scope: structuredClone(coverage.observed_scope),
    coverage_claim: coverage.coverage_claim,
    records_discovered: coverage.records_discovered,
    records_updated: coverage.records_updated,
    rank_counts: counts,
    unresolved_dates: structuredClone(coverage.unresolved_dates),
    unresolved_meeting_ids: structuredClone(coverage.unresolved_meeting_ids),
    source_errors: structuredClone(coverage.source_errors),
    artifact_refs: {
      candidate_ref: `data/generated/timetable/banei-control-plane/${batch_id}/candidate.json`,
      coverage_observation_ref: `data/generated/timetable/banei-control-plane/${batch_id}/coverage-observation.json`,
      collection_report_ref: `data/generated/timetable/banei-control-plane/${batch_id}/collection-report.json`,
    },
  };
  const manifestErrors = [
    ...validateCollectionResultManifestV1(manifest),
    ...validateCollectionResultManifestAgainstCoverageV1(manifest, coverage),
  ];
  if (manifestErrors.length) throw new Error(`Banei Result Manifest invalid: ${manifestErrors.join('; ')}`);

  const reviewQueue = {
    schema_version: 'calendar-review-queue-v1',
    generated_at: input.generated_at,
    entries: [buildReviewQueueEntryFromManifestV1(manifest, {
      review_state: 'review_ready',
      promotion_state: 'not_ready',
      manifest_ref: manifestRef,
    })],
  };
  const reviewErrors = validateReviewQueueV1(reviewQueue);
  if (reviewErrors.length) throw new Error(`Banei Review Queue invalid: ${reviewErrors.join('; ')}`);

  return {
    schema_version: 'calendar-banei-control-plane-bridge-v1',
    generated_at: input.generated_at,
    system_id: 'japan-banei-system',
    target_rank: TARGET_RANK,
    candidate,
    coverage_observation: coverage,
    result_manifest: manifest,
    review_queue: reviewQueue,
    retry_activation: {
      state: 'blocked_pending_detail_adapter_and_registry_support',
      unresolved_meeting_count: unresolvedMeetingIds.length,
      automatic_retry_queue_write: false,
    },
    boundaries: {
      approval: false,
      promotion: false,
      canonical_write: false,
      public_write: false,
      publication: false,
      deployment: false,
    },
  };
}

export const baneiControlPlaneBridgeV1Contract = Object.freeze({
  ranks: RANKS,
  target_rank: TARGET_RANK,
  current_schedule_evidence_ranks: Object.freeze(['C', 'B', 'B+']),
});
