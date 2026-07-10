import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildHkjcLiveFixtureBridgeV1,
  hkjcLiveFixtureBridgeV1Contract,
  parseHkjcFixturePageV1,
} from './timetable/hkjc-live-fixture-bridge.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha256File = (relativePath) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex');

const fixtures = readJson('data/fixtures/calendar-hkjc-live-fixture-bridge-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');

if (fixtures.schema_version !== 'calendar-hkjc-live-fixture-bridge-fixtures-v1') fail('fixture schema version differs.');
if (hkjcLiveFixtureBridgeV1Contract.input_schema_version !== 'calendar-hkjc-live-fixture-bridge-input-v1') fail('bridge input schema contract differs.');
if (hkjcLiveFixtureBridgeV1Contract.output_schema_version !== 'calendar-hkjc-live-fixture-bridge-v1') fail('bridge output schema contract differs.');
if (hkjcLiveFixtureBridgeV1Contract.system_id !== 'hong-kong-hkjc-system') fail('bridge system contract differs.');
if (hkjcLiveFixtureBridgeV1Contract.source_id !== 'hkjc-fixture-list') fail('bridge source contract differs.');
if (hkjcLiveFixtureBridgeV1Contract.adapter_id !== 'hong-kong-hkjc-live-fixture-adapter-v1') fail('bridge adapter contract differs.');
if (hkjcLiveFixtureBridgeV1Contract.output_rank !== 'C') fail('bridge output rank contract differs.');
if (hkjcLiveFixtureBridgeV1Contract.registry_activation !== false) fail('bridge Registry activation must remain false.');

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('HKJC Registry profile must remain provisional.');
  if (profile.schedule_adapter_id !== 'hong-kong-hkjc-dry-run-adapter') fail('HKJC Registry schedule adapter must remain dry-run before activation PR.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('HKJC detail source/adapter must remain unactivated.');
  if (profile.supported_observation_ranks?.length !== 1 || profile.supported_observation_ranks[0] !== 'C') fail('HKJC Registry supported observation ranks must remain C-only.');
}
const compatibilityEntry = compatibility.executors.find((entry) => entry.system_id === 'hong-kong-hkjc-system' && entry.runner === 'github_actions');
if (!compatibilityEntry || compatibilityEntry.executor_id !== 'hkjc-bounded-generator-actions') fail('HKJC compatibility executor must remain bounded generator before activation PR.');

const outputs = new Map();
for (const scenario of fixtures.scenarios ?? []) {
  try {
    const bridge = buildHkjcLiveFixtureBridgeV1(scenario.input);
    outputs.set(scenario.scenario_id, bridge);
    const expected = scenario.expected;
    if (bridge.coverage_observation.coverage_claim !== expected.coverage_claim) fail(`${scenario.scenario_id} coverage claim differs.`);
    if (bridge.candidate.records.length !== expected.record_count) fail(`${scenario.scenario_id} candidate record count differs.`);
    if (bridge.coverage_observation.records_discovered !== expected.record_count) fail(`${scenario.scenario_id} discovered count differs.`);
    if (bridge.result_manifest.records_discovered !== expected.record_count) fail(`${scenario.scenario_id} Manifest discovered count differs.`);
    if (bridge.coverage_observation.source_errors.length !== expected.source_error_count) fail(`${scenario.scenario_id} source error count differs.`);
    if (bridge.review_queue.entries.length !== 1) fail(`${scenario.scenario_id} Review Queue entry count differs.`);
    else {
      const entry = bridge.review_queue.entries[0];
      if (entry.review_state !== 'review_ready' || entry.promotion_state !== 'not_ready') fail(`${scenario.scenario_id} Review Queue state differs.`);
      if (!exact(entry.rank_counts, bridge.result_manifest.rank_counts)) fail(`${scenario.scenario_id} Review Queue rank counts differ from Manifest.`);
      if (entry.source_error_count !== expected.source_error_count) fail(`${scenario.scenario_id} Review Queue source error count differs.`);
    }
    if (bridge.collection_report.publication_effect !== 'none') fail(`${scenario.scenario_id} publication effect differs.`);
    if (Object.values(bridge.boundaries).some((value) => value !== false)) fail(`${scenario.scenario_id} bridge side-effect boundary enabled.`);
    if (bridge.candidate.review.status !== 'needs_review' || bridge.candidate.review.promotion_target !== null) fail(`${scenario.scenario_id} candidate review boundary differs.`);
    for (const record of bridge.candidate.records) {
      if (record.capability_rank !== 'C') fail(`${scenario.scenario_id} non-C candidate rank emitted.`);
      if (record.first_race_time_local !== null || record.last_race_time_local !== null) fail(`${scenario.scenario_id} C candidate inferred race time.`);
      if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length !== 0) fail(`${scenario.scenario_id} C candidate emitted timetable rows.`);
      if (record.review_status !== 'needs_review') fail(`${scenario.scenario_id} candidate record review status differs.`);
      if (record.source.source_id !== 'hkjc-fixture-list' || record.source.extraction_method !== 'adapter_candidate') fail(`${scenario.scenario_id} candidate source boundary differs.`);
    }
    const serialized = JSON.stringify(bridge).toLowerCase();
    for (const forbidden of ['"content"', 'raw_html', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'stream_url']) {
      if (serialized.includes(forbidden)) fail(`${scenario.scenario_id} output contains forbidden artifact marker ${forbidden}.`);
    }
  } catch (error) {
    fail(`${scenario.scenario_id} bridge build failed: ${error.message}`);
  }
}

const full = outputs.get('full-single-month-window');
if (full) {
  const expected = fixtures.scenarios.find((scenario) => scenario.scenario_id === 'full-single-month-window').expected;
  if (!exact(full.result_manifest.rank_counts, expected.rank_counts)) fail('full scenario rank counts differ.');
  const meetingIds = full.candidate.records.map((record) => record.meeting_id);
  if (!exact(meetingIds, expected.meeting_ids)) fail(`full scenario meeting IDs differ: ${JSON.stringify(meetingIds)}`);
  if (meetingIds.some((meetingId) => meetingId.includes('2026-08-30'))) fail('out-of-window August 30 meeting leaked into full scenario.');
  if (full.coverage_observation.observed_scope.kind !== 'date_window') fail('full scenario observed scope kind differs.');
}

const partial = outputs.get('partial-two-month-window');
if (partial) {
  const expected = fixtures.scenarios.find((scenario) => scenario.scenario_id === 'partial-two-month-window').expected;
  if (!exact(partial.coverage_observation.observed_scope, expected.observed_scope)) fail('partial scenario observed scope differs.');
  if (partial.coverage_observation.source_errors[0]?.code !== 'source_unavailable') fail('partial scenario source error code differs.');
}

const none = outputs.get('no-observed-source-window');
if (none) {
  const expected = fixtures.scenarios.find((scenario) => scenario.scenario_id === 'no-observed-source-window').expected;
  if (!exact(none.coverage_observation.observed_scope, expected.observed_scope)) fail('none scenario observed scope differs.');
  if (none.coverage_observation.source_errors[0]?.code !== 'rate_limited') fail('none scenario source error code differs.');
}

function expectRejected(label, mutate) {
  const base = structuredClone(fixtures.scenarios[0].input);
  mutate(base);
  let rejected = false;
  try { buildHkjcLiveFixtureBridgeV1(base); } catch { rejected = true; }
  if (!rejected) fail(`${label} unexpectedly passed.`);
}
expectRejected('duplicate page month', (input) => input.page_results.push(structuredClone(input.page_results[0])));
expectRejected('page outside requested scope', (input) => { input.page_results[0].month = '2026-09'; });
expectRejected('duplicate meeting identity', (input) => { input.page_results[0].content += '<div>1 Image: ST Image: D</div>'; });
expectRejected('invalid real fixture date', (input) => { input.page_results[0].content = '<div>31 Image: ST Image: D</div>'; input.page_results[0].month = '2026-09'; input.requested_scope.start_date = '2026-09-01'; input.requested_scope.end_date_exclusive = '2026-10-01'; });

try {
  const parsed = parseHkjcFixturePageV1({
    month: '2026-08',
    source_url: 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=08&CalYear=2026',
    content: '<span>3</span><img alt="ST"><img alt="D"><span>17</span><img title="HV"><img title="N">',
  });
  if (parsed.records.length !== 2) fail('HTML image alt/title parsing record count differs.');
  if (!parsed.records.some((record) => record.meeting_id === 'hkjc-sha-tin-racecourse-2026-08-03')) fail('ST parsed meeting missing.');
  if (!parsed.records.some((record) => record.meeting_id === 'hkjc-happy-valley-racecourse-2026-08-17')) fail('HV parsed meeting missing.');
} catch (error) {
  fail(`HTML fixture parser smoke test failed: ${error.message}`);
}

const protectedFiles = [
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
];
const protectedBefore = Object.fromEntries(protectedFiles.map((file) => [file, sha256File(file)]));
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-hkjc-live-fixture-bridge-'));
const inputPath = path.join(tempRoot, 'input.json');
const fullInput = fixtures.scenarios.find((scenario) => scenario.scenario_id === 'full-single-month-window').input;
fs.writeFileSync(inputPath, `${JSON.stringify(fullInput, null, 2)}\n`);
const expectedOutputRoot = `data/generated/timetable/hkjc-live-fixture-bridge/${fullInput.batch_id}`;
try {
  const checkOnly = spawnSync(process.execPath, [
    'scripts/timetable/build-hkjc-live-fixture-bridge.mjs',
    `--input=${inputPath}`,
    '--check-only',
  ], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (checkOnly.status !== 0) fail(`bridge writer check-only failed: ${checkOnly.stderr || checkOnly.stdout}`);
  if (fs.existsSync(path.join(root, expectedOutputRoot))) fail('bridge writer check-only created output root.');

  const writeRun = spawnSync(process.execPath, [
    'scripts/timetable/build-hkjc-live-fixture-bridge.mjs',
    `--input=${inputPath}`,
    `--output-root=${expectedOutputRoot}`,
  ], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (writeRun.status !== 0) fail(`bridge writer artifact run failed: ${writeRun.stderr || writeRun.stdout}`);
  const expectedFiles = ['candidate.json', 'coverage-observation.json', 'result-manifest.json', 'review-queue.json', 'collection-report.json'];
  for (const filename of expectedFiles) {
    const file = path.join(root, expectedOutputRoot, filename);
    if (!fs.existsSync(file)) fail(`bridge writer output missing ${filename}.`);
    else {
      const serialized = fs.readFileSync(file, 'utf8').toLowerCase();
      if (serialized.includes('"content"') || serialized.includes('<div>')) fail(`bridge writer persisted source page body in ${filename}.`);
    }
  }
  const manifest = readJson(path.join(expectedOutputRoot, 'result-manifest.json'));
  if (manifest.artifact_refs.candidate_ref !== `${expectedOutputRoot}/candidate.json`) fail('written Manifest candidate ref differs from output root.');
  if (manifest.artifact_refs.coverage_observation_ref !== `${expectedOutputRoot}/coverage-observation.json`) fail('written Manifest Coverage ref differs from output root.');
  if (manifest.artifact_refs.collection_report_ref !== `${expectedOutputRoot}/collection-report.json`) fail('written Manifest report ref differs from output root.');

  const wrongRootRun = spawnSync(process.execPath, [
    'scripts/timetable/build-hkjc-live-fixture-bridge.mjs',
    `--input=${inputPath}`,
    '--output-root=data/generated/timetable/hkjc-live-fixture-bridge/wrong-root',
  ], { cwd: root, encoding: 'utf8' });
  if (wrongRootRun.status === 0) fail('bridge writer accepted output root different from Manifest root.');
} finally {
  fs.rmSync(path.join(root, expectedOutputRoot), { recursive: true, force: true });
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
const protectedAfter = Object.fromEntries(protectedFiles.map((file) => [file, sha256File(file)]));
if (!exact(protectedBefore, protectedAfter)) fail('fixture bridge checker changed canonical/public files.');

const liveCollector = readText('scripts/timetable/collect-hkjc-live-fixture-window.mjs');
for (const phrase of [
  "fetch(sourceUrl",
  "finalHost !== 'racing.hkjc.com'",
  "--write-artifacts",
  "raw_source_body_persisted: false",
  "canonical_write_performed: false",
  "public_write_performed: false",
  "data/generated/timetable/hkjc-live-fixture-bridge/${batchId}",
]) {
  if (!liveCollector.includes(phrase)) fail(`live collector missing ${phrase}.`);
}
for (const forbiddenCall of ['build-canonical-timetable.mjs', 'merge-hkjc-normalized-into-canonical.mjs', 'build-public-timetable-view.mjs']) {
  if (liveCollector.includes(forbiddenCall)) fail(`live collector contains forbidden direct writer ${forbiddenCall}.`);
}

const docs = readText('docs/calendar/hkjc-live-fixture-artifact-bridge.md');
for (const phrase of [
  'HKJC-PILOT-02',
  'artifact-only live fixture acquisition bridge',
  'Registry activation remains separate',
  'source_window_complete',
  'partial',
  'none',
  'review_ready / not_ready',
  'raw page body is not persisted',
  'canonical write: false',
  'public write: false',
  'HKJC-PILOT-03',
]) {
  if (!docs.includes(phrase)) fail(`HKJC live fixture bridge doc missing ${phrase}.`);
}

const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
for (const [label, text] of [['project roadmap', projectRoadmap], ['implementation roadmap', implementationRoadmap]]) {
  if (!text.includes('HKJC-PILOT-02')) fail(`${label} missing HKJC-PILOT-02.`);
  if (!text.includes('HKJC-PILOT-03')) fail(`${label} missing HKJC-PILOT-03 next unit.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_LIVE_FIXTURE_BRIDGE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_LIVE_FIXTURE_BRIDGE: pass');
console.log('FULL_WINDOW: source_window_complete');
console.log('PARTIAL_WINDOW: partial');
console.log('NO_OBSERVED_WINDOW: none');
console.log('OUTPUT_RANK: C');
console.log('REVIEW_QUEUE_STATE: review_ready / not_ready');
console.log('RAW_PAGE_BODY_PERSISTED: false');
console.log('CANONICAL_PUBLIC_HASHES_UNCHANGED: pass');
console.log('REGISTRY_ACTIVATION: false');
console.log('NEXT_UNIT: HKJC-PILOT-03');
