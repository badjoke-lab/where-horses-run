import { validateCollectionPlanV1, summarizeCollectionPlanOutcomesV1 } from './collection-plan-validation.mjs';
import { compileRunnerExecutionV1, resolveRunnerForJobV1 } from './runner-compatibility.mjs';
import {
  buildReviewQueueEntryFromManifestV1,
  validateReviewQueueV1,
} from './review-queue-validation.mjs';

const PLAN_SCHEMA_VERSION = 'calendar-local-multi-job-plan-v1';
const STATUS_SCHEMA_VERSION = 'calendar-local-job-status-v1';
const SUMMARY_SCHEMA_VERSION = 'calendar-local-campaign-summary-v1';
const STATUS_VALUES = Object.freeze(['success', 'partial', 'source_error']);

function executorFor(contract, systemId, runner) {
  return contract?.executors?.find((entry) => entry.system_id === systemId && entry.runner === runner) ?? null;
}

function deterministicBatchId(plan, job) {
  return `${plan.plan_id}-${job.job_id}-local-run-001`;
}

function artifactPathsForExecution(execution) {
  const batchRoot = `data/generated/timetable/local-multi-job/${execution.batch_id}`;
  return [
    `data/generated/timetable/local-multi-job-status/${execution.batch_id}.json`,
    `${batchRoot}/candidate.json`,
    `${batchRoot}/coverage-observation.json`,
    `${batchRoot}/result-manifest.json`,
    `${batchRoot}/collection-report.json`,
  ];
}

export function planLocalMultiJobV1(plan, registry, compatibilityContract) {
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

    if (runner !== 'local') {
      excluded.push({ job_id: job.job_id, reason: 'non_local_runner', runner });
      continue;
    }

    const executor = executorFor(compatibilityContract, job.system_id, runner);
    if (!executor) {
      excluded.push({ job_id: job.job_id, reason: 'unsupported_local_executor', detail: `executor mapping missing for ${job.system_id}/${runner}` });
      continue;
    }
    if (!Array.isArray(executor.supported_collection_modes) || !executor.supported_collection_modes.includes(job.collection_mode)) {
      excluded.push({
        job_id: job.job_id,
        reason: 'unsupported_collection_mode',
        runner,
        collection_mode: job.collection_mode,
      });
      continue;
    }

    const batchId = deterministicBatchId(plan, job);
    const execution = compileRunnerExecutionV1(job, {
      batch_id: batchId,
      requested_runner: 'local',
    }, registry, compatibilityContract);
    jobs.push({
      job_id: job.job_id,
      batch_id: batchId,
      execution,
      status_artifact_path: `data/generated/timetable/local-multi-job-status/${batchId}.json`,
      artifact_paths: artifactPathsForExecution(execution),
    });
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

export function makeLocalJobStatusV1(execution, status, detail = null) {
  if (!STATUS_VALUES.includes(status)) throw new Error(`unsupported local Job status ${status}`);
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

export function validateLocalJobStatusV1(status, plannedJob) {
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
  if (status.runner_used !== 'local') errors.push('local status runner_used must be local');
  if (status.detail !== null && (typeof status.detail !== 'string' || status.detail.length > 500)) errors.push('status detail must be null or a bounded string');
  return errors;
}

export function buildLocalReviewQueueSnapshotV1(localPlan, manifestRecords) {
  const entries = [];
  for (const record of manifestRecords ?? []) {
    if (!['success', 'partial'].includes(record.status)) continue;
    entries.push(buildReviewQueueEntryFromManifestV1(record.manifest, {
      review_state: 'review_ready',
      promotion_state: 'not_ready',
      manifest_ref: record.manifest_ref,
    }));
  }
  const queue = {
    schema_version: 'calendar-review-queue-v1',
    generated_at: localPlan.generated_at,
    entries,
  };
  const errors = validateReviewQueueV1(queue);
  if (errors.length) throw new Error(`local Review Queue snapshot invalid: ${errors.join('; ')}`);
  return queue;
}

export function summarizeLocalCampaignV1(plan, localPlan, statusRecords, manifestRecords = []) {
  if (localPlan?.schema_version !== PLAN_SCHEMA_VERSION) throw new Error('local multi-job plan schema mismatch');
  const plannedByJobId = new Map(localPlan.jobs.map((item) => [item.job_id, item]));
  const outcomes = [];
  const statuses = [];
  const seen = new Set();

  for (const status of statusRecords ?? []) {
    const planned = plannedByJobId.get(status?.job_id);
    if (!planned) throw new Error(`unknown local status job_id ${status?.job_id}`);
    if (seen.has(status.job_id)) throw new Error(`duplicate local status job_id ${status.job_id}`);
    seen.add(status.job_id);
    const errors = validateLocalJobStatusV1(status, planned);
    if (errors.length) throw new Error(`${status.job_id}: ${errors.join('; ')}`);
    statuses.push(status);
    outcomes.push({ job_id: status.job_id, status: status.status });
  }

  const localJobs = localPlan.jobs.map((item) => plan.jobs.find((job) => job.job_id === item.job_id));
  const planSummary = summarizeCollectionPlanOutcomesV1({ ...plan, jobs: localJobs }, outcomes);
  const reviewQueue = buildLocalReviewQueueSnapshotV1(localPlan, manifestRecords);
  return {
    schema_version: SUMMARY_SCHEMA_VERSION,
    plan_id: plan.plan_id,
    campaign_id: plan.campaign_id,
    generated_at: localPlan.generated_at,
    local_job_count: localPlan.jobs.length,
    excluded_job_count: localPlan.excluded.length,
    results: planSummary.results,
    counts: planSummary.counts,
    excluded: localPlan.excluded,
    status_records: statuses,
    review_queue: reviewQueue,
  };
}

export const localMultiJobV1Contract = Object.freeze({
  plan_schema_version: PLAN_SCHEMA_VERSION,
  status_schema_version: STATUS_SCHEMA_VERSION,
  summary_schema_version: SUMMARY_SCHEMA_VERSION,
  status_values: STATUS_VALUES,
});
