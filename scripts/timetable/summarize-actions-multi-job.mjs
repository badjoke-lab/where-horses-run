import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { planActionsMultiJobV1, summarizeActionsCampaignV1 } from './actions-multi-job-core.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const planId = args.get('--plan-id');
const statusRoot = args.get('--status-root');
const output = args.get('--output');
if (!planId || !statusRoot || !output) throw new Error('--plan-id, --status-root, and --output are required');

const planFixtures = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-collection-plans-v1.json'), 'utf8'));
const plan = planFixtures.plans.find((entry) => entry.plan_id === planId);
if (!plan) throw new Error(`unknown Collection Plan ${planId}`);
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibilityContract = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-runner-compatibility-contract-v1.json'), 'utf8'));
const actionsPlan = planActionsMultiJobV1(plan, registry, compatibilityContract);

function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const statuses = [];
for (const file of collectJsonFiles(path.resolve(root, statusRoot))) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (value.schema_version === 'calendar-actions-job-status-v1') statuses.push(value);
}
const summary = summarizeActionsCampaignV1(plan, actionsPlan, statuses);
fs.writeFileSync(path.resolve(root, output), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({
  plan_id: summary.plan_id,
  hosted_job_count: summary.hosted_job_count,
  excluded_job_count: summary.excluded_job_count,
  counts: summary.counts,
}));
