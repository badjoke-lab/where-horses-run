import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const expectedCountries = [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'united-kingdom',
  'ireland',
  'france',
  'australia',
  'new-zealand',
  'canada',
  'south-africa',
  'south-korea',
  'singapore',
  'united-states'
];

function fail(message) {
  console.error(`[pr-129-real-calendar] ${message}`);
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

const historical = readJson('data/generated/timetable/real-calendar-all-countries.json');
const page = read('src/pages/major-countries/current-timetable.astro');
const rowAdapter = read('src/data/timetableMeetingRows.ts');
const publicViewModel = read('src/lib/timetable/publicTimetableViewModel.ts');
const publicList = readJson('data/generated/timetable/public/meeting-list.json');

if (historical.schema_version !== 'real-calendar-all-countries-v0') fail('Unexpected historical schema.');
if (historical.mode !== 'real_source_all_countries') fail('Unexpected historical mode.');
if (!Array.isArray(historical.records)) fail('Historical records must be an array.');
if (historical.records.length !== 13) fail(`Expected 13 historical records, got ${historical.records.length}.`);

const countries = new Set(historical.records.map((record) => record.country_id));
for (const countryId of expectedCountries) {
  if (!countries.has(countryId)) fail(`Missing historical country: ${countryId}.`);
}
if (countries.size !== 13) fail(`Expected exactly 13 historical country ids, got ${countries.size}.`);

const forbidden = ['fixture', 'sample', 'mock', 'needs_review', 'not_checked'];
for (const record of historical.records) {
  if (record.data_origin !== 'real_source') fail(`${record.country_id}: historical data_origin must be real_source.`);
  if (!['A', 'B', 'C'].includes(record.data_level)) fail(`${record.country_id}: historical data_level must be A/B/C.`);
  for (const key of ['country_id', 'country_label', 'group_id', 'group_label', 'racecourse', 'meeting_date', 'data_level', 'data_origin', 'source_trace', 'freshness']) {
    if (!record[key]) fail(`${record.country_id}: missing historical ${key}.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.meeting_date)) fail(`${record.country_id}: meeting_date must be YYYY-MM-DD.`);
  if (!record.source_trace.source_url?.startsWith('https://')) fail(`${record.country_id}: source_url must be https official source.`);
  if (!record.source_trace.last_checked) fail(`${record.country_id}: last_checked missing.`);
  if (!record.source_trace.parser) fail(`${record.country_id}: parser missing.`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const term of forbidden) {
    if (serialized.includes(term)) fail(`${record.country_id}: forbidden historical term ${term}.`);
  }
}

if (page.includes('real-calendar-all-countries.json')) {
  fail('Current timetable page must not restore the retired all-country snapshot as a runtime source.');
}
for (const marker of ['TimetableMeetingList', 'getGroupedTimetableMeetingRows']) {
  if (!page.includes(marker)) fail(`Current timetable page must include ${marker}.`);
}
for (const marker of ['getPublicTimetableMeetingRows', 'getGroupedTimetableMeetingRows']) {
  if (!rowAdapter.includes(marker)) fail(`Current timetable row adapter must include ${marker}.`);
}
for (const marker of ['meeting-list.json', 'meeting-details.json', 'effective_public_rank']) {
  if (!publicViewModel.includes(marker)) fail(`Public timetable view model must include ${marker}.`);
}
if (publicList.schema_version !== 'public-timetable-meeting-list-v0') fail('Unexpected current public meeting-list schema.');
if (!Array.isArray(publicList.meetings) || publicList.meetings.length === 0) fail('Current Public v1 meeting list must not be empty.');

console.log(`[pr-129-real-calendar] PASS: ${historical.records.length} historical country snapshots retained; Public v1 runtime active`);
