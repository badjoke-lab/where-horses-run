import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-112-sa-korea] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const generator = spawnSync('node', ['scripts/generate-pr-112-sa-korea-promotions.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (generator.status !== 0) {
  console.error(generator.stdout);
  console.error(generator.stderr);
  fail('Generator failed.');
}

const data = readJson('data/generated/timetable/pr-112-sa-korea-promotions.json');
if (data.schema_version !== 'pr-112-sa-korea-promotions-v0') fail('Unexpected schema_version.');
if (data.mode !== 'fixture_parser_backed_no_live_fetch') fail('PR-112 must not live fetch.');
if (!Array.isArray(data.records) || data.records.length < 8) fail('Expected at least eight South Africa/Korea promotion records.');

const countries = new Set(data.records.map((record) => record.country_id));
if (!countries.has('south-africa')) fail('Missing South Africa records.');
if (!countries.has('south-korea')) fail('Missing South Korea records.');

const groups = new Set(data.records.map((record) => record.group_id));
if (!groups.has('4racing-gold-circle-operator-rows')) fail('Missing South Africa operator rows.');
if (!groups.has('kra')) fail('Missing KRA rows.');

const racecourses = new Set(data.records.map((record) => record.racecourse));
for (const requiredRacecourse of ['Turffontein', 'Greyville', 'Fairview', 'Scottsville', 'Seoul', 'Busan-Gyeongnam', 'Jeju']) {
  if (!racecourses.has(requiredRacecourse)) fail(`Missing racecourse: ${requiredRacecourse}`);
}

for (const record of data.records) {
  if (!['south-africa', 'south-korea'].includes(record.country_id)) {
    fail(`${record.record_id}: unexpected country_id ${record.country_id}.`);
  }
  if (record.data_level !== 'B') fail(`${record.record_id}: should be Level B because first race/post time is available.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse is required.`);
  if (!record.meeting_date || !/^2026-\d{2}-\d{2}$/.test(record.meeting_date)) {
    fail(`${record.record_id}: meeting_date must be 2026 YYYY-MM-DD.`);
  }
  if (!record.first_race_time || !/^\d{1,2}:\d{2}(\s+(AM|PM))?$/.test(record.first_race_time)) {
    fail(`${record.record_id}: first_race_time must be available.`);
  }
  if (!record.promotes_from?.startsWith('pr107-')) {
    fail(`${record.record_id}: promotes_from must reference PR-107 source target.`);
  }
  if (record.data_level === 'A') fail(`${record.record_id}: PR-112 should not claim Level A.`);
}

console.log(`[pr-112-sa-korea] PASS: ${data.records.length} parser-backed promotion records.`);
