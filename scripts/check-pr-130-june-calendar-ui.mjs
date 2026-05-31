import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-130-june-calendar-ui] ${message}`);
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

const data = readJson('data/generated/timetable/june-2026-calendar.json');
const page = read('src/pages/major-countries/current-timetable.astro');

if (data.schema_version !== 'june-2026-calendar-v0') fail('Unexpected schema.');
if (data.month !== '2026-06') fail('Unexpected month.');
if (!Array.isArray(data.records) || data.records.length < 1) fail('June records missing.');
if (!page.includes('june-2026-calendar.json')) fail('Current timetable page must import June calendar data.');

for (const record of data.records) {
  if (record.data_origin !== 'real_source') fail(`${record.record_id}: data_origin must be real_source.`);
  if (!['A', 'B', 'C'].includes(record.data_level)) fail(`${record.record_id}: data_level must be A/B/C.`);
  if (!record.meeting_date?.startsWith('2026-06-')) fail(`${record.record_id}: meeting_date must be in June 2026.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse missing.`);
  if (!record.source_trace?.source_url?.startsWith('https://')) fail(`${record.record_id}: source URL missing.`);
  if (!record.source_trace?.parser) fail(`${record.record_id}: parser missing.`);
}

console.log('[pr-130-june-calendar-ui] PASS');
