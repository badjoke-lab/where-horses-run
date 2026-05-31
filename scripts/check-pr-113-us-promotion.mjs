import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-113-us] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const generator = spawnSync('node', ['scripts/generate-pr-113-us-promotions.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (generator.status !== 0) {
  console.error(generator.stdout);
  console.error(generator.stderr);
  fail('Generator failed.');
}

const data = readJson('data/generated/timetable/pr-113-us-promotions.json');
if (data.schema_version !== 'pr-113-us-promotions-v0') fail('Unexpected schema_version.');
if (data.mode !== 'fixture_parser_backed_no_live_fetch') fail('PR-113 must not live fetch.');
if (!Array.isArray(data.records) || data.records.length < 9) fail('Expected at least nine United States promotion records.');

const groups = new Set(data.records.map((record) => record.group_id));
for (const groupId of ['equibase-thoroughbred', 'usta-harness', 'aqha-quarter-horse']) {
  if (!groups.has(groupId)) fail(`Missing group_id: ${groupId}`);
}

for (const record of data.records) {
  if (record.country_id !== 'united-states') fail(`${record.record_id}: country_id must be united-states.`);
  if (!['equibase-thoroughbred', 'usta-harness', 'aqha-quarter-horse'].includes(record.group_id)) fail(`${record.record_id}: unexpected group_id.`);
  if (record.data_level === 'A') fail(`${record.record_id}: PR-113 must not claim Level A.`);
  if (!['B', 'C'].includes(record.data_level)) fail(`${record.record_id}: data_level must be B or C.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse is required.`);
  if (!record.meeting_date || !/^2026-\d{2}-\d{2}$/.test(record.meeting_date)) fail(`${record.record_id}: meeting_date must be 2026 YYYY-MM-DD.`);
  if (record.data_level === 'B' && !record.first_race_time) fail(`${record.record_id}: Level B requires first_race_time.`);
  if (!record.promotes_from?.startsWith('pr107-united-states-')) fail(`${record.record_id}: promotes_from must reference PR-107 United States source target.`);
  if (Array.isArray(record.races) && record.races.length > 0) fail(`${record.record_id}: PR-113 must not include full race rows.`);
}

console.log(`[pr-113-us] PASS: ${data.records.length} United States promotion records.`);
