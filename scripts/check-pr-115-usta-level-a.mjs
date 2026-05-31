import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-115-usta] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const generator = spawnSync('node', ['scripts/generate-pr-115-usta-level-a.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (generator.status !== 0) {
  console.error(generator.stdout);
  console.error(generator.stderr);
  fail('Generator failed.');
}

const data = readJson('data/generated/timetable/pr-115-usta-level-a.json');
if (data.schema_version !== 'pr-115-usta-level-a-v0') fail('Unexpected schema_version.');
if (data.mode !== 'fixture_full_harness_racecard_no_live_fetch') fail('PR-115 must not live fetch.');
if (!Array.isArray(data.records) || data.records.length < 2) fail('Expected at least two Level A records.');

for (const record of data.records) {
  if (record.country_id !== 'united-states') fail(`${record.record_id}: country_id must be united-states.`);
  if (record.group_id !== 'usta-harness') fail(`${record.record_id}: group_id must be usta-harness.`);
  if (record.data_level !== 'A') fail(`${record.record_id}: data_level must be A.`);
  if (!record.promotes_from?.startsWith('pr113-us-usta-')) fail(`${record.record_id}: promotes_from must reference PR-113 USTA record.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse is required.`);
  if (!record.meeting_date || !/^2026-\d{2}-\d{2}$/.test(record.meeting_date)) fail(`${record.record_id}: meeting_date must be 2026 YYYY-MM-DD.`);
  if (!Array.isArray(record.races) || record.races.length < 3) fail(`${record.record_id}: Level A requires full race rows.`);
  if (record.first_race_time !== record.races[0].race_time) fail(`${record.record_id}: first_race_time must match race 1 time.`);
  for (const race of record.races) {
    if (!Number.isInteger(race.race_number)) fail(`${record.record_id}: race_number must be integer.`);
    if (!race.race_time || !/^\d{1,2}:\d{2}\s+(AM|PM)$/.test(race.race_time)) fail(`${record.record_id}: each race requires race_time.`);
    if (!race.race_name) fail(`${record.record_id}: race_name is required.`);
    if (!race.distance) fail(`${record.record_id}: distance is required.`);
  }
}

console.log(`[pr-115-usta] PASS: ${data.records.length} Level A full harness racecard records.`);
