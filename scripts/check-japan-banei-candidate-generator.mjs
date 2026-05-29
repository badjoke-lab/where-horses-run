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

const generator = readFileSync(path.join(root, 'scripts/generate-japan-banei-candidates.mjs'), 'utf8');
const candidates = readJson('data/candidates/japan-banei-candidates.json');

const staleCheck = spawnSync(process.execPath, ['scripts/generate-japan-banei-candidates.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});

if (staleCheck.status !== 0) {
  fail(`Banei candidate generator check failed: ${staleCheck.stderr || staleCheck.stdout}`);
}

if (candidates.schema_version !== 'timetable-candidates-v0') fail('Banei candidates must use timetable-candidates-v0.');
if (candidates.source_adapter_id !== 'japan-banei-dry-run-adapter') fail('Unexpected source_adapter_id.');
if (candidates.country_id !== 'japan') fail('Banei candidates must be country_id japan.');
if (candidates.candidate_window?.timezone !== 'Asia/Tokyo') fail('Banei candidate timezone must be Asia/Tokyo.');
if (candidates.review?.review_status !== 'needs_review') fail('Banei candidate file must remain needs_review.');

const records = candidates.records ?? [];
if (records.length !== 3) fail('Banei dry-run candidate output must contain the 3 existing safe Banei overlay records.');

const seen = new Set();
for (const record of records) {
  if (record.country_id !== 'japan') fail(`${record.candidate_id}: country_id must be japan.`);
  if (record.racing_system_id !== 'banei') fail(`${record.candidate_id}: racing_system_id must be banei.`);
  if (record.source_id !== 'japan-banei-monthly-schedule') fail(`${record.candidate_id}: source_id must be japan-banei-monthly-schedule.`);
  if (record.extraction_method !== 'adapter_dry_run') fail(`${record.candidate_id}: extraction_method must be adapter_dry_run.`);
  if (record.status !== 'candidate') fail(`${record.candidate_id}: status must be candidate.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: review_status must be needs_review.`);
  if (!record.source_url?.startsWith('https://www.banei-keiba.or.jp/')) fail(`${record.candidate_id}: source_url must be Banei URL.`);
  if (!String(record.racing_type ?? '').includes('Banei')) fail(`${record.candidate_id}: racing_type must be Banei.`);

  const key = `${record.date}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`Duplicate Banei candidate key: ${key}`);
  seen.add(key);

  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['raw html', 'source body', 'racecard', 'entries', 'horse names', 'jockey names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
    if (serialized.includes(forbidden)) fail(`${record.candidate_id}: forbidden marker found: ${forbidden}`);
  }
}

for (const requiredKey of [
  '2026-05-30:obihiro-racecourse:japan-banei-monthly-schedule',
  '2026-05-31:obihiro-racecourse:japan-banei-monthly-schedule',
  '2026-06-01:obihiro-racecourse:japan-banei-monthly-schedule'
]) {
  if (!seen.has(requiredKey)) fail(`Missing expected Banei candidate key: ${requiredKey}`);
}

for (const required of [
  "source_id === 'japan-banei-monthly-schedule'",
  "extraction_method: 'adapter_dry_run'",
  "review_status: 'needs_review'",
  "status: 'candidate'"
]) {
  if (!generator.includes(required)) fail(`Generator must include: ${required}`);
}

if (errors.length) {
  console.error('Japan Banei candidate generator check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan Banei candidate generator check passed.');
