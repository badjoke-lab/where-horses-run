import { validateReviewQueueV1 } from './review-queue-validation.mjs';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const COHORT_KINDS = Object.freeze(['candidate_review', 'coverage_review', 'source_failure_review']);
const DISPLAY_RISKS = Object.freeze(['meeting_only', 'time_summary', 'race_timetable', 'programme_summary', 'none']);
const PROMOTION_DEPENDENCIES = Object.freeze([
  'promotion_validation_required',
  'coverage_review_required',
  'source_recovery_required',
  'public_ceiling_projection_required',
]);
const EXCLUSION_REASONS = Object.freeze(['already_reviewing', 'already_reviewed_or_promoted', 'rejected']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REPO_REF_PATTERN = /^(?:data|docs)\/[A-Za-z0-9_./+-]+$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function zeroRankCounts() {
  return { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 };
}

function addRankCounts(target, source) {
  for (const rank of RANKS) target[rank] += source[rank];
}

function highestObservedRank(rankCounts) {
  for (let index = RANKS.length - 1; index >= 0; index -= 1) {
    const rank = RANKS[index];
    if ((rankCounts?.[rank] ?? 0) > 0) return rank;
  }
  return null;
}

function displayRiskForRank(rank) {
  if (rank === null) return 'none';
  if (rank === 'C') return 'meeting_only';
  if (rank === 'B' || rank === 'B+') return 'time_summary';
  if (rank === 'A') return 'race_timetable';
  return 'programme_summary';
}

function profileFor(registry, systemId) {
  return registry?.records?.find((record) => record.system_id === systemId) ?? null;
}

function excludedReason(entry) {
  if (entry.review_state === 'reviewing') return 'already_reviewing';
  if (entry.review_state === 'rejected') return 'rejected';
  if (entry.review_state === 'approved' || entry.promotion_state !== 'not_ready') return 'already_reviewed_or_promoted';
  return null;
}

export function classifyReviewQueueEntryForCohortV1(entry, profile) {
  if (!profile) throw new Error(`Acquisition Registry profile missing for ${entry.system_id}`);
  const highestRank = highestObservedRank(entry.rank_counts);
  const publicDisplayRisk = displayRiskForRank(highestRank);
  const hasCoverageGap = entry.coverage_claim === 'partial'
    || entry.unresolved_dates_count > 0
    || entry.unresolved_meeting_ids_count > 0;
  const hasSourceFailure = entry.source_error_count > 0 || entry.coverage_claim === 'none';
  const exceedsPublicCeiling = highestRank !== null
    && RANK_INDEX.get(highestRank) > RANK_INDEX.get(profile.public_ceiling);

  let cohortKind = 'candidate_review';
  let promotionDependency = 'promotion_validation_required';
  if (hasSourceFailure) {
    cohortKind = 'source_failure_review';
    promotionDependency = 'source_recovery_required';
  } else if (hasCoverageGap) {
    cohortKind = 'coverage_review';
    promotionDependency = exceedsPublicCeiling
      ? 'public_ceiling_projection_required'
      : 'coverage_review_required';
  } else if (exceedsPublicCeiling) {
    promotionDependency = 'public_ceiling_projection_required';
  }

  return {
    cohort_kind: cohortKind,
    public_display_risk: publicDisplayRisk,
    promotion_dependency: promotionDependency,
    schedule_source_id: profile.schedule_source_id,
    detail_source_id: profile.detail_source_id,
    authority_id: profile.authority_id,
    public_ceiling: profile.public_ceiling,
  };
}

function groupingKey(entry, classification) {
  return [
    entry.system_id,
    classification.schedule_source_id,
    classification.detail_source_id ?? 'none',
    classification.cohort_kind,
    classification.public_display_risk,
    classification.promotion_dependency,
  ].join('|');
}

function batchRef(entry) {
  return {
    campaign_id: entry.campaign_id,
    job_id: entry.job_id,
    batch_id: entry.batch_id,
    manifest_ref: entry.manifest_ref,
    coverage_claim: entry.coverage_claim,
    rank_counts: structuredClone(entry.rank_counts),
    unresolved_dates_count: entry.unresolved_dates_count,
    unresolved_meeting_ids_count: entry.unresolved_meeting_ids_count,
    source_error_count: entry.source_error_count,
  };
}

function proposalTitle(cohortKind, systemId, batchCount, risk) {
  const kindLabel = cohortKind === 'candidate_review'
    ? 'candidate review'
    : cohortKind === 'coverage_review'
      ? 'coverage review'
      : 'source failure review';
  return `Calendar ${kindLabel}: ${systemId} (${batchCount} ${batchCount === 1 ? 'batch' : 'batches'}, ${risk.replaceAll('_', ' ')})`;
}

export function planReviewCohortsV1(queue, registry, { generated_at: generatedAt = queue?.generated_at } = {}) {
  const queueErrors = validateReviewQueueV1(queue);
  if (queueErrors.length) throw new Error(`invalid Review Queue: ${queueErrors.join('; ')}`);
  if (!validDateTime(generatedAt)) throw new Error('generated_at must be a valid ISO date-time');

  const excluded = [];
  const groups = new Map();
  for (const entry of queue.entries) {
    const reason = excludedReason(entry);
    if (reason) {
      excluded.push({
        campaign_id: entry.campaign_id,
        job_id: entry.job_id,
        batch_id: entry.batch_id,
        system_id: entry.system_id,
        reason,
      });
      continue;
    }
    if (entry.review_state !== 'review_ready') {
      throw new Error(`unsupported review state for cohort planning: ${entry.review_state}`);
    }
    const profile = profileFor(registry, entry.system_id);
    const classification = classifyReviewQueueEntryForCohortV1(entry, profile);
    const key = groupingKey(entry, classification);
    if (!groups.has(key)) groups.set(key, { classification, system_id: entry.system_id, entries: [] });
    groups.get(key).entries.push(entry);
  }

  const cohorts = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group], index) => {
      const entries = [...group.entries].sort((left, right) => left.batch_id.localeCompare(right.batch_id));
      const rankCounts = zeroRankCounts();
      let unresolvedDates = 0;
      let unresolvedMeetings = 0;
      let sourceErrors = 0;
      for (const entry of entries) {
        addRankCounts(rankCounts, entry.rank_counts);
        unresolvedDates += entry.unresolved_dates_count;
        unresolvedMeetings += entry.unresolved_meeting_ids_count;
        sourceErrors += entry.source_error_count;
      }
      const classification = group.classification;
      return {
        cohort_id: `review-cohort-${String(index + 1).padStart(3, '0')}`,
        cohort_kind: classification.cohort_kind,
        system_id: group.system_id,
        authority_id: classification.authority_id,
        schedule_source_id: classification.schedule_source_id,
        detail_source_id: classification.detail_source_id,
        public_ceiling: classification.public_ceiling,
        public_display_risk: classification.public_display_risk,
        promotion_dependency: classification.promotion_dependency,
        batch_count: entries.length,
        rank_counts: rankCounts,
        unresolved_dates_count: unresolvedDates,
        unresolved_meeting_ids_count: unresolvedMeetings,
        source_error_count: sourceErrors,
        batches: entries.map(batchRef),
        proposal: {
          title: proposalTitle(classification.cohort_kind, group.system_id, entries.length, classification.public_display_risk),
          review_label: 'human review required',
          human_review_required: true,
          automatic_approval: false,
          automatic_promotion: false,
        },
      };
    });

  excluded.sort((left, right) => left.batch_id.localeCompare(right.batch_id));
  const plan = {
    schema_version: 'calendar-review-cohort-plan-v1',
    generated_at: generatedAt,
    source_queue_generated_at: queue.generated_at,
    cohorts,
    excluded,
  };
  const errors = validateReviewCohortPlanV1(plan, queue, registry);
  if (errors.length) throw new Error(`Review Cohort Plan invalid: ${errors.join('; ')}`);
  return plan;
}

function checkExactKeys(value, allowed, location, errors) {
  if (!isObject(value)) {
    errors.push(`${location} must be an object`);
    return false;
  }
  for (const key of allowed) if (!Object.hasOwn(value, key)) errors.push(`${location}.${key} is required`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${location}.${key} is not allowed`);
  return true;
}

export function validateReviewCohortPlanV1(plan, queue, registry) {
  const errors = [];
  const topKeys = ['schema_version', 'generated_at', 'source_queue_generated_at', 'cohorts', 'excluded'];
  if (!checkExactKeys(plan, topKeys, 'plan', errors)) return errors;
  if (plan.schema_version !== 'calendar-review-cohort-plan-v1') errors.push('plan schema_version differs');
  if (!validDateTime(plan.generated_at)) errors.push('generated_at must be a valid ISO date-time');
  if (!validDateTime(plan.source_queue_generated_at)) errors.push('source_queue_generated_at must be a valid ISO date-time');
  if (queue && plan.source_queue_generated_at !== queue.generated_at) errors.push('source_queue_generated_at must match Review Queue');
  if (!Array.isArray(plan.cohorts)) errors.push('cohorts must be an array');
  if (!Array.isArray(plan.excluded)) errors.push('excluded must be an array');
  if (errors.length) return errors;

  const queueByBatch = new Map((queue?.entries ?? []).map((entry) => [entry.batch_id, entry]));
  const accounted = new Set();
  const cohortIds = new Set();
  for (const [index, cohort] of plan.cohorts.entries()) {
    const location = `cohorts[${index}]`;
    const keys = [
      'cohort_id', 'cohort_kind', 'system_id', 'authority_id', 'schedule_source_id', 'detail_source_id',
      'public_ceiling', 'public_display_risk', 'promotion_dependency', 'batch_count', 'rank_counts',
      'unresolved_dates_count', 'unresolved_meeting_ids_count', 'source_error_count', 'batches', 'proposal',
    ];
    if (!checkExactKeys(cohort, keys, location, errors)) continue;
    if (!ID_PATTERN.test(cohort.cohort_id ?? '')) errors.push(`${location}.cohort_id invalid`);
    if (cohortIds.has(cohort.cohort_id)) errors.push(`duplicate cohort_id ${cohort.cohort_id}`);
    cohortIds.add(cohort.cohort_id);
    if (!COHORT_KINDS.includes(cohort.cohort_kind)) errors.push(`${location}.cohort_kind unsupported`);
    if (!DISPLAY_RISKS.includes(cohort.public_display_risk)) errors.push(`${location}.public_display_risk unsupported`);
    if (!PROMOTION_DEPENDENCIES.includes(cohort.promotion_dependency)) errors.push(`${location}.promotion_dependency unsupported`);
    if (!Array.isArray(cohort.batches) || cohort.batches.length === 0) {
      errors.push(`${location}.batches must be non-empty`);
      continue;
    }
    if (cohort.batch_count !== cohort.batches.length) errors.push(`${location}.batch_count differs from batches length`);

    const profile = profileFor(registry, cohort.system_id);
    if (!profile) errors.push(`${location} Registry profile missing for ${cohort.system_id}`);
    else {
      if (cohort.authority_id !== profile.authority_id) errors.push(`${location}.authority_id differs from Registry`);
      if (cohort.schedule_source_id !== profile.schedule_source_id) errors.push(`${location}.schedule_source_id differs from Registry`);
      if (cohort.detail_source_id !== profile.detail_source_id) errors.push(`${location}.detail_source_id differs from Registry`);
      if (cohort.public_ceiling !== profile.public_ceiling) errors.push(`${location}.public_ceiling differs from Registry`);
    }

    const aggregateRanks = zeroRankCounts();
    let aggregateDates = 0;
    let aggregateMeetings = 0;
    let aggregateErrors = 0;
    for (const [batchIndex, batch] of cohort.batches.entries()) {
      const batchLocation = `${location}.batches[${batchIndex}]`;
      if (!REPO_REF_PATTERN.test(batch?.manifest_ref ?? '') || batch.manifest_ref.includes('..')) errors.push(`${batchLocation}.manifest_ref invalid`);
      const queueEntry = queueByBatch.get(batch?.batch_id);
      if (!queueEntry) {
        errors.push(`${batchLocation} batch missing from Review Queue`);
        continue;
      }
      if (accounted.has(batch.batch_id)) errors.push(`batch accounted more than once: ${batch.batch_id}`);
      accounted.add(batch.batch_id);
      const expectedBatch = batchRef(queueEntry);
      if (!exact(batch, expectedBatch)) errors.push(`${batchLocation} differs from Review Queue entry`);
      if (queueEntry.review_state !== 'review_ready') errors.push(`${batchLocation} must reference review_ready entry`);
      if (profile) {
        const classification = classifyReviewQueueEntryForCohortV1(queueEntry, profile);
        if (classification.cohort_kind !== cohort.cohort_kind
          || classification.public_display_risk !== cohort.public_display_risk
          || classification.promotion_dependency !== cohort.promotion_dependency) {
          errors.push(`${batchLocation} classification differs from cohort grouping key`);
        }
      }
      addRankCounts(aggregateRanks, batch.rank_counts);
      aggregateDates += batch.unresolved_dates_count;
      aggregateMeetings += batch.unresolved_meeting_ids_count;
      aggregateErrors += batch.source_error_count;
    }
    if (!exact(aggregateRanks, cohort.rank_counts)) errors.push(`${location}.rank_counts aggregate differs`);
    if (aggregateDates !== cohort.unresolved_dates_count) errors.push(`${location}.unresolved_dates_count aggregate differs`);
    if (aggregateMeetings !== cohort.unresolved_meeting_ids_count) errors.push(`${location}.unresolved_meeting_ids_count aggregate differs`);
    if (aggregateErrors !== cohort.source_error_count) errors.push(`${location}.source_error_count aggregate differs`);

    const proposalKeys = ['title', 'review_label', 'human_review_required', 'automatic_approval', 'automatic_promotion'];
    if (checkExactKeys(cohort.proposal, proposalKeys, `${location}.proposal`, errors)) {
      if (cohort.proposal.review_label !== 'human review required') errors.push(`${location}.proposal.review_label differs`);
      if (cohort.proposal.human_review_required !== true) errors.push(`${location}.proposal.human_review_required must be true`);
      if (cohort.proposal.automatic_approval !== false) errors.push(`${location}.proposal.automatic_approval must be false`);
      if (cohort.proposal.automatic_promotion !== false) errors.push(`${location}.proposal.automatic_promotion must be false`);
    }
  }

  for (const [index, excluded] of plan.excluded.entries()) {
    const location = `excluded[${index}]`;
    const keys = ['campaign_id', 'job_id', 'batch_id', 'system_id', 'reason'];
    if (!checkExactKeys(excluded, keys, location, errors)) continue;
    if (!EXCLUSION_REASONS.includes(excluded.reason)) errors.push(`${location}.reason unsupported`);
    const entry = queueByBatch.get(excluded.batch_id);
    if (!entry) {
      errors.push(`${location} batch missing from Review Queue`);
      continue;
    }
    if (accounted.has(excluded.batch_id)) errors.push(`batch accounted more than once: ${excluded.batch_id}`);
    accounted.add(excluded.batch_id);
    const expected = {
      campaign_id: entry.campaign_id,
      job_id: entry.job_id,
      batch_id: entry.batch_id,
      system_id: entry.system_id,
      reason: excludedReason(entry),
    };
    if (!exact(excluded, expected)) errors.push(`${location} exclusion differs from Review Queue state`);
  }

  if (queue && accounted.size !== queue.entries.length) errors.push(`plan accounts for ${accounted.size} of ${queue.entries.length} Review Queue entries`);
  return errors;
}

export function summarizeReviewCohortPlanV1(plan) {
  const summary = {
    cohort_count: plan.cohorts.length,
    excluded_count: plan.excluded.length,
    batch_count: 0,
    by_kind: Object.fromEntries(COHORT_KINDS.map((kind) => [kind, 0])),
    by_display_risk: Object.fromEntries(DISPLAY_RISKS.map((risk) => [risk, 0])),
    by_promotion_dependency: Object.fromEntries(PROMOTION_DEPENDENCIES.map((dependency) => [dependency, 0])),
  };
  for (const cohort of plan.cohorts) {
    summary.batch_count += cohort.batch_count;
    summary.by_kind[cohort.cohort_kind] += 1;
    summary.by_display_risk[cohort.public_display_risk] += 1;
    summary.by_promotion_dependency[cohort.promotion_dependency] += 1;
  }
  return summary;
}

export const reviewCohortPlannerV1Contract = Object.freeze({
  ranks: RANKS,
  cohort_kinds: COHORT_KINDS,
  display_risks: DISPLAY_RISKS,
  promotion_dependencies: PROMOTION_DEPENDENCIES,
  exclusion_reasons: EXCLUSION_REASONS,
});
