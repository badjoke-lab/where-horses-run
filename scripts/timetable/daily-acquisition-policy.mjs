const POLICY_SCHEMA = 'calendar-daily-acquisition-policy-v1';
const ACTIONS_PLAN_SCHEMA = 'calendar-actions-multi-job-plan-v1';
const DUE_PLAN_SCHEMA = 'calendar-due-job-plan-v1';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REASONS = new Set([
  'regular_refresh',
  'coverage_gap',
  'rank_upgrade_retry',
  'source_revalidation',
  'manual_recovery',
  'completion_audit_support',
]);
const MODES = new Set(['date_window', 'single_date', 'selected_meetings', 'source_visible_horizon']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, required, location, errors) {
  if (!isObject(value)) {
    errors.push(`${location} must be an object`);
    return false;
  }
  for (const key of required) if (!Object.hasOwn(value, key)) errors.push(`${location}.${key} is required`);
  for (const key of Object.keys(value)) if (!required.includes(key)) errors.push(`${location}.${key} is not allowed`);
  return true;
}

function uniqueStrings(value, location, errors, allowed = null) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${location} must be a non-empty array`);
    return;
  }
  const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') errors.push(`${location}[${index}] must be a non-empty string`);
    else if (allowed && !allowed.has(entry)) errors.push(`${location}[${index}] is unsupported`);
    if (seen.has(entry)) errors.push(`${location} must not contain duplicates`);
    seen.add(entry);
  });
}

export function validateDailyAcquisitionPolicyV1(policy) {
  const errors = [];
  if (!exactKeys(policy, ['schema_version', 'policy_version', 'enabled', 'planner', 'execution'], 'policy', errors)) return errors;
  if (policy.schema_version !== POLICY_SCHEMA) errors.push('policy schema_version differs');
  if (typeof policy.policy_version !== 'string' || !ID_PATTERN.test(policy.policy_version)) errors.push('policy_version invalid');
  if (policy.enabled !== true) errors.push('daily acquisition policy must be enabled');

  if (exactKeys(policy.planner, ['due_job_policy_path', 'require_artifact_only_plan'], 'planner', errors)) {
    if (policy.planner.due_job_policy_path !== 'data/static/calendar-due-job-policy-v1.json') errors.push('planner due_job_policy_path differs');
    if (policy.planner.require_artifact_only_plan !== true) errors.push('planner must require artifact-only Due-job Plan');
  }

  const executionKeys = [
    'execute_hosted_jobs',
    'allowed_runner',
    'automatic_approval',
    'automatic_promotion',
    'automatic_publication',
    'automatic_merge',
    'automatic_deployment',
    'systems',
  ];
  if (!exactKeys(policy.execution, executionKeys, 'execution', errors)) return errors;
  if (policy.execution.execute_hosted_jobs !== true) errors.push('execute_hosted_jobs must be true');
  if (policy.execution.allowed_runner !== 'github_actions') errors.push('allowed_runner must be github_actions');
  for (const key of ['automatic_approval', 'automatic_promotion', 'automatic_publication', 'automatic_merge', 'automatic_deployment']) {
    if (policy.execution[key] !== false) errors.push(`${key} must be false`);
  }
  if (!Array.isArray(policy.execution.systems) || policy.execution.systems.length === 0) {
    errors.push('execution.systems must be a non-empty array');
    return errors;
  }

  const seen = new Set();
  policy.execution.systems.forEach((entry, index) => {
    const location = `execution.systems[${index}]`;
    if (!exactKeys(entry, ['system_id', 'allowed_reasons', 'allowed_collection_modes', 'allowed_executors'], location, errors)) return;
    if (typeof entry.system_id !== 'string' || !ID_PATTERN.test(entry.system_id)) errors.push(`${location}.system_id invalid`);
    if (seen.has(entry.system_id)) errors.push(`duplicate daily acquisition system ${entry.system_id}`);
    seen.add(entry.system_id);
    uniqueStrings(entry.allowed_reasons, `${location}.allowed_reasons`, errors, REASONS);
    uniqueStrings(entry.allowed_collection_modes, `${location}.allowed_collection_modes`, errors, MODES);
    uniqueStrings(entry.allowed_executors, `${location}.allowed_executors`, errors);
  });
  return errors;
}

function permissionFor(policy, systemId) {
  return policy.execution.systems.find((entry) => entry.system_id === systemId) ?? null;
}

export function validateDailyActionsPlanV1(policy, duePlan, actionsPlan) {
  const errors = validateDailyAcquisitionPolicyV1(policy);
  if (duePlan?.schema_version !== DUE_PLAN_SCHEMA) errors.push('Due-job Plan schema differs');
  if (actionsPlan?.schema_version !== ACTIONS_PLAN_SCHEMA) errors.push('Actions Plan schema differs');
  if (errors.length) return errors;

  const boundary = duePlan.scheduler_boundary;
  if (policy.planner.require_artifact_only_plan) {
    if (boundary?.artifact_only !== true || boundary?.jobs_executed !== false) errors.push('Due-job Plan must remain planning-only');
    for (const key of ['automatic_approval', 'automatic_promotion', 'automatic_publication', 'automatic_deployment']) {
      if (boundary?.[key] !== false) errors.push(`Due-job Plan ${key} must remain false`);
    }
  }
  if (actionsPlan.plan_id !== duePlan.collection_plan?.plan_id) errors.push('Actions Plan plan_id differs from Due-job Collection Plan');
  if (actionsPlan.campaign_id !== duePlan.collection_plan?.campaign_id) errors.push('Actions Plan campaign_id differs from Due-job Collection Plan');

  const dueJobs = new Map((duePlan.collection_plan?.jobs ?? []).map((job) => [job.job_id, job]));
  const accounted = new Set();
  for (const item of actionsPlan.jobs ?? []) {
    const execution = item.execution;
    const dueJob = dueJobs.get(item.job_id);
    if (!dueJob) {
      errors.push(`hosted Job ${item.job_id} is absent from Due-job Plan`);
      continue;
    }
    accounted.add(item.job_id);
    const permission = permissionFor(policy, execution?.system_id);
    if (!permission) {
      errors.push(`system ${execution?.system_id} is not authorized for daily hosted execution`);
      continue;
    }
    if (execution.runner_used !== policy.execution.allowed_runner) errors.push(`${item.job_id} runner is not authorized`);
    if (!permission.allowed_reasons.includes(execution.reason)) errors.push(`${item.job_id} reason ${execution.reason} is not authorized`);
    if (!permission.allowed_collection_modes.includes(execution.collection_mode)) errors.push(`${item.job_id} mode ${execution.collection_mode} is not authorized`);
    if (!permission.allowed_executors.includes(execution.executor_id)) errors.push(`${item.job_id} executor ${execution.executor_id} is not authorized`);
    if (dueJob.system_id !== execution.system_id || dueJob.reason !== execution.reason || dueJob.collection_mode !== execution.collection_mode) {
      errors.push(`${item.job_id} execution identity differs from Due-job Job`);
    }
  }

  for (const excluded of actionsPlan.excluded ?? []) {
    if (!dueJobs.has(excluded.job_id)) errors.push(`excluded Job ${excluded.job_id} is absent from Due-job Plan`);
    accounted.add(excluded.job_id);
  }
  for (const jobId of dueJobs.keys()) if (!accounted.has(jobId)) errors.push(`Due-job Job ${jobId} is not accounted for by Actions Plan`);
  return errors;
}

export const dailyAcquisitionPolicyV1Contract = Object.freeze({
  policy_schema: POLICY_SCHEMA,
  actions_plan_schema: ACTIONS_PLAN_SCHEMA,
  due_plan_schema: DUE_PLAN_SCHEMA,
});
