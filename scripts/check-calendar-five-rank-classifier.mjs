import fs from 'node:fs';
import path from 'node:path';
import {
  classifyTimetableObservationV1,
  compareTimetableRanksV1,
  fiveRankClassifierV1Contract,
  resolveMonotonicReviewedRankV1,
} from './timetable/five-rank-classifier.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const contract = readJson('data/static/calendar-five-rank-classifier-contract-v1.json');
const fixtures = readJson('data/fixtures/calendar-five-rank-classifier-fixtures-v1.json');
const candidateSchema = readJson('data/static/timetable-candidate-v1.schema.json');
const promotionCore = readText('scripts/timetable/pipeline-v1/promotion-core.mjs');
const incrementalContract = readText('docs/calendar/incremental-coverage-contract.md');
const validationContract = readText('docs/calendar/validation-responsibility-contract.md');

const expectedRanks = ['C', 'B', 'B+', 'A', 'A+'];
const expectedAPlusFields = ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];
if (contract.schema_version !== 'calendar-five-rank-classifier-contract-v1') fail('classifier contract schema version differs.');
if (contract.work_id !== 'WHR-CAL-ACQUISITION-CONTROL-PLANE') fail('classifier contract Work ID differs.');
if (!exact(contract.rank_order, expectedRanks)) fail('classifier rank order differs.');
if (!exact(contract.a_plus_row_fields, expectedAPlusFields)) fail('A+ row field list differs.');
if (!exact(fiveRankClassifierV1Contract.ranks, expectedRanks)) fail('classifier core rank order differs.');
if (!exact(fiveRankClassifierV1Contract.aPlusRowFields, expectedAPlusFields)) fail('classifier core A+ fields differ.');

const candidateRanks = candidateSchema?.$defs?.record?.properties?.capability_rank?.enum;
if (!exact(candidateRanks, expectedRanks)) fail('candidate schema rank enum differs from classifier contract.');
for (const rank of expectedRanks) {
  if (!contract.classification_shapes?.[rank]) fail(`classification shape missing ${rank}.`);
}
if (!Array.isArray(contract.normal_update_rules) || contract.normal_update_rules.length < 7) fail('normal update rules are incomplete.');
if (!Array.isArray(contract.invalid_shape_rules) || contract.invalid_shape_rules.length < 6) fail('invalid shape rules are incomplete.');
if (!Array.isArray(contract.explicit_exclusions) || contract.explicit_exclusions.length < 5) fail('classifier exclusions are incomplete.');

if (fixtures.schema_version !== 'calendar-five-rank-classifier-fixtures-v1') fail('classifier fixture schema differs.');
if (!Array.isArray(fixtures.classification_cases) || fixtures.classification_cases.length < 6) fail('at least six classification cases are required.');
const classificationIds = new Set();
for (const testCase of fixtures.classification_cases ?? []) {
  if (classificationIds.has(testCase.case_id)) fail(`duplicate classification case ${testCase.case_id}`);
  classificationIds.add(testCase.case_id);
  const result = classifyTimetableObservationV1(testCase.observation);
  if (!result.ok) fail(`${testCase.case_id} unexpectedly invalid: ${result.errors.join('; ')}`);
  if (result.rank !== testCase.expected_rank) fail(`${testCase.case_id} expected ${testCase.expected_rank}, got ${result.rank}`);
}
for (const requiredId of [
  'rank-c-meeting-only',
  'rank-b-first-race-only',
  'rank-b-plus-first-and-last',
  'rank-a-per-race-time-table',
  'rank-a-partial-summary-fields-remain-a',
  'rank-a-plus-complete-summary',
]) if (!classificationIds.has(requiredId)) fail(`required classification case missing: ${requiredId}`);

if (!Array.isArray(fixtures.normal_update_cases) || fixtures.normal_update_cases.length < 8) fail('normal update cases are incomplete.');
const updateIds = new Set();
for (const testCase of fixtures.normal_update_cases ?? []) {
  if (updateIds.has(testCase.case_id)) fail(`duplicate normal update case ${testCase.case_id}`);
  updateIds.add(testCase.case_id);
  let actual = null;
  try {
    actual = resolveMonotonicReviewedRankV1(testCase.current_reviewed_rank, testCase.observed_rank);
  } catch (error) {
    fail(`${testCase.case_id} threw: ${error.message}`);
    continue;
  }
  if (actual !== testCase.expected_rank) fail(`${testCase.case_id} expected ${testCase.expected_rank}, got ${actual}`);
}
for (const requiredId of ['c-to-b', 'b-to-b-plus', 'b-plus-to-a', 'a-to-a-plus', 'direct-c-to-a-plus', 'a-plus-later-c-no-downgrade']) {
  if (!updateIds.has(requiredId)) fail(`required normal update case missing: ${requiredId}`);
}

if (!Array.isArray(fixtures.invalid_shape_cases) || fixtures.invalid_shape_cases.length < 5) fail('invalid shape cases are incomplete.');
for (const testCase of fixtures.invalid_shape_cases ?? []) {
  const result = classifyTimetableObservationV1(testCase.observation);
  if (result.ok || result.rank !== null || result.errors.length === 0) fail(`invalid shape unexpectedly passed: ${testCase.case_id}`);
}

for (let leftIndex = 0; leftIndex < expectedRanks.length; leftIndex += 1) {
  for (let rightIndex = 0; rightIndex < expectedRanks.length; rightIndex += 1) {
    const actual = compareTimetableRanksV1(expectedRanks[leftIndex], expectedRanks[rightIndex]);
    const expected = Math.sign(leftIndex - rightIndex);
    if (actual !== expected) fail(`rank comparison differs for ${expectedRanks[leftIndex]} / ${expectedRanks[rightIndex]}`);
  }
}

for (const invalidRank of ['D', 'S', '', null]) {
  try {
    resolveMonotonicReviewedRankV1('C', invalidRank);
    fail(`unknown observed rank unexpectedly accepted: ${invalidRank}`);
  } catch {
    // expected
  }
}

for (const marker of [
  "['C', 0]",
  "['B', 1]",
  "['B+', 2]",
  "['A', 3]",
  "['A+', 4]",
  "promotionMode !== 'corrective_downgrade'",
  'rank regression',
  'corrective_downgrade requires an allowed downgrade reason',
]) if (!promotionCore.includes(marker)) fail(`promotion core monotonic/corrective marker missing: ${marker}`);

for (const phrase of [
  'Five-rank operational model',
  'The common contract does not require sequential intermediate writes.',
  'C -> A+',
  'Rank regression rule',
  'normal incremental merge behavior is monotonic with respect to reviewed detail',
]) if (!incrementalContract.includes(phrase)) fail(`incremental contract missing ${phrase}.`);

for (const phrase of [
  'Normal promotion is monotonic',
  'corrective_downgrade',
  'ordinary promotion CLI remains normal-mode only',
]) if (!validationContract.includes(phrase)) fail(`validation responsibility contract missing ${phrase}.`);

if (errors.length) {
  console.error(`CALENDAR_FIVE_RANK_CLASSIFIER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_FIVE_RANK_CLASSIFIER: pass');
console.log('RANK_ORDER: C < B < B+ < A < A+');
console.log(`CLASSIFICATION_CASES: ${fixtures.classification_cases.length}`);
console.log(`NORMAL_UPDATE_CASES: ${fixtures.normal_update_cases.length}`);
console.log(`INVALID_SHAPE_CASES: ${fixtures.invalid_shape_cases.length}`);
console.log('DIRECT_C_TO_A_PLUS: allowed');
console.log('NORMAL_RANK_REGRESSION: rejected');
console.log('CORRECTIVE_DOWNGRADE: separate explicit promotion path');
