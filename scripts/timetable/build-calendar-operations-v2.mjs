import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { planDueJobsV1 } from './due-job-planner.mjs';
import { planReviewCohortsV1 } from './review-cohort-planner.mjs';
import { buildOperationsV2V1 } from './operations-v2.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const fixturePath = args.get('--fixture');
const outputPath = args.get('--output');
if (!fixturePath || !outputPath) throw new Error('--fixture=<path> and --output=<path> are required');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
}

const operationsFixture = readJson(fixturePath);
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const dueFixture = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');
const reviewFixture = readJson('data/fixtures/calendar-review-cohort-planner-fixtures-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const duePlan = planDueJobsV1(duePolicy, dueFixture.state, registry);
const cohortPlan = planReviewCohortsV1(reviewFixture.queue, registry);
const output = buildOperationsV2V1({
  generated_at: operationsFixture.generated_at,
  operations_v1_ref: 'data/generated/timetable/operations-status.json',
  due_plan: duePlan,
  due_policy: duePolicy,
  runtime_statuses: operationsFixture.runtime_statuses,
  review_queue: reviewFixture.queue,
  retry_queue: dueFixture.state.retry_queue,
  review_cohort_plan: cohortPlan,
  registry,
  source_states: operationsFixture.source_states,
  publication_snapshot: operationsFixture.publication_snapshot,
});

const absolute = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, absolute),
  system_count: output.systems.length,
  due_job_count: output.acquisition_summary.due_plan_job_count,
  review_entry_count: output.review_summary.entry_count,
  retry_entry_count: output.retry_summary.entry_count,
  read_only: Object.values(output.boundaries).every((value) => value === false),
}));
