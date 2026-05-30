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

const generator = readFileSync(path.join(root, 'scripts/generate-hong-kong-hkjc-candidates.mjs'), 'utf8');
const candidates = readJson('data/candidates/hong-kong-hkjc-candidates.json');

const staleCheck = spawnSync(process.execPath, ['scripts/generate-hong-kong-hkjc-candidates.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});

if (staleCheck.status !== 0) {
  fail(`HKJC candidate generator check failed: ${staleCheck.stderr || staleCheck.stdout}`);
}

if (candidates.schema_version !== 'timetable-candidates-v0') fail('HKJC candidates must use timetable-candidates-v0.');
if (candidates.source_adapter_id !== 'hong-kong-hkjc-dry-run-adapter') fail('Unexpected source_adapter_id.');
if (candidates.country_id !== 'hong-kong') fail('HKJC candidates must be country_id hong-kong.');
if (candidates.candidate_window?.timezone !== 'Asia/Hong_Kong') fail('HKJC candidate timezone must be Asia/Hong_Kong.');
if (candidates.review?.review_status !== 'needs_review') fail('HKJC candidate file must remain needs_review.');

const records = candidates.records ?? [];
if (records.length !== 7) fail('HKJC dry-run candidate output must contain the 7 existing safe HKJC seed records.');

const seen = new Set();
const racecourseIds = new Set();
for (const record of records) {
  racecourseIds.add(record.racecourse_id);
  if (record.country_id !== 'hong-kong') fail(`${record.candidate_id}: country_id must be hong-kong.`);
  if (record.racing_system_id !== 'hkjc') fail(`${record.candidate_id}: racing_system_id must be hkjc.`);
  if (record.source_id !== 'hong-kong-hkjc-home') fail(`${record.candidate_id}: source_id must be hong-kong-hkjc-home.`);
  if (record.extraction_method !== 'adapter_dry_run') fail(`${record.candidate_id}: extraction_method must be adapter_dry_run.`);
  if (record.status !== 'candidate') fail(`${record.candidate_id}: status must be candidate.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: review_status must be needs_review.`);
  if (!record.source_url?.startsWith('https://racing.hkjc.com/')) fail(`${record.candidate_id}: source_url must be HKJC URL.`);
  if (record.timezone !== 'Asia/Hong_Kong') fail(`${record.candidate_id}: timezone must be Asia/Hong_Kong.`);

  const key = `${record.date}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`Duplicate HKJC candidate key: ${key}`);
  seen.add(key);

  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['raw html', 'source body', 'racecard', 'entries', 'horse names', 'jockey names', 'trainer names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
    if (serialized.includes(forbidden)) fail(`${record.candidate_id}: forbidden marker found: ${forbidden}`);
  }
}

for (const requiredId of ['happy-valley-racecourse', 'sha-tin-racecourse']) {
  if (!racecourseIds.has(requiredId)) fail(`Missing normalized HKJC racecourse id: ${requiredId}`);
}

for (const requiredKey of [
  '2026-06-03:happy-valley-racecourse:hong-kong-hkjc-home',
  '2026-06-07:sha-tin-racecourse:hong-kong-hkjc-home',
  '2026-06-24:happy-valley-racecourse:hong-kong-hkjc-home',
  '2026-06-27:sha-tin-racecourse:hong-kong-hkjc-home'
]) {
  if (!seen.has(requiredKey)) fail(`Missing expected HKJC candidate key: ${requiredKey}`);
}

for (const required of [
  "source_id === 'hong-kong-hkjc-home'",
  "return 'happy-valley-racecourse'",
  "extraction_method: 'adapter_dry_run'",
  "review_status: 'needs_review'",
  "status: 'candidate'"
]) {
  if (!generator.includes(required)) fail(`Generator must include: ${required}`);
}

if (errors.length) {
  console.error('Hong Kong HKJC candidate generator check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Hong Kong HKJC candidate generator check passed.');
