import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildBaneiActionsArtifactsV1, baneiActionsExecutorV1Contract } from './timetable/banei-actions-executor-core.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1, validateCollectionResultManifestAgainstCoverageV1 } from './timetable/collection-result-manifest-validation.mjs';
import { validateReviewQueueV1, validateReviewQueueEntryAgainstManifestV1 } from './timetable/review-queue-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (values) => [...values].sort();

const fixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');
if (fixture.schema_version !== 'calendar-banei-actions-executor-fixture-v1') fail('fixture schema differs.');
if (baneiActionsExecutorV1Contract.executor_id !== 'banei-schedule-detail-actions') fail('executor ID contract differs.');
if (!exact(baneiActionsExecutorV1Contract.supported_collection_modes, ['date_window', 'selected_meetings'])) fail('supported collection modes differ.');

function expectedTargetIds(execution) {
  if (execution.collection_mode === 'selected_meetings') return sorted(execution.requested_scope.meeting_ids ?? []);
  if (execution.collection_mode === 'date_window') {
    return sorted((fixture.schedule_input.meetings ?? [])
      .filter((meeting) => execution.requested_scope.start_date <= meeting.date && meeting.date < execution.requested_scope.end_date_exclusive)
      .map((meeting) => meeting.meeting_id));
  }
  return [];
}

const outputs = new Map();
for (const execution of fixture.executions ?? []) {
  const scenario = fixture.scenarios.find((entry) => entry.collection_mode === execution.collection_mode);
  if (!scenario) {
    fail(`scenario missing for ${execution.collection_mode}`);
    continue;
  }
  try {
    outputs.set(execution.collection_mode, buildBaneiActionsArtifactsV1({
      execution,
      schedule_input: fixture.schedule_input,
      detail_candidate: scenario.detail_candidate,
      detail_coverage: scenario.detail_coverage,
      detail_report: scenario.detail_report,
    }));
  } catch (error) {
    fail(`${execution.collection_mode} normalization failed: ${error.message}`);
  }
}

for (const execution of fixture.executions ?? []) {
  const mode = execution.collection_mode;
  const output = outputs.get(mode);
  const scenario = fixture.scenarios.find((entry) => entry.collection_mode === mode);
  if (!output || !scenario) continue;

  const coverageValidation = validateCoverageObservation(output.coverage_observation);
  if (!coverageValidation.valid) fail(`${mode} Coverage invalid: ${coverageValidation.errors.join('; ')}`);
  const manifestErrors = [
    ...validateCollectionResultManifestV1(output.result_manifest),
    ...validateCollectionResultManifestAgainstCoverageV1(output.result_manifest, output.coverage_observation),
  ];
  if (manifestErrors.length) fail(`${mode} Manifest invalid: ${manifestErrors.join('; ')}`);
  const reviewErrors = validateReviewQueueV1(output.review_queue);
  if (reviewErrors.length) fail(`${mode} Review Queue invalid: ${reviewErrors.join('; ')}`);
  else {
    const entryErrors = validateReviewQueueEntryAgainstManifestV1(output.review_queue.entries[0], output.result_manifest);
    if (entryErrors.length) fail(`${mode} Review Queue/Manifest cross-check failed: ${entryErrors.join('; ')}`);
  }

  const rankTotal = Object.values(output.result_manifest.rank_counts).reduce((sum, value) => sum + value, 0);
  if (rankTotal !== output.result_manifest.records_discovered) fail(`${mode} rank total does not equal records_discovered.`);
  if (output.candidate.review.status !== 'needs_review') fail(`${mode} candidate review status differs.`);
  if (output.review_queue.entries[0].review_state !== 'review_ready' || output.review_queue.entries[0].promotion_state !== 'not_ready') {
    fail(`${mode} Review Queue initial state differs.`);
  }
  if (output.collection_report.publication_effect !== 'none') fail(`${mode} publication effect differs.`);

  const expectedIds = expectedTargetIds(execution);
  const actualIds = sorted(output.candidate.records.map((record) => record.meeting_id));
  if (!exact(actualIds, expectedIds)) fail(`${mode} candidate scope differs from execution scope.`);

  const expectedCoverage = scenario.detail_coverage;
  for (const field of ['records_discovered', 'records_updated', 'coverage_claim']) {
    if (output.result_manifest[field] !== expectedCoverage[field]) fail(`${mode} manifest ${field} differs from fixture coverage.`);
  }
  if (!exact(sorted(output.result_manifest.unresolved_meeting_ids), sorted(expectedCoverage.unresolved_meeting_ids ?? []))) {
    fail(`${mode} unresolved meeting IDs differ from fixture coverage.`);
  }
  if (output.result_manifest.source_errors.length !== (expectedCoverage.source_errors ?? []).length) {
    fail(`${mode} source error count differs from fixture coverage.`);
  }

  const outputById = new Map(output.candidate.records.map((record) => [record.meeting_id, record]));
  for (const detailRecord of scenario.detail_candidate.records ?? []) {
    const merged = outputById.get(detailRecord.meeting_id);
    if (!merged) fail(`${mode} detail candidate missing from merged output: ${detailRecord.meeting_id}`);
    else if (merged.capability_rank !== detailRecord.capability_rank) fail(`${mode} detail candidate rank was not preserved for ${detailRecord.meeting_id}.`);
  }
}

for (const execution of fixture.executions ?? []) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-banei-actions-check-'));
  const executionPath = path.join(tempDir, 'execution.json');
  fs.writeFileSync(executionPath, `${JSON.stringify(execution, null, 2)}\n`);
  const outputDir = path.join(root, `data/generated/timetable/actions-multi-job/${execution.batch_id}`);
  const existedBefore = fs.existsSync(outputDir);
  const result = spawnSync(process.execPath, [
    'scripts/timetable/run-banei-actions-job.mjs',
    `--execution=${executionPath}`,
    '--fixture=data/fixtures/calendar-banei-actions-executor-fixture-v1.json',
    '--check-only',
  ], { cwd: root, encoding: 'utf8' });
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (result.status !== 0) fail(`runtime fixture check failed for ${execution.collection_mode}: ${result.stderr || result.stdout}`);
  if (!existedBefore && fs.existsSync(outputDir)) fail(`check-only runtime wrote output directory for ${execution.collection_mode}.`);
}

for (const mutation of [
  {
    name: 'detail-outside-scope',
    change(value) {
      value.scenarios[0].detail_candidate.records[0].meeting_id = 'fixture-outside-requested-scope';
    },
  },
  {
    name: 'detail-rank-not-a-plus',
    change(value) {
      value.scenarios[0].detail_candidate.records[0].capability_rank = 'A';
    },
  },
  {
    name: 'discovered-count-drift',
    change(value) {
      value.scenarios[0].detail_coverage.records_discovered += 1;
    },
  },
]) {
  const changed = structuredClone(fixture);
  mutation.change(changed);
  const execution = changed.executions.find((entry) => entry.collection_mode === 'selected_meetings');
  const scenario = changed.scenarios.find((entry) => entry.collection_mode === 'selected_meetings');
  let rejected = false;
  try {
    buildBaneiActionsArtifactsV1({ execution, schedule_input: changed.schedule_input, detail_candidate: scenario.detail_candidate, detail_coverage: scenario.detail_coverage, detail_report: scenario.detail_report });
  } catch {
    rejected = true;
  }
  if (!rejected) fail(`invalid executor case unexpectedly passed: ${mutation.name}`);
}

const dispatcher = readText('scripts/timetable/run-calendar-actions-job.mjs');
for (const phrase of [
  "execution.executor_id === 'banei-schedule-detail-actions'",
  'scripts/timetable/run-banei-actions-job.mjs',
]) if (!dispatcher.includes(phrase)) fail(`Actions dispatcher missing Banei executor marker: ${phrase}`);

const actionsCore = readText('scripts/timetable/actions-multi-job-core.mjs');
if (!actionsCore.includes("execution.executor_id === 'banei-schedule-detail-actions'")) fail('Actions multi-job artifact path mapping missing Banei executor.');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const mapping = compatibility.executors.find((entry) => entry.system_id === 'japan-banei-system' && entry.runner === 'github_actions');
if (!mapping) fail('Banei Actions compatibility mapping missing.');
else {
  if (mapping.executor_id !== 'banei-schedule-detail-actions') fail('Banei executor mapping ID differs.');
  if (!exact(mapping.supported_collection_modes, ['date_window', 'selected_meetings'])) fail('Banei compatibility modes differ.');
}

const docs = readText('docs/calendar/banei-actions-executor.md');
for (const phrase of ['schedule evidence fallback', 'A+ replacement', 'date_window', 'selected_meetings', 'Result Manifest', 'Review Queue', 'Registry runner switch is separate']) {
  if (!docs.includes(phrase)) fail(`Banei Actions executor contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_ACTIONS_EXECUTOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_ACTIONS_EXECUTOR: pass');
console.log(`SCENARIOS_VALIDATED: ${outputs.size}`);
console.log('FIXTURE_DRIVEN_SCOPE_AND_COUNTS: pass');
console.log('PARTIAL_FALLBACK_ACCOUNTING: pass');
console.log('COVERAGE_MANIFEST_QUEUE: pass');
console.log('RUNTIME_FIXTURE_CHECK_ONLY: pass');
