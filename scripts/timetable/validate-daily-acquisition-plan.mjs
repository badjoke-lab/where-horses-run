import fs from 'node:fs';
import path from 'node:path';
import { validateDailyActionsPlanV1 } from './daily-acquisition-policy.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const policyPath = args.get('--policy') ?? 'data/static/calendar-daily-acquisition-policy-v1.json';
const duePlanPath = args.get('--due-plan');
const actionsPlanPath = args.get('--actions-plan');
if (!duePlanPath || !actionsPlanPath) throw new Error('--due-plan=<path> and --actions-plan=<path> are required');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
}

const policy = readJson(policyPath);
const duePlan = readJson(duePlanPath);
const actionsPlan = readJson(actionsPlanPath);
const errors = validateDailyActionsPlanV1(policy, duePlan, actionsPlan);
if (errors.length) {
  console.error(`CALENDAR_DAILY_ACQUISITION_POLICY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(JSON.stringify({
  policy_version: policy.policy_version,
  plan_id: actionsPlan.plan_id,
  hosted_job_count: actionsPlan.jobs.length,
  excluded_job_count: actionsPlan.excluded.length,
  automatic_approval: policy.execution.automatic_approval,
  automatic_publication: policy.execution.automatic_publication,
  automatic_deployment: policy.execution.automatic_deployment,
}));
