import crypto from 'node:crypto';
import {
  validateRankAwareRetryQueueEntryV1,
  validateRankAwareRetryQueueV1,
  validateRankGapV1,
} from './rank-aware-retry-queue-validation.mjs';
import {
  buildReviewQueueEntryFromManifestV1,
  validateReviewQueueEntryAgainstManifestV1,
  validateReviewQueueV1,
} from './review-queue-validation.mjs';
import { routePolicyForV1 } from './route-runner-policy.mjs';

const SYSTEM_ID = 'hong-kong-hkjc-system';
const AUTHORITY_ID = 'hkjc';
const TIMEZONE = 'Asia/Hong_Kong';
const DETAIL_SOURCE_ID = 'hkjc-detail-reviewed-import';
const DETAIL_ADAPTER_ID = 'hkjc-detail-reviewed-import-v1';
const PROMOTION_TARGET = 'canonical-timetable-v0';
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REPO_MANIFEST_PATTERN = /^data\/generated\/timetable\/hkjc-detail-batches\/[a-z0-9]+(?:-[a-z0-9]+)*\/collection-result-manifest\.json$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function sha256JsonV1(value) {
  return crypto.createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
}

function missingFieldsForRank(rank) {
  if (rank === 'C') return ['first_race_time_local', 'last_race_time_local', 'timetable_rows', 'race_name', 'distance_m', 'surface', 'course_label'];
  if (rank === 'B') return ['last_race_time_local', 'timetable_rows', 'race_name', 'distance_m', 'surface', 'course_label'];
  if (rank === 'B+') return ['timetable_rows', 'race_name', 'distance_m', 'surface', 'course_label'];
  if (rank === 'A') return ['race_name', 'distance_m', 'surface', 'course_label'];
  return [];
}

function validateOperatorRetryEntry(entry, { canonicalMeeting, profile, detailRoute }) {
  const errors = [];
  errors.push(...validateRankAwareRetryQueueEntryV1(entry));
  if (!canonicalMeeting) errors.push(`canonical meeting missing for ${entry.meeting_id}`);
  else {
    if (canonicalMeeting.meeting_id !== entry.meeting_id) errors.push('meeting identity differs');
    if (canonicalMeeting.authority_id !== AUTHORITY_ID) errors.push('canonical meeting authority is not HKJC');
    if (canonicalMeeting.country_id !== 'hong-kong') errors.push('canonical meeting country is not Hong Kong');
    if (canonicalMeeting.timezone !== TIMEZONE) errors.push('canonical meeting timezone differs');
    if (canonicalMeeting.capability_rank !== entry.current_reviewed_rank) errors.push('current reviewed rank differs from canonical');
  }
  if (!profile || profile.system_id !== SYSTEM_ID) errors.push('HKJC Acquisition Registry profile missing');
  else {
    if (profile.detail_source_id !== DETAIL_SOURCE_ID || profile.detail_adapter_id !== DETAIL_ADAPTER_ID) errors.push('HKJC Registry detail route differs');
    if (profile.public_ceiling !== 'A' || profile.technical_capability_rank !== 'A+') errors.push('HKJC Registry capability/ceiling differs');
  }
  if (!detailRoute) errors.push('HKJC detail route policy missing');
  else {
    if (detailRoute.selection_mode !== 'operator_only') errors.push('HKJC detail retry route must remain operator_only');
    if (detailRoute.primary_runner !== 'reviewed_import' || detailRoute.fallback_runner !== null) errors.push('HKJC detail retry runner differs');
    if (detailRoute.source_id !== DETAIL_SOURCE_ID || detailRoute.adapter_id !== DETAIL_ADAPTER_ID) errors.push('HKJC detail route identity differs');
    if (detailRoute.automatic_planning_allowed !== false || detailRoute.automatic_execution_allowed !== false) errors.push('HKJC detail retry automation boundary differs');
  }
  if (entry.system_id !== SYSTEM_ID) errors.push('retry entry system differs');
  if (entry.primary_runner !== 'reviewed_import' || entry.fallback_runner !== null) errors.push('retry entry must use reviewed_import without fallback');
  if (entry.adapter_id !== DETAIL_ADAPTER_ID) errors.push('retry entry detail adapter differs');
  if (entry.retry_scope?.mode !== 'selected_meetings') errors.push('HKJC operator retry must use selected_meetings');
  errors.push(...validateRankGapV1({
    ...entry,
    technical_capability_rank: profile?.technical_capability_rank ?? null,
  }));
  return [...new Set(errors)];
}

export function buildHkjcOperatorRetryQueueV1({
  meetingIds,
  generatedAt,
  canonicalMeetings,
  registry,
  routePolicy,
}) {
  assert(validDateTime(generatedAt), 'generatedAt must be a valid ISO date-time');
  assert(Array.isArray(meetingIds) && meetingIds.length > 0, 'meetingIds must contain at least one meeting');
  assert(new Set(meetingIds).size === meetingIds.length, 'meetingIds must not contain duplicates');
  for (const meetingId of meetingIds) assert(ID_PATTERN.test(meetingId), `invalid meeting ID ${meetingId}`);
  const profile = registry?.records?.find((record) => record.system_id === SYSTEM_ID);
  assert(profile, 'HKJC Acquisition Registry profile missing');
  const detailRoute = routePolicyForV1(routePolicy, SYSTEM_ID, 'detail');
  const canonicalById = new Map((canonicalMeetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
  const sortedMeetingIds = [...meetingIds].sort();

  const entries = sortedMeetingIds.map((meetingId) => {
    const canonicalMeeting = canonicalById.get(meetingId);
    assert(canonicalMeeting, `canonical meeting missing for ${meetingId}`);
    assert(RANK_INDEX.has(canonicalMeeting.capability_rank), `${meetingId} has unsupported canonical rank`);
    assert(RANK_INDEX.get(canonicalMeeting.capability_rank) < RANK_INDEX.get('A+'), `${meetingId} is already at technical capability A+`);
    const missingFields = missingFieldsForRank(canonicalMeeting.capability_rank);
    assert(missingFields.length > 0, `${meetingId} has no rank-upgrade gap`);
    const entry = {
      meeting_id: meetingId,
      system_id: SYSTEM_ID,
      current_reviewed_rank: canonicalMeeting.capability_rank,
      latest_observed_rank: canonicalMeeting.capability_rank,
      collection_target_rank: 'best_available',
      missing_fields: missingFields,
      retry_reason: 'rank_upgrade_retry',
      retry_scope: {
        mode: 'selected_meetings',
        meeting_ids: sortedMeetingIds,
      },
      primary_runner: 'reviewed_import',
      fallback_runner: null,
      adapter_id: DETAIL_ADAPTER_ID,
      next_eligible_retry_at: null,
      attempt_count: 0,
      last_attempt_at: null,
    };
    const errors = validateOperatorRetryEntry(entry, { canonicalMeeting, profile, detailRoute });
    assert(errors.length === 0, `${meetingId}: ${errors.join('; ')}`);
    return entry;
  });

  const queue = {
    schema_version: 'calendar-rank-aware-retry-queue-v1',
    generated_at: generatedAt,
    entries,
  };
  const queueErrors = validateRankAwareRetryQueueV1(queue);
  assert(queueErrors.length === 0, `HKJC Retry Queue is invalid: ${queueErrors.join('; ')}`);
  return queue;
}

export function validateHkjcOperatorRetryQueueV1(queue, { canonicalMeetings, registry, routePolicy }) {
  const errors = [...validateRankAwareRetryQueueV1(queue)];
  const profile = registry?.records?.find((record) => record.system_id === SYSTEM_ID) ?? null;
  let detailRoute = null;
  try { detailRoute = routePolicyForV1(routePolicy, SYSTEM_ID, 'detail'); }
  catch (error) { errors.push(error.message); }
  const canonicalById = new Map((canonicalMeetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
  for (const entry of queue?.entries ?? []) {
    errors.push(...validateOperatorRetryEntry(entry, {
      canonicalMeeting: canonicalById.get(entry.meeting_id),
      profile,
      detailRoute,
    }).map((error) => `${entry.meeting_id}: ${error}`));
  }
  return [...new Set(errors)];
}

export function buildHkjcReviewQueueV1({ manifest, manifestRef, generatedAt }) {
  assert(manifest?.schema_version === 'calendar-collection-result-manifest-v1', 'Collection Result Manifest schema differs');
  assert(manifest.system_id === SYSTEM_ID, 'Review Queue manifest must be HKJC');
  assert(manifest.runner_used === 'reviewed_import', 'Review Queue manifest must use reviewed_import');
  assert(REPO_MANIFEST_PATTERN.test(manifestRef), 'manifestRef must use the HKJC detail batch repository path');
  assert(validDateTime(generatedAt), 'generatedAt must be a valid ISO date-time');
  const entry = buildReviewQueueEntryFromManifestV1(manifest, {
    review_state: 'review_ready',
    promotion_state: 'not_ready',
    manifest_ref: manifestRef,
  });
  const manifestErrors = validateReviewQueueEntryAgainstManifestV1(entry, manifest);
  assert(manifestErrors.length === 0, `Review Queue manifest reconciliation failed: ${manifestErrors.join('; ')}`);
  const queue = {
    schema_version: 'calendar-review-queue-v1',
    generated_at: generatedAt,
    entries: [entry],
  };
  const queueErrors = validateReviewQueueV1(queue);
  assert(queueErrors.length === 0, `HKJC Review Queue is invalid: ${queueErrors.join('; ')}`);
  return queue;
}

export function validateHkjcRetryResultV1({ retryQueue, candidate, manifest }) {
  const errors = [];
  const selectedIds = [...new Set((retryQueue?.entries ?? []).map((entry) => entry.meeting_id))].sort();
  const candidateIds = [...new Set((candidate?.records ?? []).map((record) => record.meeting_id))].sort();
  if (!exact(selectedIds, candidateIds)) errors.push('candidate meeting IDs must exactly match selected Retry Queue meetings');
  if (candidate?.country_id !== 'hong-kong' || candidate?.authority_id !== AUTHORITY_ID || candidate?.source_id !== DETAIL_SOURCE_ID) errors.push('candidate HKJC detail identity differs');
  if (candidate?.review?.status !== 'needs_review' || candidate?.review?.promotion_target !== null) errors.push('candidate must remain needs_review with no promotion target');
  if ((candidate?.records ?? []).some((record) => record.review_status !== 'needs_review')) errors.push('candidate records must remain needs_review');
  if (manifest?.system_id !== SYSTEM_ID || manifest?.runner_used !== 'reviewed_import') errors.push('manifest route identity differs');
  if (manifest?.records_discovered !== candidateIds.length) errors.push('manifest record count must match selected meetings');
  const rankTotal = Object.values(manifest?.rank_counts ?? {}).reduce((sum, value) => sum + value, 0);
  if (rankTotal !== candidateIds.length) errors.push('manifest rank counts do not close to selected meetings');
  return errors;
}

export function approveHkjcCandidateV1({ candidate, manifest, approval }) {
  assert(candidate?.schema_version === 'timetable-candidate-v1', 'candidate schema differs');
  assert(manifest?.schema_version === 'calendar-collection-result-manifest-v1', 'manifest schema differs');
  assert(approval?.schema_version === 'calendar-hkjc-detail-promotion-approval-v1', 'approval schema differs');
  assert(approval.decision === 'approved', 'approval decision must be approved');
  assert(ID_PATTERN.test(approval.batch_id) && approval.batch_id === manifest.batch_id, 'approval batch ID differs');
  assert(typeof approval.reviewer === 'string' && approval.reviewer.trim(), 'approval reviewer is required');
  assert(validDateTime(approval.reviewed_at), 'approval reviewed_at must be valid');
  assert(approval.candidate_sha256 === sha256JsonV1(candidate), 'approval candidate SHA-256 differs');
  assert(approval.manifest_sha256 === sha256JsonV1(manifest), 'approval manifest SHA-256 differs');
  assert(candidate.review?.status === 'needs_review', 'candidate must be needs_review before approval');
  assert(candidate.review?.promotion_target === null, 'candidate must not already have a promotion target');
  assert(candidate.records?.length > 0 && candidate.records.every((record) => record.review_status === 'needs_review'), 'candidate records must be needs_review before approval');
  assert(manifest.system_id === SYSTEM_ID && manifest.runner_used === 'reviewed_import', 'approval manifest route differs');
  assert(manifest.unresolved_dates.length === 0 && manifest.unresolved_meeting_ids.length === 0 && manifest.source_errors.length === 0, 'approval requires no unresolved scope or source errors');
  assert(['source_window_complete', 'audited_complete'].includes(manifest.coverage_claim), 'approval requires complete reviewed coverage');
  assert((manifest.rank_counts.A ?? 0) + (manifest.rank_counts['A+'] ?? 0) > 0, 'approval requires at least one A or A+ detail result');

  return {
    ...structuredClone(candidate),
    review: {
      status: 'approved',
      reviewer: approval.reviewer,
      reviewed_at: approval.reviewed_at,
      promotion_target: PROMOTION_TARGET,
    },
    records: candidate.records.map((record) => ({
      ...record,
      source: {
        ...record.source,
        extraction_method: 'reviewed_snapshot',
      },
      review_status: 'approved',
    })),
  };
}

export const hkjcRankUpgradeOperationsContractV1 = Object.freeze({
  system_id: SYSTEM_ID,
  authority_id: AUTHORITY_ID,
  timezone: TIMEZONE,
  detail_source_id: DETAIL_SOURCE_ID,
  detail_adapter_id: DETAIL_ADAPTER_ID,
  promotion_target: PROMOTION_TARGET,
  ranks: RANKS,
});
