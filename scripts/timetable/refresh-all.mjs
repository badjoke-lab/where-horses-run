import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const planId = args.get('--plan-id');
const planFile = args.get('--plan-file');
const validateActionsOnly = args.has('--validate-actions-only');

if ((!planId && !planFile) || (planId && planFile)) {
  throw new Error('provide exactly one of --plan-id=<id> or --plan-file=<path>');
}

function runNode(script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function selectedPlanId() {
  if (planId) return planId;
  const value = JSON.parse(fs.readFileSync(path.resolve(root, planFile), 'utf8'));
  const plan = value.schema_version === 'calendar-due-job-plan-v1' ? value.collection_plan : value;
  if (typeof plan?.plan_id !== 'string' || plan.plan_id.trim() === '') {
    throw new Error('selected Collection Plan must contain plan_id');
  }
  return plan.plan_id;
}

const selectorArgs = planId
  ? [`--plan-id=${planId}`]
  : [`--plan-file=${planFile}`];
const resolvedPlanId = selectedPlanId();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-calendar-refresh-'));
let localFailures = 0;
let actionsFailures = 0;
let actionsExecuted = 0;
let actionsExcludedUnexpected = 0;

try {
  const localStatus = runNode('scripts/timetable/run-calendar-local-plan.mjs', selectorArgs);
  if (localStatus !== 0) {
    throw new Error(`local Calendar runner exited with status ${localStatus}`);
  }

  const localSummaryPath = path.join(
    root,
    'data/generated/timetable/local-multi-job-campaigns',
    `${resolvedPlanId}-summary.json`,
  );
  if (fs.existsSync(localSummaryPath)) {
    const summary = JSON.parse(fs.readFileSync(localSummaryPath, 'utf8'));
    localFailures = Array.isArray(summary.results)
      ? summary.results.filter((item) => item.status === 'source_error').length
      : Number(summary.counts?.source_error ?? 0);
  }

  const actionsPlanPath = path.join(tempDir, 'actions-plan.json');
  const matrixPath = path.join(tempDir, 'actions-matrix.json');
  const planStatus = runNode('scripts/timetable/plan-actions-multi-job.mjs', [
    ...selectorArgs,
    `--output=${actionsPlanPath}`,
    `--matrix-output=${matrixPath}`,
  ]);
  if (planStatus !== 0) {
    throw new Error(`Actions Calendar planner exited with status ${planStatus}`);
  }

  const actionsPlan = JSON.parse(fs.readFileSync(actionsPlanPath, 'utf8'));
  actionsExcludedUnexpected = (actionsPlan.excluded ?? [])
    .filter((item) => item.reason !== 'non_actions_runner').length;

  for (const plannedJob of actionsPlan.jobs ?? []) {
    const executionPath = path.join(tempDir, `${plannedJob.batch_id}-execution.json`);
    const jobPath = path.join(tempDir, `${plannedJob.batch_id}-job.json`);
    fs.writeFileSync(executionPath, `${JSON.stringify(plannedJob.execution, null, 2)}\n`);
    fs.writeFileSync(jobPath, `${JSON.stringify(plannedJob.collection_job, null, 2)}\n`);

    const jobArgs = [
      `--execution=${executionPath}`,
      `--job=${jobPath}`,
    ];
    if (validateActionsOnly) jobArgs.push('--validate-only');

    actionsExecuted += 1;
    const status = runNode('scripts/timetable/run-calendar-actions-job.mjs', jobArgs);
    if (status !== 0) actionsFailures += 1;
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const failureCount = localFailures + actionsFailures + actionsExcludedUnexpected;
console.log(JSON.stringify({
  plan_id: resolvedPlanId,
  mode: validateActionsOnly ? 'local_source_execution_actions_validation' : 'source_execution',
  local_source_errors: localFailures,
  actions_jobs_executed: actionsExecuted,
  actions_source_errors: actionsFailures,
  actions_unexpected_exclusions: actionsExcludedUnexpected,
  review_promotion: 'not_performed',
}));

if (failureCount > 0) process.exitCode = 1;
