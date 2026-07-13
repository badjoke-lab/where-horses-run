import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const baseRacecourses = readJson('data/static/racecourses.json');
const extensionRacecourses = readJson('data/static/racecourses-extensions.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const acquisition = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const authorityInventory = readJson('data/static/authority-source-inventory.json');
const p5 = readJson('data/audits/calendar-uae-era-pilot-05-boundary-mapping-decision-v1.json');
const operationsAudit = readJson('data/audits/calendar-uae-era-rank-upgrade-operations-v1.json');
const coreSource = readText('scripts/timetable/uae-era-pdf-grid-candidate-core.mjs');
const scheduleRunnerSource = readText('scripts/timetable/run-uae-era-pdf-grid-actions.mjs');
const sharedRunnerSource = readText('scripts/timetable/run-uae-era-actions-job.mjs');
const rankUpgradeCore = readText('scripts/timetable/uae-era-rank-upgrade-core.mjs');

if (p5.source_boundary_reconciliation?.decision?.coverage_state !== 'count_closed_reviewed_pdf_fixture_window') fail('PILOT-05 fixture-window decision differs.');
if (p5.venue_mapping_approval?.decision?.approved_mapping_count !== 5 || p5.venue_mapping_approval?.decision?.newly_approved_mapping_count !== 4) fail('PILOT-05 mapping decision counts differ.');

const allRacecourses = [...baseRacecourses, ...extensionRacecourses];
const expectedIds = [
  'meydan-racecourse',
  'abu-dhabi-turf-club',
  'al-ain-racecourse',
  'jebel-ali-racecourse',
  'sharjah-racecourse',
];
for (const id of expectedIds) {
  const matches = allRacecourses.filter((record) => record.id === id);
  if (matches.length !== 1) fail(`${id}: expected exactly one racecourse Registry record, got ${matches.length}.`);
  const record = matches[0];
  if (!record) continue;
  if (record.country_id !== 'united-arab-emirates') fail(`${id}: country differs.`);
  if (record.timezone !== 'Asia/Dubai') fail(`${id}: timezone differs.`);
  if (record.status !== 'active') fail(`${id}: status differs.`);
  if (!record.official_links?.some((link) => link.source_id === 'uae-era-home' && link.link_type === 'official')) fail(`${id}: official ERA source link missing.`);
}
const newIds = new Set(expectedIds.filter((id) => id !== 'meydan-racecourse'));
for (const id of newIds) {
  const record = extensionRacecourses.find((entry) => entry.id === id);
  if (!record) fail(`${id}: approved new identity missing from racecourse extensions.`);
  else {
    if (record.course_profile?.course_notes_en?.includes('PILOT-05 approved canonical venue identity') !== true) fail(`${id}: conservative identity-only course note missing.`);
    if (record.data_status?.course_profile !== 'partial' || record.data_status?.schedule !== 'official-link-only') fail(`${id}: conservative data status differs.`);
    if (!record.official_links?.some((link) => link.source_id === 'uae-era-home' && link.link_type === 'official' && link.url.startsWith('https://emiratesracing.com/racecourses/'))) fail(`${id}: official ERA venue-page link missing.`);
  }
}

const uaeScheduleReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!uaeScheduleReadiness) fail('UAE schedule Readiness record missing.');
else {
  if (!exact(uaeScheduleReadiness.racecourse_ids, expectedIds)) fail('UAE schedule Readiness racecourse scope differs.');
  if (uaeScheduleReadiness.authority_source_key !== 'united-arab-emirates/emirates-racing-authority/era-season-calendar') fail('UAE schedule Readiness source key differs.');
  if (uaeScheduleReadiness.technical_rank !== 'C' || uaeScheduleReadiness.public_ceiling !== 'C') fail('UAE schedule Readiness rank boundary differs.');
  if (uaeScheduleReadiness.access_mode !== 'direct' || !exact(uaeScheduleReadiness.refresh_classes, ['seasonal', 'manual'])) fail('UAE schedule Readiness route differs.');
  if (uaeScheduleReadiness.fallback !== 'keep_last_verified_and_mark_stale') fail('UAE schedule Readiness fallback differs.');
  if (uaeScheduleReadiness.checked_date !== '2026-07-11') fail('UAE schedule Readiness review date differs.');
}
const uaeDetailReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-racecard-public-timetable');
if (!uaeDetailReadiness) fail('UAE detail Readiness record missing.');
else {
  if (!exact(uaeDetailReadiness.racecourse_ids, expectedIds)) fail('UAE detail Readiness racecourse scope differs.');
  if (uaeDetailReadiness.authority_source_key !== 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable') fail('UAE detail Readiness source key differs.');
  if (uaeDetailReadiness.technical_rank !== 'A' || uaeDetailReadiness.public_ceiling !== 'A') fail('UAE detail Readiness recovered rank boundary differs.');
  if (uaeDetailReadiness.access_mode !== 'date_route' || !uaeDetailReadiness.refresh_classes.includes('near_meeting')) fail('UAE detail Readiness route differs.');
  if (uaeDetailReadiness.fallback !== 'downgrade_to_C') fail('UAE detail Readiness fallback differs.');
  if (uaeDetailReadiness.checked_date !== '2026-07-13') fail('UAE detail Readiness review date differs.');
}

const uaeSource = authorityInventory.records.find((record) => record.country_id === 'united-arab-emirates' && record.authority_id === 'emirates-racing-authority' && record.official_source_id === 'era-season-calendar');
if (!uaeSource || uaeSource.capability_rank !== 'C' || uaeSource.source_status !== 'verified') fail('UAE ERA schedule source inventory evidence differs.');
const uaeDetailSource = authorityInventory.records.find((record) => record.country_id === 'united-arab-emirates' && record.authority_id === 'emirates-racing-authority' && record.official_source_id === 'era-racecard-public-timetable');
if (!uaeDetailSource || uaeDetailSource.capability_rank !== 'A' || uaeDetailSource.source_status !== 'verified') fail('UAE ERA detail source inventory evidence differs.');

const profile = acquisition.records.find((record) => record.system_id === 'uae-national-racing-system');
if (!profile) fail('UAE Acquisition Registry profile missing.');
else {
  if (profile.country_id !== 'united-arab-emirates' || profile.authority_id !== 'emirates-racing-authority') fail('UAE profile identity differs.');
  if (profile.profile_status !== 'active') fail('Current UAE profile must be active.');
  if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== null) fail('UAE runner state differs.');
  if (profile.schedule_source_id !== 'era-season-calendar' || profile.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') fail('UAE schedule route differs.');
  if (profile.detail_source_id !== 'era-racecard-public-timetable' || profile.detail_adapter_id !== 'uae-era-racecard-detail-artifact-v1') fail('UAE detail route recovery differs.');
  if (profile.technical_capability_rank !== 'A' || profile.public_ceiling !== 'A') fail('UAE recovered profile rank boundary differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'A'])) fail('UAE supported observation ranks differ.');
  if (profile.supports_source_visible_horizon !== true || profile.supports_selected_meetings !== true || profile.supports_rank_upgrade_retry !== true) fail('UAE current operational scope differs.');
  if (profile.supports_date_window !== false || profile.supports_cross_month_window !== false) fail('Unproven UAE date/cross-month modes were enabled.');
  if (!exact(profile.pending_fields, [])) fail('Active UAE profile must not retain pending fields.');
}

const executor = compatibility.executors.find((entry) => entry.system_id === 'uae-national-racing-system' && entry.runner === 'github_actions');
if (!executor) fail('UAE Actions executor mapping missing.');
else {
  if (executor.executor_id !== 'uae-era-actions') fail('UAE executor ID differs.');
  if (executor.invocation_kind !== 'node') fail('UAE executor invocation kind differs.');
  if (executor.entry_point !== 'scripts/timetable/run-uae-era-actions-job.mjs') fail('UAE executor entry point differs.');
  if (executor.output_model !== 'uae-era-schedule-detail-artifact-batch') fail('UAE executor output model differs.');
  if (!exact(executor.supported_collection_modes, ['source_visible_horizon', 'selected_meetings'])) fail('UAE executor collection modes differ.');
}

for (const marker of [
  'count_closed_reviewed_pdf_fixture_window',
  "collection_mode !== 'source_visible_horizon'",
  "capability_rank: 'C'",
  "review_status: 'needs_review'",
  'promotion_target: null',
  "candidate_mode: 'review_only'",
  'automatic_approval: false',
  'automatic_promotion: false',
  'automatic_publication: false',
]) if (!coreSource.includes(marker)) fail(`Historical UAE candidate core missing ${marker}.`);
for (const marker of [
  "execution.executor_id !== 'uae-era-actions'",
  "execution.collection_mode !== 'source_visible_horizon'",
  'output directory must be outside the repository',
  'validateCoverageObservation',
  'validateCollectionResultManifestAgainstCoverageV1',
  'raw_pdf_stored: false',
  'repository_write: false',
  'canonical_write: false',
  'public_write: false',
  "publication_effect: 'none'",
]) if (!scheduleRunnerSource.includes(marker)) fail(`Historical UAE schedule runner missing ${marker}.`);
for (const marker of [
  "['source_visible_horizon', 'selected_meetings']",
  'collect-uae-era-detail-artifacts.mjs',
  'buildUaeEraRankUpgradeArtifactsV1',
  'buildUaeEraRetryQueueV1',
  'buildUaeEraReviewQueueV1',
  'canonical_write: false',
  'public_write: false',
]) if (!sharedRunnerSource.includes(marker)) fail(`Current UAE shared runner missing ${marker}.`);
for (const marker of [
  "collection_mode === 'selected_meetings'",
  "collection_target_rank: 'A'",
  "primary_runner: 'github_actions'",
  "review_state: manifest.coverage_claim === 'source_window_complete' ? 'review_ready' : 'not_ready'",
]) if (!rankUpgradeCore.includes(marker)) fail(`Current UAE rank-upgrade core missing ${marker}.`);
for (const forbidden of [
  'build-canonical-timetable.mjs',
  'build-public-timetable-view.mjs',
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/public/meeting-list.json',
]) {
  if (scheduleRunnerSource.includes(forbidden) || sharedRunnerSource.includes(forbidden)) fail(`UAE runner references forbidden writer/target ${forbidden}.`);
}

if (operationsAudit.schema_version !== 'calendar-uae-era-rank-upgrade-operations-v1'
  || operationsAudit.decision !== 'activate_selected_meeting_c_to_a_operations') fail('Current UAE operations audit differs.');
if (operationsAudit.reference_proof?.meeting_id !== 'era-al-ain-racecourse-2026-04-10'
  || operationsAudit.reference_proof?.starting_rank !== 'C'
  || operationsAudit.reference_proof?.observed_rank !== 'A'
  || operationsAudit.reference_proof?.race_count !== 10) fail('Current UAE operations reference proof differs.');
if (Object.values(operationsAudit.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Current UAE operations side-effect boundary differs.');

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_06_PROFILE_FOUNDATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_UAE_ERA_PILOT_06_PROFILE_FOUNDATION: pass');
console.log('HISTORICAL_UNIT: UAE-PILOT-06 / source-visible C schedule foundation');
console.log('CURRENT_UNIT: UAE-DETAIL-RECOVERY-02 / selected-meeting C-to-A operations');
console.log('ACQUISITION_PROFILE: active');
console.log('PRIMARY_RUNNER: github_actions');
console.log('COLLECTION_MODES: source_visible_horizon,selected_meetings');
console.log('SUPPORTED_RANKS: C,A');
console.log('AUTOMATIC_APPROVAL_PUBLICATION: false');
