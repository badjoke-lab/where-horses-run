import crypto from 'node:crypto';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1 } from './collection-result-manifest-validation.mjs';
import {
  buildReviewQueueEntryFromManifestV1,
  validateReviewQueueEntryAgainstManifestV1,
  validateReviewQueueV1,
} from './review-queue-validation.mjs';
import {
  validateRankAwareRetryQueueEntryV1,
  validateRankAwareRetryQueueV1,
  validateRankGapV1,
} from './rank-aware-retry-queue-validation.mjs';

const SYSTEM_ID = 'uae-national-racing-system';
const COUNTRY_ID = 'united-arab-emirates';
const AUTHORITY_ID = 'emirates-racing-authority';
const SOURCE_ID = 'era-racecard-public-timetable';
const ADAPTER_ID = 'uae-era-racecard-detail-artifact-v1';
const TIMEZONE = 'Asia/Dubai';
const PROMOTION_TARGET = 'canonical-timetable-v0';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function sha256UaeJsonV1(value) {
  return crypto.createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
}

function canonicalMap(meetings) {
  return new Map((meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
}

function publicATimetableRows(evidence) {
  const rows = (evidence?.observations ?? [])
    .filter((row) => Number.isInteger(row.race_number) && row.post_time_local)
    .sort((left, right) => left.race_number - right.race_number)
    .map((row) => ({ label: `Race ${row.race_number}`, post_time_local: row.post_time_local }));
  assert(rows.length >= 2, 'UAE A observation requires at least two timed races');
  assert(rows.every((row, index) => row.label === `Race ${index + 1}`), 'UAE A observation must be continuous from Race 1');
  return rows;
}

function officialUrlFromEvidence(evidence) {
  const url = evidence?.observations?.find((row) => typeof row.source_url === 'string')?.source_url;
  assert(url, 'UAE detail evidence has no official source URL');
  const parsed = new URL(url);
  assert(parsed.protocol === 'https:' && parsed.hostname === 'emiratesracing.com', 'UAE detail evidence URL must remain official');
  return url;
}

export function buildUaeEraRankUpgradeArtifactsV1({
  job,
  batchId,
  generatedAt,
  canonicalMeetings,
  evidenceByMeetingId,
  runnerUsed = 'github_actions',
}) {
  assert(job?.schema_version === 'calendar-collection-job-v1', 'Collection Job v1 required');
  assert(job.system_id === SYSTEM_ID, 'UAE rank-upgrade Job system differs');
  assert(job.collection_mode === 'selected_meetings', 'UAE rank-upgrade Job requires selected_meetings');
  assert(job.rank_strategy === 'target_rank' && job.target_rank === 'A', 'UAE rank-upgrade Job target must be A');
  assert(job.reason === 'rank_upgrade_retry', 'UAE rank-upgrade Job reason must be rank_upgrade_retry');
  assert(Array.isArray(job.requested_scope?.meeting_ids) && job.requested_scope.meeting_ids.length > 0, 'selected meeting IDs required');
  assert(new Set(job.requested_scope.meeting_ids).size === job.requested_scope.meeting_ids.length, 'selected meeting IDs must be unique');
  assert(ID_PATTERN.test(batchId ?? ''), 'batchId must be stable kebab-case');
  assert(validDateTime(generatedAt), 'generatedAt must be valid');
  assert(runnerUsed === 'github_actions', 'UAE detail operational runner must be github_actions');

  const byId = canonicalMap(canonicalMeetings);
  const records = [];
  const unresolvedMeetingIds = [];
  const sourceErrors = [];
  for (const meetingId of [...job.requested_scope.meeting_ids].sort()) {
    const canonical = byId.get(meetingId);
    assert(canonical, `canonical UAE meeting missing: ${meetingId}`);
    assert(canonical.country_id === COUNTRY_ID && canonical.authority_id === AUTHORITY_ID, `${meetingId} is not an ERA meeting`);
    assert(canonical.timezone === TIMEZONE, `${meetingId} timezone differs`);
    assert(canonical.capability_rank === 'C', `${meetingId} must currently be Rank C for C-to-A retry`);
    const evidence = evidenceByMeetingId?.[meetingId] ?? null;
    if (!evidence) {
      unresolvedMeetingIds.push(meetingId);
      sourceErrors.push({ code: 'source_unavailable', scope_ref: meetingId, message: 'ERA detail evidence was not produced for the selected meeting.' });
      continue;
    }
    assert(evidence.schema_version === 'calendar-uae-era-detail-live-evidence-v1', `${meetingId} evidence schema differs`);
    assert(evidence.meeting?.date === canonical.date, `${meetingId} evidence date differs`);
    assert(evidence.meeting?.racecourse_id === canonical.racecourse_id, `${meetingId} evidence racecourse differs`);
    assert(evidence.meeting?.meeting_complete === true, `${meetingId} evidence must be complete`);
    assert(['A', 'A+'].includes(evidence.classification?.rank), `${meetingId} evidence does not prove A-level detail`);
    assert((evidence.source_errors ?? []).length === 0, `${meetingId} evidence contains source errors`);
    assert(evidence.safety?.canonical_write === false && evidence.safety?.public_write === false, `${meetingId} evidence write boundary differs`);
    const timetableRows = publicATimetableRows(evidence);
    records.push({
      candidate_id: `candidate-${meetingId}`,
      meeting_id: meetingId,
      country_id: COUNTRY_ID,
      authority_id: AUTHORITY_ID,
      racing_system_id: SYSTEM_ID,
      racecourse_id: canonical.racecourse_id,
      date: canonical.date,
      timezone: TIMEZONE,
      capability_rank: 'A',
      first_race_time_local: timetableRows[0].post_time_local,
      last_race_time_local: timetableRows.at(-1).post_time_local,
      timetable_rows: timetableRows,
      source: {
        source_id: SOURCE_ID,
        official_url: officialUrlFromEvidence(evidence),
        checked_at: evidence.generated_at,
        extraction_method: 'adapter',
      },
      confidence: 'high',
      review_status: 'needs_review',
      notes: 'ERA official Race 1-N detail classified at Rank A. Public-safe rows contain race labels and post times only; participant, betting, result, payout, prediction, raw-source, and stream data are excluded.',
    });
  }

  const requestedScope = { kind: 'selected_meetings', meeting_ids: [...job.requested_scope.meeting_ids].sort() };
  const observedIds = records.map((record) => record.meeting_id).sort();
  const observedScope = observedIds.length ? { kind: 'selected_meetings', meeting_ids: observedIds } : { kind: 'not_observed' };
  const coverageClaim = unresolvedMeetingIds.length === 0 && sourceErrors.length === 0 ? 'source_window_complete' : records.length ? 'partial' : 'none';
  const candidate = {
    schema_version: 'timetable-candidate-v1',
    generated_at: generatedAt,
    adapter_id: ADAPTER_ID,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    source_id: SOURCE_ID,
    candidate_window: null,
    records,
    review: {
      status: 'needs_review',
      reviewed_at: null,
      reviewer: null,
      summary: 'UAE ERA selected-meeting C-to-A rank-upgrade candidates. Human review and separate promotion remain required.',
      promotion_target: null,
    },
  };
  const coverage = {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: batchId,
    system_id: SYSTEM_ID,
    source_id: SOURCE_ID,
    checked_at: generatedAt,
    requested_scope: requestedScope,
    observed_scope: observedScope,
    collection_mode: 'selected_meetings',
    records_discovered: records.length,
    records_updated: 0,
    unresolved_dates: [],
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    coverage_claim: coverageClaim,
    completion_audit_ref: null,
  };
  const artifactBase = `data/generated/timetable/uae-era-detail-batches/${batchId}`;
  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: job.campaign_id,
    job_id: job.job_id,
    batch_id: batchId,
    system_id: SYSTEM_ID,
    runner_used: runnerUsed,
    requested_scope: structuredClone(job.requested_scope),
    observed_scope: observedScope,
    coverage_claim: coverageClaim,
    records_discovered: records.length,
    records_updated: 0,
    rank_counts: { C: 0, B: 0, 'B+': 0, A: records.length, 'A+': 0 },
    unresolved_dates: [],
    unresolved_meeting_ids: unresolvedMeetingIds,
    source_errors: sourceErrors,
    artifact_refs: {
      candidate_ref: `${artifactBase}/candidates.json`,
      coverage_observation_ref: `${artifactBase}/coverage-observation.json`,
      collection_report_ref: `${artifactBase}/collection-report.json`,
    },
  };
  const report = {
    schema_version: 'calendar-uae-era-rank-upgrade-report-v1',
    work_id: 'WHR-CAL-UAE-ERA-DETAIL-RECOVERY',
    implementation_unit: 'UAE-DETAIL-RECOVERY-02',
    batch_id: batchId,
    generated_at: generatedAt,
    selected_meeting_ids: [...job.requested_scope.meeting_ids].sort(),
    records_discovered: records.length,
    rank_counts: structuredClone(manifest.rank_counts),
    coverage_claim: coverageClaim,
    candidate_review_state: 'needs_review',
    promotion_target: null,
    network_fetch: true,
    raw_source_storage: 'disabled',
    canonical_write: 'disabled',
    public_write: 'disabled',
    publication_effect: 'none',
    automatic_approval: false,
    automatic_promotion: false,
    automatic_publication: false,
  };

  const coverageValidation = validateCoverageObservation(coverage);
  assert(coverageValidation.valid, `Coverage invalid: ${coverageValidation.errors.join('; ')}`);
  const manifestErrors = validateCollectionResultManifestV1(manifest);
  assert(manifestErrors.length === 0, `Manifest invalid: ${manifestErrors.join('; ')}`);
  return { candidate, coverage, manifest, report };
}

export function buildUaeEraRetryQueueV1({ job, canonicalMeetings, generatedAt }) {
  const byId = canonicalMap(canonicalMeetings);
  const entries = [...job.requested_scope.meeting_ids].sort().map((meetingId) => {
    const canonical = byId.get(meetingId);
    assert(canonical?.capability_rank === 'C', `${meetingId} is not a canonical C meeting`);
    const entry = {
      meeting_id: meetingId,
      system_id: SYSTEM_ID,
      current_reviewed_rank: 'C',
      latest_observed_rank: 'C',
      collection_target_rank: 'A',
      missing_fields: ['first_race_time_local', 'last_race_time_local', 'timetable_rows'],
      retry_reason: 'rank_upgrade_retry',
      retry_scope: { mode: 'selected_meetings', meeting_ids: [...job.requested_scope.meeting_ids].sort() },
      primary_runner: 'github_actions',
      fallback_runner: null,
      adapter_id: ADAPTER_ID,
      next_eligible_retry_at: null,
      attempt_count: 0,
      last_attempt_at: null,
    };
    const errors = [...validateRankAwareRetryQueueEntryV1(entry), ...validateRankGapV1({ ...entry, technical_capability_rank: 'A' })];
    assert(errors.length === 0, `${meetingId} Retry Queue invalid: ${errors.join('; ')}`);
    return entry;
  });
  const queue = { schema_version: 'calendar-rank-aware-retry-queue-v1', generated_at: generatedAt, entries };
  const errors = validateRankAwareRetryQueueV1(queue);
  assert(errors.length === 0, `UAE Retry Queue invalid: ${errors.join('; ')}`);
  return queue;
}

export function buildUaeEraReviewQueueV1({ manifest, generatedAt }) {
  const entry = buildReviewQueueEntryFromManifestV1(manifest, {
    review_state: manifest.coverage_claim === 'source_window_complete' ? 'review_ready' : 'not_ready',
    promotion_state: 'not_ready',
    manifest_ref: `data/generated/timetable/uae-era-detail-batches/${manifest.batch_id}/collection-result-manifest.json`,
  });
  const reconcileErrors = validateReviewQueueEntryAgainstManifestV1(entry, manifest);
  assert(reconcileErrors.length === 0, `UAE Review Queue reconciliation failed: ${reconcileErrors.join('; ')}`);
  const queue = { schema_version: 'calendar-review-queue-v1', generated_at: generatedAt, entries: [entry] };
  const errors = validateReviewQueueV1(queue);
  assert(errors.length === 0, `UAE Review Queue invalid: ${errors.join('; ')}`);
  return queue;
}

export function approveUaeEraCandidateV1({ candidate, manifest, approval }) {
  assert(approval?.schema_version === 'calendar-uae-era-promotion-approval-v1', 'approval schema differs');
  assert(approval.decision === 'approved', 'approval decision must be approved');
  assert(approval.batch_id === manifest.batch_id, 'approval batch differs');
  assert(approval.candidate_sha256 === sha256UaeJsonV1(candidate), 'approval candidate SHA-256 differs');
  assert(approval.manifest_sha256 === sha256UaeJsonV1(manifest), 'approval manifest SHA-256 differs');
  assert(typeof approval.reviewer === 'string' && approval.reviewer.trim(), 'approval reviewer required');
  assert(validDateTime(approval.reviewed_at), 'approval reviewed_at invalid');
  assert(candidate.review?.status === 'needs_review' && candidate.review?.promotion_target === null, 'candidate is not awaiting review');
  assert(manifest.coverage_claim === 'source_window_complete', 'approval requires complete selected-meeting coverage');
  assert(manifest.unresolved_meeting_ids.length === 0 && manifest.source_errors.length === 0, 'approval requires no unresolved meetings or source errors');
  assert(manifest.rank_counts.A === candidate.records.length && candidate.records.length > 0, 'approval requires A candidates');
  return {
    ...structuredClone(candidate),
    review: { status: 'approved', reviewer: approval.reviewer, reviewed_at: approval.reviewed_at, promotion_target: PROMOTION_TARGET },
    records: candidate.records.map((record) => ({ ...record, review_status: 'approved' })),
  };
}

export function validateUaeSelectedIdentityV1({ job, candidate }) {
  const selected = [...job.requested_scope.meeting_ids].sort();
  const observed = [...new Set((candidate?.records ?? []).map((record) => record.meeting_id))].sort();
  return exact(selected, observed) ? [] : ['selected UAE meeting IDs must exactly match candidate meeting IDs'];
}

export const uaeEraRankUpgradeContractV1 = Object.freeze({
  system_id: SYSTEM_ID,
  country_id: COUNTRY_ID,
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  adapter_id: ADAPTER_ID,
  timezone: TIMEZONE,
  promotion_target: PROMOTION_TARGET,
});
