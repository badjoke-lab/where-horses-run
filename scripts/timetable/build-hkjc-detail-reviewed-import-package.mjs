import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildHkjcDetailReviewedImportPackage } from './hkjc-detail-reviewed-import-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');

function parseArgs(argv) {
  const options = {
    input: null,
    output: null,
    batchId: null,
    campaignId: null,
    jobId: null,
  };
  for (const arg of argv) {
    if (arg.startsWith('--input=')) options.input = arg.slice('--input='.length);
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length);
    else if (arg.startsWith('--batch-id=')) options.batchId = arg.slice('--batch-id='.length);
    else if (arg.startsWith('--campaign-id=')) options.campaignId = arg.slice('--campaign-id='.length);
    else if (arg.startsWith('--job-id=')) options.jobId = arg.slice('--job-id='.length);
    else throw new Error(`unknown argument: ${arg}`);
  }
  for (const key of ['input', 'output', 'batchId', 'campaignId', 'jobId']) {
    if (!options[key]) throw new Error(`missing required argument --${key.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}`);
  }
  return options;
}

function externalPath(value, label) {
  const absolute = path.resolve(value);
  const relative = path.relative(root, absolute);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error(`${label} must be outside the repository`);
  }
  return absolute;
}

const options = parseArgs(process.argv.slice(2));
const inputPath = externalPath(options.input, 'input');
const outputPath = externalPath(options.output, 'output');
const inputBytes = fs.readFileSync(inputPath);
const input = JSON.parse(inputBytes.toString('utf8'));
const inputSha256 = crypto.createHash('sha256').update(inputBytes).digest('hex');
const pkg = buildHkjcDetailReviewedImportPackage({
  input,
  inputFileName: path.basename(inputPath),
  inputSha256,
  batchId: options.batchId,
  campaignId: options.campaignId,
  jobId: options.jobId,
});
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-detail-reviewed-import-cli-summary-v1',
  work_id: 'WHR-CAL-HONG-KONG-HKJC',
  implementation_unit: 'HKJC-PILOT-06',
  review_state: pkg.review_state,
  normalized_artifacts_present: pkg.normalized_artifacts !== null,
  input_sha256: inputSha256,
  network_fetch: false,
  canonical_write: false,
  public_write: false,
  publication: false,
}, null, 2));
