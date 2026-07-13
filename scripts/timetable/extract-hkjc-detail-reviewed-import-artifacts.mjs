import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');

function parseArgs(argv) {
  const options = { packagePath: null, outputDir: null };
  for (const arg of argv) {
    if (arg.startsWith('--package=')) options.packagePath = arg.slice('--package='.length);
    else if (arg.startsWith('--output-dir=')) options.outputDir = arg.slice('--output-dir='.length);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.packagePath) throw new Error('--package is required');
  if (!options.outputDir) throw new Error('--output-dir is required');
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const options = parseArgs(process.argv.slice(2));
const packagePath = externalPath(options.packagePath, 'package');
const outputDir = externalPath(options.outputDir, 'output-dir');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

assert(pkg.schema_version === 'calendar-hkjc-detail-reviewed-import-package-v1', 'package schema_version differs');
assert(pkg.review_state === 'reviewed_public_safe', 'package must be reviewed_public_safe');
assert(pkg.human_review_required === true, 'package must preserve human review requirement');
assert(pkg.normalized_artifacts && typeof pkg.normalized_artifacts === 'object', 'package has no normalized artifacts');
assert(Object.values(pkg.side_effect_boundary ?? {}).every((value) => value === false), 'package side-effect boundary differs');

const { candidate, coverage, manifest, report } = pkg.normalized_artifacts;
assert(candidate?.schema_version === 'timetable-candidate-v1', 'candidate schema differs');
assert(coverage?.schema_version === 'calendar-coverage-observation-v1', 'coverage schema differs');
assert(manifest?.schema_version === 'calendar-collection-result-manifest-v1', 'manifest schema differs');
assert(report?.schema_version === 'calendar-hkjc-detail-reviewed-import-report-v1', 'report schema differs');
assert(candidate.review?.status === 'needs_review', 'candidate must remain needs_review');
assert(candidate.review?.promotion_target === null, 'candidate promotion target must remain null');
assert(manifest.runner_used === 'reviewed_import', 'manifest runner must be reviewed_import');
assert(report.network_fetch === false, 'report network_fetch must be false');
assert(report.canonical_write === 'disabled' && report.public_write === 'disabled', 'report write boundary differs');
assert(report.publication_effect === 'none', 'report publication effect differs');

fs.mkdirSync(outputDir, { recursive: true });
const files = {
  'candidates.json': candidate,
  'coverage-observation.json': coverage,
  'collection-result-manifest.json': manifest,
  'collection-report.json': report,
  'input-evidence.json': pkg.input_evidence,
};
for (const [name, value] of Object.entries(files)) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

console.log(JSON.stringify({
  schema_version: 'calendar-hkjc-detail-reviewed-import-extract-summary-v1',
  work_id: 'WHR-CAL-HKJC-DETAIL-RECOVERY',
  implementation_unit: 'HKJC-DETAIL-RECOVERY-01',
  batch_id: manifest.batch_id,
  records_discovered: manifest.records_discovered,
  records_updated: manifest.records_updated,
  rank_counts: manifest.rank_counts,
  coverage_claim: manifest.coverage_claim,
  source_error_count: manifest.source_errors.length,
  unresolved_meeting_count: manifest.unresolved_meeting_ids.length,
  candidate_review_state: candidate.review.status,
  output_dir: outputDir,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
}, null, 2));
