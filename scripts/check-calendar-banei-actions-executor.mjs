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

const fixture = readJson('data/fixtures/calendar-banei-actions-executor-fixture-v1.json');
if (fixture.schema_version !== 'calendar-banei-actions-executor-fixture-v1') fail('fixture schema differs.');
if (baneiActionsExecutorV1Contract.executor_id !== 'banei-schedule-detail-actions') fail('executor ID contract differs.');
if (!exact(baneiActionsExecutorV1Contract.supported_collection_modes, ['date_window', 'selected_meetings'])) fail('supported collection modes differ.');

const outputs = new Map();
for (const execution of fixture.executions ?? []) {
  const scenario = fixture.scenarios.find((entry) => entry.collection_mode === execution.collection_mode);
  if (!scenario) {
    fail(`scenario missing for ${execution.collection_mode}`);
    continue;
  }
  try {
    const output = buildBaneiActionsArtifactsV1({
      execution,
      schedule_input: fixture.schedule_input,
      detail_candidate: scenario.detail_candidate,
      detail_coverage: scenario.detail_coverage,
      detail_report: scenario.detail_report,
    });
    outputs.set(execution.collection_mode, output);
  } catch (error) {
    fail(`${execution.collection_mode} normalization failed: ${error.message}`);
  }
}

for (const [mode, output] of outputs) {
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
}

const selected = outputs.get('selected_meetings');
if (selected) {
  if (!exact(selected.result_manifest.rank_counts, { C: 0, B: 1, 'B+': 0, A: 0, 'A+': 1 })) {
    fail(`selected rank counts differ: ${JSON.stringify(selected.result_manifest.rank_counts)}`);
  }
  if (selected.result_manifest.records_discovered !== 2 || selected.result_manifest.records_updated !== 1) fail('selected record counts differ.');
  if (selected.result_manifest.coverage_claim !== 'partial') fail('selected coverage must be partial.');
  if (selected.result_manifest.unresolved_meeting_ids.length !== 1 || selected.result_manifest.source_errors.length !== 1) fail('selected unresolved/error counts differ.');
  const byId = new Map(selected.candidate.records.map((record) => [record.meeting_id, record]));
  if (byId.get('banei-obihiro-racecourse-2026-07-04')?.capability_rank !== 'A+') fail('selected successful detail meeting must be A+.');
  if (byId.get('banei-obihiro-racecourse-2026-07-05')?.capability_rank !== 'B') fail('selected blocked meeting must retain B schedule evidence.');
}

const windowOutput = outputs.get('date_window');
if (windowOutput) {
  if (!exact(windowOutput.result_manifest.rank_counts, { C: 0, B: 1, 'B+': 1, A: 0, 'A+': 1 })) {
    fail(`window rank counts differ: ${JSON.stringify(windowOutput.result_manifest.rank_counts)}`);
  }
  if (windowOutput.result_manifest.records_discovered !== 3 || windowOutput.result_manifest.records_updated !== 1) fail('window record counts differ.');
  if (windowOutput.result_manifest.coverage_claim !== 'partial') fail('window coverage must be partial.');
  if (windowOutput.result_manifest.unresolved_meeting_ids.length !== 2 || windowOutput.result_manifest.source_errors.length !== 2) fail('window unresolved/error counts differ.');
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
      value.scenarios[0].detail_candidate.records[0].meeting_id = 'banei-obihiro-racecourse-2026-07-20';
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
      value.scenarios[0].detail_coverage.records_discovered = 3;
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
]) {
  if (!dispatcher.includes(phrase)) fail(`Actions dispatcher missing Banei executor marker: ${phrase}`);
}
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
for (const phrase of [
  'schedule evidence fallback',
  'A+ replacement',
  'date_window',
  'selected_meetings',
  'Result Manifest',
  'Review Queue',
  'Registry runner switch is separate',
]) {
  if (!docs.includes(phrase)) fail(`Banei Actions executor contract missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_ACTIONS_EXECUTOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_ACTIONS_EXECUTOR: pass');
console.log('SELECTED_RANKS: B=1 A+=1');
console.log('WINDOW_RANKS: B=1 B+=1 A+=1');
console.log('PARTIAL_FALLBACK_ACCOUNTING: pass');
console.log('COVERAGE_MANIFEST_QUEUE: pass');
console.log('RUNTIME_FIXTURE_CHECK_ONLY: pass');
