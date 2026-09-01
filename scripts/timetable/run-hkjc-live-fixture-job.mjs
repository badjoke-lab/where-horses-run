import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildHkjcFixtureArtifacts } from './hkjc-fixture-artifact-bridge-core.mjs';
import { buildHkjcLiveBestAvailableArtifacts } from './hkjc-live-best-available-core.mjs';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1 } from './collection-result-manifest-validation.mjs';

const root = process.cwd();
const executionArg = process.argv.find((arg) => arg.startsWith('--execution='));
if (!executionArg) throw new Error('--execution=<path> is required');
const fixtureArg = process.argv.find((arg) => arg.startsWith('--check-only-fixture='));
const executionPath = path.resolve(root, executionArg.slice('--execution='.length));
const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));
const allowedRanks = new Set(['C', 'B', 'B+', 'A', 'A+']);

const protectedPaths = [
  'data/sources/timetable/hkjc-racecard-route.json',
  'data/generated/timetable/hkjc-racecard-source-snapshot.json',
  'data/generated/timetable/hkjc-refresh-report.json',
  'data/generated/timetable/hkjc-normalized-timetable.sample.json',
  'data/generated/timetable/hkjc-normalized-meeting-details.sample.json',
];

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

function validateRankShape(record) {
  if (!allowedRanks.has(record.capability_rank)) throw new Error(`HKJC live candidate rank invalid: ${record.capability_rank}`);
  const rows = record.timetable_rows ?? [];
  if (record.capability_rank === 'C' && (record.first_race_time_local !== null || record.last_race_time_local !== null || rows.length)) {
    throw new Error(`HKJC C candidate leaked timetable detail: ${record.meeting_id}`);
  }
  if (record.capability_rank === 'B' && (!record.first_race_time_local || record.last_race_time_local !== null || rows.length)) {
    throw new Error(`HKJC B candidate shape differs: ${record.meeting_id}`);
  }
  if (record.capability_rank === 'B+' && (!record.first_race_time_local || !record.last_race_time_local || rows.length)) {
    throw new Error(`HKJC B+ candidate shape differs: ${record.meeting_id}`);
  }
  if (['A', 'A+'].includes(record.capability_rank) && (!record.first_race_time_local || !record.last_race_time_local || rows.length < 2)) {
    throw new Error(`HKJC ${record.capability_rank} candidate shape differs: ${record.meeting_id}`);
  }
}

function validateArtifacts(artifacts) {
  const coverageValidation = validateCoverageObservation(artifacts.coverage);
  if (!coverageValidation.valid) throw new Error(`HKJC live fixture Coverage invalid: ${coverageValidation.errors.join('; ')}`);
  const manifestErrors = validateCollectionResultManifestV1(artifacts.manifest);
  if (manifestErrors.length) throw new Error(`HKJC live fixture Manifest invalid: ${manifestErrors.join('; ')}`);
  if (artifacts.candidate.schema_version !== 'timetable-candidate-v1') throw new Error('HKJC live fixture candidate schema mismatch');
  if (artifacts.candidate.review?.status !== 'needs_review') throw new Error('HKJC live fixture candidate must remain needs_review');
  for (const record of artifacts.candidate.records ?? []) validateRankShape(record);
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

function writeArtifacts(directory, artifacts) {
  const names = {
    candidate: 'candidates.json',
    coverage: 'coverage-observation.json',
    manifest: 'result-manifest.json',
    report: 'collection-report.json',
  };
  for (const [key, filename] of Object.entries(names)) {
    fs.writeFileSync(path.join(directory, filename), `${JSON.stringify(artifacts[key], null, 2)}\n`);
  }
}

function copyReviewArtifacts(sourceDirectory, targetDirectory) {
  fs.mkdirSync(targetDirectory, { recursive: true });
  for (const filename of ['candidates.json', 'coverage-observation.json', 'result-manifest.json', 'collection-report.json']) {
    fs.copyFileSync(path.join(sourceDirectory, filename), path.join(targetDirectory, filename));
  }
}

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed: ${(result.stderr || result.stdout || '').slice(0, 4000)}`);
  return result;
}

function runLiveCollector(tempDirectory) {
  const scope = execution.requested_scope;
  return runNode('scripts/timetable/collect-hkjc-fixture-artifacts.mjs', [
    `--from=${scope.start_date}`,
    `--to-exclusive=${scope.end_date_exclusive}`,
    `--output-dir=${tempDirectory}`,
    `--batch-id=${execution.batch_id}`,
    `--campaign-id=${execution.campaign_id}`,
    `--job-id=${execution.job_id}`,
  ]);
}

function inclusiveEndDate(endDateExclusive) {
  const date = new Date(`${endDateExclusive}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function snapshotProtectedFiles() {
  return new Map(protectedPaths.map((relativePath) => {
    const absolute = path.join(root, relativePath);
    return [relativePath, fs.existsSync(absolute) ? fs.readFileSync(absolute) : null];
  }));
}

function restoreProtectedFiles(snapshot) {
  for (const [relativePath, bytes] of snapshot.entries()) {
    const absolute = path.join(root, relativePath);
    if (bytes === null) fs.rmSync(absolute, { force: true });
    else {
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, bytes);
    }
  }
}

function runBestAvailableEnrichment(scheduleArtifacts) {
  const scope = execution.requested_scope;
  const protectedSnapshot = snapshotProtectedFiles();
  try {
    runNode('scripts/timetable/fetch-hkjc-racecards.mjs', [
      `--from=${scope.start_date}`,
      `--to=${inclusiveEndDate(scope.end_date_exclusive)}`,
    ]);
    runNode('scripts/timetable/normalize-hkjc-racecards.mjs');
    const normalized = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/hkjc-normalized-timetable.sample.json'), 'utf8'));
    const details = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/hkjc-normalized-meeting-details.sample.json'), 'utf8'));
    const refreshReport = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/hkjc-refresh-report.json'), 'utf8'));
    return buildHkjcLiveBestAvailableArtifacts({ scheduleArtifacts, normalized, details, refreshReport });
  } finally {
    restoreProtectedFiles(protectedSnapshot);
  }
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
    live_racecard_route_invoked: false,
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
  fs.mkdirSync(tempOutput, { recursive: true });
  runLiveCollector(tempOutput);
  const scheduleArtifacts = readArtifactsFromDirectory(tempOutput);
  const artifacts = runBestAvailableEnrichment(scheduleArtifacts);
  validateArtifacts(artifacts);
  writeArtifacts(tempOutput, artifacts);
  copyReviewArtifacts(tempOutput, sharedOutput);
  console.log(JSON.stringify({
    implementation_unit: 'HKJC-LIVE-BEST-AVAILABLE-01',
    execution_mode: 'live_shared_actions_job',
    batch_id: execution.batch_id,
    coverage_claim: artifacts.coverage.coverage_claim,
    records_discovered: artifacts.coverage.records_discovered,
    records_updated: artifacts.coverage.records_updated,
    rank_counts: artifacts.manifest.rank_counts,
    source_error_count: artifacts.coverage.source_errors.length,
    output_dir: path.relative(root, sharedOutput),
    schedule_only_execution: false,
    live_racecard_route_invoked: true,
    publication_effect: 'none',
    canonical_write: false,
    public_write: false,
  }));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
