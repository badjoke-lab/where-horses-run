import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import {
  makeLocalJobStatusV1,
  planLocalMultiJobV1,
  summarizeLocalCampaignV1,
} from './local-multi-job-core.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const planId = args.get('--plan-id');
const planFile = args.get('--plan-file');
if (!planId && !planFile) throw new Error('provide --plan-id or --plan-file');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relativePath), 'utf8'));
}

function findPlan() {
  if (planFile) {
    const value = readJson(planFile);
    if (value.schema_version === 'calendar-collection-plan-v1') return value;
    if (Array.isArray(value.plans)) {
      const selected = value.plans.find((entry) => entry.plan_id === planId);
      if (selected) return selected;
    }
    throw new Error(`no Collection Plan found in ${planFile}`);
  }

  const sources = [
    'data/fixtures/calendar-collection-plans-v1.json',
    'data/fixtures/calendar-local-multi-job-fixtures-v1.json',
  ];
  for (const source of sources) {
    const value = readJson(source);
    const selected = value.plans?.find((entry) => entry.plan_id === planId);
    if (selected) return selected;
  }
  throw new Error(`unknown Collection Plan ${planId}`);
}

function runNode(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

const plan = findPlan();
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const localPlan = planLocalMultiJobV1(plan, registry, compatibility);

const planOutputDir = path.join(root, 'data/generated/timetable/local-multi-job-plans');
const statusDir = path.join(root, 'data/generated/timetable/local-multi-job-status');
const campaignDir = path.join(root, 'data/generated/timetable/local-multi-job-campaigns');
fs.mkdirSync(planOutputDir, { recursive: true });
fs.mkdirSync(statusDir, { recursive: true });
fs.mkdirSync(campaignDir, { recursive: true });
fs.writeFileSync(
  path.join(planOutputDir, `${plan.plan_id}.json`),
  `${JSON.stringify(localPlan, null, 2)}\n`,
);

const statuses = [];
const manifestRecords = [];
for (const plannedJob of localPlan.jobs) {
  const execution = plannedJob.execution;
  const job = plan.jobs.find((entry) => entry.job_id === plannedJob.job_id);
  let statusRecord;
  let tempDir = null;
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-local-job-'));
    const executionPath = path.join(tempDir, 'execution.json');
    const jobPath = path.join(tempDir, 'job.json');
    fs.writeFileSync(executionPath, `${JSON.stringify(execution, null, 2)}\n`);
    fs.writeFileSync(jobPath, `${JSON.stringify(job, null, 2)}\n`);

    if (execution.executor_id === 'jra-refresh-local') {
      runNode('scripts/timetable/run-jra-local-review-job.mjs', [
        `--execution=${executionPath}`,
        `--job=${jobPath}`,
      ]);
    } else {
      throw new Error(`unsupported local executor ${execution.executor_id}`);
    }

    const batchRoot = path.join(root, `data/generated/timetable/local-multi-job/${execution.batch_id}`);
    const report = JSON.parse(fs.readFileSync(path.join(batchRoot, 'collection-report.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(batchRoot, 'result-manifest.json'), 'utf8'));
    statusRecord = makeLocalJobStatusV1(execution, report.outcome, null);
    manifestRecords.push({
      status: report.outcome,
      manifest,
      manifest_ref: `data/generated/timetable/local-multi-job/${execution.batch_id}/result-manifest.json`,
    });
  } catch (error) {
    statusRecord = makeLocalJobStatusV1(
      execution,
      'source_error',
      String(error?.message ?? error).slice(0, 500),
    );
  } finally {
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  }

  statuses.push(statusRecord);
  fs.writeFileSync(
    path.join(statusDir, `${execution.batch_id}.json`),
    `${JSON.stringify(statusRecord, null, 2)}\n`,
  );
}

const summary = summarizeLocalCampaignV1(plan, localPlan, statuses, manifestRecords);
const summaryPath = path.join(campaignDir, `${plan.plan_id}-summary.json`);
const queuePath = path.join(campaignDir, `${plan.plan_id}-review-queue.json`);
fs.writeFileSync(summaryPath, `${JSON.stringify({ ...summary, review_queue: undefined }, null, 2)}\n`);
fs.writeFileSync(queuePath, `${JSON.stringify(summary.review_queue, null, 2)}\n`);

console.log(JSON.stringify({
  plan_id: plan.plan_id,
  campaign_id: plan.campaign_id,
  local_job_count: localPlan.jobs.length,
  excluded_job_count: localPlan.excluded.length,
  counts: summary.counts,
  review_queue_entries: summary.review_queue.entries.length,
  summary_path: path.relative(root, summaryPath),
  review_queue_path: path.relative(root, queuePath),
}));
