import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-hkjc-pilot-03-live-evidence-v1.json');
const activation = readJson('data/audits/calendar-hkjc-detail-operator-activation-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const doc = readText('docs/calendar/hkjc-shared-actions-live-evidence.md');
const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
const acpPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');

if (audit.schema_version !== 'calendar-hkjc-pilot-03-live-evidence-v1') fail('audit schema version differs.');
if (audit.work_id !== 'WHR-CAL-HONG-KONG-HKJC' || audit.implementation_unit !== 'HKJC-PILOT-03') fail('audit work identity differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at invalid.');

const evidence = audit.evidence_run;
if (evidence.workflow_run_id !== 29094860976) fail('reviewed workflow run ID differs.');
if (evidence.batch_id !== 'nar-hkjc-actions-window-001-hkjc-august-actions-plan-job-001-run-001') fail('reviewed batch ID differs.');
if (evidence.requested_scope?.start_date !== '2026-08-01'
  || evidence.requested_scope?.end_date_exclusive !== '2026-08-29'
  || evidence.requested_scope?.timezone !== 'Asia/Hong_Kong') fail('reviewed requested scope differs.');
if (evidence.coverage_claim !== 'none' || evidence.observed_scope?.kind !== 'not_observed') fail('historical reviewed coverage differs.');
if (evidence.records_discovered !== 0 || evidence.records_updated !== 0) fail('historical record counts differ.');
if (evidence.source_error_count !== 1 || !exact(evidence.source_error_codes, ['parser_failure']) || !exact(evidence.source_error_scope_refs, ['month:2026-08'])) fail('historical source-error evidence differs.');
if (evidence.job_status !== 'source_error' || evidence.envelope_review_state !== 'needs_review' || evidence.publication_effect !== 'none') fail('historical Job/review/publication state differs.');
if (evidence.protected_state_hash_check !== 'pass' || evidence.repository_clean_after_cleanup !== true) fail('historical protected-state proof differs.');
for (const key of ['canonical_write_enabled','public_write_enabled','automatic_approval_enabled','automatic_promotion_enabled','automatic_publication_enabled']) {
  if (evidence[key] !== false) fail(`historical evidence ${key} must remain false.`);
}
for (const rank of ['C', 'B', 'B+', 'A', 'A+']) if (evidence.rank_counts?.[rank] !== 0) fail(`historical rank count ${rank} differs.`);

const decision = audit.decision;
if (decision.registry_profile_status !== 'provisional') fail('historical Registry profile decision differs.');
if (decision.schedule_path_decision !== 'remain_provisional_schedule_parser_reconciliation_required') fail('historical schedule-path decision differs.');
if (decision.detail_source_activation !== false || decision.detail_adapter_activation !== false) fail('historical PILOT-03 detail activation decision differs.');
if (!String(decision.reason).includes('parser_failure')) fail('historical decision reason must mention parser_failure.');
if (audit.next_implementation_unit?.id !== 'HKJC-PILOT-04') fail('historical next unit differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`historical boundary ${key} must remain false.`);

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('current HKJC Registry must remain provisional.');
  if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('current HKJC runner state differs.');
  if (profile.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('current HKJC schedule adapter differs.');
  if (profile.detail_source_id !== 'hkjc-detail-reviewed-import' || profile.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('current HKJC detail activation differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('current HKJC supported ranks differ.');
  if (profile.supports_selected_meetings !== false || profile.supports_rank_upgrade_retry !== false) fail('current HKJC selected-meeting retry must remain pending.');
}

if (activation.decision !== 'activate_operator_reviewed_detail_path'
  || activation.reviewed_reference?.technical_rank !== 'A+') fail('current HKJC detail activation audit differs.');
if (Object.values(activation.side_effect_boundary ?? {}).some((value) => value !== false)) fail('current activation side-effect boundary differs.');

for (const phrase of ['Status: completed evidence review; profile remains provisional','coverage_claim: none','parser_failure','records_discovered: 0','job_status: source_error','HKJC-PILOT-04']) {
  if (!doc.includes(phrase)) fail(`PILOT-03 document missing ${phrase}.`);
}
for (const [label, text] of [['project roadmap', projectRoadmap], ['implementation roadmap', implementationRoadmap], ['ACP implementation plan', acpPlan]]) {
  for (const phrase of ['HKJC-PILOT-03', 'parser_failure', 'HKJC-PILOT-04']) if (!text.includes(phrase)) fail(`${label} missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html','source_body','horse_name','jockey_name','trainer_name','odds_value','result_payload','payout_amount','stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`audit contains forbidden data key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_PILOT_03_LIVE_EVIDENCE_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_PILOT_03_LIVE_EVIDENCE_DECISION: pass');
console.log('HISTORICAL_SOURCE_ERROR: parser_failure');
console.log('HISTORICAL_DETAIL_ACTIVATION: false');
console.log('CURRENT_OPERATOR_DETAIL_SOURCE_ADAPTER: active');
console.log('CURRENT_SELECTED_MEETING_RANK_RETRY: pending');
