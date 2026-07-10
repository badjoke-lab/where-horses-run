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
if (decision.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('handoff Work ID differs.');
if (decision.decision_id !== 'HKJC-HANDOFF-01') fail('handoff decision ID differs.');
if (Number.isNaN(Date.parse(decision.reviewed_at))) fail('handoff reviewed_at invalid.');
if (decision.decision !== 'accept_manual_reviewed_steady_state_handoff') fail('handoff decision differs.');
if (decision.completed_work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('completed Work ID differs.');
if (decision.next_work_id !== 'WHR-CAL-UAE-ERA') fail('next Work ID differs.');

const accepted = decision.accepted_state ?? {};
if (accepted.registry_profile_status !== 'provisional') fail('accepted Registry status must remain provisional.');
if (accepted.system_primary_runner !== 'github_actions') fail('accepted system primary runner differs.');
if (accepted.system_fallback_runner !== null || accepted.system_fallback_runner_status !== 'pending') fail('accepted system fallback state differs.');
if (accepted.registry_detail_source_id !== null || accepted.registry_detail_adapter_id !== null) fail('accepted Registry detail route must remain null.');
if (!exact(accepted.registry_supported_observation_ranks, ['C'])) fail('accepted Registry observation ranks differ.');

const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== accepted.registry_profile_status) fail('Registry profile status differs from handoff decision.');
  if (profile.primary_runner !== accepted.system_primary_runner) fail('Registry primary runner differs from handoff decision.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('Registry fallback must remain null and pending.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('Registry detail source/adapter must remain null.');
  if (!exact(profile.supported_observation_ranks, ['C'])) fail('Registry supported ranks must remain C-only.');
}

const routeErrors = validateRouteRunnerPolicyV1(routePolicy, registry, runnerCompatibility);
if (routeErrors.length) fail(`route policy invalid at handoff: ${routeErrors.join('; ')}`);
let schedule = null;
let detail = null;
try {
  schedule = routePolicyForV1(routePolicy, 'hong-kong-hkjc-system', 'schedule');
  detail = routePolicyForV1(routePolicy, 'hong-kong-hkjc-system', 'detail');
} catch (error) {
  fail(`HKJC route policy missing: ${error.message}`);
}
if (schedule) {
  for (const [key, value] of Object.entries(accepted.schedule_route ?? {})) {
    if (!exact(schedule[key], value)) fail(`accepted schedule route ${key} differs from policy.`);
  }
  if (schedule.registry_activation !== false) fail('schedule policy supplement must not activate Registry fields.');
}
if (detail) {
  for (const [key, value] of Object.entries(accepted.detail_route ?? {})) {
    if (!exact(detail[key], value)) fail(`accepted detail route ${key} differs from policy.`);
  }
  if (detail.registry_activation !== false) fail('detail policy supplement must not activate Registry fields.');
}

if (p4.evidence_run?.coverage_claim !== 'source_window_complete'
  || p4.evidence_run?.source_error_count !== 0
  || !exact(p4.evidence_run?.valid_empty_months, ['2026-08'])
  || p4.evidence_run?.job_status !== 'success') fail('PILOT-04 schedule evidence no longer matches handoff claim.');
if (p5.decision?.detail_route_status !== 'hosted_http_path_not_proven') fail('PILOT-05 hosted detail blocker state differs.');
if (p6.decision?.reviewed_import_operator_path !== 'evidence_backed'
  || p6.decision?.system_level_fallback_activation !== false
  || p6.evidence_run?.observed_rank !== 'B'
  || p6.evidence_run?.runner_used !== 'reviewed_import') fail('PILOT-06 reviewed-import evidence state differs.');

const expectedEvidenceRefs = [
  'data/audits/calendar-hkjc-pilot-04-live-evidence-v1.json',
  'data/audits/calendar-hkjc-pilot-05-detail-route-evidence-v1.json',
  'data/audits/calendar-hkjc-pilot-06-reviewed-import-evidence-v1.json',
  'data/static/calendar-route-runner-policy-v1.json',
];
if (!exact(decision.evidence_refs, expectedEvidenceRefs)) fail('handoff evidence refs differ.');
for (const ref of expectedEvidenceRefs) if (!fs.existsSync(path.join(root, ref))) fail(`handoff evidence ref missing: ${ref}`);

const claims = decision.handoff_claims ?? {};
for (const key of ['schedule_path_evidence_backed', 'detail_operator_path_evidence_backed', 'ordinary_incremental_manual_reviewed_operation_allowed', 'future_hkjc_maintenance_may_continue_without_blocking_uae_start']) {
  if (claims[key] !== true) fail(`handoff claim ${key} must be true.`);
}
for (const key of ['system_level_fallback_activated', 'registry_detail_path_activated', 'full_detail_completeness_claimed', 'full_season_completeness_claimed', 'automatic_detail_acquisition_claimed', 'automatic_publication_claimed']) {
  if (claims[key] !== false) fail(`handoff claim ${key} must be false.`);
}
for (const [key, value] of Object.entries(decision.boundaries ?? {})) if (value !== false) fail(`handoff boundary ${key} must remain false.`);

for (const phrase of [
  'Status: handoff accepted for bounded manual reviewed steady-state operation',
  'WHR-CAL-UAE-ERA',
  'schedule path: evidence-backed',
  'detail operator path: evidence-backed',
  'Registry profile: provisional',
  'system fallback runner: pending',
  'ordinary incremental manual reviewed operation',
  'future HKJC maintenance may continue without blocking UAE work',
]) {
  if (!doc.includes(phrase)) fail(`handoff document missing ${phrase}.`);
}

for (const phrase of [
  'HKJC handoff accepted',
  'bounded manual reviewed steady-state operation',
  'WHR-CAL-UAE-ERA',
  'global Current Work ID switch remains a separate entrypoint synchronization step',
]) {
  if (!projectRoadmap.includes(phrase)) fail(`project roadmap missing ${phrase}.`);
}
for (const phrase of [
  'HKJC handoff accepted',
  'WHR-CAL-UAE-ERA',
  'entrypoint synchronization',
]) {
  if (!implementationRoadmap.includes(phrase)) fail(`implementation roadmap missing ${phrase}.`);
}
if (!calendarIndex.includes('hkjc-handoff-decision.md')) fail('Calendar index missing HKJC handoff decision document.');
if (!calendarIndex.includes('data/audits/calendar-hkjc-handoff-decision-v1.json')) fail('Calendar index missing HKJC handoff audit entry.');

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
console.log('DECISION: accept_manual_reviewed_steady_state_handoff');
console.log('COMPLETED_WORK_ID: WHR-CAL-HONG-KONG-HKJC');
console.log('NEXT_WORK_ID: WHR-CAL-UAE-ERA');
console.log('REGISTRY_PROFILE_STATUS: provisional');
console.log('SCHEDULE_ROUTE: github_actions / C / active');
console.log('DETAIL_ROUTE: reviewed_import / B / operator_only');
console.log('SYSTEM_FALLBACK_RUNNER: pending');
console.log('REGISTRY_DETAIL_ACTIVATION: false');
console.log('ENTRYPOINT_SWITCH: separate');
console.log('AUTOMATIC_EXECUTION_PUBLICATION: false');
