import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const collector = 'scripts/timetable/collect-hkjc-detail-artifacts.mjs';
const collectorText = fs.readFileSync(path.join(root, collector), 'utf8');

for (const phrase of [
  'HKJC detail artifact output directory must be outside the repository',
  '--fixture-scenario=',
  '--write-artifacts',
  'racing.hkjc.com',
  'raw_source_storage',
  "canonical_write: 'disabled'",
  "public_write: 'disabled'",
  "publication_effect: 'none'",
]) {
  if (!collectorText.includes(phrase)) fail(`collector missing boundary phrase: ${phrase}`);
}

const run = (args) => spawnSync(process.execPath, [collector, ...args], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

const checkOnly = run(['--fixture-scenario=a-plus-complete']);
if (checkOnly.status !== 0) {
  fail(`fixture check-only execution failed: ${checkOnly.stderr}`);
} else {
  let summary;
  try { summary = JSON.parse(checkOnly.stdout); }
  catch (error) { fail(`fixture check-only summary did not parse: ${error.message}`); }
  if (summary) {
    if (summary.rank_counts?.['A+'] !== 1) fail('fixture check-only A+ rank count differs.');
    if (summary.coverage_claim !== 'source_window_complete') fail('fixture check-only coverage differs.');
    if (summary.write_artifacts !== false || summary.artifact_output !== null) fail('fixture check-only unexpectedly wrote artifacts.');
    if (summary.raw_source_storage !== 'disabled') fail('fixture check-only raw source storage boundary differs.');
    if (summary.canonical_write !== 'disabled' || summary.public_write !== 'disabled') fail('fixture check-only write boundary differs.');
  }
}

const externalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-hkjc-detail-collector-'));
const externalOutput = path.join(externalRoot, 'batch');
const writeRun = run([
  '--fixture-scenario=a-plus-complete',
  `--output-dir=${externalOutput}`,
  '--write-artifacts',
]);
if (writeRun.status !== 0) fail(`external artifact write failed: ${writeRun.stderr}`);
else {
  const expectedFiles = ['candidates.json', 'coverage-observation.json', 'result-manifest.json', 'collection-report.json'];
  for (const file of expectedFiles) if (!fs.existsSync(path.join(externalOutput, file))) fail(`external output missing ${file}.`);
  if (expectedFiles.every((file) => fs.existsSync(path.join(externalOutput, file)))) {
    const candidate = JSON.parse(fs.readFileSync(path.join(externalOutput, 'candidates.json'), 'utf8'));
    const coverage = JSON.parse(fs.readFileSync(path.join(externalOutput, 'coverage-observation.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(externalOutput, 'result-manifest.json'), 'utf8'));
    const report = JSON.parse(fs.readFileSync(path.join(externalOutput, 'collection-report.json'), 'utf8'));
    if (candidate.review.status !== 'needs_review') fail('external candidate review state differs.');
    if (coverage.coverage_claim !== 'source_window_complete') fail('external Coverage claim differs.');
    if (manifest.rank_counts?.['A+'] !== 1) fail('external Manifest A+ count differs.');
    if (report.publication_effect !== 'none') fail('external report publication effect differs.');
    const serialized = JSON.stringify({ candidate, coverage, manifest, report }).toLowerCase();
    for (const forbidden of ['raw_html', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'stream_url']) {
      if (serialized.includes(`"${forbidden}"`)) fail(`external artifact contains forbidden key ${forbidden}.`);
    }
  }
}
fs.rmSync(externalRoot, { recursive: true, force: true });

const repositoryOutput = path.join(root, 'data/generated/timetable/hkjc-pilot-05-forbidden-output');
const rejected = run([
  '--fixture-scenario=a-plus-complete',
  `--output-dir=${repositoryOutput}`,
  '--write-artifacts',
]);
if (rejected.status === 0) fail('repository-local output path must be rejected.');
if (fs.existsSync(repositoryOutput)) fail('repository-local output rejection created files.');

if (errors.length) {
  console.error(`CALENDAR_HKJC_DETAIL_COLLECTOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_DETAIL_COLLECTOR: pass');
console.log('FIXTURE_CHECK_ONLY: pass');
console.log('EXTERNAL_ARTIFACT_WRITE: pass');
console.log('REPOSITORY_OUTPUT_REJECTION: pass');
console.log('ARTIFACT_COUNT: 4');
console.log('RAW_SOURCE_STORAGE: disabled');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
