import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const audit = readJson('data/audits/calendar-hkjc-pilot-04-live-evidence-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const doc = readText('docs/calendar/hkjc-pilot-04-live-evidence.md');
const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
const acpPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');

if (audit.schema_version !== 'calendar-hkjc-pilot-04-live-evidence-v1') fail('audit schema version differs.');
if (audit.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('audit Work ID differs.');
if (audit.implementation_unit !== 'HKJC-PILOT-04') fail('audit implementation unit differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at invalid.');

const evidence = audit.evidence_run;
if (evidence.workflow_run_id !== 29102195265) fail('reviewed workflow run ID differs.');
if (evidence.artifact_id !== 8231284923) fail('reviewed artifact ID differs.');
if (evidence.artifact_digest !== 'sha256:4e38d6e5ec849cf2b54de08d4c9a9a954a82295236b657152f4e83a01be539f1') fail('reviewed artifact digest differs.');
if (evidence.batch_id !== 'nar-hkjc-actions-window-001-hkjc-august-actions-plan-job-001-run-001') fail('reviewed batch ID differs.');
if (evidence.requested_scope?.start_date !== '2026-08-01'
  || evidence.requested_scope?.end_date_exclusive !== '2026-08-29'
  || evidence.requested_scope?.timezone !== 'Asia/Hong_Kong') fail('reviewed requested scope differs.');
if (evidence.coverage_claim !== 'source_window_complete') fail('reviewed coverage claim must be source_window_complete.');
if (evidence.observed_scope?.kind !== 'date_window') fail('reviewed observed scope must be date_window.');
if (evidence.records_discovered !== 0 || evidence.records_updated !== 0) fail('reviewed record counts must remain zero.');
if (evidence.source_error_count !== 0 || evidence.source_error_codes?.length !== 0) fail('reviewed source errors must remain zero.');
if (JSON.stringify(evidence.valid_empty_months) !== JSON.stringify(['2026-08'])) fail('reviewed valid-empty month differs.');
if (evidence.job_status !== 'success') fail('reviewed Job status differs.');
if (evidence.envelope_review_state !== 'needs_review') fail('reviewed envelope state differs.');
if (evidence.publication_effect !== 'none') fail('reviewed publication effect differs.');
if (evidence.protected_state_hash_check !== 'pass') fail('protected state hash evidence differs.');
if (evidence.repository_clean_after_cleanup !== true) fail('repository cleanup evidence differs.');
for (const key of [
  'canonical_write_enabled',
  'public_write_enabled',
  'automatic_approval_enabled',
  'automatic_promotion_enabled',
  'automatic_publication_enabled',
]) {
  if (evidence[key] !== false) fail(`evidence ${key} must remain false.`);
}
for (const rank of ['C', 'B', 'B+', 'A', 'A+']) {
  if (evidence.rank_counts?.[rank] !== 0) fail(`reviewed rank count ${rank} must remain zero.`);
}

const decision = audit.decision;
if (decision.registry_profile_status !== 'provisional') fail('decision Registry profile status differs.');
if (decision.schedule_path_decision !== 'accept_evidence_backed_schedule_path_keep_full_profile_provisional') fail('schedule path decision differs.');
if (decision.schedule_source_activation !== true || decision.schedule_adapter_activation !== true) fail('schedule path activation decision must be true.');
if (decision.detail_source_activation !== false || decision.detail_adapter_activation !== false) fail('detail activation decision must remain false.');
if (!String(decision.reason).includes('source_window_complete')) fail('decision reason must mention successful coverage evidence.');
if (!String(decision.reason).includes('detail_source_id') || !String(decision.reason).includes('detail_adapter_id')) fail('decision reason must explain pending detail path.');

if (audit.next_implementation_unit?.id !== 'HKJC-PILOT-05') fail('next implementation unit differs.');
if (audit.next_implementation_unit?.title !== 'HKJC artifact-only timetable detail adapter migration') fail('next implementation title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) {
  if (value !== false) fail(`PILOT-04 decision boundary ${key} must remain false.`);
}

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('HKJC overall Registry profile must remain provisional until detail path exists.');
  if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== 'local') fail('HKJC runner profile differs.');
  if (profile.schedule_source_id !== 'hkjc-fixture-list') fail('HKJC schedule source differs.');
  if (profile.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('HKJC schedule adapter differs.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('HKJC detail path must remain inactive.');
  if (JSON.stringify(profile.supported_observation_ranks) !== JSON.stringify(['C'])) fail('HKJC supported observation ranks differ.');
  if (profile.supports_date_window !== true) fail('HKJC date-window support must remain true.');
  if (profile.supports_cross_month_window !== false
    || profile.supports_selected_meetings !== false
    || profile.supports_source_visible_horizon !== false
    || profile.supports_rank_upgrade_retry !== false) fail('unproven HKJC scope/retry capability was enabled.');
  if (!profile.operator_notes.includes('PILOT-04')) fail('HKJC Registry notes must record PILOT-04 evidence decision.');
  if (!profile.operator_notes.includes('HKJC-PILOT-05')) fail('HKJC Registry notes must record PILOT-05 handoff.');
}

for (const phrase of [
  'Status: completed evidence review; schedule path accepted, full Registry profile remains provisional',
  'coverage_claim: source_window_complete',
  'valid_empty_months: 2026-08',
  'job_status: success',
  'protected state hash check: pass',
  'HKJC-PILOT-05',
  'artifact-only timetable detail adapter migration',
]) {
  if (!doc.includes(phrase)) fail(`PILOT-04 document missing ${phrase}.`);
}

for (const [label, text] of [
  ['project roadmap', projectRoadmap],
  ['implementation roadmap', implementationRoadmap],
  ['ACP implementation plan', acpPlan],
]) {
  for (const phrase of ['HKJC-PILOT-04', 'source_window_complete', 'HKJC-PILOT-05']) {
    if (!text.includes(phrase)) fail(`${label} missing ${phrase}.`);
  }
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`audit contains forbidden data key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_PILOT_04_LIVE_EVIDENCE_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_PILOT_04_LIVE_EVIDENCE_DECISION: pass');
console.log('WORKFLOW_RUN_ID: 29102195265');
console.log('COVERAGE_CLAIM: source_window_complete');
console.log('RECORDS_DISCOVERED: 0');
console.log('SOURCE_ERROR_COUNT: 0');
console.log('VALID_EMPTY_MONTHS: 2026-08');
console.log('JOB_STATUS: success');
console.log('REGISTRY_PROFILE_STATUS: provisional');
console.log('SCHEDULE_PATH_ACCEPTED: true');
console.log('DETAIL_ACTIVATION: false');
console.log('PROTECTED_STATE_HASH_CHECK: pass');
console.log('NEXT_UNIT: HKJC-PILOT-05');
