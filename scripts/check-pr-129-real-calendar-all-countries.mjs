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

const data = readJson('data/generated/timetable/real-calendar-all-countries.json');
const page = read('src/pages/major-countries/current-timetable.astro');

if (data.schema_version !== 'real-calendar-all-countries-v0') fail('Unexpected schema.');
if (data.mode !== 'real_source_all_countries') fail('Unexpected mode.');
if (!Array.isArray(data.records)) fail('records must be an array.');
if (data.records.length !== 13) fail(`Expected 13 records, got ${data.records.length}.`);
if (!page.includes('real-calendar-all-countries.json')) fail('Current timetable page must import real calendar data.');

const countries = new Set(data.records.map((record) => record.country_id));
for (const countryId of expectedCountries) {
  if (!countries.has(countryId)) fail(`Missing country: ${countryId}.`);
}
if (countries.size !== 13) fail(`Expected exactly 13 country ids, got ${countries.size}.`);

const forbidden = ['fixture', 'sample', 'mock', 'needs_review', 'not_checked'];
for (const record of data.records) {
  if (record.data_origin !== 'real_source') fail(`${record.country_id}: data_origin must be real_source.`);
  if (!['A', 'B', 'C'].includes(record.data_level)) fail(`${record.country_id}: data_level must be A/B/C.`);
  for (const key of ['country_id', 'country_label', 'group_id', 'group_label', 'racecourse', 'meeting_date', 'data_level', 'data_origin', 'source_trace', 'freshness']) {
    if (!record[key]) fail(`${record.country_id}: missing ${key}.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.meeting_date)) fail(`${record.country_id}: meeting_date must be YYYY-MM-DD.`);
  if (!record.source_trace.source_url?.startsWith('https://')) fail(`${record.country_id}: source_url must be https official source.`);
  if (!record.source_trace.last_checked) fail(`${record.country_id}: last_checked missing.`);
  if (!record.source_trace.parser) fail(`${record.country_id}: parser missing.`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const term of forbidden) {
    if (serialized.includes(term)) fail(`${record.country_id}: forbidden term ${term}.`);
  }
}

console.log('[pr-129-real-calendar] PASS');
