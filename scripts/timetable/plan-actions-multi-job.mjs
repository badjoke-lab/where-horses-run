import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { matrixFromActionsMultiJobPlanV1, planActionsMultiJobV1 } from './actions-multi-job-core.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const planId = args.get('--plan-id');
const output = args.get('--output');
const matrixOutput = args.get('--matrix-output');
if (!planId || !output || !matrixOutput) {
  throw new Error('--plan-id, --output, and --matrix-output are required');
}

const planFixtures = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-collection-plans-v1.json'), 'utf8'));
const plan = planFixtures.plans.find((entry) => entry.plan_id === planId);
if (!plan) throw new Error(`unknown Collection Plan ${planId}`);
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibilityContract = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-runner-compatibility-contract-v1.json'), 'utf8'));
const actionsPlan = planActionsMultiJobV1(plan, registry, compatibilityContract);
const matrix = matrixFromActionsMultiJobPlanV1(actionsPlan);

fs.writeFileSync(path.resolve(root, output), `${JSON.stringify(actionsPlan, null, 2)}\n`);
fs.writeFileSync(path.resolve(root, matrixOutput), `${JSON.stringify(matrix)}\n`);
console.log(JSON.stringify({
  plan_id: actionsPlan.plan_id,
  campaign_id: actionsPlan.campaign_id,
  hosted_jobs: actionsPlan.jobs.length,
  excluded_jobs: actionsPlan.excluded.length,
}));
