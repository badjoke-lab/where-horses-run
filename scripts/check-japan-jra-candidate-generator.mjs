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
const readinessKey = 'japan/jra/jra-programme';
const generator = read(generatorPath);
const candidates = readJson(outputPath);
const normalizedMeetings = readJson('data/generated/timetable/jra-normalized-timetable.json');
const normalizedDetails = readJson('data/generated/timetable/jra-normalized-meeting-details.json');
const authorityInventory = readJson('data/static/authority-source-inventory.json');
const readinessRegistry = readJson('data/static/calendar-readiness-registry.json');
const readinessMatches = readinessRegistry.records.filter((record) => record.authority_source_key === readinessKey);
const readiness = readinessMatches[0];
const authorityMatches = authorityInventory.records.filter((record) =>
  record.country_id === 'japan' &&
  record.authority_id === 'jra' &&
  record.official_source_id === 'jra-programme'
);
const authoritySource = authorityMatches[0];
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

if (readinessMatches.length !== 1) fail(`Expected one JRA readiness record, found ${readinessMatches.length}.`);
if (authorityMatches.length !== 1) fail(`Expected one JRA authority/source record, found ${authorityMatches.length}.`);
if (readiness?.technical_rank !== 'A+') fail('JRA reference readiness must retain technical rank A+.');
if (readiness?.public_ceiling !== 'A') fail('JRA reference readiness must retain public ceiling A.');
if (readiness?.confirmed_fields?.per_race_post_times !== true) fail('JRA readiness must confirm per-race post times.');

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
  if (record.racing_system_id !== readiness?.system_id) fail(`${record.candidate_id}: racing_system_id mismatch.`);
  if (record.source?.source_id !== 'jra-programme') fail(`${record.candidate_id}: source identity mismatch.`);
  if (record.source?.extraction_method !== 'adapter_candidate') fail(`${record.candidate_id}: extraction method mismatch.`);
  if (!record.source?.official_url?.startsWith('https://jra.jp/')) fail(`${record.candidate_id}: official URL must be JRA HTTPS.`);
  if (record.source?.checked_at !== detail.freshness.generated_at) fail(`${record.candidate_id}: checked_at must come from normalized freshness.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: record must remain needs_review.`);
  if (record.capability_rank !== readiness?.technical_rank) fail(`${record.candidate_id}: candidate rank must follow reviewed technical rank.`);
  if (record.first_race_time_local !== meeting.first_race_time_local) fail(`${record.candidate_id}: first time mismatch.`);
  if (record.last_race_time_local !== meeting.last_race_time_local) fail(`${record.candidate_id}: last time mismatch.`);
  if (record.timetable_rows.length !== detail.timetable_rows.length) fail(`${record.candidate_id}: timetable row count mismatch.`);
  if (record.timetable_rows[0]?.post_time_local !== record.first_race_time_local) fail(`${record.candidate_id}: first row/time mismatch.`);
  if (record.timetable_rows.at(-1)?.post_time_local !== record.last_race_time_local) fail(`${record.candidate_id}: last row/time mismatch.`);

  for (let index = 0; index < record.timetable_rows.length; index += 1) {
    const candidateRow = record.timetable_rows[index];
    const normalizedRow = detail.timetable_rows[index];
    if (candidateRow.label !== normalizedRow.label || candidateRow.post_time_local !== normalizedRow.post_time_local) {
      fail(`${record.candidate_id}: row ${index + 1} label/post time mismatch.`);
    }
    for (const [candidateKey, normalizedKey, readinessKeyName] of [
      ['race_name', 'race_name', 'race_name'],
      ['distance_m', 'distance_m', 'distance'],
      ['surface', 'surface', 'surface'],
      ['course_label', 'course_label', 'course']
    ]) {
      const expected = readiness?.confirmed_fields?.[readinessKeyName] === true ? normalizedRow[normalizedKey] ?? null : null;
      if (candidateRow[candidateKey] !== expected) {
        fail(`${record.candidate_id}: row ${index + 1} ${candidateKey} does not respect confirmed_fields.`);
      }
    }
  }

  const key = `${record.date}:${record.racecourse_id}:${record.source.source_id}`;
  if (seen.has(key)) fail(`Duplicate JRA candidate key: ${key}`);
  seen.add(key);
}

for (const forbidden of [
  'data/generated/timetables.json',
  'data/generated/timetable/canonical/',
  'data/generated/timetable/public/'
]) {
  if (generator.includes(forbidden)) fail(`JRA generator must not read or write forbidden path: ${forbidden}`);
}
for (const required of [
  'jra-normalized-timetable.json',
  'jra-normalized-meeting-details.json',
  'calendar-readiness-registry.json',
  "schema_version: 'timetable-candidate-v1'",
  "source_id: 'jra-programme'",
  "review_status: 'needs_review'",
  'confirmed_fields'
]) {
  if (!generator.includes(required)) fail(`JRA generator missing required contract marker: ${required}`);
}

const approved = structuredClone(candidates);
approved.review = {
  status: 'approved',
  reviewed_at: '2026-06-10T00:00:00.000Z',
  reviewer: 'jra-reference-adapter-validator',
  summary: 'In-memory approval fixture for validating the reference adapter output.',
  promotion_target: promotionTargetV1
};
approved.records = approved.records.map((record) => ({ ...record, review_status: 'approved' }));

const promotionArgs = {
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
};

let actualPromotionState = 'pass';
try {
  promoteApprovedCandidateV1(promotionArgs);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('source check predates reviewed source records')) actualPromotionState = 'blocked_by_freshness';
  else fail(`JRA v1 output failed an unexpected canonical promotion gate: ${message}`);
}

try {
  const structuralAuthority = structuredClone(authorityInventory);
  const structuralReadiness = structuredClone(readinessRegistry);
  const candidateCheckedDate = approved.records
    .map((record) => record.source.checked_at.slice(0, 10))
    .sort()
    .at(-1);
  const authorityRecord = structuralAuthority.records.find((record) =>
    record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme'
  );
  const readinessRecord = structuralReadiness.records.find((record) => record.authority_source_key === readinessKey);
  authorityRecord.last_checked_date = candidateCheckedDate;
  readinessRecord.checked_date = candidateCheckedDate;

  const promoted = promoteApprovedCandidateV1({
    ...promotionArgs,
    authorityInventory: structuralAuthority,
    readinessRegistry: structuralReadiness
  });
  if (promoted.meetingsDataset.meetings.length !== records.length) fail('Structurally approved JRA fixture did not promote every meeting in memory.');
  if (promoted.detailsDataset.details.length !== records.length) fail('Structurally approved JRA A+ fixture did not promote every detail in memory.');
  if (promoted.summary.public_projection_written !== false) fail('JRA promotion fixture must not write public projection.');
} catch (error) {
  fail(`JRA v1 output failed structural promotion gates: ${error instanceof Error ? error.message : error}`);
}

const sourceCheckedDate = records.map((record) => record.source.checked_at.slice(0, 10)).sort().at(-1);
const registryMinimumDate = [authoritySource?.last_checked_date, readiness?.checked_date].filter(Boolean).sort().at(-1);
if (actualPromotionState === 'blocked_by_freshness' && !(sourceCheckedDate < registryMinimumDate)) {
  fail('JRA freshness gate reported stale input without an older source check date.');
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
console.log(`ACTUAL_PROMOTION_GATE: ${actualPromotionState}`);
console.log(`SOURCE_CHECKED_DATE: ${sourceCheckedDate}`);
console.log(`REGISTRY_MINIMUM_DATE: ${registryMinimumDate}`);
console.log('STRUCTURAL_PROMOTION_FIXTURE: pass');
console.log('PUBLIC_PROJECTION_WRITTEN: false');
