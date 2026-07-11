import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const decision = readJson('data/audits/calendar-uae-era-handoff-decision-v1.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const p5 = readJson('data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json');
const p6 = readJson('data/audits/calendar-uae-era-pilot-06-profile-live-evidence-v1.json');
const doc = readText('docs/calendar/uae-era-handoff-decision.md');
const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
const calendarIndex = readText('docs/calendar/README.md');

if (decision.schema_version !== 'calendar-uae-era-handoff-decision-v1') fail('handoff schema differs.');
if (decision.work_id !== 'WHR-CAL-UAE-ERA') fail('handoff Work ID differs.');
if (decision.decision_id !== 'UAE-HANDOFF-01') fail('handoff decision ID differs.');
if (Number.isNaN(Date.parse(decision.reviewed_at))) fail('handoff reviewed_at invalid.');
if (decision.decision !== 'accept_bounded_reviewed_steady_state_handoff') fail('handoff decision differs.');
if (decision.completed_work_id !== 'WHR-CAL-UAE-ERA') fail('completed Work ID differs.');
if (decision.next_work_id !== 'WHR-CAL-PUBLIC-V1') fail('next Work ID differs.');

const accepted = decision.accepted_state ?? {};
if (accepted.registry_profile_status !== 'provisional') fail('accepted Registry profile must remain provisional.');
if (accepted.readiness_state !== 'prototype_ready' || accepted.implementation_status !== 'fixture_validated') fail('accepted Readiness state differs.');
if (accepted.automation_mode !== 'semi_automatic') fail('accepted automation mode differs.');
if (accepted.system_primary_runner !== 'github_actions') fail('accepted primary runner differs.');
if (accepted.system_fallback_runner !== null || accepted.system_fallback_runner_status !== 'pending') fail('accepted fallback state differs.');
if (accepted.registry_detail_source_id !== null || accepted.registry_detail_adapter_id !== null) fail('accepted detail route must remain null.');
if (!exact(accepted.registry_supported_observation_ranks, ['C'])) fail('accepted observation ranks differ.');

const schedule = accepted.schedule_route ?? {};
if (schedule.status !== 'active_review_only') fail('accepted schedule route status differs.');
if (schedule.selection_mode !== 'explicit_collection_job') fail('accepted schedule selection mode differs.');
if (schedule.primary_runner !== 'github_actions') fail('accepted schedule runner differs.');
if (schedule.source_id !== 'era-season-calendar' || schedule.adapter_id !== 'uae-era-pdf-grid-actions-v1') fail('accepted schedule source/adapter differs.');
if (schedule.executor_id !== 'uae-era-pdf-grid-actions') fail('accepted executor differs.');
if (!exact(schedule.supported_collection_modes, ['source_visible_horizon'])) fail('accepted collection modes differ.');
if (!exact(schedule.evidence_backed_observation_ranks, ['C'])) fail('accepted schedule ranks differ.');
if (schedule.reviewed_fixture_window_start !== '2026-10-22' || schedule.reviewed_fixture_window_end_exclusive !== '2027-04-16') fail('accepted fixture window differs.');
if (schedule.reviewed_record_count !== 64 || schedule.coverage_claim !== 'source_window_complete') fail('accepted schedule closure differs.');
if (schedule.automatic_planning_allowed !== false || schedule.automatic_execution_allowed !== false || schedule.human_review_required !== true) fail('accepted schedule automation/review boundary differs.');

const detail = accepted.detail_route ?? {};
if (detail.status !== 'inactive' || detail.source_id !== null || detail.adapter_id !== null) fail('accepted detail route differs.');
if (detail.automatic_planning_allowed !== false || detail.automatic_execution_allowed !== false) fail('detail automation boundary differs.');

const profile = registry.records.find((record) => record.system_id === 'uae-national-racing-system');
if (!profile) fail('UAE Acquisition Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('UAE profile status differs.');
  if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== null) fail('UAE Registry runner state differs.');
  if (profile.schedule_source_id !== 'era-season-calendar' || profile.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') fail('UAE Registry schedule route differs.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('UAE Registry detail route must remain inactive.');
  if (!exact(profile.supported_observation_ranks, ['C'])) fail('UAE Registry ranks must remain C-only.');
  if (profile.supports_source_visible_horizon !== true) fail('UAE Registry source-visible-horizon support missing.');
  for (const key of ['supports_date_window','supports_cross_month_window','supports_selected_meetings','supports_rank_upgrade_retry']) {
    if (profile[key] !== false) fail(`UAE Registry ${key} must remain false.`);
  }
}

const readinessRecord = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!readinessRecord) fail('UAE Readiness record missing.');
else {
  if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse','abu-dhabi-turf-club','al-ain-racecourse','jebel-ali-racecourse','sharjah-racecourse'])) fail('UAE Readiness racecourse scope differs.');
  if (readinessRecord.readiness !== 'prototype_ready' || readinessRecord.implementation_status !== 'fixture_validated' || readinessRecord.automation_mode !== 'semi_automatic') fail('UAE Readiness accepted state differs.');
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('UAE Readiness rank boundary differs.');
}

const executor = compatibility.executors.find((entry) => entry.system_id === 'uae-national-racing-system' && entry.runner === 'github_actions');
if (!executor) fail('UAE Actions executor missing.');
else {
  if (executor.executor_id !== 'uae-era-pdf-grid-actions') fail('UAE executor ID differs.');
  if (executor.entry_point !== 'scripts/timetable/run-uae-era-pdf-grid-actions.mjs') fail('UAE executor entry point differs.');
  if (!exact(executor.supported_collection_modes, ['source_visible_horizon'])) fail('UAE executor collection modes differ.');
}

if (p5.source_boundary_reconciliation?.decision?.coverage_state !== 'count_closed_reviewed_pdf_fixture_window') fail('PILOT-05 fixture-window decision differs.');
if (p5.venue_mapping_approval?.decision?.approved_mapping_count !== 5) fail('PILOT-05 mapping approval differs.');
if (p6.evidence_run?.records_discovered !== 64 || p6.evidence_run?.coverage_claim !== 'source_window_complete') fail('PILOT-06 live evidence closure differs.');
if (p6.evidence_run?.candidate_review_state !== 'needs_review' || p6.evidence_run?.promotion_target !== null) fail('PILOT-06 review boundary differs.');
if (p6.decision?.profile_foundation !== 'evidence_backed_review_only_c_level' || p6.decision?.canonical_publication_path !== 'not_activated') fail('PILOT-06 decision state differs.');

const expectedEvidenceRefs = [
  'data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json',
  'data/audits/calendar-uae-era-pilot-06-profile-live-evidence-v1.json',
  'data/static/calendar-acquisition-registry.json',
  'data/static/calendar-readiness-registry.json',
  'data/static/calendar-runner-compatibility-contract-v1.json',
];
if (!exact(decision.evidence_refs, expectedEvidenceRefs)) fail('handoff evidence refs differ.');
for (const ref of expectedEvidenceRefs) if (!fs.existsSync(path.join(root, ref))) fail(`handoff evidence ref missing: ${ref}`);

const claims = decision.handoff_claims ?? {};
for (const key of ['five_venue_identity_scope_approved','schedule_path_evidence_backed','date_venue_pairing_evidence_backed','review_artifact_generation_evidence_backed','count_closed_reviewed_fixture_window_accepted','ordinary_bounded_manual_reviewed_operation_allowed','future_uae_maintenance_may_continue_without_blocking_public_v1']) {
  if (claims[key] !== true) fail(`handoff claim ${key} must be true.`);
}
for (const key of ['system_level_fallback_activated','detail_route_activated','arbitrary_date_window_activated','selected_meeting_mode_activated','rank_upgrade_retry_activated','full_detail_completeness_claimed','full_season_semantic_claimed','automatic_acquisition_claimed','automatic_publication_claimed']) {
  if (claims[key] !== false) fail(`handoff claim ${key} must be false.`);
}
for (const [key, value] of Object.entries(decision.boundaries ?? {})) if (value !== false) fail(`handoff boundary ${key} must remain false.`);

for (const phrase of [
  'Status: handoff accepted for bounded manual reviewed steady-state operation',
  'WHR-CAL-PUBLIC-V1',
  'Schedule path: evidence-backed',
  'Detail route: inactive',
  'Registry profile: provisional',
  'ordinary manual reviewed operation',
  'Future UAE maintenance may continue without blocking Calendar Public v1',
]) {
  if (!doc.includes(phrase)) fail(`handoff document missing ${phrase}.`);
}
for (const phrase of [
  'UAE ERA handoff accepted',
  'bounded manual reviewed steady-state operation',
  'WHR-CAL-PUBLIC-V1',
  'global Current Work ID switch remains a separate entrypoint synchronization step',
]) {
  if (!projectRoadmap.includes(phrase)) fail(`project roadmap missing ${phrase}.`);
}
for (const phrase of [
  'UAE ERA handoff accepted',
  'WHR-CAL-PUBLIC-V1',
  'entrypoint synchronization',
]) {
  if (!implementationRoadmap.includes(phrase)) fail(`implementation roadmap missing ${phrase}.`);
}
if (!calendarIndex.includes('uae-era-handoff-decision.md')) fail('Calendar index missing UAE handoff decision document.');
if (!calendarIndex.includes('data/audits/calendar-uae-era-handoff-decision-v1.json')) fail('Calendar index missing UAE handoff audit entry.');

const serialized = JSON.stringify(decision).toLowerCase();
for (const forbiddenKey of ['raw_html','raw_pdf','raw_text','source_body','horse_name','jockey_name','trainer_name','odds_value','result_payload','payout_amount','prediction','tip','stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`handoff audit contains forbidden key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_HANDOFF_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_HANDOFF_DECISION: pass');
console.log('DECISION: accept_bounded_reviewed_steady_state_handoff');
console.log('COMPLETED_WORK_ID: WHR-CAL-UAE-ERA');
console.log('NEXT_WORK_ID: WHR-CAL-PUBLIC-V1');
console.log('REGISTRY_PROFILE_STATUS: provisional');
console.log('SCHEDULE_ROUTE: github_actions / source_visible_horizon / C / active_review_only');
console.log('DETAIL_ROUTE: inactive');
console.log('SYSTEM_FALLBACK_RUNNER: pending');
console.log('ENTRYPOINT_SWITCH: separate');
console.log('AUTOMATIC_EXECUTION_PUBLICATION: false');
