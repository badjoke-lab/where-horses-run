import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { validateRunnerExecutionV1 } from './runner-compatibility.mjs';
import { makeActionsJobStatusV1 } from './actions-multi-job-core.mjs';

const root = process.cwd();
const executionArg = process.argv.find((item) => item.startsWith('--execution='));
if (!executionArg) throw new Error('--execution=<path> is required');
const executionPath = path.resolve(root, executionArg.slice('--execution='.length));
const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));
const registry = loadCalendarAcquisitionRegistryV1(root);
const contract = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-runner-compatibility-contract-v1.json'), 'utf8'));
const planFixtures = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-collection-plans-v1.json'), 'utf8'));
const matchingJobs = planFixtures.plans.flatMap((plan) => plan.jobs).filter((job) => job.job_id === execution.job_id);
if (matchingJobs.length !== 1) throw new Error(`expected exactly one fixture Job for ${execution.job_id}, found ${matchingJobs.length}`);
const job = matchingJobs[0];
const executionErrors = validateRunnerExecutionV1(execution, job, registry, contract);
if (executionErrors.length) throw new Error(`execution validation failed: ${executionErrors.join('; ')}`);
if (execution.runner_used !== 'github_actions') throw new Error('Actions dispatcher requires github_actions runner');

const statusDir = path.join(root, 'data/generated/timetable/actions-multi-job-status');
const statusPath = path.join(statusDir, `${execution.batch_id}.json`);
fs.mkdirSync(statusDir, { recursive: true });

function runNode(script, args = [], env = process.env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

function coveragePathForExecution(value) {
  if (value.executor_id === 'nar-incremental-v2-actions') {
    return path.join(root, `data/generated/timetable/nar-incremental-batches/${value.batch_id}/coverage-observation.json`);
  }
  if (value.executor_id === 'hkjc-bounded-generator-actions') {
    return path.join(root, `data/generated/timetable/actions-multi-job/${value.batch_id}/coverage-observation.json`);
  }
  throw new Error(`unsupported Actions executor ${value.executor_id}`);
}

function outcomeFromCoverage(coverage) {
  if ((coverage.source_errors ?? []).length > 0 || coverage.coverage_claim === 'none') return 'source_error';
  if (coverage.coverage_claim === 'partial') return 'partial';
  return 'success';
}

let statusRecord;
let failed = false;
try {
  if (execution.executor_id === 'nar-incremental-v2-actions') {
    if (!['date_window', 'selected_meetings'].includes(execution.collection_mode)) {
      throw new Error(`NAR Actions executor does not support ${execution.collection_mode}`);
    }
    const scope = execution.requested_scope;
    const env = {
      ...process.env,
      WHR_BATCH_ID: execution.batch_id,
      WHR_MODE: execution.collection_mode,
      WHR_START_DATE: execution.collection_mode === 'date_window' ? scope.start_date : '',
      WHR_END_DATE_EXCLUSIVE: execution.collection_mode === 'date_window' ? scope.end_date_exclusive : '',
      WHR_MEETING_IDS: execution.collection_mode === 'selected_meetings' ? scope.meeting_ids.join(',') : '',
    };
    runNode('scripts/timetable/run-nar-incremental-v2-actions.mjs', [], env);
  } else if (execution.executor_id === 'hkjc-bounded-generator-actions') {
    runNode('scripts/timetable/run-hkjc-bounded-generator-job.mjs', [`--execution=${executionPath}`]);
  } else {
    throw new Error(`unsupported Actions executor ${execution.executor_id}`);
  }

  const coveragePath = coveragePathForExecution(execution);
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  statusRecord = makeActionsJobStatusV1(execution, outcomeFromCoverage(coverage), null);
} catch (error) {
  failed = true;
  const detail = String(error?.message ?? error).slice(0, 500);
  statusRecord = makeActionsJobStatusV1(execution, 'source_error', detail);
}

fs.writeFileSync(statusPath, `${JSON.stringify(statusRecord, null, 2)}\n`);
console.log(JSON.stringify({ status_path: path.relative(root, statusPath), status: statusRecord.status }));
if (failed) process.exitCode = 1;
