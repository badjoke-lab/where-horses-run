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

const generator = read('scripts/generate-hong-kong-active-window-approved-candidates.mjs');
const sourceFile = readJson('data/candidates/hong-kong-hkjc-candidates.json');

const generation = spawnSync(process.execPath, ['scripts/generate-hong-kong-active-window-approved-candidates.mjs'], {
  cwd: root,
  encoding: 'utf8'
});

if (generation.status !== 0) fail(`approved bundle generation failed: ${generation.stderr || generation.stdout}`);

const staleCheck = spawnSync(process.execPath, ['scripts/generate-hong-kong-active-window-approved-candidates.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});

if (staleCheck.status !== 0) fail(`approved bundle is not up to date: ${staleCheck.stderr || staleCheck.stdout}`);

const bundle = readJson('data/candidates/hong-kong-active-window-approved-candidates.json');
if (bundle.schema_version !== 'timetable-candidates-v0') fail('bundle must use timetable-candidates-v0');
if (bundle.country_id !== 'hong-kong') fail('bundle country_id must be hong-kong');
if (bundle.source_adapter_id !== 'hong-kong-active-window-reviewed-bundle') fail('bundle source_adapter_id mismatch');
if (bundle.review?.review_status !== 'approved') fail('bundle review_status must be approved');
if (bundle.review?.reviewed_at !== bundle.generated_at) fail('bundle reviewed_at must match generated_at');
if (bundle.review?.reviewer !== 'PR-074') fail('bundle reviewer must be PR-074');
if (bundle.review?.promotion_target !== 'data/generated/timetables.json') fail('bundle promotion_target must be data/generated/timetables.json');

const expectedCount = (sourceFile.records ?? []).length;
if ((bundle.records ?? []).length !== expectedCount) fail(`bundle must include ${expectedCount} records`);

const racecourseIds = new Set();
const seen = new Set();
for (const record of bundle.records ?? []) {
  racecourseIds.add(record.racecourse_id);
  if (record.country_id !== 'hong-kong') fail(`${record.candidate_id}: country_id must be hong-kong`);
  if (record.status !== 'source-reviewed') fail(`${record.candidate_id}: status must be source-reviewed`);
  if (record.review_status !== 'approved') fail(`${record.candidate_id}: review_status must be approved`);
  if (record.source_id !== 'hong-kong-hkjc-home') fail(`${record.candidate_id}: source_id must be hong-kong-hkjc-home`);
  const key = `${record.date}:${record.racing_system_id}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`duplicate bundle key: ${key}`);
  seen.add(key);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['raw html', 'source body', 'racecard', 'entries', 'horse names', 'jockey names', 'trainer names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
    if (serialized.includes(forbidden)) fail(`${record.candidate_id}: forbidden marker found ${forbidden}`);
  }
}

for (const requiredId of ['happy-valley-racecourse', 'sha-tin-racecourse']) {
  if (!racecourseIds.has(requiredId)) fail(`bundle must include racecourse_id ${requiredId}`);
}

for (const required of [
  'hong-kong-hkjc-candidates.json',
  "source_adapter_id: 'hong-kong-active-window-reviewed-bundle'",
  "country_id: 'hong-kong'",
  "status: 'source-reviewed'",
  "review_status: 'approved'",
  "reviewer: 'PR-074'"
]) {
  if (!generator.includes(required)) fail(`generator must include ${required}`);
}

if (errors.length) {
  console.error('Hong Kong active-window approved candidate check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Hong Kong active-window approved candidate check passed.');
