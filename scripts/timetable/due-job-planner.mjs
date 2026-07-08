import { validateCollectionPlanV1 } from './collection-plan-validation.mjs';
import { validateRankAwareRetryQueueV1 } from './rank-aware-retry-queue-validation.mjs';

const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const SEASON_STATES = Object.freeze(['active', 'offseason', 'unknown']);
const SOURCE_HEALTH = Object.freeze(['healthy', 'degraded', 'unavailable']);
const BOUNDARY_KEYS = Object.freeze([
  'cadence_hours', 'artifact_only', 'jobs_executed', 'automatic_approval',
  'automatic_promotion', 'automatic_publication', 'automatic_deployment',
]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function hoursSince(asOf, previous) {
  if (previous === null) return Number.POSITIVE_INFINITY;
  return (Date.parse(asOf) - Date.parse(previous)) / 3600000;
}

function daysUntil(planningDate, futureDate) {
  if (futureDate === null) return Number.POSITIVE_INFINITY;
  return (Date.parse(`${futureDate}T00:00:00Z`) - Date.parse(`${planningDate}T00:00:00Z`)) / 86400000;
}

function profileFor(registry, systemId) {
  return registry?.records?.find((record) => record.system_id === systemId) ?? null;
}

function ruleFor(policy, systemId) {
  return policy?.system_rules?.find((rule) => rule.system_id === systemId) ?? null;
}

function stableSystemToken(systemId) {
  return systemId.replace(/-system$/, '');
}

function makeJob({ jobId, campaignId, systemId, mode, scope, rankStrategy, targetRank, reason, requestedAt, allowFallback = false }) {
  return {
    schema_version: 'calendar-collection-job-v1',
    job_id: jobId,
    campaign_id: campaignId,
    system_id: systemId,
    runner_policy: {
      mode: allowFallback ? 'registry_primary_or_fallback' : 'registry_primary',
      runner: null,
    },
    collection_mode: mode,
    requested_scope: scope,
    rank_strategy: rankStrategy,
    target_rank: targetRank,
    reason,
    requested_at: requestedAt,
  };
}

function splitDateWindow(gap, maxDays) {
  const windows = [];
  let cursor = gap.start_date;
  while (cursor < gap.end_date_exclusive) {
    const proposed = addDays(cursor, maxDays);
    const end = proposed < gap.end_date_exclusive ? proposed : gap.end_date_exclusive;
    windows.push({
      start_date: cursor,
      end_date_exclusive: end,
      timezone: gap.timezone,
    });
    cursor = end;
  }
  return windows;
}

function chunks(values, size) {
  const out = [];
  for (let index = 0; index < values.length; index += size) out.push(values.slice(index, index + size));
  return out;
}

function highestTargetRank(entries, profile) {
  let highest = 'C';
  for (const entry of entries) {
    const target = entry.collection_target_rank === 'best_available'
      ? profile.technical_capability_rank
      : entry.collection_target_rank;
    if (RANK_INDEX.get(target) > RANK_INDEX.get(highest)) highest = target;
  }
  return highest;
}

export function validateDueJobPolicyV1(policy, registry) {
  const errors = [];
  if (policy?.schema_version !== 'calendar-due-job-policy-v1') errors.push('policy schema_version differs');
  if (typeof policy?.policy_version !== 'string' || !ID_PATTERN.test(policy.policy_version)) errors.push('policy_version invalid');
  const scheduler = policy?.scheduler;
  if (!scheduler || !Number.isInteger(scheduler.cadence_hours) || scheduler.cadence_hours < 1) errors.push('scheduler cadence_hours invalid');
  if (!Number.isInteger(scheduler?.max_jobs_per_plan) || scheduler.max_jobs_per_plan < 1) errors.push('scheduler max_jobs_per_plan invalid');
  if (!Number.isInteger(scheduler?.artifact_retention_days) || scheduler.artifact_retention_days < 1) errors.push('scheduler artifact_retention_days invalid');
  for (const key of ['artifact_only']) if (scheduler?.[key] !== true) errors.push(`scheduler ${key} must be true`);
  for (const key of ['execute_jobs', 'automatic_approval', 'automatic_promotion', 'automatic_publication', 'automatic_deployment']) {
    if (scheduler?.[key] !== false) errors.push(`scheduler ${key} must be false`);
  }
  if (!Array.isArray(policy?.system_rules)) return [...errors, 'system_rules must be an array'];
  const seen = new Set();
  for (const [index, rule] of policy.system_rules.entries()) {
    const location = `system_rules[${index}]`;
    if (seen.has(rule.system_id)) errors.push(`duplicate policy system ${rule.system_id}`);
    seen.add(rule.system_id);
    const profile = profileFor(registry, rule.system_id);
    if (!profile) errors.push(`${location} Registry profile missing`);
    if (typeof rule.enabled !== 'boolean') errors.push(`${location}.enabled invalid`);
    for (const section of ['regular_refresh', 'coverage_gap', 'source_revalidation', 'rank_retry']) {
      if (!rule[section] || typeof rule[section].enabled !== 'boolean') errors.push(`${location}.${section} invalid`);
    }
    if (!Number.isInteger(rule.regular_refresh?.freshness_threshold_hours) || rule.regular_refresh.freshness_threshold_hours < 1) errors.push(`${location} freshness threshold invalid`);
    if (!Number.isInteger(rule.regular_refresh?.window_days) || rule.regular_refresh.window_days < 1) errors.push(`${location} regular window invalid`);
    if (!Number.isInteger(rule.coverage_gap?.max_window_days) || rule.coverage_gap.max_window_days < 1) errors.push(`${location} coverage max window invalid`);
    if (!Number.isInteger(rule.source_revalidation?.min_interval_hours) || rule.source_revalidation.min_interval_hours < 1) errors.push(`${location} revalidation interval invalid`);
    if (!Number.isInteger(rule.rank_retry?.max_selected_meetings_per_job) || rule.rank_retry.max_selected_meetings_per_job < 0) errors.push(`${location} retry batch limit invalid`);
    if (!Number.isInteger(rule.rank_retry?.max_attempt_count) || rule.rank_retry.max_attempt_count < 0) errors.push(`${location} retry attempt limit invalid`);
    if (rule.rank_retry?.enabled && profile && (!profile.supports_rank_upgrade_retry || !profile.supports_selected_meetings)) {
      errors.push(`${location} enables rank retry without Registry support`);
    }
  }
  return errors;
}

export function planDueJobsV1(policy, state, registry) {
  const policyErrors = validateDueJobPolicyV1(policy, registry);
  if (policyErrors.length) throw new Error(`invalid due-job policy: ${policyErrors.join('; ')}`);
  if (state?.schema_version !== 'calendar-due-job-planner-state-v1') throw new Error('planner state schema_version differs');
  if (!validDateTime(state.as_of)) throw new Error('planner state as_of invalid');
  if (!Array.isArray(state.system_states)) throw new Error('planner system_states must be an array');
  const retryErrors = validateRankAwareRetryQueueV1(state.retry_queue);
  if (retryErrors.length) throw new Error(`planner Retry Queue invalid: ${retryErrors.join('; ')}`);

  const planningDate = state.as_of.slice(0, 10);
  const campaignId = `scheduled-planning-${planningDate}`;
  const planId = `due-job-plan-${planningDate}`;
  const jobs = [];
  const decisions = [];
  const jobIds = new Set();

  function addJob(job, trigger, detail) {
    if (jobIds.has(job.job_id)) throw new Error(`duplicate generated job_id ${job.job_id}`);
    jobIds.add(job.job_id);
    jobs.push(job);
    decisions.push({ system_id: job.system_id, trigger, disposition: 'job_planned', job_id: job.job_id, detail });
  }

  for (const systemState of state.system_states) {
    const profile = profileFor(registry, systemState.system_id);
    if (!profile) throw new Error(`planner state Registry profile missing for ${systemState.system_id}`);
    const rule = ruleFor(policy, systemState.system_id);
    if (!rule || !rule.enabled) {
      decisions.push({ system_id: systemState.system_id, trigger: 'policy_disabled', disposition: 'excluded', job_id: null, detail: 'Due-job policy is disabled or absent for this system.' });
      continue;
    }
    if (!SEASON_STATES.includes(systemState.season_state)) throw new Error(`season_state invalid for ${systemState.system_id}`);
    if (!SOURCE_HEALTH.includes(systemState.source_health)) throw new Error(`source_health invalid for ${systemState.system_id}`);
    if (systemState.season_state !== 'active') {
      decisions.push({ system_id: systemState.system_id, trigger: 'season_inactive', disposition: 'not_due', job_id: null, detail: `Season state is ${systemState.season_state}; regular due-job generation is suppressed.` });
      continue;
    }

    const token = stableSystemToken(systemState.system_id);
    const startDate = addDays(planningDate, 1);
    const regularEnd = addDays(startDate, rule.regular_refresh.window_days);

    if (systemState.source_health !== 'healthy') {
      const revalidationAge = hoursSince(state.as_of, systemState.last_source_revalidation_at);
      if (rule.source_revalidation.enabled && revalidationAge >= rule.source_revalidation.min_interval_hours && profile.supports_date_window) {
        const end = addDays(startDate, rule.source_revalidation.window_days);
        addJob(makeJob({
          jobId: `due-${token}-source-revalidation-001`,
          campaignId,
          systemId: systemState.system_id,
          mode: 'date_window',
          scope: { start_date: startDate, end_date_exclusive: end, timezone: systemState.timezone },
          rankStrategy: 'best_available',
          targetRank: null,
          reason: 'source_revalidation',
          requestedAt: state.as_of,
        }), 'source_health', `Source health is ${systemState.source_health}; bounded revalidation interval is due.`);
      } else {
        decisions.push({ system_id: systemState.system_id, trigger: 'source_health', disposition: 'not_due', job_id: null, detail: `Source health is ${systemState.source_health}, but revalidation is not eligible yet or date-window capability is unavailable.` });
      }
      continue;
    }

    if (rule.coverage_gap.enabled) {
      let gapIndex = 0;
      for (const gap of systemState.coverage_gaps ?? []) {
        for (const scope of splitDateWindow(gap, rule.coverage_gap.max_window_days)) {
          gapIndex += 1;
          addJob(makeJob({
            jobId: `due-${token}-coverage-gap-${String(gapIndex).padStart(3, '0')}`,
            campaignId,
            systemId: systemState.system_id,
            mode: 'date_window',
            scope,
            rankStrategy: 'best_available',
            targetRank: null,
            reason: 'coverage_gap',
            requestedAt: state.as_of,
          }), 'coverage_gap', `Explicit coverage gap ${scope.start_date}..${scope.end_date_exclusive} is due.`);
        }
      }
    }

    if (rule.rank_retry.enabled) {
      const eligible = state.retry_queue.entries.filter((entry) =>
        entry.system_id === systemState.system_id
        && entry.attempt_count < rule.rank_retry.max_attempt_count
        && (entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= Date.parse(state.as_of)));
      const groups = chunks(eligible, rule.rank_retry.max_selected_meetings_per_job);
      groups.forEach((group, index) => {
        if (group.length === 0) return;
        const targetRank = highestTargetRank(group, profile);
        addJob(makeJob({
          jobId: `due-${token}-rank-retry-${String(index + 1).padStart(3, '0')}`,
          campaignId,
          systemId: systemState.system_id,
          mode: 'selected_meetings',
          scope: { meeting_ids: group.map((entry) => entry.meeting_id).sort() },
          rankStrategy: 'target_rank',
          targetRank,
          reason: 'rank_upgrade_retry',
          requestedAt: state.as_of,
          allowFallback: profile.fallback_runner !== null,
        }), 'rank_retry', `${group.length} retry target(s) are eligible after backoff and attempt limits.`);
      });
    }

    let horizonPlanned = false;
    if (rule.regular_refresh.enabled
      && profile.supports_source_visible_horizon
      && systemState.source_visible_horizon_end_exclusive !== null
      && validDate(systemState.source_visible_horizon_end_exclusive)) {
      const horizonThreshold = addDays(regularEnd, rule.regular_refresh.horizon_buffer_days);
      if (systemState.source_visible_horizon_end_exclusive < horizonThreshold && startDate < systemState.source_visible_horizon_end_exclusive) {
        addJob(makeJob({
          jobId: `due-${token}-source-horizon-001`,
          campaignId,
          systemId: systemState.system_id,
          mode: 'source_visible_horizon',
          scope: {
            start_date: startDate,
            end_date_exclusive: systemState.source_visible_horizon_end_exclusive,
            timezone: systemState.timezone,
          },
          rankStrategy: 'best_available',
          targetRank: null,
          reason: 'regular_refresh',
          requestedAt: state.as_of,
        }), 'source_horizon', `Visible source horizon ends before the policy lookahead plus ${rule.regular_refresh.horizon_buffer_days}-day buffer.`);
        horizonPlanned = true;
      }
    }

    const freshnessAge = hoursSince(state.as_of, systemState.last_successful_collection_at);
    const proximityDays = daysUntil(planningDate, systemState.next_meeting_date);
    const stale = freshnessAge >= rule.regular_refresh.freshness_threshold_hours;
    const proximityDue = proximityDays >= 0
      && proximityDays <= rule.regular_refresh.meeting_proximity_days
      && freshnessAge >= rule.regular_refresh.proximity_min_age_hours;
    if (rule.regular_refresh.enabled && profile.supports_date_window && !horizonPlanned && (stale || proximityDue)) {
      addJob(makeJob({
        jobId: `due-${token}-regular-refresh-001`,
        campaignId,
        systemId: systemState.system_id,
        mode: 'date_window',
        scope: { start_date: startDate, end_date_exclusive: regularEnd, timezone: systemState.timezone },
        rankStrategy: 'best_available',
        targetRank: null,
        reason: 'regular_refresh',
        requestedAt: state.as_of,
      }), 'regular_refresh', `Regular refresh due: stale=${stale}, meeting_proximity_due=${proximityDue}, age_hours=${Math.floor(freshnessAge)}.`);
    }

    if (!decisions.some((decision) => decision.system_id === systemState.system_id)) {
      decisions.push({ system_id: systemState.system_id, trigger: 'not_due', disposition: 'not_due', job_id: null, detail: 'No policy trigger is currently due.' });
    }
  }

  if (jobs.length > policy.scheduler.max_jobs_per_plan) {
    throw new Error(`planned ${jobs.length} jobs exceeds policy max ${policy.scheduler.max_jobs_per_plan}`);
  }

  const collectionPlan = {
    schema_version: 'calendar-collection-plan-v1',
    plan_id: planId,
    campaign_id: campaignId,
    created_at: state.as_of,
    jobs,
  };
  const planErrors = validateCollectionPlanV1(collectionPlan, registry);
  if (planErrors.length) throw new Error(`generated Collection Plan invalid: ${planErrors.join('; ')}`);

  const duePlan = {
    schema_version: 'calendar-due-job-plan-v1',
    policy_version: policy.policy_version,
    generated_at: state.as_of,
    planning_date: planningDate,
    collection_plan: collectionPlan,
    decisions,
    scheduler_boundary: {
      cadence_hours: policy.scheduler.cadence_hours,
      artifact_only: true,
      jobs_executed: false,
      automatic_approval: false,
      automatic_promotion: false,
      automatic_publication: false,
      automatic_deployment: false,
    },
  };
  const dueErrors = validateDueJobPlanV1(duePlan, policy, registry);
  if (dueErrors.length) throw new Error(`due-job plan invalid: ${dueErrors.join('; ')}`);
  return duePlan;
}

export function validateDueJobPlanV1(plan, policy, registry) {
  const errors = [];
  const topKeys = ['schema_version', 'policy_version', 'generated_at', 'planning_date', 'collection_plan', 'decisions', 'scheduler_boundary'];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return ['due-job plan must be an object'];
  for (const key of topKeys) if (!Object.hasOwn(plan, key)) errors.push(`missing due-job plan field ${key}`);
  for (const key of Object.keys(plan)) if (!topKeys.includes(key)) errors.push(`unexpected due-job plan field ${key}`);
  if (plan.schema_version !== 'calendar-due-job-plan-v1') errors.push('due-job plan schema_version differs');
  if (plan.policy_version !== policy?.policy_version) errors.push('due-job plan policy_version differs');
  if (!validDateTime(plan.generated_at)) errors.push('due-job plan generated_at invalid');
  if (!validDate(plan.planning_date)) errors.push('due-job plan planning_date invalid');
  if (plan.planning_date !== plan.generated_at?.slice(0, 10)) errors.push('planning_date must equal generated_at UTC date');

  const collectionErrors = validateCollectionPlanV1(plan.collection_plan, registry);
  if (collectionErrors.length) errors.push(...collectionErrors.map((error) => `collection_plan: ${error}`));
  if ((plan.collection_plan?.jobs?.length ?? Number.POSITIVE_INFINITY) > policy?.scheduler?.max_jobs_per_plan) errors.push('collection plan exceeds policy max jobs');
  if (!Array.isArray(plan.decisions)) errors.push('decisions must be an array');
  const jobIds = new Set((plan.collection_plan?.jobs ?? []).map((job) => job.job_id));
  const plannedDecisionIds = new Set();
  for (const decision of plan.decisions ?? []) {
    if (decision.disposition === 'job_planned') {
      if (!jobIds.has(decision.job_id)) errors.push(`decision references unknown job ${decision.job_id}`);
      if (plannedDecisionIds.has(decision.job_id)) errors.push(`job has duplicate planned decisions ${decision.job_id}`);
      plannedDecisionIds.add(decision.job_id);
    } else if (decision.job_id !== null) {
      errors.push(`non-planned decision must have null job_id for ${decision.system_id}`);
    }
  }
  for (const jobId of jobIds) if (!plannedDecisionIds.has(jobId)) errors.push(`generated job lacks planned decision ${jobId}`);

  const boundary = plan.scheduler_boundary;
  if (!boundary || !BOUNDARY_KEYS.every((key) => Object.hasOwn(boundary, key)) || Object.keys(boundary ?? {}).some((key) => !BOUNDARY_KEYS.includes(key))) {
    errors.push('scheduler boundary fields differ');
  } else {
    if (boundary.cadence_hours !== policy.scheduler.cadence_hours) errors.push('scheduler cadence differs from policy');
    if (boundary.artifact_only !== true) errors.push('scheduler artifact_only must be true');
    for (const key of ['jobs_executed', 'automatic_approval', 'automatic_promotion', 'automatic_publication', 'automatic_deployment']) {
      if (boundary[key] !== false) errors.push(`scheduler ${key} must be false`);
    }
  }
  return errors;
}

export function summarizeDueJobPlanV1(plan) {
  const summary = {
    job_count: plan.collection_plan.jobs.length,
    by_reason: {
      regular_refresh: 0,
      coverage_gap: 0,
      rank_upgrade_retry: 0,
      source_revalidation: 0,
      manual_recovery: 0,
      completion_audit_support: 0,
    },
    by_system: {},
    planned_decision_count: 0,
    not_due_decision_count: 0,
    excluded_decision_count: 0,
  };
  for (const job of plan.collection_plan.jobs) {
    summary.by_reason[job.reason] += 1;
    summary.by_system[job.system_id] = (summary.by_system[job.system_id] ?? 0) + 1;
  }
  for (const decision of plan.decisions) {
    if (decision.disposition === 'job_planned') summary.planned_decision_count += 1;
    else if (decision.disposition === 'not_due') summary.not_due_decision_count += 1;
    else summary.excluded_decision_count += 1;
  }
  return summary;
}

export const dueJobPlannerV1Contract = Object.freeze({
  ranks: RANKS,
  season_states: SEASON_STATES,
  source_health_states: SOURCE_HEALTH,
  boundary_keys: BOUNDARY_KEYS,
});
