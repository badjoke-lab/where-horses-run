import fs from 'node:fs';
import path from 'node:path';
import {
  buildUaeEraSeasonCalendarArtifacts,
  UAE_ERA_SEASON_CALENDAR_V1,
  validateUaeEraReviewedMeetingV1,
} from './timetable/uae-era-season-calendar-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const baseline = readJson('data/audits/calendar-uae-era-pilot-01-baseline-v1.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const sourceTest = readJson('docs/timetable-source-tests/01-united-arab-emirates/backfill-summary.json');
const fixtures = readJson('data/fixtures/calendar-uae-era-season-calendar-fixtures-v1.json');

if (baseline.schema_version !== 'calendar-uae-era-pilot-01-baseline-v1') fail('baseline schema differs.');
if (baseline.work_id !== 'WHR-CAL-UAE-ERA' || baseline.implementation_unit !== 'UAE-PILOT-01') fail('baseline Work identity differs.');
if (baseline.technical_rank !== 'C' || baseline.public_ceiling !== 'C') fail('baseline rank boundary differs.');
if (!exact(baseline.trusted_racecourse_ids_for_pilot_01, ['meydan-racecourse'])) fail('baseline trusted racecourse IDs differ.');
if (baseline.venue_network_expansion?.status !== 'pending_canonical_id_mapping_review'
  || baseline.venue_network_expansion?.automatic_expansion_allowed !== false) fail('venue expansion boundary differs.');
if (baseline.candidate_boundary?.capability_rank !== 'C'
  || baseline.candidate_boundary?.first_race_time_local !== null
  || baseline.candidate_boundary?.last_race_time_local !== null
  || !exact(baseline.candidate_boundary?.timetable_rows, [])
  || baseline.candidate_boundary?.review_status !== 'needs_review'
  || baseline.candidate_boundary?.promotion_target !== null) fail('candidate baseline boundary differs.');
for (const [key, value] of Object.entries(baseline.boundaries ?? {})) if (value !== false) fail(`baseline boundary ${key} must remain false.`);

const readinessRecord = readiness.records.find((record) => record.readiness_id === baseline.readiness_id);
if (!readinessRecord) fail('UAE schedule readiness record missing.');
else {
  if (readinessRecord.country_id !== UAE_ERA_SEASON_CALENDAR_V1.country_id) fail('readiness country differs.');
  if (readinessRecord.system_id !== UAE_ERA_SEASON_CALENDAR_V1.system_id) fail('readiness system differs.');
  if (readinessRecord.technical_rank !== 'C' || readinessRecord.public_ceiling !== 'C') fail('current schedule readiness rank differs.');
  if (!exact(readinessRecord.racecourse_ids, ['meydan-racecourse', 'abu-dhabi-turf-club', 'al-ain-racecourse', 'jebel-ali-racecourse', 'sharjah-racecourse'])) fail('current schedule readiness racecourse IDs differ.');
  if (readinessRecord.readiness !== 'prototype_ready' || readinessRecord.implementation_status !== 'fixture_validated') fail('current schedule readiness implementation state differs.');
  if (readinessRecord.automation_mode !== 'semi_automatic') fail('current schedule readiness automation mode differs.');
  if (readinessRecord.confirmed_fields?.meeting_date !== true || readinessRecord.confirmed_fields?.racecourse !== true) fail('readiness C fields missing.');
  for (const field of ['first_race_time', 'last_race_time', 'per_race_post_times', 'race_name', 'distance', 'surface', 'course']) {
    if (readinessRecord.confirmed_fields?.[field] !== false) fail('schedule readiness field ' + field + ' must remain false.');
  }
}
const detailReadinessRecord = readiness.records.find((record) => record.readiness_id === 'united-arab-emirates--uae-national-racing-system--era-racecard-public-timetable');
if (!detailReadinessRecord) fail('UAE detail recovery readiness record missing.');
else {
  if (detailReadinessRecord.technical_rank !== 'A' || detailReadinessRecord.public_ceiling !== 'A') fail('UAE detail recovery rank differs.');
  if (detailReadinessRecord.authority_source_key !== 'united-arab-emirates/emirates-racing-authority/era-racecard-public-timetable') fail('UAE detail recovery source differs.');
}

if (sourceTest.technical_rank !== 'C' || sourceTest.public_ceiling !== 'C') fail('source-test rank differs.');
if (sourceTest.public_safe !== true) fail('source-test public-safe state differs.');
if (sourceTest.authority !== 'Emirates Racing Authority') fail('source-test authority differs.');
if (!String(sourceTest.decision).includes('manual C-level meeting-date and venue confirmation')) fail('source-test C-level decision marker missing.');
if (sourceTest.official_source !== fixtures.official_source_url) fail('fixture official source URL differs from reviewed source-test evidence.');

if (fixtures.schema_version !== 'calendar-uae-era-season-calendar-fixtures-v1') fail('fixture schema differs.');
if (fixtures.work_id !== 'WHR-CAL-UAE-ERA' || fixtures.implementation_unit !== 'UAE-PILOT-01') fail('fixture Work identity differs.');
if (!Array.isArray(fixtures.scenarios) || fixtures.scenarios.length !== 3) fail('expected three permanent UAE core scenarios.');
if (!Array.isArray(fixtures.invalid_cases) || fixtures.invalid_cases.length < 5) fail('expected at least five invalid cases.');

const scenarioById = new Map(fixtures.scenarios.map((scenario) => [scenario.id, scenario]));
for (const scenario of fixtures.scenarios ?? []) {
  let artifacts;
  try {
    artifacts = buildUaeEraSeasonCalendarArtifacts({
      ...scenario.input,
      officialSourceUrl: fixtures.official_source_url,
    });
  } catch (error) {
    fail(`${scenario.id}: artifact build failed: ${error.message}`);
    continue;
  }
  const { candidate, coverage, manifest, report } = artifacts;
  if (candidate.schema_version !== 'timetable-candidate-v1') fail(`${scenario.id}: candidate schema differs.`);
  if (candidate.adapter_id !== UAE_ERA_SEASON_CALENDAR_V1.adapter_id) fail(`${scenario.id}: adapter differs.`);
  if (candidate.country_id !== UAE_ERA_SEASON_CALENDAR_V1.country_id) fail(`${scenario.id}: country differs.`);
  if (candidate.authority_id !== UAE_ERA_SEASON_CALENDAR_V1.authority_id) fail(`${scenario.id}: authority differs.`);
  if (candidate.source_id !== UAE_ERA_SEASON_CALENDAR_V1.source_id) fail(`${scenario.id}: source differs.`);
  if (candidate.review.status !== 'needs_review' || candidate.review.promotion_target !== null) fail(`${scenario.id}: candidate review boundary differs.`);
  if (candidate.records.length !== scenario.expected.records) fail(`${scenario.id}: record count differs.`);
  for (const record of candidate.records) {
    if (record.capability_rank !== 'C') fail(`${scenario.id}: non-C rank emitted.`);
    if (record.first_race_time_local !== null || record.last_race_time_local !== null) fail(`${scenario.id}: time claim emitted.`);
    if (!exact(record.timetable_rows, [])) fail(`${scenario.id}: timetable rows emitted.`);
    if (record.review_status !== 'needs_review') fail(`${scenario.id}: record review state differs.`);
    if (!UAE_ERA_SEASON_CALENDAR_V1.trusted_racecourse_ids.includes(record.racecourse_id)) fail(`${scenario.id}: untrusted racecourse emitted.`);
  }
  if (coverage.coverage_claim !== scenario.expected.coverage_claim || manifest.coverage_claim !== scenario.expected.coverage_claim) fail(`${scenario.id}: coverage claim differs.`);
  if (coverage.unresolved_dates.length !== scenario.expected.unresolved_dates) fail(`${scenario.id}: unresolved date count differs.`);
  if (coverage.source_errors.length !== scenario.expected.source_errors) fail(`${scenario.id}: source error count differs.`);
  if (!exact(coverage.source_errors, manifest.source_errors)) fail(`${scenario.id}: Coverage/Manifest source errors differ.`);
  if (!exact(coverage.unresolved_dates, manifest.unresolved_dates)) fail(`${scenario.id}: Coverage/Manifest unresolved dates differ.`);
  if (manifest.rank_counts.C !== manifest.records_discovered) fail(`${scenario.id}: C rank count does not close.`);
  for (const rank of ['B', 'B+', 'A', 'A+']) if (manifest.rank_counts[rank] !== 0) fail(`${scenario.id}: ${rank} count must remain zero.`);
  if (report.network_fetch !== false || report.raw_source_storage !== 'disabled') fail(`${scenario.id}: source access boundary differs.`);
  if (report.registry_activation !== false) fail(`${scenario.id}: Registry activation boundary differs.`);
  if (report.canonical_write !== 'disabled' || report.public_write !== 'disabled') fail(`${scenario.id}: write boundary differs.`);
  if (report.publication_effect !== 'none') fail(`${scenario.id}: publication effect differs.`);
  if (report.automatic_approval !== false || report.automatic_promotion !== false || report.automatic_publication !== false) fail(`${scenario.id}: automatic action boundary differs.`);

  const serialized = JSON.stringify(artifacts).toLowerCase();
  for (const forbidden of ['first_race_time_local":"', 'last_race_time_local":"', 'horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'prediction', 'tip', 'stream_url', 'raw_html', 'source_body']) {
    if (serialized.includes(forbidden)) fail(`${scenario.id}: forbidden artifact marker present ${forbidden}.`);
  }
}

function patchedInput(base, testCase) {
  const input = structuredClone(base.input);
  if (testCase.mutation === 'duplicate_first_meeting') {
    input.reviewedMeetings.push(structuredClone(input.reviewedMeetings[0]));
    return input;
  }
  let target = input;
  for (const segment of testCase.patch.path.slice(0, -1)) {
    if (target[segment] === undefined) target[segment] = {};
    target = target[segment];
  }
  target[testCase.patch.path.at(-1)] = structuredClone(testCase.patch.value);
  return input;
}

for (const testCase of fixtures.invalid_cases ?? []) {
  const base = scenarioById.get(testCase.base_scenario_id);
  if (!base) {
    fail(`${testCase.id}: base scenario missing.`);
    continue;
  }
  const input = patchedInput(base, testCase);
  let rejected = false;
  try {
    buildUaeEraSeasonCalendarArtifacts({ ...input, officialSourceUrl: input.officialSourceUrl ?? fixtures.official_source_url });
  } catch {
    rejected = true;
  }
  if (!rejected) fail(`${testCase.id}: invalid input unexpectedly passed.`);
}

const cMeetingValidation = validateUaeEraReviewedMeetingV1({
  meeting_id: 'uae-meydan-racecourse-2027-03-27',
  racecourse_id: 'meydan-racecourse',
  date: '2027-03-27',
});
if (cMeetingValidation.length) fail(`valid C meeting rejected: ${cMeetingValidation.join('; ')}`);

if (errors.length) {
  console.error(`CALENDAR_UAE_ERA_SEASON_CALENDAR_CORE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_UAE_ERA_SEASON_CALENDAR_CORE: pass');
console.log('WORK_ID: WHR-CAL-UAE-ERA');
console.log('IMPLEMENTATION_UNIT: UAE-PILOT-01');
console.log('TECHNICAL_RANK: C');
console.log('TRUSTED_RACECOURSE_IDS: meydan-racecourse');
console.log('VENUE_NETWORK_EXPANSION: pending_canonical_id_mapping_review');
console.log('NETWORK_FETCH_IN_CORE: false');
console.log('REGISTRY_ACTIVATION: false');
console.log('CANONICAL_WRITE: false');
console.log('PUBLIC_WRITE: false');
console.log('NEXT_UNIT: UAE-PILOT-02');
