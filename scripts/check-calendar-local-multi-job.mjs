import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  makeLocalJobStatusV1,
  planLocalMultiJobV1,
  summarizeLocalCampaignV1,
} from './timetable/local-multi-job-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const baseFixtures = readJson('data/fixtures/calendar-collection-plans-v1.json');
const localFixtures = readJson('data/fixtures/calendar-local-multi-job-fixtures-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const plans = [...(baseFixtures.plans ?? []), ...(localFixtures.plans ?? [])];

if (plans.length === 0) fail('Local multi-job fixtures must contain at least one Plan.');

let localJobCount = 0;
let checkOnlyCandidate = null;
for (const plan of plans) {
  let localPlan;
  try {
    localPlan = planLocalMultiJobV1(plan, registry, compatibility);
  } catch (error) {
    fail(`${plan.plan_id}: local compilation failed: ${error.message}`);
    continue;
  }

  const sourceJobs = new Map((plan.jobs ?? []).map((job) => [job.job_id, job]));
  const batchIds = new Set();
  for (const item of localPlan.jobs) {
    localJobCount += 1;
    const sourceJob = sourceJobs.get(item.job_id);
    if (!sourceJob || !exact(item.collection_job ?? sourceJob, sourceJob)) fail(`${plan.plan_id}/${item.job_id}: local Job snapshot differs.`);
    if (item.execution?.job_id !== item.job_id) fail(`${plan.plan_id}/${item.job_id}: execution identity differs.`);
    if (item.execution?.runner_used !== 'local') fail(`${plan.plan_id}/${item.job_id}: local execution must resolve to local runner.`);
    if (batchIds.has(item.batch_id)) fail(`${plan.plan_id}: duplicate local batch ID ${item.batch_id}.`);
    batchIds.add(item.batch_id);
    if (!checkOnlyCandidate && item.execution?.executor_id === 'jra-refresh-local' && sourceJob) checkOnlyCandidate = { item, sourceJob };
  }

  if (localPlan.jobs.length > 0) {
    const statuses = localPlan.jobs.map((item) => makeLocalJobStatusV1(item.execution, 'success', null));
    const summary = summarizeLocalCampaignV1(plan, localPlan, statuses, []);
    if (summary.counts.success !== statuses.length) fail(`${plan.plan_id}: local summary success count differs.`);
    const missing = summarizeLocalCampaignV1(plan, localPlan, statuses.slice(0, -1), []);
    if (statuses.length > 0 && missing.counts.not_run < 1) fail(`${plan.plan_id}: missing local status must become not_run.`);
    if (statuses.length > 0) {
      let duplicateRejected = false;
      try { summarizeLocalCampaignV1(plan, localPlan, [statuses[0], statuses[0]], []); } catch { duplicateRejected = true; }
      if (!duplicateRejected) fail(`${plan.plan_id}: duplicate local status was accepted.`);
    }
  }
}

if (localJobCount === 0) fail('Fixture matrix must exercise at least one local Job.');
if (!checkOnlyCandidate) fail('Fixture matrix must exercise the JRA local review executor.');
else {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-local-check-'));
  const executionPath = path.join(tempDir, 'execution.json');
  const jobPath = path.join(tempDir, 'job.json');
  fs.writeFileSync(executionPath, `${JSON.stringify(checkOnlyCandidate.item.execution, null, 2)}\n`);
  fs.writeFileSync(jobPath, `${JSON.stringify(checkOnlyCandidate.sourceJob, null, 2)}\n`);
  const batchDir = path.join(root, `data/generated/timetable/local-multi-job/${checkOnlyCandidate.item.batch_id}`);
  const existedBefore = fs.existsSync(batchDir);
  const result = spawnSync(process.execPath, [
    'scripts/timetable/run-jra-local-review-job.mjs',
    `--execution=${executionPath}`,
    `--job=${jobPath}`,
    '--source-root=.',
    '--check-only',
  ], { cwd: root, encoding: 'utf8' });
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (result.status !== 0) fail(`JRA local check-only executor failed: ${result.stderr || result.stdout}`);
  else {
    const output = JSON.parse(result.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1));
    if (output.outcome !== 'success' || output.check_only !== true) fail(`JRA local check-only outcome differs: ${JSON.stringify(output)}`);
  }
  if (!existedBefore && fs.existsSync(batchDir)) fail('JRA local check-only executor wrote a batch output directory.');
}

const executorText = readText('scripts/timetable/run-jra-local-review-job.mjs');
for (const phrase of ["git', ['worktree', 'add'", "git', ['worktree', 'remove'", "publication_effect: 'none'"]) {
  if (!executorText.includes(phrase)) fail(`JRA local executor missing isolation marker ${phrase}.`);
}
const runnerText = readText('scripts/timetable/run-calendar-local-plan.mjs');
for (const phrase of ['for (const plannedJob of localPlan.jobs)', "'source_error'", 'summarizeLocalCampaignV1']) {
  if (!runnerText.includes(phrase)) fail(`local Plan runner missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_LOCAL_MULTI_JOB: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_LOCAL_MULTI_JOB: pass');
console.log(`PLANS_EXERCISED: ${plans.length}`);
console.log(`LOCAL_JOBS_EXERCISED: ${localJobCount}`);
console.log('FIXED_DATE_ASSERTIONS: 0');
console.log('CHECK_ONLY_WRITE_ISOLATION: pass');
