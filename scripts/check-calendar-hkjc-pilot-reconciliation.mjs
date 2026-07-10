import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const sha256File = (relativePath) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-hkjc-pilot-reconciliation-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const candidates = readJson('data/candidates/hong-kong-hkjc-candidates.json');
const route = readJson('data/sources/timetable/hkjc-racecard-route.json');
const report = readJson('data/generated/timetable/hkjc-refresh-report.json');
const normalized = readJson('data/generated/timetable/hkjc-normalized-timetable.sample.json');
const orchestrator = readText('scripts/timetable/refresh-hkjc.mjs');
const boundedExecutor = readText('scripts/timetable/run-hkjc-bounded-generator-job.mjs');

if (audit.schema_version !== 'calendar-hkjc-pilot-reconciliation-v1') fail('audit schema version differs.');
if (audit.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('audit Work ID differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at invalid.');
if (audit.decision !== 'transition_legacy_refresh_to_shared_control_plane') fail('audit transition decision differs.');

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  const expected = audit.registry_state;
  for (const key of ['system_id', 'profile_status', 'primary_runner', 'fallback_runner', 'schedule_source_id', 'detail_source_id', 'detail_adapter_id', 'public_ceiling']) {
    if (profile[key] !== expected[key]) fail(`Registry audit mismatch for ${key}: ${profile[key]} != ${expected[key]}`);
  }
  if (profile.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('current HKJC schedule adapter must point to PILOT-02 artifact bridge.');
  if (!exact(profile.supported_observation_ranks, expected.supported_observation_ranks)) fail('Registry supported observation ranks differ from audit.');
  if (profile.profile_status !== 'provisional') fail('HKJC profile must remain provisional at reconciliation stage.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('HKJC detail path must remain unactivated at reconciliation stage.');
  if (profile.public_ceiling !== 'A') fail('HKJC public ceiling must remain A at reconciliation stage.');
}

const shared = audit.shared_control_plane_state;
if (candidates.source_adapter_id !== 'hong-kong-hkjc-dry-run-adapter') fail('HKJC candidate source adapter differs.');
if (candidates.candidate_window?.start_date !== shared.candidate_window_start
  || candidates.candidate_window?.end_date_exclusive !== shared.candidate_window_end_exclusive) fail('HKJC candidate window differs from audit.');
if ((candidates.records ?? []).length !== shared.candidate_record_count) fail('HKJC candidate record count differs from audit.');
if (!candidates.records.every((record) => record.review_status === 'needs_review')) fail('HKJC candidate source must remain needs_review.');
if (!boundedExecutor.includes("execution.executor_id !== 'hkjc-bounded-generator-actions'")) fail('bounded HKJC executor identity guard missing.');
if (!boundedExecutor.includes("execution.collection_mode !== 'date_window'")) fail('bounded HKJC date-window guard missing.');
if (!boundedExecutor.includes("capability_rank: 'C'")) fail('bounded HKJC executor must remain C-level at reconciliation stage.');
if (!boundedExecutor.includes("publication_effect: 'none'")) fail('bounded HKJC executor publication-effect boundary missing.');
if (!boundedExecutor.includes("data/candidates/hong-kong-hkjc-candidates.json")) fail('bounded HKJC executor candidate source differs.');

const legacy = audit.legacy_rolling_evidence;
if ((route.meetings ?? []).length !== legacy.route_meeting_count) fail(`legacy route meeting count differs: ${route.meetings?.length ?? 0}`);
if ((normalized.records ?? []).length !== legacy.normalized_record_count) fail(`legacy normalized record count differs: ${normalized.records?.length ?? 0}`);
const rankCounts = { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 };
for (const record of normalized.records ?? []) {
  if (!(record.capability_rank in rankCounts)) fail(`unexpected legacy rank ${record.capability_rank}`);
  else rankCounts[record.capability_rank] += 1;
}
if (!exact(rankCounts, legacy.rank_counts)) fail(`legacy rank counts differ: ${JSON.stringify(rankCounts)}`);
if (!normalized.records.some((record) => record.meeting_id === legacy.historical_a_plus_meeting_id && record.capability_rank === 'A+')) {
  fail('historical A+ evidence meeting missing or not A+.');
}
if (report.generated_at !== legacy.generated_at) fail('legacy report generated_at differs from audit.');
if (report.fixture_meeting_count !== legacy.route_meeting_count) fail('legacy report fixture count differs from audit.');
if (!report.statuses.some((row) => row.meeting_date === '2026-06-10' && row.status === 'a_plus_ready')) fail('legacy report A+ evidence marker missing.');
if (legacy.evidence_role !== 'reviewed_historical_migration_evidence_only') fail('legacy evidence role differs.');

const legacyDecision = audit.legacy_orchestrator_decision;
if (legacyDecision.path !== 'scripts/timetable/refresh-hkjc.mjs') fail('legacy orchestrator path differs.');
if (legacyDecision.default_execution !== 'fail_closed') fail('legacy default execution decision differs.');
if (legacyDecision.research_flag !== '--legacy-research-only') fail('legacy research flag differs.');
for (const allowedStep of legacyDecision.research_steps) {
  if (!orchestrator.includes(allowedStep)) fail(`research step missing from orchestrator: ${allowedStep}`);
}
for (const forbiddenStep of legacyDecision.forbidden_steps) {
  if (orchestrator.includes(forbiddenStep)) fail(`forbidden direct-write step remains in orchestrator: ${forbiddenStep}`);
}
if (!orchestrator.includes("args.includes('--legacy-research-only')")) fail('legacy research-only explicit flag guard missing.');
if (!orchestrator.includes('legacy rolling refresh is quarantined from canonical/public write paths')) fail('legacy quarantine error marker missing.');
if (legacyDecision.canonical_write_enabled !== false || legacyDecision.public_write_enabled !== false) fail('legacy write boundary differs.');

const protectedFiles = [
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
];
const beforeHashes = Object.fromEntries(protectedFiles.map((file) => [file, sha256File(file)]));
const rejected = spawnSync(process.execPath, ['scripts/timetable/refresh-hkjc.mjs'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
if (rejected.status === 0) fail('legacy refresh default execution unexpectedly succeeded.');
const rejectionOutput = `${rejected.stdout ?? ''}\n${rejected.stderr ?? ''}`;
if (!rejectionOutput.includes('legacy rolling refresh is quarantined')) fail('legacy refresh rejection message differs.');
const afterHashes = Object.fromEntries(protectedFiles.map((file) => [file, sha256File(file)]));
if (!exact(beforeHashes, afterHashes)) fail('default rejected legacy refresh changed canonical/public files.');

const decisions = new Map((audit.migration_decisions ?? []).map((entry) => [entry.component, entry.decision]));
const expectedDecisions = new Map([
  ['official fixture/racecard fetch logic', 'retain_for_reviewed_migration'],
  ['normalization logic', 'retain_for_adapter_migration'],
  ['legacy direct canonical/public orchestration', 'quarantine'],
  ['bounded Actions C-level executor', 'retain_as_safe_fallback_foundation'],
]);
for (const [component, decision] of expectedDecisions) {
  if (decisions.get(component) !== decision) fail(`migration decision differs for ${component}.`);
}

if (audit.next_implementation_unit?.id !== 'HKJC-PILOT-02') fail('next HKJC implementation unit ID differs.');
if (audit.next_implementation_unit?.title !== 'HKJC artifact-only live fixture acquisition bridge') fail('next HKJC implementation unit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) {
  if (value !== false) fail(`reconciliation side-effect boundary ${key} must be false.`);
}

const docs = readText('docs/calendar/hkjc-pilot-reconciliation.md');
for (const phrase of [
  'transition_legacy_refresh_to_shared_control_plane',
  'Default execution now fails closed.',
  '--legacy-research-only',
  'route meetings: 10',
  'A+ records: 1',
  'C records: 9',
  'retain_for_reviewed_migration',
  'retain_for_adapter_migration',
  'retain_as_safe_fallback_foundation',
  'HKJC-PILOT-02',
  'without canonical or public writes',
]) {
  if (!docs.includes(phrase)) fail(`HKJC reconciliation doc missing ${phrase}.`);
}

const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
for (const [label, text] of [['project roadmap', projectRoadmap], ['implementation roadmap', implementationRoadmap]]) {
  if (!text.includes('Current Work ID: `WHR-CAL-HONG-KONG-HKJC`')) fail(`${label} missing HKJC current Work ID.`);
  if (!text.includes('HKJC-PILOT-02')) fail(`${label} missing HKJC-PILOT-02 next unit.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_PILOT_RECONCILIATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_PILOT_RECONCILIATION: pass');
console.log('CURRENT_WORK_ID: WHR-CAL-HONG-KONG-HKJC');
console.log('REGISTRY_PROFILE_STATUS: provisional');
console.log('SHARED_BOUNDED_RANK: C');
console.log('LEGACY_ROUTE_MEETINGS: 10');
console.log('LEGACY_RANK_COUNTS: A+=1 C=9');
console.log('LEGACY_DIRECT_WRITE_PATH: quarantined');
console.log('DEFAULT_LEGACY_REFRESH: fail_closed');
console.log('CANONICAL_PUBLIC_HASHES_UNCHANGED_AFTER_REJECTION: pass');
console.log('NEXT_UNIT: HKJC-PILOT-02');
