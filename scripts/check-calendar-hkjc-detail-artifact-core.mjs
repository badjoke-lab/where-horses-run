import fs from 'node:fs';
import path from 'node:path';
import {
  buildHkjcDetailArtifacts,
  classifyHkjcDetailObservation,
  HKJC_DETAIL_ARTIFACT_V1,
  parseHkjcPublicSafeRacecardHtml,
} from './timetable/hkjc-detail-artifact-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-hkjc-detail-artifact-core-fixtures-v1.json'), 'utf8'));

if (fixtures.schema_version !== 'calendar-hkjc-detail-artifact-core-fixtures-v1') fail('fixture schema version differs.');
if (fixtures.work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('fixture Work ID differs.');
if (fixtures.implementation_unit !== 'HKJC-PILOT-05') fail('fixture implementation unit differs.');
if (!Array.isArray(fixtures.scenarios) || fixtures.scenarios.length !== 5) fail('expected five rank scenarios.');
if (!exact(fixtures.scenarios.map((scenario) => scenario.expected.rank), ['A+', 'A', 'B+', 'B', 'C'])) fail('fixture rank order must exercise A+/A/B+/B/C.');

if (HKJC_DETAIL_ARTIFACT_V1.source_id !== 'hkjc-racecard-public-timetable') fail('HKJC detail source ID differs.');
if (HKJC_DETAIL_ARTIFACT_V1.adapter_id !== 'hkjc-racecard-detail-artifact-v1') fail('HKJC detail adapter ID differs.');
if (!exact(HKJC_DETAIL_ARTIFACT_V1.ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('HKJC detail rank contract differs.');

const sample = parseHkjcPublicSafeRacecardHtml(
  '<h1>Race 1 - Fixture Public Safe Race</h1><div>Saturday, July 4, 2026, Sha Tin, 14:00</div><div>Turf, "A" Course, 1200M</div>',
  {
    raceNumber: 1,
    sourceUrl: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-07-04&Racecourse=ST&RaceNo=1',
  },
);
if (sample.post_time_local !== '14:00') fail('sample post time extraction differs.');
if (sample.race_name !== 'Fixture Public Safe Race') fail(`sample race name extraction differs: ${sample.race_name}`);
if (sample.distance_m !== 1200 || sample.surface !== 'Turf' || sample.course_label !== 'A Course') fail('sample A+ metadata extraction differs.');
if (sample.missing_fields.length !== 0) fail('complete sample must have no missing fields.');

let unofficialRejected = false;
try {
  parseHkjcPublicSafeRacecardHtml('<div>Post Time 14:00</div>', { raceNumber: 1, sourceUrl: 'https://example.com/racecard' });
} catch {
  unofficialRejected = true;
}
if (!unofficialRejected) fail('unofficial racecard URL must be rejected.');

for (const scenario of fixtures.scenarios ?? []) {
  let artifacts;
  try {
    artifacts = buildHkjcDetailArtifacts({
      startDate: scenario.start_date,
      endDateExclusive: scenario.end_date_exclusive,
      generatedAt: scenario.generated_at,
      batchId: scenario.batch_id,
      campaignId: scenario.campaign_id,
      jobId: scenario.job_id,
      meetingInputs: scenario.meeting_inputs,
    });
  } catch (error) {
    fail(`${scenario.id}: artifact build failed: ${error.message}`);
    continue;
  }

  const record = artifacts.candidate.records[0];
  if (artifacts.candidate.schema_version !== 'timetable-candidate-v1') fail(`${scenario.id}: candidate schema differs.`);
  if (artifacts.candidate.adapter_id !== HKJC_DETAIL_ARTIFACT_V1.adapter_id) fail(`${scenario.id}: candidate adapter differs.`);
  if (artifacts.candidate.source_id !== HKJC_DETAIL_ARTIFACT_V1.source_id) fail(`${scenario.id}: candidate source differs.`);
  if (artifacts.candidate.review.status !== 'needs_review') fail(`${scenario.id}: candidate review state differs.`);
  if (artifacts.candidate.records.length !== 1) fail(`${scenario.id}: expected one meeting candidate.`);
  if (record?.capability_rank !== scenario.expected.rank) fail(`${scenario.id}: rank differs: ${record?.capability_rank}`);
  if (record?.first_race_time_local !== scenario.expected.first_race_time_local) fail(`${scenario.id}: first time differs.`);
  if (record?.last_race_time_local !== scenario.expected.last_race_time_local) fail(`${scenario.id}: last time differs.`);
  if (record?.timetable_rows?.length !== scenario.expected.row_count) fail(`${scenario.id}: row count differs.`);
  if (artifacts.coverage.coverage_claim !== scenario.expected.coverage_claim) fail(`${scenario.id}: Coverage claim differs.`);
  if (artifacts.manifest.coverage_claim !== scenario.expected.coverage_claim) fail(`${scenario.id}: Manifest coverage claim differs.`);
  if (artifacts.coverage.source_errors.length !== scenario.expected.source_error_count) fail(`${scenario.id}: source error count differs.`);
  if (artifacts.coverage.unresolved_meeting_ids.length !== scenario.expected.unresolved_meeting_count) fail(`${scenario.id}: unresolved meeting count differs.`);
  if (!exact(artifacts.coverage.source_errors, artifacts.manifest.source_errors)) fail(`${scenario.id}: Coverage/Manifest source errors differ.`);
  if (!exact(artifacts.coverage.unresolved_meeting_ids, artifacts.manifest.unresolved_meeting_ids)) fail(`${scenario.id}: Coverage/Manifest unresolved meetings differ.`);
  if (Object.values(artifacts.manifest.rank_counts).reduce((sum, count) => sum + count, 0) !== artifacts.manifest.records_discovered) fail(`${scenario.id}: rank totals do not close.`);
  if (artifacts.report.publication_effect !== 'none') fail(`${scenario.id}: publication effect differs.`);
  if (artifacts.report.raw_source_storage !== 'disabled') fail(`${scenario.id}: raw source storage boundary differs.`);
  if (artifacts.report.canonical_write !== 'disabled' || artifacts.report.public_write !== 'disabled') fail(`${scenario.id}: write boundary differs.`);
  if (artifacts.report.automatic_approval !== false || artifacts.report.automatic_promotion !== false || artifacts.report.automatic_publication !== false) fail(`${scenario.id}: automation boundary differs.`);

  if (scenario.expected.rank === 'A+') {
    if (!record.timetable_rows.every((row) => row.race_name && row.distance_m && (row.surface || row.course_label))) fail('A+ rows must retain all allowed programme-summary metadata.');
  }
  if (scenario.expected.rank === 'A') {
    if (!record.timetable_rows.every((row) => Object.keys(row).sort().join(',') === 'label,post_time_local')) fail('A rows must contain only label and post time.');
  }
  if (['B+', 'B', 'C'].includes(scenario.expected.rank) && record.timetable_rows.length !== 0) fail(`${scenario.id}: rank below A must not expose race rows.`);

  const serialized = JSON.stringify(artifacts).toLowerCase();
  for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'result_payload', 'payout_amount', 'prediction', 'tip', 'raw_html', 'source_body', 'stream_url']) {
    if (serialized.includes(`"${forbidden}"`)) fail(`${scenario.id}: forbidden artifact key present: ${forbidden}`);
  }
}

const downgradeProof = classifyHkjcDetailObservation({
  meeting_complete: true,
  race_observations: [
    { race_number: 1, label: 'Race 1', post_time_local: '14:00', race_name: 'One', distance_m: 1200, surface: 'Turf', course_label: 'A Course' },
    { race_number: 2, label: 'Race 2', post_time_local: '14:30', race_name: null, distance_m: null, surface: null, course_label: null },
  ],
});
if (downgradeProof.rank !== 'A') fail('incomplete A+ metadata with continuous complete times must classify as A.');
if (!downgradeProof.timetable_rows.every((row) => exact(Object.keys(row).sort(), ['label', 'post_time_local']))) fail('A downgrade must strip partial A+ fields.');

const incompleteMeetingProof = classifyHkjcDetailObservation({
  meeting_complete: false,
  race_observations: [
    { race_number: 1, label: 'Race 1', post_time_local: '14:00', race_name: 'One', distance_m: 1200, surface: 'Turf', course_label: 'A Course' },
    { race_number: 2, label: 'Race 2', post_time_local: '14:30', race_name: 'Two', distance_m: 1400, surface: 'Turf', course_label: 'B Course' },
  ],
});
if (incompleteMeetingProof.rank !== 'B') fail('incomplete meeting observation must not infer A/A+ from contiguous pages alone.');

if (errors.length) {
  console.error(`CALENDAR_HKJC_DETAIL_ARTIFACT_CORE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_DETAIL_ARTIFACT_CORE: pass');
console.log('RANK_FIXTURES: A+ / A / B+ / B / C');
console.log('A_DOWNGRADE_FIELD_STRIP: pass');
console.log('INCOMPLETE_MEETING_NO_A_INFERENCE: pass');
console.log('RAW_SOURCE_STORAGE: disabled');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
console.log('REGISTRY_DETAIL_ACTIVATION: separate');
