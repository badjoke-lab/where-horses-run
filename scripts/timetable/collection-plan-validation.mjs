import { validateCollectionJobV1 } from './collection-job-validation.mjs';

const REQUIRED_FIELDS = Object.freeze([
  'schema_version',
  'plan_id',
  'campaign_id',
  'created_at',
  'jobs',
]);
const FORBIDDEN_KEY_FRAGMENTS = Object.freeze([
  'source_id', 'adapter_id', 'raw_html', 'raw_body', 'source_body', 'credential', 'cookie', 'secret',
  'horse_name', 'jockey', 'trainer', 'odds', 'betting', 'result', 'payout', 'prediction', 'tip',
  'approval', 'promotion', 'publication', 'deployment',
]);

function stableId(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function walkForbiddenKeys(value, errors, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkForbiddenKeys(entry, errors, [...trail, String(index)]));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (FORBIDDEN_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
      errors.push(`forbidden plan key ${[...trail, key].join('.')}`);
    }
    walkForbiddenKeys(entry, errors, [...trail, key]);
  }
}

export function partitionCollectionPlanJobsV1(plan, registry) {
  const valid_jobs = [];
  const invalid_jobs = [];
  for (const job of Array.isArray(plan?.jobs) ? plan.jobs : []) {
    const errors = validateCollectionJobV1(job, registry);
    const item = { job_id: job?.job_id ?? null, errors };
    if (errors.length) invalid_jobs.push(item);
    else valid_jobs.push(item);
  }
  return Object.freeze({ valid_jobs, invalid_jobs });
}

export function validateCollectionPlanV1(plan, registry) {
  const errors = [];
  if (!isObject(plan)) return ['plan must be an object'];
  for (const field of REQUIRED_FIELDS) if (!Object.hasOwn(plan, field)) errors.push(`missing required field ${field}`);
  for (const key of Object.keys(plan)) if (!REQUIRED_FIELDS.includes(key)) errors.push(`unexpected field ${key}`);
  if (plan.schema_version !== 'calendar-collection-plan-v1') errors.push('schema_version must be calendar-collection-plan-v1');
  if (!stableId(plan.plan_id)) errors.push('plan_id must be lowercase kebab-case');
  if (!stableId(plan.campaign_id)) errors.push('campaign_id must be lowercase kebab-case');
  if (typeof plan.created_at !== 'string' || Number.isNaN(Date.parse(plan.created_at))) errors.push('created_at must be a valid date-time');
  if (!Array.isArray(plan.jobs) || plan.jobs.length === 0) errors.push('jobs must be a non-empty array');

  const seenJobIds = new Set();
  for (const [index, job] of (plan.jobs ?? []).entries()) {
    if (job?.campaign_id !== plan.campaign_id) errors.push(`jobs[${index}] campaign_id must equal plan campaign_id`);
    if (seenJobIds.has(job?.job_id)) errors.push(`duplicate job_id ${job?.job_id}`);
    seenJobIds.add(job?.job_id);
    const jobErrors = validateCollectionJobV1(job, registry);
    for (const error of jobErrors) errors.push(`jobs[${index}] ${job?.job_id ?? 'unknown'}: ${error}`);
  }

  walkForbiddenKeys({ ...plan, jobs: [] }, errors);
  return errors;
}

export function summarizeCollectionPlanOutcomesV1(plan, outcomes) {
  const jobs = Array.isArray(plan?.jobs) ? plan.jobs : [];
  const byJobId = new Map(jobs.map((job) => [job.job_id, job]));
  const seen = new Set();
  const results = [];
  for (const outcome of outcomes ?? []) {
    if (!byJobId.has(outcome?.job_id)) throw new Error(`unknown outcome job_id ${outcome?.job_id}`);
    if (seen.has(outcome.job_id)) throw new Error(`duplicate outcome job_id ${outcome.job_id}`);
    seen.add(outcome.job_id);
    if (!['success', 'partial', 'source_error'].includes(outcome.status)) throw new Error(`unknown outcome status ${outcome.status}`);
    results.push({ job_id: outcome.job_id, status: outcome.status });
  }
  for (const job of jobs) if (!seen.has(job.job_id)) results.push({ job_id: job.job_id, status: 'not_run' });
  return Object.freeze({
    results: Object.freeze(results),
    counts: Object.freeze(results.reduce((out, item) => ({ ...out, [item.status]: (out[item.status] ?? 0) + 1 }), {})),
  });
}

export const collectionPlanV1Contract = Object.freeze({ requiredFields: REQUIRED_FIELDS });
