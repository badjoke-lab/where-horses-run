import fs from 'node:fs';
import path from 'node:path';
import { buildBaneiControlPlaneBridgeV1 } from './banei-control-plane-bridge.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));

const inputPath = args.get('--input');
const outputRoot = args.get('--output-root');
if (!inputPath || !outputRoot) {
  throw new Error('--input=<candidate.json> and --output-root=<directory> are required');
}

const input = JSON.parse(fs.readFileSync(path.resolve(root, inputPath), 'utf8'));
const output = buildBaneiControlPlaneBridgeV1(input);
const target = path.resolve(root, outputRoot);
fs.mkdirSync(target, { recursive: true });

const artifacts = [
  ['candidate.json', output.candidate],
  ['coverage-observation.json', output.coverage_observation],
  ['result-manifest.json', output.result_manifest],
  ['review-queue.json', output.review_queue],
  ['bridge-summary.json', {
    schema_version: output.schema_version,
    generated_at: output.generated_at,
    system_id: output.system_id,
    target_rank: output.target_rank,
    retry_activation: output.retry_activation,
    boundaries: output.boundaries,
  }],
];

for (const [filename, value] of artifacts) {
  fs.writeFileSync(path.join(target, filename), `${JSON.stringify(value, null, 2)}\n`);
}

console.log(JSON.stringify({
  output_root: path.relative(root, target),
  records: output.candidate.records.length,
  rank_counts: output.result_manifest.rank_counts,
  coverage_claim: output.coverage_observation.coverage_claim,
  unresolved_meeting_ids: output.coverage_observation.unresolved_meeting_ids.length,
  review_state: output.review_queue.entries[0]?.review_state ?? null,
  retry_activation: output.retry_activation.state,
  publication_effect: 'none',
}));
