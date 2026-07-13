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
const activation = readJson('data/audits/calendar-hkjc-detail-operator-activation-v1.json');
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
const historicalState = audit.registry_state;
if (historicalState?.primary_runner !== 'github_actions' || historicalState?.fallback_runner !== 'local') fail('historical reconciliation runner state differs.');
if (historicalState?.schedule_adapter_id !== 'hong-kong-hkjc-dry-run-adapter') fail('historical reconciliation schedule adapter differs.');
if (historicalState?.detail_source_id !== null || historicalState?.detail_adapter_id !== null) fail('historical reconciliation detail state differs.');
if (!exact(historicalState?.supported_observation_ranks, ['C'])) fail('historical reconciliation supported ranks differ.');

if (!profile) fail('current HKJC Registry profile missing.');
else {
  if (profile.system_id !== historicalState.system_id || profile.profile_status !== historicalState.profile_status) fail('current Registry identity/status differs from historical reconciliation.');
  if (profile.primary_runner !== 'github_actions') fail('current HKJC schedule primary runner must remain GitHub Actions.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('current HKJC fallback runner must remain pending.');
  if (profile.schedule_source_id !== historicalState.schedule_source_id) fail('current HKJC schedule source differs from historical reconciliation.');
  if (profile.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('current HKJC schedule adapter must point to artifact bridge.');
  if (profile.detail_source_id !== 'hkjc-detail-reviewed-import' || profile.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('current HKJC detail activation differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('current HKJC supported ranks differ.');
  if (profile.public_ceiling !== 'A') fail('current HKJC public ceiling must remain A.');
  if (profile.supports_selected_meetings !== false || profile.supports_rank_upgrade_retry !== false) fail('current HKJC selected-meeting retry must remain pending.');
}

if (activation.schema_version !== 'calendar-hkjc-detail-operator-activation-v1'
  || activation.decision !== 'activate_operator_reviewed_detail_path') fail('current HKJC activation audit differs.');
if (activation.reviewed_reference?.meeting_id !== 'hkjc-happy-valley-racecourse-2026-06-10'
  || activation.reviewed_reference?.race_count !== 9
  || activation.reviewed_reference?.technical_rank !== 'A+') fail('current HKJC reviewed reference differs.');
if (Object.values(activation.side_effect_boundary ?? {}).some((value) => value !== false)) fail('current activation side-effect boundary differs.');

const shared = audit.shared_control_plane_state;
if (candidates.source_adapter_id !== 'hong-kong-hkjc-dry-run-adapter') fail('historical candidate source adapter differs.');
if (candidates.candidate_window?.start_date !== shared.candidate_window_start
  || candidates.candidate_window?.end_date_exclusive !== shared.candidate_window_end_exclusive) fail('historical candidate window differs.');
if ((candidates.records ?? []).length !== shared.candidate_record_count) fail('historical candidate record count differs.');
if (!candidates.records.every((record) => record.review_status === 'needs_review')) fail('historical candidate source must remain needs_review.');
if (!boundedExecutor.includes("execution.executor_id !== 'hkjc-bounded-generator-actions'")) fail('bounded HKJC executor identity guard missing.');
if (!boundedExecutor.includes("execution.collection_mode !== 'date_window'")) fail('bounded HKJC date-window guard missing.');
if (!boundedExecutor.includes("capability_rank: 'C'")) fail('bounded HKJC schedule executor must remain C-level.');
if (!boundedExecutor.includes("publication_effect: 'none'")) fail('bounded HKJC executor publication boundary missing.');

const legacy = audit.legacy_rolling_evidence;
if ((route.meetings ?? []).length !== legacy.route_meeting_count) fail('legacy route meeting count differs.');
if ((normalized.records ?? []).length !== legacy.normalized_record_count) fail('legacy normalized record count differs.');
const rankCounts = { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 };
for (const record of normalized.records ?? []) {
  if (!(record.capability_rank in rankCounts)) fail(`unexpected legacy rank ${record.capability_rank}`);
  else rankCounts[record.capability_rank] += 1;
}
if (!exact(rankCounts, legacy.rank_counts)) fail(`legacy rank counts differ: ${JSON.stringify(rankCounts)}`);
if (!normalized.records.some((record) => record.meeting_id === legacy.historical_a_plus_meeting_id && record.capability_rank === 'A+')) fail('historical A+ evidence meeting missing.');
if (report.generated_at !== legacy.generated_at || report.fixture_meeting_count !== legacy.route_meeting_count) fail('legacy report evidence differs.');
if (!report.statuses.some((row) => row.meeting_date === '2026-06-10' && row.status === 'a_plus_ready')) fail('legacy report A+ marker missing.');
if (legacy.evidence_role !== 'reviewed_historical_migration_evidence_only') fail('legacy evidence role differs.');

const legacyDecision = audit.legacy_orchestrator_decision;
if (legacyDecision.path !== 'scripts/timetable/refresh-hkjc.mjs' || legacyDecision.default_execution !== 'fail_closed' || legacyDecision.research_flag !== '--legacy-research-only') fail('legacy orchestrator decision differs.');
for (const allowedStep of legacyDecision.research_steps) if (!orchestrator.includes(allowedStep)) fail(`research step missing: ${allowedStep}`);
for (const forbiddenStep of legacyDecision.forbidden_steps) if (orchestrator.includes(forbiddenStep)) fail(`forbidden direct-write step remains: ${forbiddenStep}`);
if (!orchestrator.includes("args.includes('--legacy-research-only')") || !orchestrator.includes('legacy rolling refresh is quarantined from canonical/public write paths')) fail('legacy quarantine guard differs.');
if (legacyDecision.canonical_write_enabled !== false || legacyDecision.public_write_enabled !== false) fail('legacy write boundary differs.');

const protectedFiles = [
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json',
];
const beforeHashes = Object.fromEntries(protectedFiles.map((file) => [file, sha256File(file)]));
const rejected = spawnSync(process.execPath, ['scripts/timetable/refresh-hkjc.mjs'], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
if (rejected.status === 0) fail('legacy refresh default execution unexpectedly succeeded.');
if (!`${rejected.stdout ?? ''}\n${rejected.stderr ?? ''}`.includes('legacy rolling refresh is quarantined')) fail('legacy refresh rejection message differs.');
const afterHashes = Object.fromEntries(protectedFiles.map((file) => [file, sha256File(file)]));
if (!exact(beforeHashes, afterHashes)) fail('rejected legacy refresh changed protected files.');

const decisions = new Map((audit.migration_decisions ?? []).map((entry) => [entry.component, entry.decision]));
const expectedDecisions = new Map([
  ['official fixture/racecard fetch logic', 'retain_for_reviewed_migration'],
  ['normalization logic', 'retain_for_adapter_migration'],
  ['legacy direct canonical/public orchestration', 'quarantine'],
  ['bounded Actions C-level executor', 'retain_as_safe_fallback_foundation'],
]);
for (const [component, decisionValue] of expectedDecisions) if (decisions.get(component) !== decisionValue) fail(`migration decision differs for ${component}.`);

if (audit.next_implementation_unit?.id !== 'HKJC-PILOT-02') fail('historical next unit ID differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`historical reconciliation boundary ${key} must be false.`);

const docs = readText('docs/calendar/hkjc-pilot-reconciliation.md');
for (const phrase of ['transition_legacy_refresh_to_shared_control_plane','Default execution now fails closed.','--legacy-research-only','route meetings: 10','A+ records: 1','C records: 9','HKJC-PILOT-02']) {
  if (!docs.includes(phrase)) fail(`HKJC reconciliation doc missing ${phrase}.`);
}
const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
for (const [label, text] of [['project roadmap', projectRoadmap], ['implementation roadmap', implementationRoadmap]]) {
  if (!text.includes('WHR-CAL-HONG-KONG-HKJC') || !text.includes('WHR-CAL-PUBLIC-V1') || !text.includes('HKJC-PILOT-02')) fail(`${label} historical/current markers differ.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_PILOT_RECONCILIATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_PILOT_RECONCILIATION: pass');
console.log('HISTORICAL_LEGACY_RANK_COUNTS: A+=1 C=9');
console.log('LEGACY_DIRECT_WRITE_PATH: quarantined');
console.log('CURRENT_OPERATOR_DETAIL_SOURCE_ADAPTER: active');
console.log('CURRENT_SELECTED_MEETING_RANK_RETRY: pending');
