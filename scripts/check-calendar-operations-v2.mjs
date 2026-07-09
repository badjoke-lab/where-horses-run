import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { planDueJobsV1 } from './timetable/due-job-planner.mjs';
import { planReviewCohortsV1 } from './timetable/review-cohort-planner.mjs';
import {
  buildOperationsV2V1,
  operationsV2V1Contract,
  validateOperationsV2V1,
} from './timetable/operations-v2.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-operations-v2.schema.json');
const operationsFixtures = readJson('data/fixtures/calendar-operations-v2-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-operations-v2-invalid-cases-v1.json');
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const dueFixtures = readJson('data/fixtures/calendar-due-job-planner-fixtures-v1.json');
const reviewFixtures = readJson('data/fixtures/calendar-review-cohort-planner-fixtures-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Operations v2 schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-operations-v2.schema.json') fail('Operations v2 schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Operations v2 schema must be closed.');
if (schema.properties?.schema_version?.const !== 'calendar-operations-v2') fail('Operations v2 schema version differs.');
if (!exact(schema.$defs?.jobStatusCounts?.required, operationsV2V1Contract.job_statuses)) fail('Operations v2 job statuses differ from core.');
if (!exact(schema.$defs?.reviewStateCounts?.required, operationsV2V1Contract.review_states)) fail('Operations v2 review states differ from core.');
if (!exact(schema.$defs?.promotionStateCounts?.required, operationsV2V1Contract.promotion_states)) fail('Operations v2 promotion states differ from core.');
if (!exact(schema.$defs?.rankCounts?.required, operationsV2V1Contract.ranks)) fail('Operations v2 rank keys differ from core.');
if (!exact(schema.$defs?.boundaries?.required, Object.keys(operationsV2V1Contract.boundaries))) fail('Operations v2 boundary keys differ from core.');
for (const [key, value] of Object.entries(operationsV2V1Contract.boundaries)) {
  if (schema.$defs?.boundaries?.properties?.[key]?.const !== value) fail(`Operations v2 schema boundary differs for ${key}.`);
}

let duePlan = null;
let cohortPlan = null;
let output = null;
try {
  duePlan = planDueJobsV1(duePolicy, dueFixtures.state, registry);
  cohortPlan = planReviewCohortsV1(reviewFixtures.queue, registry);
  output = buildOperationsV2V1({
    generated_at: operationsFixtures.generated_at,
    operations_v1_ref: 'data/generated/timetable/operations-status.json',
    due_plan: duePlan,
    due_policy: duePolicy,
    runtime_statuses: operationsFixtures.runtime_statuses,
    review_queue: reviewFixtures.queue,
    retry_queue: dueFixtures.state.retry_queue,
    review_cohort_plan: cohortPlan,
    registry,
    source_states: operationsFixtures.source_states,
    publication_snapshot: operationsFixtures.publication_snapshot,
  });
} catch (error) {
  fail(`Operations v2 build failed: ${error.message}`);
}

if (output) {
  const validationErrors = validateOperationsV2V1(output, registry);
  if (validationErrors.length) fail(`Operations v2 validation failed: ${validationErrors.join('; ')}`);
  const expected = operationsFixtures.expected;
  if (!exact(output.acquisition_summary.job_counts, expected.acquisition_job_counts)) fail(`acquisition job counts differ: ${JSON.stringify(output.acquisition_summary.job_counts)}`);
  if (output.acquisition_summary.due_plan_job_count !== expected.due_plan_job_count) fail('due plan Job count differs.');
  if (output.acquisition_summary.recent_result_count !== expected.recent_result_count) fail('recent result count differs.');
  if (output.review_summary.entry_count !== expected.review_entry_count) fail('Review Queue entry count differs.');
  if (!exact(output.review_summary.by_review_state, expected.review_state_counts)) fail(`review state counts differ: ${JSON.stringify(output.review_summary.by_review_state)}`);
  if (!exact(output.review_summary.by_promotion_state, expected.promotion_state_counts)) fail(`promotion state counts differ: ${JSON.stringify(output.review_summary.by_promotion_state)}`);
  if (output.retry_summary.entry_count !== expected.retry_entry_count
    || output.retry_summary.due_now_count !== expected.retry_due_count
    || output.retry_summary.deferred_count !== expected.retry_deferred_count) fail('Retry Queue counts differ.');
  if (!exact(output.rank_distribution, expected.rank_distribution)) fail(`rank distribution differs: ${JSON.stringify(output.rank_distribution)}`);
  if (output.promotion_summary.human_review_required_count !== expected.human_review_required_count) fail('human review cohort count differs.');
  if (output.promotion_summary.public_ceiling_projection_required_count !== expected.public_ceiling_projection_required_count) fail('Public Ceiling dependency count differs.');
  if (output.publication_summary.state !== expected.publication_state) fail('publication state differs.');
  if (output.systems.length !== expected.system_count) fail(`system row count differs: ${output.systems.length}`);

  const bySystem = new Map(output.systems.map((row) => [row.system_id, row]));
  const jra = bySystem.get('japan-jra-system');
  if (!jra) fail('JRA Operations v2 row missing.');
  else {
    if (jra.freshness_age_hours !== 6) fail(`JRA freshness age differs: ${jra.freshness_age_hours}`);
    if (jra.job_counts.queued !== 1 || jra.job_counts.success !== 1) fail('JRA job status counts differ.');
    if (!exact(jra.operator_attention, ['queued_work', 'review_queue', 'promotion_ready'])) fail(`JRA attention differs: ${JSON.stringify(jra.operator_attention)}`);
  }

  const nar = bySystem.get('japan-nar-system');
  if (!nar) fail('NAR Operations v2 row missing.');
  else {
    if (nar.due_job_count !== 3) fail(`NAR due Job count differs: ${nar.due_job_count}`);
    if (nar.retry_due_count !== 2) fail(`NAR retry due count differs: ${nar.retry_due_count}`);
    for (const attention of ['freshness', 'running_work', 'partial_result', 'review_queue', 'retry_due', 'publication_stale']) {
      if (!nar.operator_attention.includes(attention)) fail(`NAR attention missing ${attention}.`);
    }
  }

  const hkjc = bySystem.get('hong-kong-hkjc-system');
  if (!hkjc) fail('HKJC Operations v2 row missing.');
  else {
    if (hkjc.source_health !== 'degraded') fail('HKJC source health differs.');
    if (hkjc.job_counts.planned !== 1 || hkjc.job_counts.failure !== 1) fail('HKJC planned/failure counts differ.');
    for (const attention of ['source_health', 'freshness', 'recent_failure', 'review_queue']) {
      if (!hkjc.operator_attention.includes(attention)) fail(`HKJC attention missing ${attention}.`);
    }
  }

  const banei = bySystem.get('japan-banei-system');
  if (!banei) fail('Banei Operations v2 row missing.');
  else {
    if (banei.source_health !== 'unknown' || banei.freshness_age_hours !== null) fail('Banei unknown source/freshness state differs.');
    if (banei.due_job_count !== 1) fail(`Banei due Job count differs: ${banei.due_job_count}`);
    if (banei.retry_due_count !== 2) fail(`Banei retry due count differs: ${banei.retry_due_count}`);
    if (!exact(banei.operator_attention, ['source_health', 'freshness', 'retry_due'])) fail(`Banei attention differs: ${JSON.stringify(banei.operator_attention)}`);
  }

  if (output.operations_v1_ref !== 'data/generated/timetable/operations-status.json') fail('Operations v1 additive reference differs.');
  if (Object.values(output.boundaries).some((value) => value !== false)) fail('Operations v2 read-only boundaries enabled.');
}

function mutate(base, testCase) {
  const value = structuredClone(base);
  if (testCase.mutation === 'set') {
    let target = value;
    for (const segment of testCase.path.slice(0, -1)) target = target[segment];
    target[testCase.path.at(-1)] = structuredClone(testCase.value);
  } else if (testCase.mutation === 'increment') {
    let target = value;
    for (const segment of testCase.path.slice(0, -1)) target = target[segment];
    target[testCase.path.at(-1)] += testCase.value;
  } else if (testCase.mutation === 'remove_last_system') {
    value.systems.pop();
  } else {
    throw new Error(`unsupported mutation ${testCase.mutation}`);
  }
  return value;
}

if (invalidFixtures.schema_version !== 'calendar-operations-v2-invalid-cases-v1') fail('invalid Operations v2 fixture schema differs.');
const invalidCaseIds = new Set();
if (output) {
  for (const testCase of invalidFixtures.cases ?? []) {
    if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid Operations v2 case ${testCase.case_id}`);
    invalidCaseIds.add(testCase.case_id);
    const changed = mutate(output, testCase);
    if (validateOperationsV2V1(changed, registry).length === 0) fail(`invalid Operations v2 case unexpectedly passed: ${testCase.case_id}`);
  }
}
for (const required of [
  'network-fetch-enabled',
  'job-execution-enabled',
  'recent-result-count-drift',
  'unsafe-operations-v1-ref',
  'system-authority-drift',
  'system-runner-drift',
  'unsupported-source-health',
  'missing-system-row',
  'none-attention-mixed',
  'publication-state-invalid',
]) {
  if (!invalidCaseIds.has(required)) fail(`required invalid Operations v2 case missing: ${required}`);
}

const docs = readText('docs/calendar/operations-v2.md');
for (const phrase of [
  'additive v2 layer',
  'planned jobs',
  'queued jobs',
  'running jobs',
  'success / partial / failure',
  'Review Queue',
  'Retry Queue',
  'rank distributions',
  'source health',
  'freshness',
  'promotion state',
  'publication state',
  'read-only',
]) {
  if (!docs.includes(phrase)) fail(`Operations v2 contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-15 — Operations v2 operator view', 'Status: complete.']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_OPERATIONS_V2: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_OPERATIONS_V2: pass');
console.log(`SYSTEMS: ${output?.systems.length ?? 0}`);
console.log(`DUE_JOBS: ${output?.acquisition_summary.due_plan_job_count ?? 0}`);
console.log(`REVIEW_ENTRIES: ${output?.review_summary.entry_count ?? 0}`);
console.log(`RETRY_ENTRIES: ${output?.retry_summary.entry_count ?? 0}`);
console.log('ACQUISITION_STATE_ACCOUNTING: pass');
console.log('REVIEW_RETRY_RANK_AGGREGATION: pass');
console.log('SOURCE_HEALTH_AND_FRESHNESS: pass');
console.log('PROMOTION_AND_PUBLICATION_STATE: pass');
console.log('OPERATIONS_V1_ADDITIVE_REFERENCE: pass');
console.log('READ_ONLY_BOUNDARY: pass');
