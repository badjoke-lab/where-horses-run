import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const generator = readFileSync(path.join(root, 'scripts/generate-japan-jra-candidates.mjs'), 'utf8');
const candidates = readJson('data/candidates/japan-jra-candidates.json');

const staleCheck = spawnSync(process.execPath, ['scripts/generate-japan-jra-candidates.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});

if (staleCheck.status !== 0) {
  fail(`JRA candidate generator check failed: ${staleCheck.stderr || staleCheck.stdout}`);
}

if (candidates.schema_version !== 'timetable-candidates-v0') fail('JRA candidates must use timetable-candidates-v0.');
if (candidates.source_adapter_id !== 'japan-jra-dry-run-adapter') fail('Unexpected source_adapter_id.');
if (candidates.country_id !== 'japan') fail('JRA candidates must be country_id japan.');
if (candidates.candidate_window?.timezone !== 'Asia/Tokyo') fail('JRA candidate timezone must be Asia/Tokyo.');
if (candidates.review?.review_status !== 'needs_review') fail('JRA candidate file must remain needs_review.');

const records = candidates.records ?? [];
if (records.length !== 4) fail('JRA dry-run candidate output must contain the four existing safe JRA seed records.');

const seen = new Set();
for (const record of records) {
  if (record.country_id !== 'japan') fail(`${record.candidate_id}: country_id must be japan.`);
  if (record.racing_system_id !== 'jra') fail(`${record.candidate_id}: racing_system_id must be jra.`);
  if (record.source_id !== 'japan-jra-home') fail(`${record.candidate_id}: source_id must be japan-jra-home.`);
  if (record.extraction_method !== 'adapter_dry_run') fail(`${record.candidate_id}: extraction_method must be adapter_dry_run.`);
  if (record.status !== 'candidate') fail(`${record.candidate_id}: status must be candidate.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: review_status must be needs_review.`);
  if (!record.source_url?.startsWith('https://jra.jp/')) fail(`${record.candidate_id}: source_url must be JRA URL.`);

  const key = `${record.date}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`Duplicate JRA candidate key: ${key}`);
  seen.add(key);

  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['raw html', 'source body', 'racecard', 'entries', 'horse names', 'jockey names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
    if (serialized.includes(forbidden)) fail(`${record.candidate_id}: forbidden marker found: ${forbidden}`);
  }
}

for (const required of [
  "source_id === 'japan-jra-home'",
  "extraction_method: 'adapter_dry_run'",
  "review_status: 'needs_review'",
  "status: 'candidate'"
]) {
  if (!generator.includes(required)) fail(`Generator must include: ${required}`);
}

if (errors.length) {
  console.error('Japan JRA candidate generator check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan JRA candidate generator check passed.');
