import fs from 'node:fs';
import path from 'node:path';
import {
  routePolicyForV1,
  validateRouteRunnerPolicyV1,
} from './timetable/route-runner-policy.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const decision = readJson('data/audits/calendar-hkjc-handoff-decision-v1.json');
const activation = readJson('data/audits/calendar-hkjc-detail-operator-activation-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const routePolicy = readJson('data/static/calendar-route-runner-policy-v1.json');
const runnerCompatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const p4 = readJson('data/audits/calendar-hkjc-pilot-04-live-evidence-v1.json');
const p5 = readJson('data/audits/calendar-hkjc-pilot-05-detail-route-evidence-v1.json');
const p6 = readJson('data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json');
const doc = readText('docs/calendar/hkjc-handoff-decision.md');
const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
const calendarIndex = readText('docs/calendar/README.md');

if (decision.schema_version !== 'calendar-hkjc-handoff-decision-v1') fail('handoff decision schema differs.');
if (decision.work_id !== 'WHR-CAL-HONG-KONG-HKJC' || decision.decision_id !== 'HKJC-HANDOFF-01') fail('handoff decision identity differs.');
if (Number.isNaN(Date.parse(decision.reviewed_at))) fail('handoff reviewed_at invalid.');
if (decision.decision !== 'accept_manual_reviewed_steady_state_handoff') fail('handoff decision differs.');
if (decision.completed_work_id !== 'WHR-CAL-HONG-KONG-HKJC' || decision.next_work_id !== 'WHR-CAL-UAE-ERA') fail('handoff Work ID transition differs.');

const accepted = decision.accepted_state ?? {};
if (accepted.registry_profile_status !== 'provisional') fail('historical accepted Registry status differs.');
if (accepted.system_primary_runner !== 'github_actions') fail('historical accepted primary runner differs.');
if (accepted.system_fallback_runner !== null || accepted.system_fallback_runner_status !== 'pending') fail('historical accepted fallback state differs.');
if (accepted.registry_detail_source_id !== null || accepted.registry_detail_adapter_id !== null) fail('historical accepted detail route must remain null.');
if (!exact(accepted.registry_supported_observation_ranks, ['C'])) fail('historical accepted observation ranks differ.');

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('current HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('current HKJC profile must remain provisional.');
  if (profile.primary_runner !== 'github_actions') fail('current HKJC primary runner differs.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('current HKJC fallback must remain null and pending.');
  if (profile.detail_source_id !== 'hkjc-detail-reviewed-import' || profile.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('current HKJC detail source/adapter activation differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('current HKJC supported ranks differ.');
  if (profile.public_ceiling !== 'A') fail('current HKJC public ceiling must remain A.');
  if (profile.supports_selected_meetings !== false || profile.supports_rank_upgrade_retry !== false) fail('current HKJC retry ownership must remain pending.');
}

const routeErrors = validateRouteRunnerPolicyV1(routePolicy, registry, runnerCompatibility);
if (routeErrors.length) fail(`current route policy invalid: ${routeErrors.join('; ')}`);
let schedule = null;
let detail = null;
try {
  schedule = routePolicyForV1(routePolicy, 'hong-kong-hkjc-system', 'schedule');
  detail = routePolicyForV1(routePolicy, 'hong-kong-hkjc-system', 'detail');
} catch (error) {
  fail(`HKJC route policy missing: ${error.message}`);
}
if (schedule) {
  if (schedule.status !== 'active' || schedule.selection_mode !== 'collection_job' || schedule.primary_runner !== 'github_actions') fail('current HKJC schedule route differs.');
  if (!exact(schedule.evidence_backed_observation_ranks, ['C'])) fail('current HKJC schedule evidence ranks differ.');
}
if (detail) {
  if (detail.status !== 'operator_path_evidence_backed' || detail.selection_mode !== 'operator_only' || detail.primary_runner !== 'reviewed_import') fail('current HKJC detail route differs.');
  if (detail.source_id !== 'hkjc-detail-reviewed-import' || detail.adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('current HKJC detail route identity differs.');
  if (!exact(detail.evidence_backed_observation_ranks, ['B', 'A+'])) fail('current HKJC detail evidence ranks differ.');
  if (detail.automatic_planning_allowed !== false || detail.automatic_execution_allowed !== false) fail('current HKJC detail automation boundary differs.');
}

if (p4.evidence_run?.coverage_claim !== 'source_window_complete'
  || p4.evidence_run?.source_error_count !== 0
  || !exact(p4.evidence_run?.valid_empty_months, ['2026-08'])
  || p4.evidence_run?.job_status !== 'success') fail('historical PILOT-04 schedule evidence differs.');
if (p5.decision?.detail_route_status !== 'hosted_http_path_not_proven') fail('historical PILOT-05 hosted detail state differs.');
if (p6.decision?.reviewed_import_operator_path !== 'evidence_backed'
  || p6.decision?.system_level_fallback_activation !== false
  || p6.evidence_run?.observed_rank !== 'B'
  || p6.evidence_run?.runner_used !== 'reviewed_import') fail('historical PILOT-06 reviewed-import evidence differs.');

if (activation.schema_version !== 'calendar-hkjc-detail-operator-activation-v1') fail('current activation audit schema differs.');
if (activation.work_id !== 'WHR-CAL-HKJC-DETAIL-RECOVERY' || activation.implementation_unit !== 'HKJC-DETAIL-RECOVERY-01') fail('current activation work identity differs.');
if (activation.decision !== 'activate_operator_reviewed_detail_path') fail('current activation decision differs.');
if (activation.reviewed_reference?.meeting_id !== 'hkjc-happy-valley-racecourse-2026-06-10'
  || activation.reviewed_reference?.race_count !== 9
  || activation.reviewed_reference?.technical_rank !== 'A+') fail('current reviewed A+ reference differs.');
if (Object.values(activation.side_effect_boundary ?? {}).some((value) => value !== false)) fail('current activation side-effect boundary differs.');

const expectedHistoricalRefs = [
  'data/audits/calendar-hkjc-pilot-04-live-evidence-v1.json',
  'data/audits/calendar-hkjc-pilot-05-detail-route-evidence-v1.json',
  'data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json',
  'data/static/calendar-route-runner-policy-v1.json',
];
if (!exact(decision.evidence_refs, expectedHistoricalRefs)) fail('historical handoff evidence refs differ.');
for (const ref of [...expectedHistoricalRefs, 'data/audits/calendar-hkjc-detail-operator-activation-v1.json']) {
  if (!fs.existsSync(path.join(root, ref))) fail(`evidence ref missing: ${ref}`);
}

const claims = decision.handoff_claims ?? {};
for (const key of ['schedule_path_evidence_backed','detail_operator_path_evidence_backed','ordinary_incremental_manual_reviewed_operation_allowed','future_hkjc_maintenance_may_continue_without_blocking_uae_start']) {
  if (claims[key] !== true) fail(`historical handoff claim ${key} must be true.`);
}
for (const key of ['system_level_fallback_activated','registry_detail_path_activated','full_detail_completeness_claimed','full_season_completeness_claimed','automatic_detail_acquisition_claimed','automatic_publication_claimed']) {
  if (claims[key] !== false) fail(`historical handoff claim ${key} must be false.`);
}
for (const [key, value] of Object.entries(decision.boundaries ?? {})) if (value !== false) fail(`historical handoff boundary ${key} must remain false.`);

for (const phrase of ['Status: handoff accepted for bounded manual reviewed steady-state operation','WHR-CAL-UAE-ERA','schedule path: evidence-backed','detail operator path: evidence-backed','Registry profile: provisional','system fallback runner: pending']) {
  if (!doc.includes(phrase)) fail(`historical handoff document missing ${phrase}.`);
}
for (const phrase of ['HKJC handoff accepted','bounded manual reviewed steady-state operation','WHR-CAL-UAE-ERA']) if (!projectRoadmap.includes(phrase)) fail(`project roadmap missing ${phrase}.`);
for (const phrase of ['HKJC handoff accepted','WHR-CAL-UAE-ERA','entrypoint synchronization']) if (!implementationRoadmap.includes(phrase)) fail(`implementation roadmap missing ${phrase}.`);
if (!calendarIndex.includes('hkjc-handoff-decision.md') || !calendarIndex.includes('data/audits/calendar-hkjc-handoff-decision-v1.json')) fail('Calendar index missing HKJC handoff references.');

const serialized = JSON.stringify(decision).toLowerCase();
for (const forbiddenKey of ['raw_html','source_body','horse_name','jockey_name','trainer_name','odds_value','result_payload','payout_amount','prediction','tip','stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`handoff audit contains forbidden key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_HANDOFF_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_HANDOFF_DECISION: pass');
console.log('HISTORICAL_HANDOFF: accepted_manual_reviewed_steady_state');
console.log('HISTORICAL_REGISTRY_DETAIL_ACTIVATION: false');
console.log('CURRENT_OPERATOR_DETAIL_SOURCE_ADAPTER: active');
console.log('CURRENT_DETAIL_EVIDENCE_RANKS: B,A+');
console.log('CURRENT_SELECTED_MEETING_RANK_RETRY: pending');
