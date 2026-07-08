import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateReviewQueueV1 } from './timetable/review-queue-validation.mjs';
import { planReviewCohortsV1, validateReviewCohortPlanV1 } from './timetable/review-cohort-planner.mjs';
import {
  prepareReviewPrPackagesV1,
  reviewPrPreparationV1Contract,
  validateReviewPrPackageSetV1,
} from './timetable/review-pr-preparation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const schema = readJson('data/static/calendar-review-pr-package.schema.json');
const fixtures = readJson('data/fixtures/calendar-review-pr-preparation-fixtures-v1.json');
const invalidFixtures = readJson('data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('Review PR package schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-review-pr-package.schema.json') fail('Review PR package schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('Review PR package schema must be closed.');
if (schema.properties?.schema_version?.const !== 'calendar-review-pr-package-v1') fail('Review PR package schema version differs.');
if (!exact(schema.$defs?.package?.required, reviewPrPreparationV1Contract.package_keys)) fail('Review PR package keys differ from preparation core.');
if (!exact(schema.$defs?.boundaries?.required, Object.keys(reviewPrPreparationV1Contract.boundaries))) fail('Review PR package boundary keys differ from preparation core.');
for (const [key, value] of Object.entries(reviewPrPreparationV1Contract.boundaries)) {
  if (schema.$defs?.boundaries?.properties?.[key]?.const !== value) fail(`Review PR package boundary schema differs for ${key}.`);
}

if (fixtures.schema_version !== 'calendar-review-pr-preparation-fixtures-v1') fail('Review PR preparation fixture schema differs.');
const queueErrors = validateReviewQueueV1(fixtures.queue);
if (queueErrors.length) fail(`Review PR fixture Queue invalid: ${queueErrors.join('; ')}`);

let cohortPlan = null;
let output = null;
try {
  cohortPlan = planReviewCohortsV1(fixtures.queue, registry);
  const planErrors = validateReviewCohortPlanV1(cohortPlan, fixtures.queue, registry);
  if (planErrors.length) fail(`fixture Review Cohort Plan invalid: ${planErrors.join('; ')}`);
  output = prepareReviewPrPackagesV1(cohortPlan, {
    review_queue: fixtures.queue,
    registry,
    artifact_catalog: fixtures.artifact_catalog,
    canonical_meetings: fixtures.canonical_meetings,
    retry_queue: fixtures.retry_queue,
  });
} catch (error) {
  fail(`Review PR preparation failed: ${error.message}`);
}

if (output && cohortPlan) {
  const validationErrors = validateReviewPrPackageSetV1(output, cohortPlan, fixtures.artifact_catalog);
  if (validationErrors.length) fail(`Review PR package validation failed: ${validationErrors.join('; ')}`);
  if (output.packages.length !== fixtures.expected.package_count) fail(`package count differs: ${output.packages.length}`);

  const jra = output.packages.find((pkg) => pkg.system_id === 'japan-jra-system');
  if (!jra) fail('JRA review package missing.');
  else {
    const diff = jra.candidate_diff_summary;
    for (const [key, value] of Object.entries(fixtures.expected.jra_diff)) {
      if (diff[key] !== value) fail(`JRA diff ${key} differs: ${diff[key]} != ${value}`);
    }
    const transitionKeys = new Set(diff.transitions.map((entry) => `${entry.from_rank ?? 'NEW'}->${entry.to_rank}:${entry.count}`));
    if (!transitionKeys.has('A->A+:1') || !transitionKeys.has('A+->A+:1')) fail('JRA A→A+ and A+ unchanged transitions are not both preserved.');
  }

  const narCoverage = output.packages.find((pkg) =>
    pkg.system_id === 'japan-nar-system' && pkg.cohort_kind === 'coverage_review');
  if (!narCoverage) fail('NAR coverage-review package missing.');
  else {
    if (narCoverage.retry_summary.matched_retry_count !== fixtures.expected.nar_retry_count) fail('NAR matched retry count differs.');
    if (narCoverage.retry_summary.due_now_count !== 1 || narCoverage.retry_summary.deferred_count !== 0) fail('NAR retry due/deferred summary differs.');
    if (narCoverage.retry_summary.by_reason.scheduled_pending_details !== 1) fail('NAR retry reason summary differs.');
    if (narCoverage.coverage_summary.unresolved_meeting_ids_count !== 1) fail('NAR unresolved meeting summary differs.');
  }

  const sourceFailure = output.packages.find((pkg) => pkg.cohort_kind === 'source_failure_review');
  if (!sourceFailure) fail('source-failure review package missing.');
  else {
    if (sourceFailure.candidate_diff_summary.candidate_count !== fixtures.expected.source_failure_candidate_count) fail('source-failure candidate count differs.');
    if (sourceFailure.coverage_summary.source_error_count !== 1) fail('source-failure source error summary differs.');
    if (!sourceFailure.checklist.includes('Recover or revalidate the source route before candidate promotion.')) fail('source-failure checklist requirement missing.');
  }

  const hkjc = output.packages.find((pkg) => pkg.system_id === 'hong-kong-hkjc-system');
  if (!hkjc) fail('HKJC review package missing.');
  else {
    if (hkjc.promotion_dependency !== fixtures.expected.hkjc_dependency) fail('HKJC Public Ceiling dependency differs.');
    if (!hkjc.checklist.includes('Verify Public Ceiling projection removes fields above the active public ceiling.')) fail('HKJC Public Ceiling checklist item missing.');
  }

  for (const pkg of output.packages) {
    if (!pkg.proposed_pr.body_markdown.includes('**human review required**')) fail(`${pkg.package_id} PR body lacks human review marker.`);
    if (pkg.proposed_pr.labels.length !== 1 || pkg.proposed_pr.labels[0] !== 'human review required') fail(`${pkg.package_id} review label differs.`);
    if (pkg.proposed_pr.review_state !== 'pending_human_review') fail(`${pkg.package_id} review state differs.`);
    if (Object.values(pkg.boundaries).some((value) => value !== false)) fail(`${pkg.package_id} side-effect boundary enabled.`);
  }
}

function applyMutation(base, testCase) {
  const value = structuredClone(base);
  let target = value;
  for (const segment of testCase.path.slice(0, -1)) target = target[segment];
  const key = testCase.path.at(-1);
  if (testCase.mutation === 'set') target[key] = structuredClone(testCase.value);
  else if (testCase.mutation === 'increment') target[key] += testCase.value;
  else throw new Error(`unsupported mutation ${testCase.mutation}`);
  return value;
}

if (invalidFixtures.schema_version !== 'calendar-review-pr-preparation-invalid-cases-v1') fail('invalid Review PR fixture schema differs.');
const invalidCaseIds = new Set();
if (output && cohortPlan) {
  for (const testCase of invalidFixtures.cases ?? []) {
    if (invalidCaseIds.has(testCase.case_id)) fail(`duplicate invalid Review PR case ${testCase.case_id}`);
    invalidCaseIds.add(testCase.case_id);
    const mutated = applyMutation(output, testCase);
    if (validateReviewPrPackageSetV1(mutated, cohortPlan, fixtures.artifact_catalog).length === 0) {
      fail(`invalid Review PR case unexpectedly passed: ${testCase.case_id}`);
    }
  }
}
for (const required of [
  'candidate-diff-count-drift',
  'coverage-batch-count-drift',
  'retry-total-drift',
  'manifest-ref-drift',
  'unsafe-candidate-ref',
  'human-review-label-removed',
  'review-state-approved',
  'pr-body-human-boundary-removed',
  'pull-request-created-flag-enabled',
  'candidate-approved-flag-enabled',
  'promotion-performed-flag-enabled',
  'package-system-drift',
]) {
  if (!invalidCaseIds.has(required)) fail(`required invalid Review PR case missing: ${required}`);
}

const workflow = readText('.github/workflows/calendar-review-pr-preparation.yml');
for (const phrase of [
  'permissions:\n  contents: read',
  'actions/upload-artifact@v4',
  'Prepare deterministic review PR package',
  'human review required',
]) {
  if (!workflow.includes(phrase)) fail(`Review PR preparation workflow missing ${phrase}.`);
}
if (/pull-requests:\s*write/.test(workflow)) fail('Review PR preparation workflow must not request pull-requests: write.');
if (/contents:\s*write/.test(workflow)) fail('Review PR preparation workflow must not request contents: write.');
if (/\bschedule\s*:|\bcron\s*:/.test(workflow)) fail('Review PR preparation workflow must not have schedule or cron trigger.');

const docs = readText('docs/calendar/review-pr-preparation.md');
for (const phrase of [
  'preparation is not PR creation',
  'candidate diff summary',
  'Coverage summary',
  'retry summary',
  'human review required',
  'pending_human_review',
  'pull-requests: write',
]) {
  if (!docs.includes(phrase)) fail(`Review PR preparation contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-13 — automatic review PR preparation', 'Status: complete.', 'Stage ACP-14 — due-job planner and scheduling', 'Status: current.']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_REVIEW_PR_PREPARATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_REVIEW_PR_PREPARATION: pass');
console.log(`PACKAGES: ${output?.packages.length ?? 0}`);
console.log('CANDIDATE_DIFF_SUMMARY: pass');
console.log('COVERAGE_SUMMARY: pass');
console.log('RETRY_SUMMARY: pass');
console.log('PUBLIC_CEILING_CHECKLIST: pass');
console.log('HUMAN_REVIEW_BOUNDARY: pass');
console.log('NO_PR_CREATION_PERMISSION: pass');
console.log('NO_APPROVAL_OR_PROMOTION_SIDE_EFFECT: pass');
