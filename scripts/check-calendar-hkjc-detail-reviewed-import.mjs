import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildHkjcDetailReviewedImportPackage,
  validateHkjcDetailReviewedImportInput,
} from './timetable/hkjc-detail-reviewed-import-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json'), 'utf8'));
const cli = 'scripts/timetable/build-hkjc-detail-reviewed-import-package.mjs';

if (fixtures.schema_version !== 'calendar-hkjc-detail-reviewed-import-fixtures-v1') fail('fixture schema differs.');
if (fixtures.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('fixture Work ID differs.');
if (fixtures.implementation_unit !== 'HKJC-PILOT-06') fail('fixture implementation unit differs.');
if (fixtures.valid_inputs?.length !== 2) fail('expected pending and reviewed valid inputs.');
if (fixtures.invalid_cases?.length < 5) fail('expected at least five invalid cases.');

const validById = new Map((fixtures.valid_inputs ?? []).map((entry) => [entry.id, entry]));
for (const entry of fixtures.valid_inputs ?? []) {
  const validation = validateHkjcDetailReviewedImportInput(entry.input);
  if (validation.length) {
    fail(`${entry.id}: valid input rejected: ${validation.join('; ')}`);
    continue;
  }
  let pkg;
  try {
    pkg = buildHkjcDetailReviewedImportPackage({
      input: entry.input,
      inputFileName: `${entry.id}.json`,
      inputSha256: 'a'.repeat(64),
      batchId: `hkjc-reviewed-import-${entry.id}`,
      campaignId: 'hkjc-stage-10-runner-reconciliation',
      jobId: `hkjc-reviewed-import-${entry.id}-job`,
    });
  } catch (error) {
    fail(`${entry.id}: package build failed: ${error.message}`);
    continue;
  }
  if (pkg.review_state !== entry.expected_package.review_state) fail(`${entry.id}: package review state differs.`);
  if ((pkg.normalized_artifacts !== null) !== entry.expected_package.normalized_artifacts_present) fail(`${entry.id}: normalized artifact presence differs.`);
  if (pkg.human_review_required !== true) fail(`${entry.id}: human review must remain required.`);
  for (const value of Object.values(pkg.side_effect_boundary ?? {})) if (value !== false) fail(`${entry.id}: side-effect boundary must remain false.`);

  if (pkg.normalized_artifacts) {
    const { candidate, coverage, manifest, report } = pkg.normalized_artifacts;
    const record = candidate.records[0];
    if (candidate.review.status !== 'needs_review') fail(`${entry.id}: candidate must remain needs_review.`);
    if (candidate.review.promotion_target !== null) fail(`${entry.id}: candidate promotion target must remain null.`);
    if (record?.capability_rank !== entry.expected_package.rank) fail(`${entry.id}: rank differs.`);
    if (coverage.coverage_claim !== entry.expected_package.coverage_claim) fail(`${entry.id}: coverage claim differs.`);
    if (manifest.runner_used !== entry.expected_package.runner_used) fail(`${entry.id}: runner_used differs.`);
    if (!exact(coverage.unresolved_meeting_ids, manifest.unresolved_meeting_ids)) fail(`${entry.id}: Coverage/Manifest unresolved meetings differ.`);
    if (!exact(coverage.source_errors, manifest.source_errors)) fail(`${entry.id}: Coverage/Manifest source errors differ.`);
    if (Object.values(manifest.rank_counts).reduce((sum, count) => sum + count, 0) !== manifest.records_discovered) fail(`${entry.id}: rank totals do not close.`);
    if (report.network_fetch !== false || report.raw_source_storage !== 'disabled') fail(`${entry.id}: report network/raw boundary differs.`);
    if (report.canonical_write !== 'disabled' || report.public_write !== 'disabled' || report.publication_effect !== 'none') fail(`${entry.id}: report write/publication boundary differs.`);
    if (report.automatic_approval !== false || report.automatic_promotion !== false || report.automatic_publication !== false) fail(`${entry.id}: report automatic-action boundary differs.`);
    const serialized = JSON.stringify(pkg).toLowerCase();
    for (const forbidden of ['raw_html', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'stream_url']) {
      if (serialized.includes(`"${forbidden}"`)) fail(`${entry.id}: forbidden key present ${forbidden}.`);
    }
  }
}

function patched(base, patch) {
  const value = structuredClone(base);
  let target = value;
  for (const segment of patch.path.slice(0, -1)) {
    if (target[segment] === undefined) target[segment] = {};
    target = target[segment];
  }
  target[patch.path.at(-1)] = structuredClone(patch.value);
  return value;
}

for (const invalidCase of fixtures.invalid_cases ?? []) {
  const base = validById.get(invalidCase.base_valid_input_id)?.input;
  if (!base) {
    fail(`${invalidCase.id}: missing base valid input.`);
    continue;
  }
  const mutated = patched(base, invalidCase.patch);
  const validation = validateHkjcDetailReviewedImportInput(mutated);
  if (validation.length === 0) fail(`${invalidCase.id}: invalid input unexpectedly passed.`);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-hkjc-reviewed-import-'));
try {
  const reviewed = validById.get('reviewed-public-safe-a-plus')?.input;
  const inputPath = path.join(tempRoot, 'reviewed-input.json');
  const outputPath = path.join(tempRoot, 'review-package.json');
  fs.writeFileSync(inputPath, `${JSON.stringify(reviewed, null, 2)}\n`);
  const cliRun = spawnSync(process.execPath, [cli,
    `--input=${inputPath}`,
    `--output=${outputPath}`,
    '--batch-id=hkjc-reviewed-import-cli-proof',
    '--campaign-id=hkjc-stage-10-runner-reconciliation',
    '--job-id=hkjc-reviewed-import-cli-proof-job',
  ], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (cliRun.status !== 0) fail(`external reviewed-import CLI failed: ${cliRun.stderr}`);
  else {
    if (!fs.existsSync(outputPath)) fail('external review package missing.');
    else {
      const pkg = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      if (!pkg.input_evidence?.sha256 || pkg.input_evidence.sha256.length !== 64) fail('CLI package input digest missing.');
      if (pkg.normalized_artifacts?.manifest?.runner_used !== 'reviewed_import') fail('CLI package runner differs.');
      if (pkg.normalized_artifacts?.candidate?.records?.[0]?.capability_rank !== 'A+') fail('CLI package rank differs.');
    }
  }

  const repoInput = path.join(root, 'data/fixtures/calendar-hkjc-detail-reviewed-import-fixtures-v1.json');
  const rejectInput = spawnSync(process.execPath, [cli,
    `--input=${repoInput}`,
    `--output=${outputPath}`,
    '--batch-id=hkjc-reviewed-import-reject-input',
    '--campaign-id=hkjc-stage-10-runner-reconciliation',
    '--job-id=hkjc-reviewed-import-reject-input-job',
  ], { cwd: root, encoding: 'utf8' });
  if (rejectInput.status === 0) fail('repository-local input path must be rejected.');

  const repoOutput = path.join(root, 'data/generated/timetable/hkjc-reviewed-import-forbidden.json');
  const rejectOutput = spawnSync(process.execPath, [cli,
    `--input=${inputPath}`,
    `--output=${repoOutput}`,
    '--batch-id=hkjc-reviewed-import-reject-output',
    '--campaign-id=hkjc-stage-10-runner-reconciliation',
    '--job-id=hkjc-reviewed-import-reject-output-job',
  ], { cwd: root, encoding: 'utf8' });
  if (rejectOutput.status === 0) fail('repository-local output path must be rejected.');
  if (fs.existsSync(repoOutput)) fail('rejected repository-local output path created a file.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_DETAIL_REVIEWED_IMPORT: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_DETAIL_REVIEWED_IMPORT: pass');
console.log('PENDING_PACKAGE_NORMALIZED_ARTIFACTS: false');
console.log('REVIEWED_PACKAGE_RUNNER: reviewed_import');
console.log('EXTERNAL_INPUT_DIGEST: required');
console.log('REPOSITORY_INPUT_REJECTED: true');
console.log('REPOSITORY_OUTPUT_REJECTED: true');
console.log('NETWORK_FETCH: false');
console.log('REGISTRY_ACTIVATION: separate');
