import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json');
const activation = readJson('data/audits/calendar-hkjc-detail-operator-activation-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const doc = readText('docs/calendar/hkjc-pilot-06-reviewed-import-evidence.md');
const reconciliationDoc = readText('docs/calendar/hkjc-detail-runner-source-route-reconciliation.md');

if (audit.schema_version !== 'calendar-hkjc-pilot-06-reviewed-import-evidence-v1') fail('audit schema differs.');
if (audit.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('audit Work ID differs.');
if (audit.implementation_unit !== 'HKJC-PILOT-06') fail('audit implementation unit differs.');
if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at invalid.');

const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29106908246) fail('evidence workflow run differs.');
if (evidence.artifact_id !== 8233171311) fail('evidence artifact ID differs.');
if (evidence.artifact_digest !== 'sha256:201cca150dd2d5008ee779e3211dd31b7966a271b84b99b1db27a269b6d0d55f') fail('evidence artifact digest differs.');
if (evidence.input_sha256 !== '4bf489f4c6c31f9fc9c7a21606ac2625f297e6d192a6a4636933d80de29a138b') fail('external input digest differs.');
if (evidence.review_state !== 'reviewed_public_safe') fail('review state differs.');
if (evidence.target_meeting_id !== 'hkjc-happy-valley-racecourse-2026-07-08') fail('target meeting differs.');
if (evidence.observed_rank !== 'B') fail('historical observed rank must remain B.');
if (evidence.first_race_time_local !== '18:30' || evidence.last_race_time_local !== null) fail('historical race-time evidence differs.');
if (evidence.timetable_row_count !== 0 || evidence.coverage_claim !== 'partial' || evidence.unresolved_meeting_count !== 1) fail('historical B coverage evidence differs.');
if (evidence.runner_used !== 'reviewed_import') fail('runner identity differs.');
if (evidence.candidate_review_state !== 'needs_review' || evidence.promotion_target !== null) fail('candidate review boundary differs.');
if (evidence.network_fetch !== false || evidence.raw_source_storage !== 'disabled') fail('network/raw-source boundary differs.');
if (evidence.canonical_write !== 'disabled' || evidence.public_write !== 'disabled' || evidence.publication_effect !== 'none') fail('write/publication boundary differs.');
if (evidence.protected_state_hash_check !== 'pass' || evidence.repository_clean_after_run !== true) fail('protected-state/cleanup proof differs.');

const decision = audit.decision ?? {};
if (decision.reviewed_import_operator_path !== 'evidence_backed') fail('historical reviewed-import operator decision differs.');
if (decision.system_level_fallback_activation !== false || decision.fallback_runner_status !== 'pending') fail('historical fallback decision differs.');
if (decision.registry_detail_source_activation !== false || decision.registry_detail_adapter_activation !== false) fail('historical PILOT-06 Registry detail activation decision differs.');
if (decision.registry_supported_rank_expansion !== false) fail('historical PILOT-06 rank-expansion decision differs.');
if (!String(decision.reason).includes('system-level Acquisition Registry')) fail('historical decision reason differs.');
if (audit.next_subunit?.id !== 'HKJC-PILOT-06B') fail('historical next subunit differs.');
if (audit.next_subunit?.title !== 'HKJC route-specific runner policy representation') fail('historical next subunit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`historical boundary ${key} must remain false.`);

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('current HKJC Registry profile must remain provisional.');
  if (profile.primary_runner !== 'github_actions') fail('current HKJC schedule primary runner must remain github_actions.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('current HKJC fallback must remain pending.');
  if (profile.detail_source_id !== 'hkjc-detail-reviewed-import' || profile.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('current HKJC detail source/adapter activation differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('current HKJC supported ranks differ.');
  if (profile.public_ceiling !== 'A') fail('current HKJC public ceiling must remain A.');
  if (profile.supports_selected_meetings !== false || profile.supports_rank_upgrade_retry !== false) fail('current selected-meeting retry ownership must remain pending.');
}

if (activation.schema_version !== 'calendar-hkjc-detail-operator-activation-v1') fail('current activation audit schema differs.');
if (activation.work_id !== 'WHR-CAL-HKJC-DETAIL-RECOVERY' || activation.implementation_unit !== 'HKJC-DETAIL-RECOVERY-01') fail('current activation work identity differs.');
if (activation.decision !== 'activate_operator_reviewed_detail_path') fail('current activation decision differs.');
if (!exact(activation.detail_route?.evidence_backed_observation_ranks, ['B', 'A+'])) fail('current activation evidence ranks differ.');
if (!exact(activation.detail_route?.classifier_supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('current classifier ranks differ.');
if (Object.values(activation.side_effect_boundary ?? {}).some((value) => value !== false)) fail('current activation side-effect boundary differs.');

for (const phrase of [
  'Status: reviewed-import detail operator path evidence-backed; system-level fallback remains pending',
  'workflow run: 29106908246',
  'rank: B',
  'runner_used: reviewed_import',
  'fallback_runner: null',
  'HKJC-PILOT-06B',
]) {
  if (!doc.includes(phrase)) fail(`historical evidence document missing ${phrase}.`);
}
for (const phrase of ['Reviewed-import boundary', 'fallback_runner: null', 'PILOT-06']) {
  if (!reconciliationDoc.includes(phrase)) fail(`reconciliation document missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html','source_body','horse_name','jockey_name','trainer_name','odds_value','result_payload','payout_amount','prediction','tip','stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`audit contains forbidden data key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_PILOT_06_REVIEWED_IMPORT_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_PILOT_06_REVIEWED_IMPORT_EVIDENCE: pass');
console.log('HISTORICAL_OBSERVED_RANK: B');
console.log('HISTORICAL_REGISTRY_DETAIL_ACTIVATION: false');
console.log('CURRENT_OPERATOR_DETAIL_SOURCE_ADAPTER: active');
console.log('CURRENT_DETAIL_EVIDENCE_RANKS: B,A+');
console.log('CURRENT_SELECTED_MEETING_RANK_RETRY: pending');
