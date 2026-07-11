import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { validateRunnerCompatibilityContractV1 } from './timetable/runner-compatibility.mjs';

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
const coreSource = readText('scripts/timetable/uae-era-pdf-grid-candidate-core.mjs');
const runnerSource = readText('scripts/timetable/run-uae-era-pdf-grid-actions.mjs');

if (p5.decision === undefined) fail('PILOT-05 decision audit missing.');
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
  if (!record.official_links?.some((link) => link.source_id === 'uae-era-home' && link.link_type === 'official' && link.url.startsWith('https://emiratesracing.com/racecourses/'))) {
    fail(`${id}: official ERA racecourse link missing.`);
  }
}
const newIds = new Set(expectedIds.filter((id) => id !== 'meydan-racecourse'));
for (const id of newIds) {
  const record = extensionRacecourses.find((entry) => entry.id === id);
  if (!record) fail(`${id}: approved new identity missing from racecourse extensions.`);
  else {
    if (record.course_profile?.course_notes_en?.includes('PILOT-05 approved canonical venue identity') !== true) fail(`${id}: conservative identity-only course note missing.`);
    if (record.data_status?.course_profile !== 'partial' || record.data_status?.schedule !== 'official-link-only') fail(`${id}: conservative data status differs.`);
  }
}

const uaeReadiness = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-season-calendar');
if (!uaeReadiness) fail('UAE Readiness record missing.');
else {
  if (!exact(uaeReadiness.racecourse_ids, expectedIds)) fail('UAE Readiness racecourse scope differs.');
  if (uaeReadiness.technical_rank !== 'C' || uaeReadiness.public_ceiling !== 'C') fail('UAE Readiness rank boundary differs.');
  if (uaeReadiness.source_format !== 'mixed') fail('UAE Readiness source format differs.');
  if (uaeReadiness.access_mode !== 'direct') fail('UAE Readiness access mode differs.');
  if (uaeReadiness.automation_mode !== 'semi_automatic') fail('UAE Readiness automation mode differs.');
  if (!exact(uaeReadiness.refresh_classes, ['seasonal', 'manual'])) fail('UAE Readiness refresh classes differ.');
  if (uaeReadiness.readiness !== 'prototype_ready' || uaeReadiness.implementation_status !== 'fixture_validated') fail('UAE Readiness implementation state differs.');
  if (uaeReadiness.fallback !== 'keep_last_verified_and_mark_stale') fail('UAE Readiness fallback differs.');
  if (uaeReadiness.checked_date !== '2026-07-11' || !String(uaeReadiness.evidence_reviewed_at).startsWith('2026-07-11')) fail('UAE Readiness review date differs.');
  if (!String(uaeReadiness.limitations).includes('C-level meeting date and approved racecourse identity only')) fail('UAE Readiness C-only limitation missing.');
}

const uaeSource = authorityInventory.records.find((record) => record.source_key === 'united-arab-emirates/emirates-racing-authority/era-season-calendar');
if (!uaeSource) fail('UAE ERA authority source inventory record missing.');
else {
  if (uaeSource.source_id !== 'era-season-calendar') fail('UAE ERA source ID differs.');
  if (uaeSource.public_ceiling !== 'C') fail('UAE ERA source inventory public ceiling differs.');
  if (uaeSource.source_status !== 'verified') fail('UAE ERA source inventory status differs.');
}

const profile = acquisition.records.find((record) => record.system_id === 'uae-national-racing-system');
if (!profile) fail('UAE Acquisition Registry profile missing.');
else {
  if (profile.country_id !== 'united-arab-emirates' || profile.authority_id !== 'emirates-racing-authority') fail('UAE profile identity differs.');
  if (profile.profile_status !== 'provisional') fail('UAE profile must remain provisional.');
  if (profile.primary_runner !== 'github_actions' || profile.fallback_runner !== null) fail('UAE runner state differs.');
  if (profile.schedule_source_id !== 'era-season-calendar') fail('UAE schedule source differs.');
  if (profile.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') fail('UAE schedule adapter differs.');
  if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) fail('UAE detail route must remain inactive.');
  if (profile.technical_capability_rank !== 'C' || profile.public_ceiling !== 'C') fail('UAE profile rank boundary differs.');
  if (!exact(profile.supported_observation_ranks, ['C'])) fail('UAE supported observation ranks differ.');
  if (profile.supports_source_visible_horizon !== true) fail('UAE source-visible-horizon support missing.');
  for (const key of ['supports_date_window','supports_cross_month_window','supports_selected_meetings','supports_rank_upgrade_retry']) {
    if (profile[key] !== false) fail(`UAE profile ${key} must remain false.`);
  }
  for (const field of ['fallback_runner','detail_source_id','detail_adapter_id']) {
    if (!profile.pending_fields?.includes(field)) fail(`UAE profile pending field missing ${field}.`);
  }
}

const compatibilityErrors = validateRunnerCompatibilityContractV1(compatibility, acquisition);
if (compatibilityErrors.length) fail(`runner compatibility validation failed: ${compatibilityErrors.join('; ')}`);
const executor = compatibility.executors.find((entry) => entry.system_id === 'uae-national-racing-system' && entry.runner === 'github_actions');
if (!executor) fail('UAE Actions executor mapping missing.');
else {
  if (executor.executor_id !== 'uae-era-pdf-grid-actions') fail('UAE executor ID differs.');
  if (executor.invocation_kind !== 'node') fail('UAE executor invocation kind differs.');
  if (executor.entry_point !== 'scripts/timetable/run-uae-era-pdf-grid-actions.mjs') fail('UAE executor entry point differs.');
  if (executor.output_model !== 'uae-era-pdf-grid-artifact-batch') fail('UAE executor output model differs.');
  if (!exact(executor.supported_collection_modes, ['source_visible_horizon'])) fail('UAE executor collection modes differ.');
}

for (const marker of [
  'count_closed_reviewed_pdf_fixture_window',
  "collection_mode !== 'source_visible_horizon'",
  "capability_rank: 'C'",
  "review_status: 'needs_review'",
  "promotion_target: null",
  "candidate_mode: 'review_only'",
  "automatic_approval: false",
  "automatic_promotion: false",
  "automatic_publication: false",
]) {
  if (!coreSource.includes(marker)) fail(`UAE candidate core missing ${marker}.`);
}
for (const marker of [
  "execution.executor_id !== 'uae-era-pdf-grid-actions'",
  "execution.collection_mode !== 'source_visible_horizon'",
  'output directory must be outside the repository',
  'validateCoverageObservation',
  'validateCollectionResultManifestAgainstCoverageV1',
  'raw_pdf_stored: false',
  'repository_write: false',
  'canonical_write: false',
  'public_write: false',
  "publication_effect: 'none'",
]) {
  if (!runnerSource.includes(marker)) fail(`UAE runner missing ${marker}.`);
}
for (const forbidden of [
  'build-canonical-timetable.mjs',
  'build-public-timetable-view.mjs',
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/public/meeting-list.json',
]) {
  if (runnerSource.includes(forbidden)) fail(`UAE runner references forbidden writer/target ${forbidden}.`);
}

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_PILOT_06_PROFILE_FOUNDATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_PILOT_06_PROFILE_FOUNDATION: pass');
console.log('WORK_ID: WHR-CAL-UAE-ERA');
console.log('IMPLEMENTATION_UNIT: UAE-PILOT-06');
console.log('APPROVED_RACECOURSE_IDENTITIES: 5');
console.log('READINESS_STATE: prototype_ready / fixture_validated');
console.log('ACQUISITION_PROFILE: provisional');
console.log('PRIMARY_RUNNER: github_actions');
console.log('COLLECTION_MODE: source_visible_horizon');
console.log('SUPPORTED_RANKS: C');
console.log('DETAIL_ROUTE: inactive');
console.log('AUTOMATIC_EXECUTION_PUBLICATION: false');
