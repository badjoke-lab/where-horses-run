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

const script = read('scripts/generate-japan-active-window-approved-candidates.mjs');
const sourceFiles = [
  readJson('data/candidates/japan-jra-candidates.json'),
  readJson('data/candidates/japan-nar-candidates.json'),
  readJson('data/candidates/japan-banei-candidates.json')
];

const dryRun = spawnSync(process.execPath, ['scripts/generate-japan-active-window-approved-candidates.mjs'], {
  cwd: root,
  encoding: 'utf8'
});

if (dryRun.status !== 0) fail(`approved bundle generation failed: ${dryRun.stderr || dryRun.stdout}`);

const bundle = readJson('data/candidates/japan-active-window-approved-candidates.json');
if (bundle.schema_version !== 'timetable-candidates-v0') fail('bundle must use timetable-candidates-v0');
if (bundle.country_id !== 'japan') fail('bundle country_id must be japan');
if (bundle.source_adapter_id !== 'japan-active-window-reviewed-bundle') fail('bundle source_adapter_id mismatch');
if (bundle.review?.review_status !== 'approved') fail('bundle review_status must be approved');

const expectedCount = sourceFiles.reduce((sum, file) => sum + (file.records ?? []).length, 0);
if ((bundle.records ?? []).length !== expectedCount) fail(`bundle must include ${expectedCount} records`);

const systems = new Set();
const seen = new Set();
for (const record of bundle.records ?? []) {
  systems.add(record.racing_system_id);
  if (record.country_id !== 'japan') fail(`${record.candidate_id}: country_id must be japan`);
  if (record.status !== 'source-reviewed') fail(`${record.candidate_id}: status must be source-reviewed`);
  if (record.review_status !== 'approved') fail(`${record.candidate_id}: review_status must be approved`);
  const key = `${record.date}:${record.racing_system_id}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`duplicate bundle key: ${key}`);
  seen.add(key);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['raw html', 'source body', 'racecard', 'entries', 'horse names', 'jockey names', 'trainer names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
    if (serialized.includes(forbidden)) fail(`${record.candidate_id}: forbidden marker found ${forbidden}`);
  }
}

for (const system of ['jra', 'nar', 'banei']) {
  if (!systems.has(system)) fail(`bundle must include ${system}`);
}

for (const required of [
  'japan-jra-candidates.json',
  'japan-nar-candidates.json',
  'japan-banei-candidates.json',
  "review_status: 'approved'",
  "status: 'source-reviewed'"
]) {
  if (!script.includes(required)) fail(`script must include ${required}`);
}

if (errors.length) {
  console.error('Japan active-window approved candidate check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan active-window approved candidate check passed.');
