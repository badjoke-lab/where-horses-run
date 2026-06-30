import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { promoteApprovedCandidateV1, promotionTargetV1 } from './timetable/pipeline-v1/promotion-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(read(file));
const hash = (file) => createHash('sha256').update(read(file)).digest('hex');

const generatorPath = 'scripts/generate-japan-jra-candidates.mjs';
const outputPath = 'data/candidates/japan-jra-candidates.json';
const generator = read(generatorPath);
const candidates = readJson(outputPath);
const normalizedMeetings = readJson('data/generated/timetable/jra-normalized-timetable.json');
const normalizedDetails = readJson('data/generated/timetable/jra-normalized-meeting-details.json');
const authorityInventory = readJson('data/static/authority-source-inventory.json');
const readinessRegistry = readJson('data/static/calendar-readiness-registry.json');
const publicFiles = [
  'data/generated/timetable/public/meeting-list.json',
  'data/generated/timetable/public/meeting-details.json'
];
const publicBefore = Object.fromEntries(publicFiles.map((file) => [file, hash(file)]));

const staleCheck = spawnSync(process.execPath, [generatorPath, '--check'], {
  cwd: root,
  encoding: 'utf8'
});
if (staleCheck.status !== 0) fail(`JRA Pipeline v1 generator check failed: ${staleCheck.stderr || staleCheck.stdout}`);

if (candidates.schema_version !== 'timetable-candidate-v1') fail('JRA candidates must use timetable-candidate-v1.');
if (candidates.adapter_id !== 'jra-normalized-programme-candidate-v1') fail('Unexpected JRA adapter_id.');
if (candidates.country_id !== 'japan') fail('JRA candidates must use country_id japan.');
if (candidates.authority_id !== 'jra') fail('JRA candidates must use authority_id jra.');
if (candidates.source_id !== 'jra-programme') fail('JRA candidates must use canonical source_id jra-programme.');
if (candidates.generated_at !== normalizedMeetings.generated_at || candidates.generated_at !== normalizedDetails.generated_at) {
  fail('JRA candidate generated_at must come from matching normalized inputs.');
}
if (candidates.candidate_window?.start_date !== normalizedMeetings.refresh_window.from) fail('JRA candidate window start is incorrect.');
if (candidates.candidate_window?.end_date_exclusive !== '2026-06-08') fail('JRA candidate window end must be exclusive.');
if (candidates.candidate_window?.timezone !== 'Asia/Tokyo') fail('JRA candidate timezone must be Asia/Tokyo.');
if (candidates.review?.status !== 'needs_review') fail('JRA candidate envelope must remain needs_review.');
if (candidates.review?.reviewed_at !== null || candidates.review?.reviewer !== null || candidates.review?.promotion_target !== null) {
  fail('JRA needs_review envelope must not claim review or promotion metadata.');
}

const records = candidates.records ?? [];
if (records.length !== normalizedMeetings.records.length || records.length !== normalizedDetails.details.length) {
  fail('JRA candidate output must match normalized meeting/detail record counts.');
}
const meetingsById = new Map(normalizedMeetings.records.map((record) => [record.meeting_id, record]));
const detailsById = new Map(normalizedDetails.details.map((record) => [record.meeting_id, record]));
const seen = new Set();
for (const record of records) {
  const meeting = meetingsById.get(record.meeting_id);
  const detail = detailsById.get(record.meeting_id);
  if (!meeting || !detail) {
    fail(`${record.candidate_id}: no matching normalized meeting/detail pair.`);
    continue;
  }
  if (record.candidate_id !== `candidate-${record.meeting_id}`) fail(`${record.meeting_id}: candidate_id is unstable.`);
  if (record.country_id !== 'japan' || record.authority_id !== 'jra') fail(`${record.candidate_id}: country/authority mismatch.`);
  if (record.racing_system_id !== 'japan-jra-system') fail(`${record.candidate_id}: racing_system_id mismatch.`);
  if (record.source?.source_id !== 'jra-programme') fail(`${record.candidate_id}: source identity mismatch.`);
  if (record.source?.extraction_method !== 'adapter_candidate') fail(`${record.candidate_id}: extraction method mismatch.`);
  if (!record.source?.official_url?.startsWith('https://jra.jp/')) fail(`${record.candidate_id}: official URL must be JRA HTTPS.`);
  if (record.source?.checked_at !== detail.freshness.generated_at) fail(`${record.candidate_id}: checked_at must come from normalized freshness.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: record must remain needs_review.`);
  if (record.capability_rank !== meeting.capability_rank || record.capability_rank !== detail.capability_rank) fail(`${record.candidate_id}: rank mismatch.`);
  if (record.first_race_time_local !== meeting.first_race_time_local) fail(`${record.candidate_id}: first time mismatch.`);
  if (record.last_race_time_local !== meeting.last_race_time_local) fail(`${record.candidate_id}: last time mismatch.`);
  if (record.timetable_rows.length !== detail.timetable_rows.length) fail(`${record.candidate_id}: timetable row count mismatch.`);
  if (record.timetable_rows[0]?.post_time_local !== record.first_race_time_local) fail(`${record.candidate_id}: first row/time mismatch.`);
  if (record.timetable_rows.at(-1)?.post_time_local !== record.last_race_time_local) fail(`${record.candidate_id}: last row/time mismatch.`);
  const key = `${record.date}:${record.racecourse_id}:${record.source.source_id}`;
  if (seen.has(key)) fail(`Duplicate JRA candidate key: ${key}`);
  seen.add(key);
}

for (const forbidden of [
  'data/generated/timetables.json',
  'data/generated/timetable/canonical/',
  'data/generated/timetable/public/',
  'data/candidates/japan-jra-candidates.json'
]) {
  if (forbidden !== outputPath && generator.includes(forbidden)) fail(`JRA generator must not read or write forbidden path: ${forbidden}`);
}
for (const required of [
  'jra-normalized-timetable.json',
  'jra-normalized-meeting-details.json',
  "schema_version: 'timetable-candidate-v1'",
  "source_id: 'jra-programme'",
  "review_status: 'needs_review'"
]) {
  if (!generator.includes(required)) fail(`JRA generator missing required contract marker: ${required}`);
}

try {
  const approved = structuredClone(candidates);
  approved.review = {
    status: 'approved',
    reviewed_at: '2026-06-10T00:00:00.000Z',
    reviewer: 'jra-reference-adapter-validator',
    summary: 'In-memory approval fixture for validating the reference adapter output.',
    promotion_target: promotionTargetV1
  };
  approved.records = approved.records.map((record) => ({ ...record, review_status: 'approved' }));
  const promoted = promoteApprovedCandidateV1({
    candidate: approved,
    meetingsDataset: {
      schema_version: 'canonical-timetable-v0',
      generated_at: '2026-06-01T00:00:00.000Z',
      input_sources: [],
      meetings: []
    },
    detailsDataset: {
      schema_version: 'canonical-meeting-details-v0',
      generated_at: '2026-06-01T00:00:00.000Z',
      input_sources: [],
      details: []
    },
    authorityInventory,
    readinessRegistry,
    inputPath: outputPath
  });
  if (promoted.meetingsDataset.meetings.length !== records.length) fail('Approved JRA fixture did not promote every meeting in memory.');
  if (promoted.detailsDataset.details.length !== records.length) fail('Approved JRA A+ fixture did not promote every detail in memory.');
  if (promoted.summary.public_projection_written !== false) fail('JRA promotion fixture must not write public projection.');
} catch (error) {
  fail(`JRA v1 output failed canonical promotion gates: ${error instanceof Error ? error.message : error}`);
}

const publicAfter = Object.fromEntries(publicFiles.map((file) => [file, hash(file)]));
if (JSON.stringify(publicBefore) !== JSON.stringify(publicAfter)) fail('JRA generator validation modified public JSON.');

if (errors.length) {
  console.error(`JAPAN_JRA_CANDIDATE_V1: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`JAPAN_JRA_CANDIDATE_V1: pass records=${records.length}`);
console.log('OUTPUT_BOUNDARY: candidate-only');
console.log('REVIEW_STATE: needs_review');
console.log('CANONICAL_PROMOTION_FIXTURE: pass');
console.log('PUBLIC_PROJECTION_WRITTEN: false');
