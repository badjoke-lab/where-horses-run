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

const generator = readFileSync(path.join(root, 'scripts/generate-japan-nar-candidates.mjs'), 'utf8');
const candidates = readJson('data/candidates/japan-nar-candidates.json');

const staleCheck = spawnSync(process.execPath, ['scripts/generate-japan-nar-candidates.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});

if (staleCheck.status !== 0) {
  fail(`NAR candidate generator check failed: ${staleCheck.stderr || staleCheck.stdout}`);
}

if (candidates.schema_version !== 'timetable-candidates-v0') fail('NAR candidates must use timetable-candidates-v0.');
if (candidates.source_adapter_id !== 'japan-nar-dry-run-adapter') fail('Unexpected source_adapter_id.');
if (candidates.country_id !== 'japan') fail('NAR candidates must be country_id japan.');
if (candidates.candidate_window?.timezone !== 'Asia/Tokyo') fail('NAR candidate timezone must be Asia/Tokyo.');
if (candidates.review?.review_status !== 'needs_review') fail('NAR candidate file must remain needs_review.');

const records = candidates.records ?? [];
if (records.length !== 12) fail('NAR dry-run candidate output must contain the 12 existing safe NAR overlay records.');

const seen = new Set();
for (const record of records) {
  if (record.country_id !== 'japan') fail(`${record.candidate_id}: country_id must be japan.`);
  if (record.racing_system_id !== 'nar') fail(`${record.candidate_id}: racing_system_id must be nar.`);
  if (record.source_id !== 'japan-nar-home') fail(`${record.candidate_id}: source_id must be japan-nar-home.`);
  if (record.extraction_method !== 'adapter_dry_run') fail(`${record.candidate_id}: extraction_method must be adapter_dry_run.`);
  if (record.status !== 'candidate') fail(`${record.candidate_id}: status must be candidate.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: review_status must be needs_review.`);
  if (!record.source_url?.startsWith('https://www.keiba.go.jp/')) fail(`${record.candidate_id}: source_url must be NAR URL.`);
  if (!String(record.racing_type ?? '').includes('NAR')) fail(`${record.candidate_id}: racing_type must be NAR.`);

  const key = `${record.date}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`Duplicate NAR candidate key: ${key}`);
  seen.add(key);

  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['raw html', 'source body', 'racecard', 'entries', 'horse names', 'jockey names', 'odds', 'results', 'payouts', 'prediction', 'tips']) {
    if (serialized.includes(forbidden)) fail(`${record.candidate_id}: forbidden marker found: ${forbidden}`);
  }
}

for (const requiredKey of [
  '2026-05-30:urawa-racecourse:japan-nar-home',
  '2026-05-30:kasamatsu-racecourse:japan-nar-home',
  '2026-05-30:sonoda-racecourse:japan-nar-home',
  '2026-05-31:mizusawa-racecourse:japan-nar-home',
  '2026-05-31:kanazawa-racecourse:japan-nar-home',
  '2026-06-01:funabashi-racecourse:japan-nar-home'
]) {
  if (!seen.has(requiredKey)) fail(`Missing expected NAR candidate key: ${requiredKey}`);
}

for (const required of [
  "source_id === 'japan-nar-home'",
  "extraction_method: 'adapter_dry_run'",
  "review_status: 'needs_review'",
  "status: 'candidate'"
]) {
  if (!generator.includes(required)) fail(`Generator must include: ${required}`);
}

if (errors.length) {
  console.error('Japan NAR candidate generator check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan NAR candidate generator check passed.');
