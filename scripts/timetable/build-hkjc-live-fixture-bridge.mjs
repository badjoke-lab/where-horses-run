import fs from 'node:fs';
import path from 'node:path';
import { buildHkjcLiveFixtureBridgeV1 } from './hkjc-live-fixture-bridge.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const inputPath = args.get('--input');
const outputRoot = args.get('--output-root');
const checkOnly = args.has('--check-only');

if (!inputPath) throw new Error('--input=<bridge-input.json> is required');
if (!checkOnly && !outputRoot) throw new Error('--output-root=<directory> is required unless --check-only is used');

const input = JSON.parse(fs.readFileSync(path.resolve(root, inputPath), 'utf8'));
const bridge = buildHkjcLiveFixtureBridgeV1(input);
const expectedOutputRoot = `data/generated/timetable/hkjc-live-fixture-bridge/${bridge.result_manifest.batch_id}`;

if (!checkOnly && outputRoot !== expectedOutputRoot) {
  throw new Error(`--output-root must equal ${expectedOutputRoot}`);
}

function writeJson(relativePath, value) {
  const absolute = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

if (!checkOnly) {
  writeJson(path.join(outputRoot, 'candidate.json'), bridge.candidate);
  writeJson(path.join(outputRoot, 'coverage-observation.json'), bridge.coverage_observation);
  writeJson(path.join(outputRoot, 'result-manifest.json'), bridge.result_manifest);
  writeJson(path.join(outputRoot, 'review-queue.json'), bridge.review_queue);
  writeJson(path.join(outputRoot, 'collection-report.json'), bridge.collection_report);
}

console.log(JSON.stringify({
  schema_version: bridge.schema_version,
  system_id: bridge.system_id,
  adapter_id: bridge.adapter_id,
  batch_id: bridge.result_manifest.batch_id,
  output_root: expectedOutputRoot,
  coverage_claim: bridge.coverage_observation.coverage_claim,
  records_discovered: bridge.coverage_observation.records_discovered,
  source_error_count: bridge.coverage_observation.source_errors.length,
  review_state: bridge.review_queue.entries[0].review_state,
  promotion_state: bridge.review_queue.entries[0].promotion_state,
  publication_effect: bridge.collection_report.publication_effect,
  check_only: checkOnly,
}));
