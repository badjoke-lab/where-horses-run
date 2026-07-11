import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const audit = readJson('data/audits/calendar-uae-era-pilot-06-profile-live-evidence-v1.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const acquisition = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const jobFixture = readJson('data/fixtures/calendar-uae-era-pilot-06-job-v1.json');
const p5 = readJson('data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json');
const doc = readText('docs/calendar/uae-era-pilot-06-profile-foundation.md');

if (audit.schema_version !== 'calendar-uae-era-pilot-06-profile-live-evidence-v1') fail('PILOT-06 live evidence schema differs.');
if (audit.work_id !== 'WHR-CAL-UAE-ERA' || audit.implementation_unit !== 'UAE-PILOT-06') fail('PILOT-06 live evidence Work identity differs.');
if (audit.reviewed_at !== '2026-07-11T07:00:10.268Z') fail('PILOT-06 reviewed_at differs.');

const evidence = audit.evidence_run ?? {};
if (evidence.workflow_run_id !== 29143729235) fail('PILOT-06 workflow run ID differs.');
if (evidence.artifact_id !== 8246040300) fail('PILOT-06 artifact ID differs.');
if (evidence.artifact_digest !== 'sha256:5b1832ca37e64fa3fb61630b1072ca45a86787510b4340014906347320bc4415') fail('PILOT-06 artifact digest differs.');
if (evidence.batch_id !== 'uae-era-pilot-06-live-review-batch') fail('PILOT-06 batch ID differs.');
if (evidence.generated_at !== '2026-07-11T07:00:10.268Z') fail('PILOT-06 generated_at differs.');
if (evidence.runner_used !== 'github_actions') fail('PILOT-06 runner identity differs.');
if (evidence.collection_mode !== 'source_visible_horizon') fail('PILOT-06 collection mode differs.');
if (!exact(evidence.fixture_window, {
  start_date: '2026-10-22',
  end_date_exclusive: '2027-04-16',
  timezone: 'Asia/Dubai',
})) fail('PILOT-06 fixture window differs.');
if (evidence.records_discovered !== 64 || evidence.records_updated !== 0) fail('PILOT-06 record counts differ.');
if (!exact(evidence.racecourse_record_counts, {
  'meydan-racecourse': 17,
  'abu-dhabi-turf-club': 16,
  'al-ain-racecourse': 14,
  'jebel-ali-racecourse': 11,
  'sharjah-racecourse': 6,
})) fail('PILOT-06 racecourse record counts differ.');
if (!exact(evidence.rank_counts, { C:64, B:0, 'B+':0, A:0, 'A+':0 })) fail('PILOT-06 rank counts differ.');
if (evidence.coverage_claim !== 'source_window_complete') fail('PILOT-06 coverage claim differs.');
if (!exact(evidence.unresolved_dates, []) || !exact(evidence.unresolved_meeting_ids, [])) fail('PILOT-06 unresolved state differs.');
if (evidence.source_error_count !== 0) fail('PILOT-06 source error count differs.');
if (evidence.candidate_mode !== 'review_only' || evidence.candidate_review_state !== 'needs_review' || evidence.promotion_target !== null) fail('PILOT-06 review boundary differs.');
for (const key of ['raw_pdf_storage','raw_text_storage','registry_write','canonical_write','public_write']) {
  if (evidence[key] !== 'disabled') fail(`PILOT-06 evidence ${key} must remain disabled.`);
}
if (evidence.publication_effect !== 'none') fail('PILOT-06 publication effect differs.');
for (const key of ['automatic_approval','automatic_promotion','automatic_publication']) {
  if (evidence[key] !== false) fail(`PILOT-06 evidence ${key} must remain false.`);
}
if (evidence.protected_state_hash_check !== 'pass' || evidence.repository_clean_after_run !== true) fail('PILOT-06 protected-state/cleanup evidence differs.');

const accepted = audit.accepted_profile_state ?? {};
if (accepted.racecourse_identity_count !== 5) fail('accepted profile racecourse identity count differs.');
if (accepted.readiness_state !== 'prototype_ready' || accepted.implementation_status !== 'fixture_validated') fail('accepted Readiness state differs.');
if (accepted.automation_mode !== 'semi_automatic') fail('accepted automation mode differs.');
if (accepted.technical_rank !== 'C' || accepted.public_ceiling !== 'C') fail('accepted rank boundary differs.');
if (accepted.acquisition_profile_status !== 'provisional') fail('accepted Acquisition profile status differs.');
if (accepted.primary_runner !== 'github_actions' || accepted.fallback_runner !== null) fail('accepted runner state differs.');
if (accepted.schedule_source_id !== 'era-season-calendar' || accepted.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') fail('accepted schedule route differs.');
if (!exact(accepted.supported_observation_ranks, ['C'])) fail('accepted observation ranks differ.');
if (accepted.supports_source_visible_horizon !== true) fail('accepted source-visible-horizon support missing.');
for (const key of ['supports_date_window','supports_cross_month_window','supports_selected_meetings','supports_rank_upgrade_retry']) {
  if (accepted[key] !== false) fail(`accepted profile ${key} must remain false.`);
}
if (accepted.detail_source_id !== null || accepted.detail_adapter_id !== null) fail('accepted detail route must remain inactive.');

const readinessRecord = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!readinessRecord) fail('UAE Readiness record missing.');
else {
  if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse','abu-dhabi-turf-club','al-ain-racecourse','jebel-ali-racecourse','sharjah-racecourse'])) fail('current UAE Readiness scope differs.');
  if (readinessRecord.readiness !== accepted.readiness_state || readinessRecord.implementation_status !== accepted.implementation_status || readinessRecord.automation_mode !== accepted.automation_mode) fail('current Readiness state differs from accepted evidence.');
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('current Readiness rank boundary differs.');
}

const profile = acquisition.records.find((record) => record.system_id === 'uae-national-racing-system');
if (!profile) fail('current UAE Acquisition profile missing.');
else {
  if (profile.profile_status !== accepted.acquisition_profile_status) fail('current profile status differs from accepted evidence.');
  if (profile.primary_runner !== accepted.primary_runner || profile.fallback_runner !== accepted.fallback_runner) fail('current runner state differs from accepted evidence.');
  if (profile.schedule_source_id !== accepted.schedule_source_id || profile.schedule_adapter_id !== accepted.schedule_adapter_id) fail('current schedule route differs from accepted evidence.');
  if (!exact(profile.supported_observation_ranks, accepted.supported_observation_ranks)) fail('current observation ranks differ from accepted evidence.');
  if (profile.supports_source_visible_horizon !== true) fail('current source-visible-horizon support missing.');
  for (const key of ['supports_date_window','supports_cross_month_window','supports_selected_meetings','supports_rank_upgrade_retry']) {
    if (profile[key] !== false) fail(`current profile ${key} must remain false.`);
  }
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('current detail route must remain inactive.');
}

const executor = compatibility.executors.find((entry) => entry.system_id === 'uae-national-racing-system' && entry.runner === 'github_actions');
if (!executor) fail('current UAE Actions executor missing.');
else {
  if (executor.executor_id !== 'uae-era-pdf-grid-actions') fail('current UAE executor ID differs.');
  if (executor.entry_point !== 'scripts/timetable/run-uae-era-pdf-grid-actions.mjs') fail('current UAE executor entry point differs.');
  if (!exact(executor.supported_collection_modes, ['source_visible_horizon'])) fail('current UAE executor modes differ.');
}

if (jobFixture.job?.collection_mode !== 'source_visible_horizon') fail('PILOT-06 Job fixture mode differs.');
if (!exact(jobFixture.job?.requested_scope, evidence.fixture_window)) fail('PILOT-06 Job fixture window differs from evidence.');
if (jobFixture.job?.runner_policy?.mode !== 'exact' || jobFixture.job?.runner_policy?.runner !== 'github_actions') fail('PILOT-06 Job runner policy differs.');
if (jobFixture.expected?.records_discovered !== 64 || jobFixture.expected?.coverage_claim !== 'source_window_complete') fail('PILOT-06 Job expected closure differs.');

if (p5.source_boundary_reconciliation?.decision?.coverage_state !== 'count_closed_reviewed_pdf_fixture_window') fail('PILOT-05 fixture-window decision differs.');
if (p5.venue_mapping_approval?.decision?.approved_mapping_count !== 5) fail('PILOT-05 mapping approval count differs.');

const decision = audit.decision ?? {};
if (decision.profile_foundation !== 'evidence_backed_review_only_c_level') fail('PILOT-06 profile foundation decision differs.');
if (decision.schedule_execution_path !== 'evidence_backed_github_actions_source_visible_horizon') fail('PILOT-06 schedule execution decision differs.');
if (decision.review_artifact_generation !== 'evidence_backed_64_candidate_batch') fail('PILOT-06 artifact-generation decision differs.');
if (decision.canonical_publication_path !== 'not_activated') fail('PILOT-06 canonical/publication path decision differs.');
for (const key of ['automatic_execution','automatic_approval','automatic_promotion','automatic_publication','detail_route_activation']) {
  if (decision[key] !== false) fail(`PILOT-06 decision ${key} must remain false.`);
}
if (!String(decision.reason).includes('64-record C-only review batch')) fail('PILOT-06 decision reason must preserve live evidence closure.');

if (audit.next_unit?.id !== 'UAE-HANDOFF-01') fail('PILOT-06 next unit ID differs.');
if (audit.next_unit?.title !== 'UAE bounded reviewed steady-state handoff decision') fail('PILOT-06 next unit title differs.');
for (const [key, value] of Object.entries(audit.boundaries ?? {})) if (value !== false) fail(`PILOT-06 boundary ${key} must remain false.`);

for (const phrase of [
  'Status: completed live review-only execution evidence',
  'workflow run: 29143729235',
  'records discovered: 64',
  'source_window_complete',
  'needs_review',
  'protected-state hash check: pass',
  'UAE-HANDOFF-01',
  'bounded reviewed steady-state handoff decision',
]) {
  if (!doc.toLowerCase().includes(phrase.toLowerCase())) fail(`PILOT-06 document missing ${phrase}.`);
}

const serialized = JSON.stringify(audit).toLowerCase();
for (const forbiddenKey of ['raw_html','raw_pdf','raw_text','source_body','horse_name','jockey_name','trainer_name','odds_value','result_payload','payout_amount','prediction','tip','stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`PILOT-06 audit contains forbidden key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_06_PROFILE_LIVE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_PILOT_06_PROFILE_LIVE_EVIDENCE: pass');
console.log('WORKFLOW_RUN_ID: 29143729235');
console.log('ARTIFACT_ID: 8246040300');
console.log('RECORDS_DISCOVERED: 64');
console.log('RANK_COUNTS: C=64 B=0 B+=0 A=0 A+=0');
console.log('COVERAGE_CLAIM: source_window_complete');
console.log('CANDIDATE_REVIEW_STATE: needs_review');
console.log('PROFILE_FOUNDATION: evidence_backed_review_only_c_level');
console.log('SCHEDULE_EXECUTION_PATH: evidence_backed_github_actions_source_visible_horizon');
console.log('CANONICAL_PUBLICATION_PATH: not_activated');
console.log('NEXT_UNIT: UAE-HANDOFF-01');
