import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-120-current-timetable-ui] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const page = read('src/pages/major-countries/current-timetable.astro');
const component = read('src/components/CurrentTimetableRecords.astro');
const data = readJson('data/generated/timetable/current-integrated.json');

if (!page.includes('current-integrated.json')) fail('Page must import current-integrated.json.');
if (!page.includes('CurrentTimetableRecords')) fail('Page must render CurrentTimetableRecords.');
if (!page.includes('Current integrated timetable')) fail('Page title text missing.');

for (const field of [
  'country_label',
  'group_label',
  'racecourse',
  'meeting_date',
  'first_race_time',
  'all_race_times',
  'source_trace',
  'last_checked'
]) {
  if (!component.includes(field)) fail(`Component must reference ${field}.`);
}

if (data.schema_version !== 'current-timetable-integrated-v0') fail('Unexpected data schema.');
if (!Array.isArray(data.records) || data.records.length < 9) fail('Expected at least nine records.');

for (const record of data.records) {
  if (!record.country_label) fail(`${record.record_id}: country_label missing.`);
  if (!record.group_label) fail(`${record.record_id}: group_label missing.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse missing.`);
  if (!record.meeting_date) fail(`${record.record_id}: meeting_date missing.`);
  if (!record.first_race_time) fail(`${record.record_id}: first_race_time missing.`);
  if (!Array.isArray(record.all_race_times) || record.all_race_times.length < 3) fail(`${record.record_id}: all_race_times missing.`);
  if (!record.source_trace?.last_checked) fail(`${record.record_id}: last_checked missing.`);
}

console.log(`[pr-120-current-timetable-ui] PASS: ${data.records.length} records available to UI.`);
