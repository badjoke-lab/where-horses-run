import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildHkjcFixtureArtifacts } from './timetable/hkjc-fixture-artifact-bridge-core.mjs';
import { validateCoverageObservation } from './timetable/coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1 } from './timetable/collection-result-manifest-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const forbiddenKeyMarkers = ['horse', 'runner', 'jockey', 'trainer', 'draw', 'gate', 'post_position', 'weight', 'odds', 'result', 'payout', 'prediction', 'tip', 'betting', 'raw_html', 'source_body', 'direct_stream', 'stream_url', 'video_embed'];

function hashFile(relativePath) {
  const file = path.join(root, relativePath);
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function scanForbiddenKeys(value, label) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbiddenKeys(item, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const marker = forbiddenKeyMarkers.find((item) => key.toLowerCase().includes(item));
    if (marker) fail(`${label}.${key} contains forbidden key marker ${marker}`);
    scanForbiddenKeys(child, `${label}.${key}`);
  }
}

function validateCandidate(candidate, scenarioId) {
  const prefix = `${scenarioId} candidate`;
  const topKeys = ['adapter_id', 'authority_id', 'candidate_window', 'country_id', 'generated_at', 'records', 'review', 'schema_version', 'source_id'];
  if (JSON.stringify(Object.keys(candidate).sort()) !== JSON.stringify(topKeys.sort())) fail(`${prefix} top-level keys differ.`);
  if (candidate.schema_version !== 'timetable-candidate-v1') fail(`${prefix} schema version differs.`);
  if (candidate.adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail(`${prefix} adapter differs.`);
  if (candidate.country_id !== 'hong-kong' || candidate.authority_id !== 'hkjc' || candidate.source_id !== 'hkjc-fixture-list') fail(`${prefix} envelope identity differs.`);
  if (candidate.review?.status !== 'needs_review' || candidate.review?.reviewed_at !== null || candidate.review?.reviewer !== null || candidate.review?.promotion_target !== null) fail(`${prefix} must remain needs_review without promotion metadata.`);

  const seen = new Set();
  for (const record of candidate.records ?? []) {
    if (!idPattern.test(record.candidate_id) || !idPattern.test(record.meeting_id)) fail(`${prefix} contains invalid stable IDs.`);
    if (seen.has(record.candidate_id)) fail(`${prefix} contains duplicate candidate_id ${record.candidate_id}.`);
    seen.add(record.candidate_id);
    if (record.country_id !== 'hong-kong' || record.authority_id !== 'hkjc' || record.racing_system_id !== 'hong-kong-hkjc-system') fail(`${prefix} record identity differs.`);
    if (record.capability_rank !== 'C') fail(`${prefix} may emit C only.`);
    if (record.first_race_time_local !== null || record.last_race_time_local !== null || record.timetable_rows.length !== 0) fail(`${prefix} C record leaked race-time detail.`);
    if (record.review_status !== 'needs_review') fail(`${prefix} record must remain needs_review.`);
    if (record.source?.source_id !== 'hkjc-fixture-list') fail(`${prefix} record source differs.`);
    if (!String(record.source?.official_url ?? '').startsWith('https://racing.hkjc.com/')) fail(`${prefix} record official URL must remain HKJC HTTPS.`);
    if (record.source?.extraction_method !== 'fixture_parser') fail(`${prefix} extraction method differs.`);
  }
  scanForbiddenKeys(candidate, prefix);
}

const fixtures = readJson('data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json');
if (fixtures.schema_version !== 'calendar-hkjc-fixture-artifact-bridge-fixtures-v1') fail('fixture schema version differs.');
if (!Array.isArray(fixtures.scenarios) || fixtures.scenarios.length < 4) fail('expected success, partial, none, and parser-failure scenarios.');

for (const scenario of fixtures.scenarios ?? []) {
  const artifacts = buildHkjcFixtureArtifacts({
    startDate: scenario.start_date,
    endDateExclusive: scenario.end_date_exclusive,
    generatedAt: scenario.generated_at,
    batchId: scenario.batch_id,
    campaignId: scenario.campaign_id,
    jobId: scenario.job_id,
    monthResults: scenario.month_results,
    runnerUsed: 'github_actions',
  });

  validateCandidate(artifacts.candidate, scenario.id);
  const coverageValidation = validateCoverageObservation(artifacts.coverage);
  if (!coverageValidation.valid) fail(`${scenario.id} Coverage invalid: ${coverageValidation.errors.join('; ')}`);
  const manifestErrors = validateCollectionResultManifestV1(artifacts.manifest);
  if (manifestErrors.length) fail(`${scenario.id} Manifest invalid: ${manifestErrors.join('; ')}`);

  if (artifacts.coverage.coverage_claim !== scenario.expected.coverage_claim) fail(`${scenario.id} coverage claim differs.`);
  if (artifacts.manifest.coverage_claim !== scenario.expected.coverage_claim) fail(`${scenario.id} Manifest coverage claim differs.`);
  if (artifacts.candidate.records.length !== scenario.expected.record_count) fail(`${scenario.id} record count differs.`);
  if (artifacts.coverage.records_discovered !== scenario.expected.record_count) fail(`${scenario.id} Coverage record count differs.`);
  if (artifacts.manifest.rank_counts.C !== scenario.expected.record_count) fail(`${scenario.id} C rank count differs.`);
  for (const rank of ['B', 'B+', 'A', 'A+']) if (artifacts.manifest.rank_counts[rank] !== 0) fail(`${scenario.id} unexpectedly emitted ${rank}.`);

  const dates = artifacts.candidate.records.map((record) => record.date);
  if (JSON.stringify(dates) !== JSON.stringify(scenario.expected.dates)) fail(`${scenario.id} dates differ: ${JSON.stringify(dates)}.`);
  if (artifacts.coverage.source_errors.length !== scenario.expected.source_error_count) fail(`${scenario.id} source error count differs.`);
  if (scenario.expected.source_error_code && artifacts.coverage.source_errors[0]?.code !== scenario.expected.source_error_code) fail(`${scenario.id} source error code differs.`);
  if (JSON.stringify(artifacts.coverage.source_errors) !== JSON.stringify(artifacts.manifest.source_errors)) fail(`${scenario.id} Coverage/Manifest source errors differ.`);

  if (artifacts.report.publication_effect !== 'none') fail(`${scenario.id} report publication effect differs.`);
  for (const flag of ['canonical_write_enabled', 'public_write_enabled', 'automatic_approval_enabled', 'automatic_promotion_enabled', 'automatic_publication_enabled']) {
    if (artifacts.report[flag] !== false) fail(`${scenario.id} report ${flag} must remain false.`);
  }
  if (artifacts.report.artifact_transport !== 'external_directory_or_github_actions_upload_artifact_only') fail(`${scenario.id} artifact transport differs.`);
}

const coreSource = readText('scripts/timetable/hkjc-fixture-artifact-bridge-core.mjs');
if (/from ['"]node:fs['"]/.test(coreSource) || /writeFile|mkdirSync|renameSync/.test(coreSource)) fail('HKJC fixture bridge core must remain pure and write-free.');
const collectorSource = readText('scripts/timetable/collect-hkjc-fixture-artifacts.mjs');
for (const forbiddenPath of [
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'data/sources/timetable/hkjc-racecard-route.json',
]) {
  if (collectorSource.includes(forbiddenPath)) fail(`collector references forbidden write target ${forbiddenPath}.`);
}
if (!collectorSource.includes('HKJC live fixture artifacts must be written outside the repository')) fail('collector external-output guard missing.');

const protectedFiles = [
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
  'data/sources/timetable/hkjc-racecard-route.json',
];
const before = Object.fromEntries(protectedFiles.map((file) => [file, hashFile(file)]));
const rejected = spawnSync(process.execPath, [
  'scripts/timetable/collect-hkjc-fixture-artifacts.mjs',
  '--from=2026-07-10',
  '--to-exclusive=2026-08-01',
  '--output-dir=data/generated/timetable/hkjc-illegal-live-output',
  '--batch-id=hkjc-live-illegal-output',
  '--campaign-id=hkjc-stage10-pilot',
  '--job-id=hkjc-live-fixture-illegal-output',
], { cwd: root, encoding: 'utf8', timeout: 15000 });
if (rejected.status === 0) fail('collector accepted repository output directory.');
if (!`${rejected.stdout}\n${rejected.stderr}`.includes('must be written outside the repository')) fail('collector repository-output rejection message missing.');
const after = Object.fromEntries(protectedFiles.map((file) => [file, hashFile(file)]));
if (JSON.stringify(before) !== JSON.stringify(after)) fail('repository-output rejection modified protected canonical/public/config files.');
if (fs.existsSync(path.join(root, 'data/generated/timetable/hkjc-illegal-live-output'))) fail('repository-output rejection created illegal artifact directory.');

if (errors.length) {
  console.error(`CALENDAR_HKJC_FIXTURE_ARTIFACT_BRIDGE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_FIXTURE_ARTIFACT_BRIDGE: pass');
console.log('IMPLEMENTATION_UNIT: HKJC-PILOT-02');
console.log('LIVE_SOURCE: official HKJC fixture window');
console.log('OUTPUT: candidate + Coverage Observation + Result Manifest + collection report');
console.log('CANDIDATE_RANK: C only');
console.log('REVIEW_STATE: needs_review');
console.log('REPOSITORY_OUTPUT_DIR: rejected before fetch');
console.log('CANONICAL_WRITE: false');
console.log('PUBLIC_WRITE: false');
console.log('AUTOMATIC_APPROVAL_PROMOTION_PUBLICATION: false');
