import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-111-canada] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const generator = spawnSync('node', ['scripts/generate-pr-111-canada-promotions.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (generator.status !== 0) {
  console.error(generator.stdout);
  console.error(generator.stderr);
  fail('Generator failed.');
}

const data = readJson('data/generated/timetable/pr-111-canada-promotions.json');
if (data.schema_version !== 'pr-111-canada-promotions-v0') fail('Unexpected schema_version.');
if (data.mode !== 'fixture_parser_backed_no_live_fetch') fail('PR-111 must not live fetch.');
if (!Array.isArray(data.records) || data.records.length < 10) fail('Expected at least ten Canada promotion records.');

const groups = new Set(data.records.map((record) => record.group_id));
if (!groups.has('woodbine-thoroughbred')) fail('Missing Woodbine thoroughbred records.');
if (!groups.has('standardbred-canada')) fail('Missing Canadian standardbred records.');

const byGroup = new Map();
for (const record of data.records) {
  byGroup.set(record.group_id, (byGroup.get(record.group_id) ?? 0) + 1);

  if (record.country_id !== 'canada') fail(`${record.record_id}: country_id must be canada.`);
  if (!['woodbine-thoroughbred', 'standardbred-canada'].includes(record.group_id)) {
    fail(`${record.record_id}: unexpected group_id ${record.group_id}.`);
  }
  if (record.data_level !== 'B') fail(`${record.record_id}: should be Level B because post time is available.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse is required.`);
  if (!record.meeting_date || !/^2026-\d{2}-\d{2}$/.test(record.meeting_date)) {
    fail(`${record.record_id}: meeting_date must be 2026 YYYY-MM-DD.`);
  }
  if (!record.first_race_time || !/\d{1,2}:\d{2}\s+(AM|PM)/.test(record.first_race_time)) {
    fail(`${record.record_id}: first_race_time must be available.`);
  }
  if (!record.promotes_from?.startsWith('pr107-canada-')) {
    fail(`${record.record_id}: promotes_from must reference PR-107 Canada source target.`);
  }
  if (!record.source_url.startsWith('https://woodbine.com/')) {
    fail(`${record.record_id}: source_url must be official Woodbine operator URL.`);
  }
  if (record.data_level === 'A') fail(`${record.record_id}: PR-111 should not claim Level A.`);
}

if ((byGroup.get('woodbine-thoroughbred') ?? 0) < 5) fail('Expected at least five Woodbine thoroughbred rows.');
if ((byGroup.get('standardbred-canada') ?? 0) < 5) fail('Expected at least five standardbred rows.');

console.log(`[pr-111-canada] PASS: ${data.records.length} parser-backed Canada promotion records.`);
