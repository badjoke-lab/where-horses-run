import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildHkjcFixtureArtifacts } from './hkjc-fixture-artifact-bridge-core.mjs';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1 } from './collection-result-manifest-validation.mjs';

const root = process.cwd();
const executionArg = process.argv.find((arg) => arg.startsWith('--execution='));
if (!executionArg) throw new Error('--execution=<path> is required');
const fixtureArg = process.argv.find((arg) => arg.startsWith('--check-only-fixture='));
const executionPath = path.resolve(root, executionArg.slice('--execution='.length));
const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));

function assertExecution(value) {
  if (value.schema_version !== 'calendar-runner-execution-v1') throw new Error('execution schema mismatch');
  if (value.system_id !== 'hong-kong-hkjc-system') throw new Error('HKJC live fixture executor requires hong-kong-hkjc-system');
  if (value.runner_used !== 'github_actions') throw new Error('HKJC live fixture executor requires github_actions runner');
  if (value.executor_id !== 'hkjc-live-fixture-actions') throw new Error('HKJC live fixture executor_id mismatch');
  if (value.collection_mode !== 'date_window') throw new Error('HKJC live fixture executor supports date_window only');
  if (value.requested_scope?.timezone !== 'Asia/Hong_Kong') throw new Error('HKJC live fixture executor requires Asia/Hong_Kong timezone');
  if (value.source_route?.schedule_source_id !== 'hkjc-fixture-list') throw new Error('HKJC live fixture schedule source mismatch');
  if (value.source_route?.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') throw new Error('HKJC live fixture schedule adapter mismatch');
  if (value.source_route?.detail_source_id !== 'hkjc-detail-reviewed-import'
    || value.source_route?.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') {
    throw new Error('HKJC live fixture Registry route snapshot differs from the activated operator detail identity');
  }
  if (value.review_required !== true) throw new Error('HKJC live fixture execution must require review');
  for (const [key, enabled] of Object.entries(value.side_effect_boundary ?? {})) {
    if (enabled !== false) throw new Error(`HKJC live fixture side effect ${key} must remain false`);
  }
}

function validateArtifacts(artifacts) {
  const coverageValidation = validateCoverageObservation(artifacts.coverage);
  if (!coverageValidation.valid) throw new Error(`HKJC live fixture Coverage invalid: ${coverageValidation.errors.join('; ')}`);
  const manifestErrors = validateCollectionResultManifestV1(artifacts.manifest);
  if (manifestErrors.length) throw new Error(`HKJC live fixture Manifest invalid: ${manifestErrors.join('; ')}`);
  if (artifacts.candidate.schema_version !== 'timetable-candidate-v1') throw new Error('HKJC live fixture candidate schema mismatch');
  if (artifacts.candidate.review?.status !== 'needs_review') throw new Error('HKJC live fixture candidate must remain needs_review');
  if ((artifacts.candidate.records ?? []).some((record) => record.capability_rank !== 'C')) throw new Error('HKJC fixture executor may emit C candidates only');
  if ((artifacts.candidate.records ?? []).some((record) => record.first_race_time_local !== null || record.last_race_time_local !== null || record.timetable_rows?.length)) {
    throw new Error('HKJC C fixture candidate leaked race-time or timetable-row detail');
  }
}

function readFixtureArtifacts(fixtureId) {
  const fixturePath = path.join(root, 'data/fixtures/calendar-hkjc-actions-live-job-fixture-v1.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const scenario = fixture.scenarios?.find((entry) => entry.id === fixtureId);
  if (!scenario) throw new Error(`HKJC live fixture scenario not found: ${fixtureId}`);
  const scope = execution.requested_scope;
  if (scenario.start_date !== scope.start_date || scenario.end_date_exclusive !== scope.end_date_exclusive) {
    throw new Error(`HKJC fixture scenario scope differs from execution: ${fixtureId}`);
  }
  const artifacts = buildHkjcFixtureArtifacts({
    startDate: scope.start_date,
    endDateExclusive: scope.end_date_exclusive,
    generatedAt: scenario.generated_at,
    batchId: execution.batch_id,
    campaignId: execution.campaign_id,
    jobId: execution.job_id,
    monthResults: scenario.month_results,
    runnerUsed: execution.runner_used,
  });
  validateArtifacts(artifacts);
  return { artifacts, scenario };
}

function readArtifactsFromDirectory(directory) {
  const names = {
    candidate: 'candidates.json',
    coverage: 'coverage-observation.json',
    manifest: 'result-manifest.json',
    report: 'collection-report.json',
  };
  const artifacts = Object.fromEntries(Object.entries(names).map(([key, filename]) => [
    key,
    JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8')),
  ]));
  validateArtifacts(artifacts);
  return artifacts;
}

function copyReviewArtifacts(sourceDirectory, targetDirectory) {
  fs.mkdirSync(targetDirectory, { recursive: true });
  for (const filename of ['candidates.json', 'coverage-observation.json', 'result-manifest.json', 'collection-report.json']) {
    fs.copyFileSync(path.join(sourceDirectory, filename), path.join(targetDirectory, filename));
  }
}

function runLiveCollector(tempDirectory) {
  const scope = execution.requested_scope;
  const result = spawnSync(process.execPath, [
    'scripts/timetable/collect-hkjc-fixture-artifacts.mjs',
    `--from=${scope.start_date}`,
    `--to-exclusive=${scope.end_date_exclusive}`,
    `--output-dir=${tempDirectory}`,
    `--batch-id=${execution.batch_id}`,
    `--campaign-id=${execution.campaign_id}`,
    `--job-id=${execution.job_id}`,
  ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`HKJC live fixture collector failed: ${(result.stderr || result.stdout || '').slice(0, 2000)}`);
  }
  return result;
}

assertExecution(execution);

if (fixtureArg) {
  const fixtureId = fixtureArg.slice('--check-only-fixture='.length);
  const { artifacts, scenario } = readFixtureArtifacts(fixtureId);
  const output = {
    implementation_unit: 'HKJC-PILOT-03',
    execution_mode: 'fixture_check_only',
    fixture_id: fixtureId,
    batch_id: execution.batch_id,
    coverage_claim: artifacts.coverage.coverage_claim,
    records_discovered: artifacts.coverage.records_discovered,
    source_error_count: artifacts.coverage.source_errors.length,
    expected_coverage_claim: scenario.expected.coverage_claim,
    expected_records_discovered: scenario.expected.records_discovered,
    schedule_only_execution: true,
    operator_detail_route_invoked: false,
    repository_write: false,
    canonical_write: false,
    public_write: false,
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-hkjc-live-job-'));
const tempOutput = path.join(tempRoot, 'artifacts');
const sharedOutput = path.join(root, `data/generated/timetable/actions-multi-job/${execution.batch_id}`);

try {
  runLiveCollector(tempOutput);
  const artifacts = readArtifactsFromDirectory(tempOutput);
  copyReviewArtifacts(tempOutput, sharedOutput);
  console.log(JSON.stringify({
    implementation_unit: 'HKJC-PILOT-03',
    execution_mode: 'live_shared_actions_job',
    batch_id: execution.batch_id,
    coverage_claim: artifacts.coverage.coverage_claim,
    records_discovered: artifacts.coverage.records_discovered,
    source_error_count: artifacts.coverage.source_errors.length,
    output_dir: path.relative(root, sharedOutput),
    schedule_only_execution: true,
    operator_detail_route_invoked: false,
    publication_effect: 'none',
    canonical_write: false,
    public_write: false,
  }));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
