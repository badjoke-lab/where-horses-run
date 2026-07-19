import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runCopier({ artifactRoot, payloadRoot, receiptPath, allowEmpty = false }) {
  return spawnSync(process.execPath, [
    'scripts/timetable/copy-calendar-daily-review-artifacts.mjs',
    `--artifact-root=${artifactRoot}`,
    `--payload-root=${payloadRoot}`,
    `--receipt=${receiptPath}`,
    '--run-id=29695247741',
    '--source-sha=b6d1f0924ff557948e056f44a475ad509f442601',
    `--allow-empty=${allowEmpty}`,
  ], { cwd: root, encoding: 'utf8' });
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-daily-review-delivery-'));
try {
  const strippedArtifacts = path.join(tempRoot, 'stripped-artifacts');
  const strippedPayload = path.join(tempRoot, 'stripped-payload');
  const strippedReceipt = path.join(strippedPayload, 'data/generated/timetable/daily-acquisition-deliveries/29695247741.json');
  writeJson(
    path.join(strippedArtifacts, 'generated/timetable/actions-multi-job-status/batch-one.json'),
    { schema_version: 'calendar-actions-job-status-v1', status: 'success' },
  );
  writeJson(
    path.join(strippedArtifacts, 'generated/timetable/nar-incremental-batches/batch-one/coverage-observation.json'),
    { schema_version: 'calendar-coverage-observation-v1', coverage_claim: 'source_window_complete' },
  );
  writeJson(
    path.join(strippedArtifacts, 'candidates/nar-incremental-batches/batch-one/batch.json'),
    { schema_version: 'nar-incremental-batch-v2', review: { status: 'needs_review' } },
  );

  const strippedRun = runCopier({
    artifactRoot: strippedArtifacts,
    payloadRoot: strippedPayload,
    receiptPath: strippedReceipt,
  });
  if (strippedRun.status !== 0) fail(`stripped-root copy failed: ${strippedRun.stderr || strippedRun.stdout}`);
  for (const relativePath of [
    'data/generated/timetable/actions-multi-job-status/batch-one.json',
    'data/generated/timetable/nar-incremental-batches/batch-one/coverage-observation.json',
    'data/candidates/nar-incremental-batches/batch-one/batch.json',
  ]) {
    if (!fs.existsSync(path.join(strippedPayload, relativePath))) fail(`stripped-root copy missing ${relativePath}`);
  }
  const strippedStatus = JSON.parse(fs.readFileSync(
    path.join(strippedPayload, 'data/generated/timetable/actions-multi-job-status/batch-one.json'),
    'utf8',
  ));
  if (strippedStatus.status !== 'success') fail('stripped-root copied status differs');
  const strippedDelivery = JSON.parse(fs.readFileSync(strippedReceipt, 'utf8'));
  if (strippedDelivery.copied_file_count !== 3) fail('stripped-root copied file count differs');
  if (!strippedDelivery.artifact_layouts_seen.includes('generated/timetable/actions-multi-job-status')) {
    fail('stripped-root layout was not recorded');
  }
  if (Object.values(strippedDelivery.publication_boundary).some((value) => value !== false)) {
    fail('delivery receipt enabled a publication side effect');
  }

  const dataArtifacts = path.join(tempRoot, 'data-artifacts');
  const dataPayload = path.join(tempRoot, 'data-payload');
  const dataReceipt = path.join(dataPayload, 'receipt.json');
  writeJson(
    path.join(dataArtifacts, 'data/generated/timetable/actions-multi-job/batch-two/result-manifest.json'),
    { schema_version: 'calendar-collection-result-manifest-v1' },
  );
  const dataRun = runCopier({ artifactRoot: dataArtifacts, payloadRoot: dataPayload, receiptPath: dataReceipt });
  if (dataRun.status !== 0) fail(`data-root copy failed: ${dataRun.stderr || dataRun.stdout}`);
  if (!fs.existsSync(path.join(dataPayload, 'data/generated/timetable/actions-multi-job/batch-two/result-manifest.json'))) {
    fail('data-root copy missing result manifest');
  }

  const emptyArtifacts = path.join(tempRoot, 'empty-artifacts');
  fs.mkdirSync(emptyArtifacts, { recursive: true });
  const emptyPayload = path.join(tempRoot, 'empty-payload');
  const emptyReceipt = path.join(emptyPayload, 'receipt.json');
  const emptyRun = runCopier({
    artifactRoot: emptyArtifacts,
    payloadRoot: emptyPayload,
    receiptPath: emptyReceipt,
    allowEmpty: true,
  });
  if (emptyRun.status !== 0) fail(`allow-empty delivery failed: ${emptyRun.stderr || emptyRun.stdout}`);
  if (JSON.parse(fs.readFileSync(emptyReceipt, 'utf8')).copied_file_count !== 0) {
    fail('allow-empty delivery receipt count differs');
  }

  const forbiddenArtifacts = path.join(tempRoot, 'forbidden-artifacts');
  fs.mkdirSync(path.join(forbiddenArtifacts, 'generated/timetable/nar-incremental-batches/batch-three'), { recursive: true });
  fs.writeFileSync(
    path.join(forbiddenArtifacts, 'generated/timetable/nar-incremental-batches/batch-three/raw.html'),
    '<html>forbidden</html>',
  );
  const forbiddenRun = runCopier({
    artifactRoot: forbiddenArtifacts,
    payloadRoot: path.join(tempRoot, 'forbidden-payload'),
    receiptPath: path.join(tempRoot, 'forbidden-payload/receipt.json'),
  });
  if (forbiddenRun.status === 0 || !`${forbiddenRun.stderr}${forbiddenRun.stdout}`.includes('non-JSON review artifact is forbidden')) {
    fail('non-JSON artifact was not rejected');
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

if (errors.length) {
  console.error(`CALENDAR_DAILY_REVIEW_ARTIFACT_DELIVERY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DAILY_REVIEW_ARTIFACT_DELIVERY: pass');
console.log('STRIPPED_DATA_ROOT: supported');
console.log('EXPLICIT_DATA_ROOT: supported');
console.log('NON_JSON_ARTIFACT: rejected');
console.log('PUBLICATION_SIDE_EFFECTS: disabled');
