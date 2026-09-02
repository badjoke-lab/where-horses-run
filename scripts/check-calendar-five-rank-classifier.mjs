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

const expectedRanks = ['C', 'B', 'B+', 'A', 'A+'];
const expectedAPlusFields = ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];
if (contract.schema_version !== 'calendar-five-rank-classifier-contract-v1') fail('classifier contract schema version differs.');
if (!exact(contract.rank_order, expectedRanks)) fail('classifier rank order differs.');
if (!exact(contract.a_plus_row_fields, expectedAPlusFields)) fail('A+ row field list differs.');
if (!exact(fiveRankClassifierV1Contract.ranks, expectedRanks)) fail('classifier core rank order differs.');
if (!exact(fiveRankClassifierV1Contract.aPlusRowFields, expectedAPlusFields)) fail('classifier core A+ fields differ.');

const candidateRanks = candidateSchema?.$defs?.record?.properties?.capability_rank?.enum;
if (!exact(candidateRanks, expectedRanks)) fail('candidate schema rank enum differs from classifier contract.');
for (const rank of expectedRanks) if (!contract.classification_shapes?.[rank]) fail(`classification shape missing ${rank}.`);
if (!Array.isArray(contract.normal_update_rules) || contract.normal_update_rules.length === 0) fail('normal update rules are missing.');
if (!Array.isArray(contract.invalid_shape_rules) || contract.invalid_shape_rules.length === 0) fail('invalid shape rules are missing.');
if (!Array.isArray(contract.explicit_exclusions) || contract.explicit_exclusions.length === 0) fail('classifier exclusions are missing.');

if (fixtures.schema_version !== 'calendar-five-rank-classifier-fixtures-v1') fail('classifier fixture schema differs.');
if (!Array.isArray(fixtures.classification_cases) || fixtures.classification_cases.length === 0) fail('classification cases are missing.');
const seenClassificationIds = new Set();
const observedRanks = new Set();
for (const testCase of fixtures.classification_cases ?? []) {
  if (!testCase.case_id || seenClassificationIds.has(testCase.case_id)) fail(`classification case_id invalid or duplicate: ${testCase.case_id}`);
  seenClassificationIds.add(testCase.case_id);
  const result = classifyTimetableObservationV1(testCase.observation);
  if (!result.ok) fail(`${testCase.case_id} unexpectedly invalid: ${result.errors.join('; ')}`);
  if (result.rank !== testCase.expected_rank) fail(`${testCase.case_id} expected ${testCase.expected_rank}, got ${result.rank}`);
  if (result.rank) observedRanks.add(result.rank);
}
for (const rank of expectedRanks) if (!observedRanks.has(rank)) fail(`classification fixtures do not exercise rank ${rank}.`);

if (!Array.isArray(fixtures.normal_update_cases) || fixtures.normal_update_cases.length === 0) fail('normal update cases are missing.');
let directUpgradeCovered = false;
let regressionGuardCovered = false;
for (const testCase of fixtures.normal_update_cases ?? []) {
  let actual;
  try {
    actual = resolveMonotonicReviewedRankV1(testCase.current_reviewed_rank, testCase.observed_rank);
  } catch (error) {
    fail(`${testCase.case_id}: ${error.message}`);
    continue;
  }
  if (actual !== testCase.expected_rank) fail(`${testCase.case_id} expected ${testCase.expected_rank}, got ${actual}`);
  if (testCase.current_reviewed_rank === 'C' && testCase.observed_rank === 'A+' && actual === 'A+') directUpgradeCovered = true;
  if (compareTimetableRanksV1(testCase.observed_rank, testCase.current_reviewed_rank) < 0 && actual === testCase.current_reviewed_rank) regressionGuardCovered = true;
}
if (!directUpgradeCovered) fail('fixtures must cover direct C to A+ upgrade.');
if (!regressionGuardCovered) fail('fixtures must cover monotonic no-downgrade behavior.');

if (!Array.isArray(fixtures.invalid_shape_cases) || fixtures.invalid_shape_cases.length === 0) fail('invalid shape cases are missing.');
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
  } catch {}
}

for (const marker of [
  "['C', 0]",
  "['B', 1]",
  "['B+', 2]",
  "['A', 3]",
  "['A+', 4]",
  "promotionMode !== 'corrective_downgrade'",
  'corrective_downgrade requires an allowed downgrade reason',
]) if (!promotionCore.includes(marker)) fail(`promotion core monotonic/corrective marker missing: ${marker}`);

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
