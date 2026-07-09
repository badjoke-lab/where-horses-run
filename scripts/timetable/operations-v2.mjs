import { validateReviewQueueV1 } from './review-queue-validation.mjs';
import { validateRankAwareRetryQueueV1 } from './rank-aware-retry-queue-validation.mjs';
import { validateDueJobPlanV1 } from './due-job-planner.mjs';
import { validateReviewCohortPlanV1 } from './review-cohort-planner.mjs';

const JOB_STATUSES = Object.freeze(['planned', 'queued', 'running', 'success', 'partial', 'failure', 'not_run']);
const REVIEW_STATES = Object.freeze(['review_ready', 'reviewing', 'approved', 'rejected']);
const PROMOTION_STATES = Object.freeze(['not_ready', 'promotion_ready', 'promoted', 'published']);
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const SOURCE_HEALTH = Object.freeze(['healthy', 'degraded', 'unavailable', 'unknown']);
const PUBLICATION_STATES = Object.freeze(['current', 'stale', 'unknown']);
const BOUNDARIES = Object.freeze({
  network_fetch_performed: false,
  job_execution_performed: false,
  approval_performed: false,
  promotion_performed: false,
  canonical_write_performed: false,
  public_write_performed: false,
  publication_performed: false,
  deployment_performed: false,
});
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REPO_REF_PATTERN = /^(?:data|docs)\/[A-Za-z0-9_./+-]+$/;

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function zeroJobCounts() {
  return Object.fromEntries(JOB_STATUSES.map((status) => [status, 0]));
}

function zeroReviewCounts() {
  return Object.fromEntries(REVIEW_STATES.map((state) => [state, 0]));
}

function zeroPromotionCounts() {
  return Object.fromEntries(PROMOTION_STATES.map((state) => [state, 0]));
}

function zeroRankCounts() {
  return Object.fromEntries(RANKS.map((rank) => [rank, 0]));
}

function addRanks(target, source) {
  for (const rank of RANKS) target[rank] += source?.[rank] ?? 0;
}

function hoursSince(asOf, previous) {
  if (previous === null || previous === undefined) return null;
  const hours = Math.floor((Date.parse(asOf) - Date.parse(previous)) / 3600000);
  return Number.isFinite(hours) && hours >= 0 ? hours : null;
}

function profileFor(registry, systemId) {
  return registry?.records?.find((record) => record.system_id === systemId) ?? null;
}

function sourceStateFor(sourceStates, systemId) {
  return sourceStates?.find((state) => state.system_id === systemId) ?? null;
}

function retryPolicyFor(duePolicy, systemId) {
  return duePolicy?.system_rules?.find((rule) => rule.system_id === systemId)?.rank_retry ?? null;
}

function retryOperationalState(entries, generatedAt, attemptLimit) {
  let dueCount = 0;
  let deferredCount = 0;
  let attemptedCount = 0;
  let attemptLimitReachedCount = 0;
  const deferredTimes = [];
  for (const entry of entries) {
    const due = entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= Date.parse(generatedAt);
    if (due) dueCount += 1;
    else {
      deferredCount += 1;
      deferredTimes.push(entry.next_eligible_retry_at);
    }
    if (entry.attempt_count > 0) attemptedCount += 1;
    if (attemptLimit > 0 && entry.attempt_count >= attemptLimit) attemptLimitReachedCount += 1;
  }
  deferredTimes.sort();
  return {
    entry_count: entries.length,
    due_count: dueCount,
    deferred_count: deferredCount,
    attempted_count: attemptedCount,
    attempt_limit_reached_count: attemptLimitReachedCount,
    next_eligible_at: deferredTimes[0] ?? null,
    attempt_limit: attemptLimit,
  };
}

function publicationStateFor(publicationBySystem, systemId, fallbackState) {
  return publicationBySystem?.find((entry) => entry.system_id === systemId)?.state ?? fallbackState;
}

function validateRuntimeStatuses(statuses, registry) {
  const errors = [];
  if (!Array.isArray(statuses)) return ['runtime_statuses must be an array'];
  const seenJobIds = new Set();
  for (const [index, status] of statuses.entries()) {
    const location = `runtime_statuses[${index}]`;
    const keys = ['job_id', 'campaign_id', 'system_id', 'status', 'updated_at'];
    if (!status || typeof status !== 'object' || Array.isArray(status)) {
      errors.push(`${location} must be an object`);
      continue;
    }
    for (const key of keys) if (!Object.hasOwn(status, key)) errors.push(`${location}.${key} is required`);
    for (const key of Object.keys(status)) if (!keys.includes(key)) errors.push(`${location}.${key} is not allowed`);
    for (const key of ['job_id', 'campaign_id', 'system_id']) {
      if (typeof status[key] !== 'string' || !ID_PATTERN.test(status[key])) errors.push(`${location}.${key} invalid`);
    }
    if (!JOB_STATUSES.filter((value) => value !== 'planned').includes(status.status)) errors.push(`${location}.status unsupported`);
    if (!validDateTime(status.updated_at)) errors.push(`${location}.updated_at invalid`);
    if (seenJobIds.has(status.job_id)) errors.push(`duplicate runtime status job_id ${status.job_id}`);
    seenJobIds.add(status.job_id);
    if (!profileFor(registry, status.system_id)) errors.push(`${location} Registry profile missing for ${status.system_id}`);
  }
  return errors;
}

function validateSourceStates(sourceStates, registry) {
  const errors = [];
  if (!Array.isArray(sourceStates)) return ['source_states must be an array'];
  const seen = new Set();
  for (const [index, state] of sourceStates.entries()) {
    const location = `source_states[${index}]`;
    const keys = ['system_id', 'source_health', 'last_successful_collection_at', 'freshness_threshold_hours'];
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      errors.push(`${location} must be an object`);
      continue;
    }
    for (const key of keys) if (!Object.hasOwn(state, key)) errors.push(`${location}.${key} is required`);
    for (const key of Object.keys(state)) if (!keys.includes(key)) errors.push(`${location}.${key} is not allowed`);
    if (!profileFor(registry, state.system_id)) errors.push(`${location} Registry profile missing for ${state.system_id}`);
    if (!SOURCE_HEALTH.includes(state.source_health)) errors.push(`${location}.source_health unsupported`);
    if (state.last_successful_collection_at !== null && !validDateTime(state.last_successful_collection_at)) errors.push(`${location}.last_successful_collection_at invalid`);
    if (!Number.isInteger(state.freshness_threshold_hours) || state.freshness_threshold_hours < 1) errors.push(`${location}.freshness_threshold_hours invalid`);
    if (seen.has(state.system_id)) errors.push(`duplicate source state ${state.system_id}`);
    seen.add(state.system_id);
  }
  return errors;
}

function validatePublicationSnapshot(snapshot, registry) {
  const errors = [];
  const keys = ['state', 'generated_at', 'meeting_count', 'detail_count', 'stale_for_current_window', 'by_system'];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return ['publication_snapshot must be an object'];
  for (const key of keys) if (!Object.hasOwn(snapshot, key)) errors.push(`publication_snapshot.${key} is required`);
  for (const key of Object.keys(snapshot)) if (!keys.includes(key)) errors.push(`publication_snapshot.${key} is not allowed`);
  if (!PUBLICATION_STATES.includes(snapshot.state)) errors.push('publication_snapshot.state unsupported');
  if (snapshot.generated_at !== null && !validDateTime(snapshot.generated_at)) errors.push('publication_snapshot.generated_at invalid');
  for (const key of ['meeting_count', 'detail_count']) if (!Number.isInteger(snapshot[key]) || snapshot[key] < 0) errors.push(`publication_snapshot.${key} invalid`);
  if (typeof snapshot.stale_for_current_window !== 'boolean') errors.push('publication_snapshot.stale_for_current_window invalid');
  if (!Array.isArray(snapshot.by_system)) errors.push('publication_snapshot.by_system must be an array');
  else {
    const seen = new Set();
    for (const [index, entry] of snapshot.by_system.entries()) {
      if (!profileFor(registry, entry.system_id)) errors.push(`publication_snapshot.by_system[${index}] Registry profile missing`);
      if (!PUBLICATION_STATES.includes(entry.state)) errors.push(`publication_snapshot.by_system[${index}].state unsupported`);
      if (seen.has(entry.system_id)) errors.push(`duplicate publication system ${entry.system_id}`);
      seen.add(entry.system_id);
    }
  }
  return errors;
}

function buildJobAccounting(duePlan, runtimeStatuses) {
  const counts = zeroJobCounts();
  const dueJobIds = new Set(duePlan.collection_plan.jobs.map((job) => job.job_id));
  const statusByJobId = new Map(runtimeStatuses.map((status) => [status.job_id, status]));
  for (const job of duePlan.collection_plan.jobs) {
    const status = statusByJobId.get(job.job_id);
    counts[status?.status ?? 'planned'] += 1;
  }
  for (const status of runtimeStatuses) {
    if (!dueJobIds.has(status.job_id)) counts[status.status] += 1;
  }
  return counts;
}

function systemJobCounts(systemId, duePlan, runtimeStatuses) {
  const counts = zeroJobCounts();
  const dueJobs = duePlan.collection_plan.jobs.filter((job) => job.system_id === systemId);
  const dueIds = new Set(dueJobs.map((job) => job.job_id));
  const statuses = runtimeStatuses.filter((status) => status.system_id === systemId);
  const statusByJobId = new Map(statuses.map((status) => [status.job_id, status]));
  for (const job of dueJobs) counts[statusByJobId.get(job.job_id)?.status ?? 'planned'] += 1;
  for (const status of statuses) if (!dueIds.has(status.job_id)) counts[status.status] += 1;
  return counts;
}

function attentionFor({ sourceHealth, freshnessAge, freshnessThreshold, jobCounts, reviewReady, retryDue, retryDeferred, promotionReady, publicationState }) {
  const attention = [];
  if (sourceHealth !== 'healthy') attention.push('source_health');
  if (freshnessAge === null || freshnessAge >= freshnessThreshold) attention.push('freshness');
  if (jobCounts.queued > 0) attention.push('queued_work');
  if (jobCounts.running > 0) attention.push('running_work');
  if (jobCounts.failure > 0) attention.push('recent_failure');
  if (jobCounts.partial > 0) attention.push('partial_result');
  if (reviewReady > 0) attention.push('review_queue');
  if (retryDue > 0) attention.push('retry_due');
  if (retryDeferred > 0) attention.push('retry_backoff');
  if (promotionReady > 0) attention.push('promotion_ready');
  if (publicationState === 'stale') attention.push('publication_stale');
  return attention.length ? attention : ['none'];
}

export function buildOperationsV2V1({
  generated_at: generatedAt,
  operations_v1_ref: operationsV1Ref = 'data/generated/timetable/operations-status.json',
  due_plan: duePlan,
  due_policy: duePolicy,
  runtime_statuses: runtimeStatuses,
  review_queue: reviewQueue,
  retry_queue: retryQueue,
  review_cohort_plan: reviewCohortPlan,
  registry,
  source_states: sourceStates,
  publication_snapshot: publicationSnapshot,
} = {}) {
  if (!validDateTime(generatedAt)) throw new Error('generated_at must be a valid ISO date-time');
  if (typeof operationsV1Ref !== 'string' || !REPO_REF_PATTERN.test(operationsV1Ref) || operationsV1Ref.includes('..')) throw new Error('operations_v1_ref invalid');
  const dueErrors = validateDueJobPlanV1(duePlan, duePolicy, registry);
  if (dueErrors.length) throw new Error(`Due-job Plan invalid: ${dueErrors.join('; ')}`);
  const reviewErrors = validateReviewQueueV1(reviewQueue);
  if (reviewErrors.length) throw new Error(`Review Queue invalid: ${reviewErrors.join('; ')}`);
  const retryErrors = validateRankAwareRetryQueueV1(retryQueue);
  if (retryErrors.length) throw new Error(`Retry Queue invalid: ${retryErrors.join('; ')}`);
  const cohortErrors = validateReviewCohortPlanV1(reviewCohortPlan, reviewQueue, registry);
  if (cohortErrors.length) throw new Error(`Review Cohort Plan invalid: ${cohortErrors.join('; ')}`);
  const runtimeErrors = validateRuntimeStatuses(runtimeStatuses, registry);
  if (runtimeErrors.length) throw new Error(`runtime statuses invalid: ${runtimeErrors.join('; ')}`);
  const sourceErrors = validateSourceStates(sourceStates, registry);
  if (sourceErrors.length) throw new Error(`source states invalid: ${sourceErrors.join('; ')}`);
  const publicationErrors = validatePublicationSnapshot(publicationSnapshot, registry);
  if (publicationErrors.length) throw new Error(`publication snapshot invalid: ${publicationErrors.join('; ')}`);

  const jobCounts = buildJobAccounting(duePlan, runtimeStatuses);
  const reviewCounts = zeroReviewCounts();
  const promotionCounts = zeroPromotionCounts();
  const rankCounts = zeroRankCounts();
  for (const entry of reviewQueue.entries) {
    reviewCounts[entry.review_state] += 1;
    promotionCounts[entry.promotion_state] += 1;
    addRanks(rankCounts, entry.rank_counts);
  }

  const retryReasonCounts = {};
  let retryDue = 0;
  let retryDeferred = 0;
  let retryAttempted = 0;
  let retryAttemptLimitReached = 0;
  const retryDeferredTimes = [];
  for (const entry of retryQueue.entries) {
    retryReasonCounts[entry.retry_reason] = (retryReasonCounts[entry.retry_reason] ?? 0) + 1;
    if (entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= Date.parse(generatedAt)) retryDue += 1;
    else {
      retryDeferred += 1;
      retryDeferredTimes.push(entry.next_eligible_retry_at);
    }
    if (entry.attempt_count > 0) retryAttempted += 1;
    const limit = retryPolicyFor(duePolicy, entry.system_id)?.max_attempt_count ?? 0;
    if (limit > 0 && entry.attempt_count >= limit) retryAttemptLimitReached += 1;
  }
  retryDeferredTimes.sort();

  const publicCeilingDependencies = reviewCohortPlan.cohorts.filter((cohort) => cohort.promotion_dependency === 'public_ceiling_projection_required').length;
  const humanReviewRequired = reviewCohortPlan.cohorts.length;
  const systems = registry.records.map((profile) => {
    const sourceState = sourceStateFor(sourceStates, profile.system_id);
    const sourceHealth = sourceState?.source_health ?? 'unknown';
    const freshnessAge = hoursSince(generatedAt, sourceState?.last_successful_collection_at ?? null);
    const freshnessThreshold = sourceState?.freshness_threshold_hours ?? 1;
    const systemJobs = systemJobCounts(profile.system_id, duePlan, runtimeStatuses);
    const systemReviewEntries = reviewQueue.entries.filter((entry) => entry.system_id === profile.system_id);
    const systemRetryEntries = retryQueue.entries.filter((entry) => entry.system_id === profile.system_id);
    const systemRanks = zeroRankCounts();
    const systemPromotions = zeroPromotionCounts();
    let systemReviewReady = 0;
    for (const entry of systemReviewEntries) {
      if (entry.review_state === 'review_ready') systemReviewReady += 1;
      systemPromotions[entry.promotion_state] += 1;
      addRanks(systemRanks, entry.rank_counts);
    }
    const retryPolicy = retryPolicyFor(duePolicy, profile.system_id);
    const systemRetryState = retryOperationalState(systemRetryEntries, generatedAt, retryPolicy?.max_attempt_count ?? 0);
    const systemRetryDue = systemRetryState.due_count;
    const publicationState = publicationStateFor(publicationSnapshot.by_system, profile.system_id, publicationSnapshot.state);
    return {
      system_id: profile.system_id,
      authority_id: profile.authority_id,
      primary_runner: profile.primary_runner,
      source_health: sourceHealth,
      freshness_age_hours: freshnessAge,
      due_job_count: duePlan.collection_plan.jobs.filter((job) => job.system_id === profile.system_id).length,
      job_counts: systemJobs,
      review_ready_count: systemReviewReady,
      retry_entry_count: systemRetryState.entry_count,
      retry_due_count: systemRetryState.due_count,
      retry_deferred_count: systemRetryState.deferred_count,
      retry_attempted_count: systemRetryState.attempted_count,
      retry_attempt_limit_reached_count: systemRetryState.attempt_limit_reached_count,
      retry_next_eligible_at: systemRetryState.next_eligible_at,
      retry_attempt_limit: systemRetryState.attempt_limit,
      rank_distribution: systemRanks,
      promotion_state_counts: systemPromotions,
      publication_state: publicationState,
      operator_attention: attentionFor({
        sourceHealth,
        freshnessAge,
        freshnessThreshold,
        jobCounts: systemJobs,
        reviewReady: systemReviewReady,
        retryDue: systemRetryDue,
        retryDeferred: systemRetryState.deferred_count,
        promotionReady: systemPromotions.promotion_ready,
        publicationState,
      }),
    };
  }).sort((left, right) => left.system_id.localeCompare(right.system_id));

  const output = {
    schema_version: 'calendar-operations-v2',
    generated_at: generatedAt,
    mode: 'read_only_control_plane_view',
    operations_v1_ref: operationsV1Ref,
    boundaries: structuredClone(BOUNDARIES),
    acquisition_summary: {
      job_counts: jobCounts,
      due_plan_job_count: duePlan.collection_plan.jobs.length,
      recent_result_count: jobCounts.success + jobCounts.partial + jobCounts.failure,
    },
    review_summary: {
      entry_count: reviewQueue.entries.length,
      by_review_state: reviewCounts,
      by_promotion_state: promotionCounts,
    },
    retry_summary: {
      entry_count: retryQueue.entries.length,
      due_now_count: retryDue,
      deferred_count: retryDeferred,
      attempted_entry_count: retryAttempted,
      attempt_limit_reached_count: retryAttemptLimitReached,
      next_deferred_eligible_at: retryDeferredTimes[0] ?? null,
      by_reason: Object.fromEntries(Object.entries(retryReasonCounts).sort(([left], [right]) => left.localeCompare(right))),
    },
    rank_distribution: rankCounts,
    promotion_summary: {
      by_state: structuredClone(promotionCounts),
      human_review_required_count: humanReviewRequired,
      public_ceiling_projection_required_count: publicCeilingDependencies,
    },
    publication_summary: {
      state: publicationSnapshot.state,
      generated_at: publicationSnapshot.generated_at,
      meeting_count: publicationSnapshot.meeting_count,
      detail_count: publicationSnapshot.detail_count,
      stale_for_current_window: publicationSnapshot.stale_for_current_window,
    },
    systems,
  };
  const errors = validateOperationsV2V1(output, registry);
  if (errors.length) throw new Error(`Operations v2 invalid: ${errors.join('; ')}`);
  return output;
}

export function validateOperationsV2V1(output, registry) {
  const errors = [];
  const topKeys = [
    'schema_version', 'generated_at', 'mode', 'operations_v1_ref', 'boundaries',
    'acquisition_summary', 'review_summary', 'retry_summary', 'rank_distribution',
    'promotion_summary', 'publication_summary', 'systems',
  ];
  if (!output || typeof output !== 'object' || Array.isArray(output)) return ['Operations v2 must be an object'];
  for (const key of topKeys) if (!Object.hasOwn(output, key)) errors.push(`missing Operations v2 field ${key}`);
  for (const key of Object.keys(output)) if (!topKeys.includes(key)) errors.push(`unexpected Operations v2 field ${key}`);
  if (output.schema_version !== 'calendar-operations-v2') errors.push('schema_version differs');
  if (!validDateTime(output.generated_at)) errors.push('generated_at invalid');
  if (output.mode !== 'read_only_control_plane_view') errors.push('mode differs');
  if (!REPO_REF_PATTERN.test(output.operations_v1_ref ?? '') || output.operations_v1_ref.includes('..')) errors.push('operations_v1_ref invalid');
  if (!exact(output.boundaries, BOUNDARIES)) errors.push('Operations v2 boundaries differ');
  const acquisition = output.acquisition_summary;
  if (!acquisition || !JOB_STATUSES.every((status) => Number.isInteger(acquisition.job_counts?.[status]) && acquisition.job_counts[status] >= 0)) errors.push('acquisition job counts invalid');
  else if (acquisition.recent_result_count !== acquisition.job_counts.success + acquisition.job_counts.partial + acquisition.job_counts.failure) errors.push('recent result count does not close');
  const retry = output.retry_summary;
  for (const key of ['entry_count', 'due_now_count', 'deferred_count', 'attempted_entry_count', 'attempt_limit_reached_count']) {
    if (!Number.isInteger(retry?.[key]) || retry[key] < 0) errors.push(`retry summary ${key} invalid`);
  }
  if (retry?.next_deferred_eligible_at !== null && !validDateTime(retry?.next_deferred_eligible_at)) errors.push('retry summary next deferred eligible time invalid');
  const publication = output.publication_summary;
  if (!publication || !PUBLICATION_STATES.includes(publication.state)) errors.push('publication summary state invalid');
  if (publication?.generated_at !== null && !validDateTime(publication?.generated_at)) errors.push('publication summary generated_at invalid');
  for (const key of ['meeting_count', 'detail_count']) {
    if (!Number.isInteger(publication?.[key]) || publication[key] < 0) errors.push(`publication summary ${key} invalid`);
  }
  if (typeof publication?.stale_for_current_window !== 'boolean') errors.push('publication summary stale flag invalid');

  if (!Array.isArray(output.systems)) errors.push('systems must be an array');
  else {
    const seen = new Set();
    for (const [index, row] of output.systems.entries()) {
      const profile = profileFor(registry, row.system_id);
      if (!profile) errors.push(`systems[${index}] Registry profile missing`);
      else {
        if (row.authority_id !== profile.authority_id) errors.push(`systems[${index}] authority differs`);
        if (row.primary_runner !== profile.primary_runner) errors.push(`systems[${index}] primary runner differs`);
      }
      if (!SOURCE_HEALTH.includes(row.source_health)) errors.push(`systems[${index}] source health invalid`);
      for (const key of ['retry_entry_count', 'retry_due_count', 'retry_deferred_count', 'retry_attempted_count', 'retry_attempt_limit_reached_count', 'retry_attempt_limit']) {
        if (!Number.isInteger(row[key]) || row[key] < 0) errors.push(`systems[${index}] ${key} invalid`);
      }
      if (row.retry_due_count + row.retry_deferred_count !== row.retry_entry_count) errors.push(`systems[${index}] retry due/deferred counts do not close`);
      if (row.retry_next_eligible_at !== null && !validDateTime(row.retry_next_eligible_at)) errors.push(`systems[${index}] retry next eligible time invalid`);
      if (!PUBLICATION_STATES.includes(row.publication_state)) errors.push(`systems[${index}] publication state invalid`);
      if (!Array.isArray(row.operator_attention) || row.operator_attention.length === 0) errors.push(`systems[${index}] operator attention invalid`);
      if (row.operator_attention?.includes('none') && row.operator_attention.length !== 1) errors.push(`systems[${index}] none attention must be exclusive`);
      if (seen.has(row.system_id)) errors.push(`duplicate system row ${row.system_id}`);
      seen.add(row.system_id);
    }
    if (seen.size !== registry.records.length) errors.push(`Operations v2 covers ${seen.size} of ${registry.records.length} Registry systems`);
  }
  return errors;
}

export const operationsV2V1Contract = Object.freeze({
  job_statuses: JOB_STATUSES,
  review_states: REVIEW_STATES,
  promotion_states: PROMOTION_STATES,
  ranks: RANKS,
  source_health_states: SOURCE_HEALTH,
  publication_states: PUBLICATION_STATES,
  boundaries: BOUNDARIES,
});
