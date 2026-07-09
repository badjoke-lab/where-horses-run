import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateReviewQueueV1 } from './timetable/review-queue-validation.mjs';
import {
  classifyReviewQueueEntryForCohortV1,
  planReviewCohortsV1,
  reviewCohortPlannerV1Contract,
  summarizeReviewCohortPlanV1,
  validateReviewCohortPlanV1,
} from './timetable/review-cohort-planner.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-review-cohort-plan.schema.json');
const fixtures = readJson('data/fixtures/calendar-review-cohort-planner-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Review Cohort Plan schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-review-cohort-plan.schema.json') fail('Review Cohort Plan schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Review Cohort Plan schema must be closed.');
if (schema.properties?.schema_version?.const !== 'calendar-review-cohort-plan-v1') fail('Review Cohort Plan schema version differs.');
if (!exact(schema.$defs?.cohort?.properties?.cohort_kind?.enum, reviewCohortPlannerV1Contract.cohort_kinds)) fail('cohort kind enum differs from planner core.');
if (!exact(schema.$defs?.cohort?.properties?.public_display_risk?.enum, reviewCohortPlannerV1Contract.display_risks)) fail('display risk enum differs from planner core.');
if (!exact(schema.$defs?.cohort?.properties?.promotion_dependency?.enum, reviewCohortPlannerV1Contract.promotion_dependencies)) fail('promotion dependency enum differs from planner core.');
if (!exact(schema.$defs?.excluded?.properties?.reason?.enum, reviewCohortPlannerV1Contract.exclusion_reasons)) fail('exclusion reason enum differs from planner core.');

if (fixtures.schema_version !== 'calendar-review-cohort-planner-fixtures-v1') fail('Review Cohort fixture schema differs.');
const queueErrors = validateReviewQueueV1(fixtures.queue);
if (queueErrors.length) fail(`Review Cohort fixture queue invalid: ${queueErrors.join('; ')}`);

let plan = null;
try {
  plan = planReviewCohortsV1(fixtures.queue, registry);
} catch (error) {
  fail(`Review Cohort planning failed: ${error.message}`);
}

if (plan) {
  const validationErrors = validateReviewCohortPlanV1(plan, fixtures.queue, registry);
  if (validationErrors.length) fail(`Review Cohort Plan validation failed: ${validationErrors.join('; ')}`);
  const summary = summarizeReviewCohortPlanV1(plan);
  if (!exact(summary, fixtures.expected_summary)) fail(`Review Cohort summary differs: ${JSON.stringify(summary)}`);

  const jraClean = plan.cohorts.find((cohort) =>
    cohort.system_id === 'japan-jra-system'
    && cohort.cohort_kind === 'candidate_review'
    && cohort.public_display_risk === 'programme_summary'
    && cohort.source_error_count === 0
    && cohort.unresolved_dates_count === 0);
  if (!jraClean || jraClean.batch_count !== 2) fail('compatible JRA clean batches from different campaigns must share one cohort.');
  else {
    const campaigns = new Set(jraClean.batches.map((batch) => batch.campaign_id));
    if (campaigns.size !== 2) fail('JRA compatibility cohort must prove cross-campaign grouping.');
  }

  const narSameCampaign = plan.cohorts.filter((cohort) =>
    cohort.batches.some((batch) => batch.campaign_id === 'nar-shared-campaign'));
  if (narSameCampaign.length !== 2) fail('same NAR campaign with different risk/coverage must split into two cohorts.');
  else {
    const risks = new Set(narSameCampaign.map((cohort) => cohort.public_display_risk));
    const kinds = new Set(narSameCampaign.map((cohort) => cohort.cohort_kind));
    if (!risks.has('meeting_only') || !risks.has('programme_summary')) fail('NAR same-campaign split must preserve public display risk.');
    if (!kinds.has('candidate_review') || !kinds.has('coverage_review')) fail('NAR same-campaign split must preserve cohort kind.');
  }

  const sourceFailure = plan.cohorts.find((cohort) => cohort.cohort_kind === 'source_failure_review');
  if (!sourceFailure || sourceFailure.batch_count !== 1 || sourceFailure.promotion_dependency !== 'source_recovery_required') {
    fail('source failure must remain isolated in one source-recovery cohort.');
  }

  const excludedReasons = new Set(plan.excluded.map((entry) => entry.reason));
  for (const reason of ['already_reviewing', 'already_reviewed_or_promoted', 'rejected']) {
    if (!excludedReasons.has(reason)) fail(`required exclusion reason missing: ${reason}`);
  }

  if (!plan.cohorts.every((cohort) =>
    cohort.proposal.human_review_required === true
    && cohort.proposal.automatic_approval === false
    && cohort.proposal.automatic_promotion === false)) {
    fail('all review cohort proposals must stop at human review boundary.');
  }
}

const hkjcProfile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
const ceilingCase = {
  campaign_id: 'hkjc-ceiling-test',
  job_id: 'hkjc-ceiling-job',
  batch_id: 'hkjc-ceiling-batch',
  system_id: 'hong-kong-hkjc-system',
  runner_used: 'github_actions',
  requested_scope: { start_date: '2026-08-01', end_date_exclusive: '2026-08-10', timezone: 'Asia/Hong_Kong' },
  coverage_claim: 'source_window_complete',
  rank_counts: { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 1 },
  unresolved_dates_count: 0,
  unresolved_meeting_ids_count: 0,
  source_error_count: 0,
  review_state: 'review_ready',
  promotion_state: 'not_ready',
  manifest_ref: 'data/generated/timetable/manifests/hkjc-ceiling-batch.json',
};
try {
  const classification = classifyReviewQueueEntryForCohortV1(ceilingCase, hkjcProfile);
  if (classification.public_display_risk !== 'programme_summary') fail('A+ observation must retain programme_summary review risk even when public ceiling is lower.');
  if (classification.promotion_dependency !== 'public_ceiling_projection_required') fail('A+ above HKJC public ceiling A must require public ceiling projection.');
} catch (error) {
  fail(`public ceiling classification failed: ${error.message}`);
}

function applyMutation(base, testCase) {
  const value = structuredClone(base);
  let target = value;
  for (const segment of testCase.path.slice(0, -1)) target = target[segment];
  const key = testCase.path.at(-1);
  if (testCase.mutation === 'set') {
    target[key] = structuredClone(testCase.value);
  } else if (testCase.mutation === 'increment') {
    target[key] += testCase.value;
  } else if (testCase.mutation === 'remove_first_batch_and_fix_count') {
    const cohort = target[key];
    cohort.batches.shift();
    cohort.batch_count = cohort.batches.length;
  } else if (testCase.mutation === 'duplicate_first_batch') {
    const cohort = target[key];
    cohort.batches.push(structuredClone(cohort.batches[0]));
    cohort.batch_count = cohort.batches.length;
  } else {
    throw new Error(`unsupported mutation ${testCase.mutation}`);
  }
  return value;
}

if (invalidFixtures.schema_version !== 'calendar-review-cohort-planner-invalid-cases-v1') fail('invalid Review Cohort fixture schema differs.');
const invalidCaseIds = new Set();
if (plan) {
  for (const testCase of invalidFixtures.cases ?? []) {
    if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid Review Cohort case ${testCase.case_id}`);
    invalidCaseIds.add(testCase.case_id);
    const mutated = applyMutation(plan, testCase);
    if (validateReviewCohortPlanV1(mutated, fixtures.queue, registry).length === 0) {
      fail(`invalid Review Cohort case unexpectedly passed: ${testCase.case_id}`);
    }
  }
}
for (const required of [
  'schedule-source-drift',
  'public-ceiling-drift',
  'display-risk-drift',
  'promotion-dependency-drift',
  'rank-aggregate-drift',
  'batch-count-drift',
  'automatic-approval-enabled',
  'automatic-promotion-enabled',
  'unsafe-manifest-ref',
  'excluded-reason-drift',
  'missing-batch-accounting',
  'duplicate-batch-accounting',
]) {
  if (!invalidCaseIds.has(required)) fail(`required invalid Review Cohort case missing: ${required}`);
}

const docs = readText('docs/calendar/review-cohort-planner.md');
for (const phrase of [
  'collection time is not a grouping key',
  'system/source compatibility',
  'public display risk',
  'Source failure isolation',
  'human review required',
  'One campaign may produce several review proposals',
]) {
  if (!docs.includes(phrase)) fail(`Review Cohort Planner contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const heading of ['Stage ACP-12 — review cohort planner', 'Stage ACP-13 — automatic review PR preparation']) {
  if (!implementationPlan.includes(heading)) fail(`control-plane implementation plan missing ${heading}.`);
}
const acp12Section = implementationPlan.split('## Stage ACP-12 — review cohort planner')[1]?.split('## Stage ACP-13 — automatic review PR preparation')[0] ?? '';
const acp13Section = implementationPlan.split('## Stage ACP-13 — automatic review PR preparation')[1]?.split('## Stage ACP-14 — due-job planner and scheduling')[0] ?? '';
if (!acp12Section.includes('Status: complete.')) fail('control-plane implementation plan must mark ACP-12 complete.');
if (!acp13Section.includes('Status: complete.')) fail('control-plane implementation plan must mark ACP-13 complete.');

if (errors.length) {
  console.error(`CALENDAR_REVIEW_COHORT_PLANNER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_REVIEW_COHORT_PLANNER: pass');
console.log(`COHORTS: ${plan?.cohorts.length ?? 0}`);
console.log(`COHORT_BATCHES: ${plan?.cohorts.reduce((sum, cohort) => sum + cohort.batch_count, 0) ?? 0}`);
console.log(`EXCLUDED: ${plan?.excluded.length ?? 0}`);
console.log('CROSS_CAMPAIGN_COMPATIBLE_GROUPING: pass');
console.log('SAME_CAMPAIGN_RISK_SPLIT: pass');
console.log('SOURCE_FAILURE_ISOLATION: pass');
console.log('PUBLIC_CEILING_DEPENDENCY: pass');
console.log('FULL_QUEUE_ACCOUNTING: pass');
console.log('HUMAN_REVIEW_BOUNDARY: pass');
