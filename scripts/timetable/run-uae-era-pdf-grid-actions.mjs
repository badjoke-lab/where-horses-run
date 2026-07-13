import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { validateRunnerExecutionV1 } from './runner-compatibility.mjs';
import { validateCollectionJobV1 } from './collection-job-validation.mjs';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import {
  validateCollectionResultManifestAgainstCoverageV1,
  validateCollectionResultManifestAgainstJobV1,
  validateCollectionResultManifestV1,
} from './collection-result-manifest-validation.mjs';
import { buildUaeEraPdfGridArtifactsV1 } from './uae-era-pdf-grid-candidate-core.mjs';

const root = process.cwd();
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const executionArg = argument('execution');
const jobArg = argument('job');
const outputArg = argument('output-dir');
if (!executionArg || !jobArg || !outputArg) {
  throw new Error('--execution=<path>, --job=<path>, and --output-dir=<path> are required');
}

const resolveInput = (value) => path.resolve(root, value);
const executionPath = resolveInput(executionArg);
const jobPath = resolveInput(jobArg);
const outputDir = path.resolve(root, outputArg);
const relativeOutput = path.relative(root, outputDir);
if (relativeOutput === '' || (!relativeOutput.startsWith('..') && !path.isAbsolute(relativeOutput))) {
  throw new Error('UAE ERA runner output directory must be outside the repository');
}

const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));
const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-runner-compatibility-contract-v1.json'), 'utf8'));
const mappingDecision = JSON.parse(fs.readFileSync(path.join(root, 'data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json'), 'utf8'));

const jobErrors = validateCollectionJobV1(job, registry);
if (jobErrors.length) throw new Error(`Collection Job validation failed: ${jobErrors.join('; ')}`);
const executionErrors = validateRunnerExecutionV1(execution, job, registry, compatibility);
if (executionErrors.length) throw new Error(`Runner Execution validation failed: ${executionErrors.join('; ')}`);
if (execution.system_id !== 'uae-national-racing-system') throw new Error('UAE runner requires uae-national-racing-system');
if (execution.runner_used !== 'github_actions') throw new Error('UAE runner requires github_actions');
if (execution.executor_id !== 'uae-era-actions') throw new Error('UAE shared executor identity differs');
if (execution.collection_mode !== 'source_visible_horizon') throw new Error('UAE schedule executor requires source_visible_horizon');
if (Object.values(execution.side_effect_boundary).some((value) => value !== false)) throw new Error('execution side-effect boundary must remain all false');

function runJson(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-uae-era-pdf-grid-'));
try {
  const coordinateSummary = runJson('python', ['scripts/timetable/probe_uae_era_pdf_coordinates.py']);
  const coordinatePath = path.join(tempDir, 'coordinate-summary.json');
  fs.writeFileSync(coordinatePath, `${JSON.stringify(coordinateSummary)}\n`);
  const gridObservations = runJson('python', [
    'scripts/timetable/parse_uae_era_pdf_grid_coordinates.py',
    '--input', coordinatePath,
  ]);

  const now = new Date().toISOString();
  const artifacts = buildUaeEraPdfGridArtifactsV1({
    gridObservations,
    mappingDecision,
    job,
    batchId: execution.batch_id,
    generatedAt: now,
    checkedAt: now,
    runnerUsed: execution.runner_used,
  });

  const coverageValidation = validateCoverageObservation(artifacts.coverage);
  if (!coverageValidation.valid) throw new Error(`Coverage validation failed: ${coverageValidation.errors.join('; ')}`);
  const manifestErrors = [
    ...validateCollectionResultManifestV1(artifacts.manifest),
    ...validateCollectionResultManifestAgainstJobV1(artifacts.manifest, job, registry),
    ...validateCollectionResultManifestAgainstCoverageV1(artifacts.manifest, artifacts.coverage),
  ];
  if (manifestErrors.length) throw new Error(`Manifest validation failed: ${manifestErrors.join('; ')}`);

  fs.mkdirSync(outputDir, { recursive: true });
  const files = {
    'candidates.json': artifacts.candidate,
    'coverage-observation.json': artifacts.coverage,
    'collection-result-manifest.json': artifacts.manifest,
    'collection-report.json': artifacts.report,
  };
  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
  }

  console.log(JSON.stringify({
    schema_version: 'calendar-uae-era-pdf-grid-runner-summary-v1',
    work_id: 'WHR-CAL-UAE-ERA',
    implementation_unit: 'UAE-PILOT-06',
    batch_id: execution.batch_id,
    output_dir: outputDir,
    records_discovered: artifacts.manifest.records_discovered,
    rank_counts: artifacts.manifest.rank_counts,
    coverage_claim: artifacts.manifest.coverage_claim,
    candidate_review_state: artifacts.candidate.review.status,
    promotion_target: artifacts.candidate.review.promotion_target,
    raw_pdf_stored: false,
    raw_text_stored: false,
    repository_write: false,
    canonical_write: false,
    public_write: false,
    publication_effect: 'none',
  }));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
