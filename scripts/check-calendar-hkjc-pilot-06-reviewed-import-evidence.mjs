import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const audit = readJson('data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json');
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
if (evidence.observed_rank !== 'B') fail('observed rank must remain B.');
if (evidence.first_race_time_local !== '18:30') fail('first race time differs.');
if (evidence.last_race_time_local !== null) fail('last race time must remain null.');
if (evidence.timetable_row_count !== 0) fail('B evidence must not expose timetable rows.');
if (evidence.coverage_claim !== 'partial') fail('coverage claim differs.');
if (evidence.unresolved_meeting_count !== 1) fail('unresolved meeting count differs.');
if (evidence.runner_used !== 'reviewed_import') fail('runner identity differs.');
if (evidence.candidate_review_state !== 'needs_review') fail('candidate review state differs.');
if (evidence.promotion_target !== null) fail('promotion target must remain null.');
if (evidence.network_fetch !== false) fail('package evidence must remain network-free.');
if (evidence.raw_source_storage !== 'disabled') fail('raw source storage boundary differs.');
if (evidence.canonical_write !== 'disabled' || evidence.public_write !== 'disabled') fail('write boundary differs.');
if (evidence.publication_effect !== 'none') fail('publication effect differs.');
if (evidence.protected_state_hash_check !== 'pass') fail('protected-state proof differs.');
if (evidence.repository_clean_after_run !== true) fail('repository cleanup proof differs.');

const decision = audit.decision ?? {};
if (decision.reviewed_import_operator_path !== 'evidence_backed') fail('reviewed-import operator decision differs.');
if (decision.system_level_fallback_activation !== false) fail('system-level fallback activation must remain false.');
if (decision.fallback_runner_status !== 'pending') fail('fallback runner status must remain pending.');
if (decision.registry_detail_source_activation !== false || decision.registry_detail_adapter_activation !== false) fail('Registry detail activation must remain false.');
if (decision.registry_supported_rank_expansion !== false) fail('Registry supported-rank expansion must remain false.');
if (!String(decision.reason).includes('system-level Acquisition Registry')) fail('decision reason must explain Registry granularity boundary.');

if (audit.next_subunit?.id !== 'HKJC-PILOT-06B') fail('next subunit differs.');
if (audit.next_subunit?.title !== 'HKJC route-specific runner policy representation') fail('next subunit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`boundary ${key} must remain false.`);

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('HKJC Registry profile must remain provisional.');
  if (profile.primary_runner !== 'github_actions') fail('HKJC schedule primary runner must remain github_actions.');
  if (profile.fallback_runner !== null) fail('HKJC system fallback must remain null.');
  if (!profile.pending_fields?.includes('fallback_runner')) fail('HKJC fallback_runner must remain pending.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('HKJC detail source/adapter must remain null.');
  if (JSON.stringify(profile.supported_observation_ranks) !== JSON.stringify(['C'])) fail('HKJC Registry supported ranks must remain C-only.');
}

for (const phrase of [
  'Status: reviewed-import detail operator path evidence-backed; system-level fallback remains pending',
  'workflow run: 29106908246',
  'rank: B',
  'runner_used: reviewed_import',
  'fallback_runner: null',
  'HKJC-PILOT-06B',
  'HKJC route-specific runner policy representation',
]) {
  if (!doc.includes(phrase)) fail(`evidence document missing ${phrase}.`);
}
for (const phrase of ['reviewed-import boundary', 'fallback_runner: null', 'PILOT-06']) {
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
console.log('WORKFLOW_RUN_ID: 29106908246');
console.log('INPUT_SHA256: 4bf489f4c6c31f9fc9c7a21606ac2625f297e6d192a6a4636933d80de29a138b');
console.log('OBSERVED_RANK: B');
console.log('RUNNER_USED: reviewed_import');
console.log('OPERATOR_PATH: evidence_backed');
console.log('SYSTEM_LEVEL_FALLBACK_ACTIVATION: false');
console.log('FALLBACK_RUNNER_STATUS: pending');
console.log('REGISTRY_DETAIL_ACTIVATION: false');
console.log('NEXT_SUBUNIT: HKJC-PILOT-06B');
