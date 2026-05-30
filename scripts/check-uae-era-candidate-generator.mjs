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

function isDateInsideWindow(date, window) {
  return date >= window.start_date && date < window.end_date_exclusive;
}

const generator = read('scripts/generate-uae-era-candidates.mjs');
const candidateText = read('data/candidates/uae-era-candidates.json');
const candidates = JSON.parse(candidateText);

const freshness = spawnSync(process.execPath, ['scripts/generate-uae-era-candidates.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8'
});

if (freshness.status !== 0) {
  fail(`UAE ERA candidate generator --check failed: ${freshness.stderr || freshness.stdout}`);
}

if (candidates.schema_version !== 'timetable-candidates-v0') fail('UAE ERA candidates must use timetable-candidates-v0.');
if (candidates.source_adapter_id !== 'uae-era-dry-run-adapter') fail('Unexpected source_adapter_id.');
if (candidates.country_id !== 'united-arab-emirates') fail('UAE ERA candidates must be country_id united-arab-emirates.');
if (candidates.candidate_window?.timezone !== 'Asia/Dubai') fail('UAE ERA candidate timezone must be Asia/Dubai.');
if (candidates.review?.review_status !== 'needs_review') fail('UAE ERA candidate file must remain needs_review.');
if (candidates.review?.reviewed_at !== null) fail('UAE ERA candidate file reviewed_at must remain null.');
if (candidates.review?.reviewer !== null) fail('UAE ERA candidate file reviewer must remain null.');
if (candidates.review?.promotion_target !== null) fail('UAE ERA candidate file promotion_target must remain null.');

const sourceTimetables = readJson('data/generated/timetables.json');
const expectedStart = sourceTimetables.generated_at.slice(0, 10);
if (candidates.generated_at !== sourceTimetables.generated_at) fail('UAE ERA generated_at must match the safe generated timetable seed.');
if (candidates.candidate_window?.start_date !== expectedStart) fail('UAE ERA candidate window must start at the safe generated timetable date.');

const records = candidates.records ?? [];
if (!Array.isArray(records)) fail('UAE ERA records must be an array.');

const seenCandidateIds = new Set();
const seenCandidateKeys = new Set();
for (const record of records) {
  if (seenCandidateIds.has(record.candidate_id)) fail(`${record.candidate_id}: duplicate candidate_id.`);
  seenCandidateIds.add(record.candidate_id);

  const key = `${record.date}:${record.racecourse_id}:${record.source_id}`;
  if (seenCandidateKeys.has(key)) fail(`${record.candidate_id}: duplicate candidate key ${key}.`);
  seenCandidateKeys.add(key);

  if (record.country_id !== 'united-arab-emirates') fail(`${record.candidate_id}: country_id must be united-arab-emirates.`);
  if (record.racing_system_id !== 'era') fail(`${record.candidate_id}: racing_system_id must be era.`);
  if (record.extraction_method !== 'adapter_dry_run') fail(`${record.candidate_id}: extraction_method must be adapter_dry_run.`);
  if (record.status !== 'candidate') fail(`${record.candidate_id}: status must be candidate.`);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id}: review_status must be needs_review.`);
  if (record.timezone !== 'Asia/Dubai') fail(`${record.candidate_id}: timezone must be Asia/Dubai.`);
  if (!isDateInsideWindow(record.date, candidates.candidate_window)) fail(`${record.candidate_id}: date must be inside the active candidate window.`);
  if (record.source_id !== 'uae-era-home') fail(`${record.candidate_id}: source_id must be uae-era-home.`);
  if (!record.source_url?.startsWith('https://emiratesracing.com/')) fail(`${record.candidate_id}: source_url must be an Emirates Racing URL.`);
}

const forbiddenMarkers = [
  'raw html',
  'source body',
  'source response body',
  'racecard',
  'entries',
  'horse names',
  'jockey names',
  'trainer names',
  'odds',
  'results',
  'payouts',
  'prediction',
  'tips'
];

const lowerCandidateText = candidateText.toLowerCase();
for (const marker of forbiddenMarkers) {
  if (lowerCandidateText.includes(marker)) fail(`UAE ERA candidate file must not include forbidden marker: ${marker}`);
}

if (records.length === 0) {
  const gapText = `${candidates.review?.summary ?? ''} ${candidates.notes ?? ''}`.toLowerCase();
  if (!gapText.includes('season gap') || !gapText.includes('no active-window')) {
    fail('Empty UAE ERA candidate file must clearly state season gap and no active-window meetings.');
  }
}

for (const required of [
  "source_id === 'uae-era-home'",
  "timezone === 'Asia/Dubai'",
  "extraction_method: 'adapter_dry_run'",
  "review_status: 'needs_review'",
  "status: 'candidate'",
  'Season gap: no active-window meetings',
  'isInsideWindow(record, startDate, endDateExclusive)'
]) {
  if (!generator.includes(required)) fail(`Generator must include: ${required}`);
}

if (generator.includes('fetch(')) fail('Generator must not live fetch.');
if (generator.includes('node-fetch')) fail('Generator must not add fetch dependencies.');

if (errors.length) {
  console.error('UAE ERA candidate generator check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('UAE ERA candidate generator check passed.');
