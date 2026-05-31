import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-110-harness-australia] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const generator = spawnSync('node', ['scripts/generate-pr-110-harness-australia-promotions.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (generator.status !== 0) {
  console.error(generator.stdout);
  console.error(generator.stderr);
  fail('Generator failed.');
}

const data = readJson('data/generated/timetable/pr-110-harness-australia-promotions.json');
if (data.schema_version !== 'pr-110-harness-australia-promotions-v0') fail('Unexpected schema_version.');
if (data.mode !== 'fixture_parser_backed_no_live_fetch') fail('PR-110 must not live fetch.');
if (!Array.isArray(data.records) || data.records.length < 2) fail('Expected at least two promoted records.');

const byRacecourse = new Map(data.records.map((record) => [record.racecourse, record]));
for (const racecourse of ['Riverina Paceway', 'Bendigo']) {
  if (!byRacecourse.has(racecourse)) fail(`Missing racecourse: ${racecourse}`);
}

const riverina = byRacecourse.get('Riverina Paceway');
if (riverina.data_level !== 'B') fail('Riverina Paceway should be Level B because first-race time is available.');
if (riverina.first_race_time !== '12:26 PM') fail(`Unexpected Riverina first_race_time: ${riverina.first_race_time}`);
if (riverina.meeting_date !== '2026-02-20') fail(`Unexpected Riverina meeting_date: ${riverina.meeting_date}`);

const bendigo = byRacecourse.get('Bendigo');
if (!['C', 'B'].includes(bendigo.data_level)) fail('Bendigo should be C or B from current races rail.');
if (bendigo.first_race_time !== '1:08 PM') fail(`Unexpected Bendigo first_race_time: ${bendigo.first_race_time}`);

for (const record of data.records) {
  if (record.country_id !== 'australia') fail(`${record.record_id}: country_id must be australia.`);
  if (record.group_id !== 'harness-australia') fail(`${record.record_id}: group_id must be harness-australia.`);
  if (!record.promotes_from?.includes('harness-australia')) fail(`${record.record_id}: promotes_from must reference PR-107 source target.`);
  if (!record.source_url.startsWith('https://www.harness.org.au/')) fail(`${record.record_id}: source_url must be official Harness Australia URL.`);
  if (record.data_level === 'A') fail(`${record.record_id}: PR-110 should not claim Level A from rail-only fixture.`);
}

console.log(`[pr-110-harness-australia] PASS: ${data.records.length} parser-backed promotion records.`);
