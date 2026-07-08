import { validateCollectionPlanV1, summarizeCollectionPlanOutcomesV1 } from './collection-plan-validation.mjs';
import { compileRunnerExecutionV1, resolveRunnerForJobV1 } from './runner-compatibility.mjs';

const PLAN_SCHEMA_VERSION = 'calendar-actions-multi-job-plan-v1';
const STATUS_SCHEMA_VERSION = 'calendar-actions-job-status-v1';
const SUMMARY_SCHEMA_VERSION = 'calendar-actions-campaign-summary-v1';
const STATUS_VALUES = Object.freeze(['success', 'partial', 'source_error']);

function artifactPathsForExecution(execution) {
  const status = `data/generated/timetable/actions-multi-job-status/${execution.batch_id}.json`;
  if (execution.executor_id === 'nar-incremental-v2-actions') {
    return [
      status,
      `data/generated/timetable/nar-incremental-batches/${execution.batch_id}`,
      `data/candidates/nar-incremental-batches/${execution.batch_id}`,
    ];
  }
  if (execution.executor_id === 'hkjc-bounded-generator-actions') {
    return [
      status,
      `data/generated/timetable/actions-multi-job/${execution.batch_id}`,
    ];
  }
  return [status];
}

function deterministicBatchId(plan, job) {
  return `${plan.plan_id}-${job.job_id}-run-001`;
}

export function planActionsMultiJobV1(plan, registry, compatibilityContract) {
  const planErrors = validateCollectionPlanV1(plan, registry);
  if (planErrors.length) throw new Error(`invalid Collection Plan: ${planErrors.join('; ')}`);

  const jobs = [];
  const excluded = [];
  for (const job of plan.jobs) {
    let runner;
    try {
      runner = resolveRunnerForJobV1(job, registry, null);
    } catch (error) {
      excluded.push({ job_id: job.job_id, reason: 'runner_resolution_error', detail: error.message });
      continue;
    }
    if (runner !== 'github_actions') {
      excluded.push({ job_id: job.job_id, reason: 'non_actions_runner', runner });
      continue;
    }
    const batchId = deterministicBatchId(plan, job);
    try {
      const execution = compileRunnerExecutionV1(job, {
        batch_id: batchId,
        requested_runner: 'github_actions',
      }, registry, compatibilityContract);
      jobs.push({
        job_id: job.job_id,
        batch_id: batchId,
        execution,
        status_artifact_path: `data/generated/timetable/actions-multi-job-status/${batchId}.json`,
        artifact_paths: artifactPathsForExecution(execution),
      });
    } catch (error) {
      excluded.push({ job_id: job.job_id, reason: 'unsupported_actions_executor', detail: error.message });
    }
  }

  return {
    schema_version: PLAN_SCHEMA_VERSION,
    plan_id: plan.plan_id,
    campaign_id: plan.campaign_id,
    generated_at: plan.created_at,
    jobs,
    excluded,
  };
}

export function matrixFromActionsMultiJobPlanV1(actionsPlan) {
  if (actionsPlan?.schema_version !== PLAN_SCHEMA_VERSION) throw new Error('Actions multi-job plan schema mismatch');
  return {
    include: actionsPlan.jobs.map((item) => ({
      job_id: item.job_id,
      batch_id: item.batch_id,
      execution: item.execution,
      artifact_paths: item.artifact_paths,
    })),
  };
}

export function makeActionsJobStatusV1(execution, status, detail = null) {
  if (!STATUS_VALUES.includes(status)) throw new Error(`unsupported Actions job status ${status}`);
  return {
    schema_version: STATUS_SCHEMA_VERSION,
    campaign_id: execution.campaign_id,
    job_id: execution.job_id,
    batch_id: execution.batch_id,
    system_id: execution.system_id,
    runner_used: execution.runner_used,
    status,
    detail,
  };
}

export function validateActionsJobStatusV1(status, plannedJob) {
  const errors = [];
  const required = ['schema_version', 'campaign_id', 'job_id', 'batch_id', 'system_id', 'runner_used', 'status', 'detail'];
  if (!status || typeof status !== 'object' || Array.isArray(status)) return ['status must be an object'];
  for (const key of required) if (!Object.hasOwn(status, key)) errors.push(`missing status field ${key}`);
  for (const key of Object.keys(status)) if (!required.includes(key)) errors.push(`unexpected status field ${key}`);
  if (status.schema_version !== STATUS_SCHEMA_VERSION) errors.push('status schema_version differs');
  if (!STATUS_VALUES.includes(status.status)) errors.push('status value is unsupported');
  if (!plannedJob) return [...errors, 'matching planned Job is required'];
  const execution = plannedJob.execution;
  for (const key of ['campaign_id', 'job_id', 'batch_id', 'system_id', 'runner_used']) {
    if (status[key] !== execution[key]) errors.push(`status ${key} differs from planned execution`);
  }
  if (status.detail !== null && (typeof status.detail !== 'string' || status.detail.length > 500)) errors.push('status detail must be null or a bounded string');
  return errors;
}

export function summarizeActionsCampaignV1(plan, actionsPlan, statusRecords) {
  if (actionsPlan?.schema_version !== PLAN_SCHEMA_VERSION) throw new Error('Actions multi-job plan schema mismatch');
  const plannedByJobId = new Map(actionsPlan.jobs.map((item) => [item.job_id, item]));
  const outcomes = [];
  const statuses = [];
  const seen = new Set();
  for (const status of statusRecords ?? []) {
    const planned = plannedByJobId.get(status?.job_id);
    if (!planned) throw new Error(`unknown Actions status job_id ${status?.job_id}`);
    if (seen.has(status.job_id)) throw new Error(`duplicate Actions status job_id ${status.job_id}`);
    seen.add(status.job_id);
    const errors = validateActionsJobStatusV1(status, planned);
    if (errors.length) throw new Error(`${status.job_id}: ${errors.join('; ')}`);
    statuses.push(status);
    outcomes.push({ job_id: status.job_id, status: status.status });
  }
  const plannedSummary = summarizeCollectionPlanOutcomesV1(
    { ...plan, jobs: actionsPlan.jobs.map((item) => plan.jobs.find((job) => job.job_id === item.job_id)) },
    outcomes,
  );
  return {
    schema_version: SUMMARY_SCHEMA_VERSION,
    plan_id: plan.plan_id,
    campaign_id: plan.campaign_id,
    generated_at: actionsPlan.generated_at,
    hosted_job_count: actionsPlan.jobs.length,
    excluded_job_count: actionsPlan.excluded.length,
    results: plannedSummary.results,
    counts: plannedSummary.counts,
    excluded: actionsPlan.excluded,
    status_records: statuses,
  };
}

export const actionsMultiJobV1Contract = Object.freeze({
  plan_schema_version: PLAN_SCHEMA_VERSION,
  status_schema_version: STATUS_SCHEMA_VERSION,
  summary_schema_version: SUMMARY_SCHEMA_VERSION,
  status_values: STATUS_VALUES,
});
