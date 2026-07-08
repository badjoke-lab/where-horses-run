import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { planDueJobsV1, summarizeDueJobPlanV1 } from './due-job-planner.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const policyPath = args.get('--policy') ?? 'data/static/calendar-due-job-policy-v1.json';
const statePath = args.get('--state');
const fixturePath = args.get('--fixture');
const outputPath = args.get('--output');
if (!outputPath) throw new Error('--output=<path> is required');
if (!statePath && !fixturePath) throw new Error('provide --state=<path> or --fixture=<path>');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
}

const policy = readJson(policyPath);
const state = fixturePath ? readJson(fixturePath).state : readJson(statePath);
const registry = loadCalendarAcquisitionRegistryV1(root);
const plan = planDueJobsV1(policy, state, registry);
const summary = summarizeDueJobPlanV1(plan);
const output = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, output),
  policy_version: plan.policy_version,
  job_count: summary.job_count,
  by_reason: summary.by_reason,
  artifact_only: plan.scheduler_boundary.artifact_only,
  jobs_executed: plan.scheduler_boundary.jobs_executed,
}));
