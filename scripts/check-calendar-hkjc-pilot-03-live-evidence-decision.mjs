import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const audit = readJson('data/audits/calendar-hkjc-pilot-03-live-evidence-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const doc = readText('docs/calendar/hkjc-shared-actions-live-evidence.md');
const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
const acpPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');

if (audit.schema_version !== 'calendar-hkjc-pilot-03-live-evidence-v1') fail('audit schema version differs.');
if (audit.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('audit Work ID differs.');
if (audit.implementation_unit !== 'HKJC-PILOT-03') fail('audit implementation unit differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at invalid.');

const evidence = audit.evidence_run;
if (evidence.workflow_run_id !== 29094860976) fail('reviewed workflow run ID differs.');
if (evidence.batch_id !== 'nar-hkjc-actions-window-001-hkjc-august-actions-plan-job-001-run-001') fail('reviewed batch ID differs.');
if (evidence.requested_scope?.start_date !== '2026-08-01'
  || evidence.requested_scope?.end_date_exclusive !== '2026-08-29'
  || evidence.requested_scope?.timezone !== 'Asia/Hong_Kong') fail('reviewed requested scope differs.');
if (evidence.coverage_claim !== 'none') fail('reviewed coverage claim must remain none.');
if (evidence.observed_scope?.kind !== 'not_observed') fail('reviewed observed scope must remain not_observed.');
if (evidence.records_discovered !== 0 || evidence.records_updated !== 0) fail('reviewed record counts must remain zero.');
if (evidence.source_error_count !== 1) fail('reviewed source error count differs.');
if (JSON.stringify(evidence.source_error_codes) !== JSON.stringify(['parser_failure'])) fail('reviewed source error code differs.');
if (JSON.stringify(evidence.source_error_scope_refs) !== JSON.stringify(['month:2026-08'])) fail('reviewed source error scope differs.');
if (evidence.job_status !== 'source_error') fail('reviewed Job status differs.');
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
if (decision.schedule_path_decision !== 'remain_provisional_schedule_parser_reconciliation_required') fail('schedule path decision differs.');
if (decision.detail_source_activation !== false || decision.detail_adapter_activation !== false) fail('detail activation decision must remain false.');
if (!String(decision.reason).includes('parser_failure')) fail('decision reason must mention parser_failure evidence.');

if (audit.next_implementation_unit?.id !== 'HKJC-PILOT-04') fail('next implementation unit differs.');
if (audit.next_implementation_unit?.title !== 'HKJC official fixture route and parser resilience reconciliation') fail('next implementation title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) {
  if (value !== false) fail(`PILOT-03 decision boundary ${key} must remain false.`);
}

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('HKJC Registry must remain provisional after the later transition stages.');
  if (profile.primary_runner !== 'github_actions') fail('HKJC schedule primary runner must remain GitHub Actions.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('HKJC fallback runner must remain pending under PILOT-06 reconciliation.');
  if (profile.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('HKJC schedule adapter differs.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('HKJC detail Registry path must remain inactive.');
  if (JSON.stringify(profile.supported_observation_ranks) !== JSON.stringify(['C'])) fail('HKJC Registry observation ranks must remain C-only.');
}

for (const phrase of [
  'Status: completed evidence review; profile remains provisional',
  'coverage_claim: none',
  'parser_failure',
  'records_discovered: 0',
  'job_status: source_error',
  'protected state hash check: pass',
  'HKJC-PILOT-04',
  'official fixture route and parser resilience reconciliation',
]) {
  if (!doc.includes(phrase)) fail(`PILOT-03 document missing ${phrase}.`);
}

for (const [label, text] of [
  ['project roadmap', projectRoadmap],
  ['implementation roadmap', implementationRoadmap],
  ['ACP implementation plan', acpPlan],
]) {
  for (const phrase of ['HKJC-PILOT-03', 'parser_failure', 'HKJC-PILOT-04']) {
    if (!text.includes(phrase)) fail(`${label} missing ${phrase}.`);
  }
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html', 'source_body', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`audit contains forbidden data key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_PILOT_03_LIVE_EVIDENCE_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_PILOT_03_LIVE_EVIDENCE_DECISION: pass');
console.log('WORKFLOW_RUN_ID: 29094860976');
console.log('COVERAGE_CLAIM: none');
console.log('RECORDS_DISCOVERED: 0');
console.log('SOURCE_ERROR: parser_failure');
console.log('JOB_STATUS: source_error');
console.log('REGISTRY_PROFILE_STATUS: provisional');
console.log('CURRENT_FALLBACK_RUNNER: pending');
console.log('DETAIL_ACTIVATION: false');
console.log('PROTECTED_STATE_HASH_CHECK: pass');
console.log('NEXT_UNIT_HISTORY: HKJC-PILOT-04');
