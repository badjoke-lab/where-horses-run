import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function includesAll(text, terms) {
  return terms.every((term) => text.includes(term));
}

const generator = read('scripts/generate-uae-active-window-approved-candidates.mjs');
const sourceFile = readJson('data/candidates/uae-era-candidates.json');
const bundleText = read('data/candidates/uae-active-window-approved-candidates.json');
const bundle = JSON.parse(bundleText);

const freshness = spawnSync(process.execPath, ['scripts/generate-uae-active-window-approved-candidates.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});

if (freshness.status !== 0) {
  fail(`UAE active-window approved candidate generator --check failed: ${freshness.stderr || freshness.stdout}`);
}

if (bundle.schema_version !== 'timetable-candidates-v0') fail('bundle must use timetable-candidates-v0');
if (bundle.country_id !== 'united-arab-emirates') fail('bundle country_id must be united-arab-emirates');
if (bundle.source_adapter_id !== 'uae-active-window-reviewed-bundle') fail('bundle source_adapter_id mismatch');
if (JSON.stringify(bundle.candidate_window) !== JSON.stringify(sourceFile.candidate_window)) fail('bundle must preserve candidate_window from UAE ERA candidates');
if (bundle.review?.review_status !== 'approved') fail('bundle review_status must be approved');
if (bundle.review?.reviewed_at !== bundle.generated_at) fail('bundle reviewed_at must match generated_at');
if (bundle.review?.reviewer !== 'PR-077') fail('bundle reviewer must be PR-077');

const expectedCount = (sourceFile.records ?? []).length;
if ((bundle.records ?? []).length !== expectedCount) fail(`bundle must include ${expectedCount} records`);

const serializedFile = bundleText.toLowerCase();
for (const forbidden of ['raw html', 'source body', 'source response body', 'racecard', 'entries', 'horse names', 'jockey names', 'trainer names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
  if (serializedFile.includes(forbidden)) fail(`forbidden marker found: ${forbidden}`);
}

const publicCoverageClaims = [
  'is public coverage',
  'as public coverage',
  'currently covered',
  'current public coverage',
  'public coverage is available',
  'public coverage available',
  'published coverage'
];

const seen = new Set();
let previousSortKey = '';
for (const record of bundle.records ?? []) {
  if (record.country_id !== 'united-arab-emirates') fail(`${record.candidate_id}: country_id must be united-arab-emirates`);
  if (record.racing_system_id !== 'era') fail(`${record.candidate_id}: racing_system_id must be era`);
  if (record.status !== 'source-reviewed') fail(`${record.candidate_id}: status must be source-reviewed`);
  if (record.review_status !== 'approved') fail(`${record.candidate_id}: review_status must be approved`);
  if (record.timezone !== 'Asia/Dubai') fail(`${record.candidate_id}: timezone must be Asia/Dubai`);
  if (record.source_id !== 'uae-era-home') fail(`${record.candidate_id}: source_id must be uae-era-home`);

  const key = `${record.date}:${record.racing_system_id}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`duplicate bundle key: ${key}`);
  seen.add(key);

  const sortKey = `${record.date}:${record.racing_system_id}:${record.racecourse_id}`;
  if (previousSortKey && previousSortKey.localeCompare(sortKey) > 0) fail(`${record.candidate_id}: records must be sorted by date, racing_system_id, racecourse_id`);
  previousSortKey = sortKey;
}

if ((bundle.records ?? []).length === 0) {
  if (!includesAll(serializedFile, ['season gap', 'no active-window'])) {
    fail('empty bundle must visibly contain season gap and no active-window wording');
  }
  for (const claim of publicCoverageClaims) {
    if (serializedFile.includes(claim)) fail(`empty bundle must not claim public coverage: ${claim}`);
  }
  if (bundle.review?.promotion_target !== null) fail('empty season-gap bundle promotion_target must be null');
} else if (bundle.review?.promotion_target !== 'data/generated/timetables.json') {
  fail('non-empty bundle promotion_target must be data/generated/timetables.json');
}

for (const required of [
  'uae-era-candidates.json',
  "source_adapter_id: 'uae-active-window-reviewed-bundle'",
  "country_id: 'united-arab-emirates'",
  "status: 'source-reviewed'",
  "review_status: 'approved'",
  "reviewer: 'PR-077'"
]) {
  if (!generator.includes(required)) fail(`generator must include ${required}`);
}

if (errors.length) {
  console.error('UAE active-window approved candidate check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('UAE active-window approved candidate check passed.');
