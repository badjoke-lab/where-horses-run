import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { compileRunnerExecutionV1 } from './runner-compatibility.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const outputDirArg = argument('output-dir');
const requestedAt = argument('requested-at') ?? new Date().toISOString();
if (!outputDirArg) throw new Error('--output-dir=<path> is required');
if (Number.isNaN(Date.parse(requestedAt))) throw new Error('--requested-at must be a valid date-time');
const outputDir = path.resolve(outputDirArg);
const relativeOutput = path.relative(root, outputDir);
if (relativeOutput === '' || (!relativeOutput.startsWith('..') && !path.isAbsolute(relativeOutput))) {
  throw new Error('Banei current-window specification output must remain outside the repository');
}

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const policy = readJson('data/static/calendar-banei-current-window-policy-v1.json');
const sourceDecision = readJson(policy.source_decision_ref);
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (policy.schema_version !== 'calendar-banei-current-window-policy-v1') throw new Error('Banei current-window policy schema differs');
if (policy.work_id !== 'WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-ACQUISITION' || policy.implementation_unit !== 'BANEI-CURRENT-WINDOW-01') {
  throw new Error('Banei current-window policy identity differs');
}
if (policy.window?.start_date !== '2026-07-13' || policy.window?.end_date_exclusive !== '2026-08-12' || policy.window?.timezone !== 'Asia/Tokyo') {
  throw new Error('Banei current-window policy window differs');
}
if (!Array.isArray(policy.month_jobs) || policy.month_jobs.length !== 2) throw new Error('Banei current-window policy requires two month Jobs');
if (!exact(policy.month_jobs.map((entry) => entry.target_month), ['2026-07', '2026-08'])) throw new Error('Banei current-window month order differs');
if (Object.values(policy.side_effect_boundary ?? {}).some((value) => value !== false)) throw new Error('Banei current-window side-effect boundary differs');

const historicalBanei = sourceDecision.systems?.find((record) => record.system_id === 'japan-banei-system');
if (!historicalBanei || historicalBanei.canonical_meeting_count !== 0 || historicalBanei.decision !== 'acquire_schedule_before_detail_retry') {
  throw new Error('Banei source decision does not authorize schedule acquisition');
}
const currentBanei = canonical.meetings.filter((meeting) => (
  meeting.authority_id === 'banei-tokachi'
  && meeting.date >= policy.window.start_date
  && meeting.date < policy.window.end_date_exclusive
));
if (currentBanei.length !== 0) throw new Error(`Banei current-window baseline differs: expected 0 Canonical meetings, got ${currentBanei.length}`);

const profile = registry.records.find((record) => record.system_id === policy.job_contract.system_id);
if (!profile || profile.profile_status !== 'active' || profile.primary_runner !== 'github_actions') throw new Error('Banei Acquisition Registry profile differs');
if (profile.supports_date_window !== true || profile.supports_cross_month_window !== false) throw new Error('Banei month-splitting capability boundary differs');
if (profile.supported_observation_ranks.join(',') !== 'B,A+') throw new Error('Banei supported observation ranks differ');

const jobs = policy.month_jobs.map((monthJob) => ({
  schema_version: 'calendar-collection-job-v1',
  job_id: monthJob.job_id,
  campaign_id: monthJob.campaign_id,
  system_id: policy.job_contract.system_id,
  runner_policy: structuredClone(policy.job_contract.runner_policy),
  collection_mode: policy.job_contract.collection_mode,
  requested_scope: {
    start_date: monthJob.start_date,
    end_date_exclusive: monthJob.end_date_exclusive,
    timezone: policy.window.timezone,
  },
  rank_strategy: policy.job_contract.rank_strategy,
  target_rank: policy.job_contract.target_rank,
  reason: policy.job_contract.reason,
  requested_at: requestedAt,
}));
const executions = jobs.map((job, index) => compileRunnerExecutionV1(
  job,
  { batch_id: policy.month_jobs[index].batch_id },
  registry,
  compatibility,
));
for (const [index, execution] of executions.entries()) {
  const monthJob = policy.month_jobs[index];
  if (execution.executor_id !== 'banei-schedule-detail-actions') throw new Error(`${monthJob.target_month} Banei executor differs`);
  if (execution.runner_used !== 'github_actions' || execution.collection_mode !== 'date_window') throw new Error(`${monthJob.target_month} Banei execution route differs`);
  if (execution.requested_scope.start_date.slice(0, 7) !== monthJob.target_month) throw new Error(`${monthJob.target_month} Banei execution month differs`);
  if (execution.review_required !== true || Object.values(execution.side_effect_boundary).some((value) => value !== false)) {
    throw new Error(`${monthJob.target_month} Banei execution safety boundary differs`);
  }
}

const plan = {
  schema_version: 'calendar-collection-plan-v1',
  plan_id: 'banei-current-window-two-month-plan-001',
  campaign_id: policy.month_jobs[0].campaign_id,
  created_at: requestedAt,
  jobs,
};
const scope = {
  schema_version: 'calendar-banei-current-window-scope-v1',
  work_id: policy.work_id,
  implementation_unit: policy.implementation_unit,
  canonical_generated_at: canonical.generated_at,
  source_decision_ref: policy.source_decision_ref,
  requested_window: structuredClone(policy.window),
  baseline_canonical_meeting_count: currentBanei.length,
  split_reason: 'Banei supports date_window but does not support cross_month_window.',
  month_job_count: jobs.length,
  month_jobs: policy.month_jobs.map((monthJob, index) => ({
    target_month: monthJob.target_month,
    job_id: monthJob.job_id,
    batch_id: monthJob.batch_id,
    requested_scope: structuredClone(jobs[index].requested_scope),
    executor_id: executions[index].executor_id,
  })),
  accepted_observation_ranks: structuredClone(policy.campaign_result_contract.accepted_ranks),
  side_effect_boundary: structuredClone(policy.side_effect_boundary),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'collection-plan.json'), `${JSON.stringify(plan, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'campaign-scope.json'), `${JSON.stringify(scope, null, 2)}\n`);
for (const [index, monthJob] of policy.month_jobs.entries()) {
  fs.writeFileSync(path.join(outputDir, `${monthJob.target_month}-job.json`), `${JSON.stringify(jobs[index], null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, `${monthJob.target_month}-execution.json`), `${JSON.stringify(executions[index], null, 2)}\n`);
}
console.log(JSON.stringify({
  schema_version: 'calendar-banei-current-window-spec-summary-v1',
  work_id: policy.work_id,
  implementation_unit: policy.implementation_unit,
  requested_window: policy.window,
  baseline_canonical_meeting_count: currentBanei.length,
  month_job_count: jobs.length,
  month_jobs: scope.month_jobs,
  output_dir: outputDir,
  network_fetch: false,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
}, null, 2));
