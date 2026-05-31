import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-119-current-integrated] ${message}`);
  process.exit(1);
}

const build = spawnSync('node', ['scripts/timetable/build-current-integrated.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
if (build.status !== 0) {
  console.error(build.stdout);
  console.error(build.stderr);
  fail('Builder failed.');
}

const outputPath = path.join(root, 'data/generated/timetable/current-integrated.json');
if (!fs.existsSync(outputPath)) fail('Missing current-integrated.json.');

const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
if (data.schema_version !== 'current-timetable-integrated-v0') fail('Unexpected schema_version.');
if (data.mode !== 'fixture_level_a_integration_no_live_fetch') fail('Unexpected mode.');
if (!Array.isArray(data.records)) fail('records must be an array.');
if (data.records.length < 9) fail('Expected at least nine integrated records.');
if (data.record_count !== data.records.length) fail('record_count mismatch.');

for (const dimension of ['country', 'group', 'meeting_date', 'racecourse']) {
  if (!data.display_dimensions.includes(dimension)) fail(`Missing display dimension: ${dimension}`);
}

const groups = new Set();
for (const record of data.records) {
  groups.add(record.group_id);
  for (const key of ['record_id', 'country_id', 'country_label', 'group_id', 'group_label', 'racecourse', 'meeting_date', 'data_level', 'first_race_time']) {
    if (!record[key]) fail(`${record.record_id ?? 'record'} missing ${key}.`);
  }
  if (record.data_level !== 'A') fail(`${record.record_id}: expected Level A.`);
  if (!Array.isArray(record.all_race_times) || record.all_race_times.length < 3) fail(`${record.record_id}: all_race_times required.`);
  if (record.first_race_time !== record.all_race_times[0].race_time) fail(`${record.record_id}: first race time mismatch.`);
  if (!record.source_trace?.source_url) fail(`${record.record_id}: source_url missing.`);
  if (!record.source_trace?.source_type) fail(`${record.record_id}: source_type missing.`);
  if (!record.source_trace?.source_capture_date) fail(`${record.record_id}: source_capture_date missing.`);
  if (!record.source_trace?.last_checked) fail(`${record.record_id}: last_checked missing.`);
  if (!record.source_trace?.parser) fail(`${record.record_id}: parser missing.`);
  if (!record.freshness?.status) fail(`${record.record_id}: freshness status missing.`);
}

for (const groupId of ['equibase-thoroughbred', 'usta-harness', 'aqha-quarter-horse']) {
  if (!groups.has(groupId)) fail(`Missing group: ${groupId}`);
}

console.log(`[pr-119-current-integrated] PASS: ${data.records.length} records integrated for display.`);
