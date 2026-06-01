import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const expectedGroups = [
  ['japan', 'jra'],
  ['japan', 'nar'],
  ['japan', 'banei'],
  ['hong-kong', 'hkjc'],
  ['united-arab-emirates', 'era'],
  ['united-kingdom', 'bha'],
  ['united-kingdom', 'point-to-point'],
  ['united-kingdom', 'purebred-arabian'],
  ['ireland', 'hri'],
  ['france', 'france-galop'],
  ['france', 'letrot'],
  ['australia', 'racing-australia-thoroughbred'],
  ['australia', 'harness-australia'],
  ['new-zealand', 'loveracing-thoroughbred'],
  ['new-zealand', 'hrnz-harness'],
  ['canada', 'woodbine-thoroughbred'],
  ['canada', 'standardbred-canada'],
  ['south-africa', 'nhra'],
  ['south-africa', '4racing'],
  ['south-africa', 'gold-circle'],
  ['south-korea', 'kra'],
  ['singapore', 'singapore-turf-club'],
  ['united-states', 'equibase-thoroughbred'],
  ['united-states', 'usta-harness'],
  ['united-states', 'aqha-quarter-horse']
];

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
if (!Array.isArray(data.records) || data.records.length < expectedGroups.length) fail(`Expected at least ${expectedGroups.length} June records.`);
if (!page.includes('june-2026-calendar.json')) fail('Current timetable page must import June calendar data.');

const groupKeys = new Set(data.records.map((record) => `${record.country_id}::${record.group_id}`));
for (const [countryId, groupId] of expectedGroups) {
  if (!groupKeys.has(`${countryId}::${groupId}`)) fail(`Missing June record for ${countryId}/${groupId}.`);
}

for (const record of data.records) {
  if (record.data_origin !== 'real_source') fail(`${record.record_id}: data_origin must be real_source.`);
  if (!['A', 'B', 'C'].includes(record.data_level)) fail(`${record.record_id}: data_level must be A/B/C.`);
  if (!record.meeting_date?.startsWith('2026-06-')) fail(`${record.record_id}: meeting_date must be in June 2026.`);
  if (!record.racecourse) fail(`${record.record_id}: racecourse missing.`);
  if (!record.source_trace?.source_url?.startsWith('https://')) fail(`${record.record_id}: source URL missing.`);
  if (!record.source_trace?.parser) fail(`${record.record_id}: parser missing.`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['fixture_source', 'sample', 'mock', 'needs_review', 'not_checked']) {
    if (serialized.includes(forbidden)) fail(`${record.record_id}: forbidden marker ${forbidden}.`);
  }
}

console.log('[pr-130-june-calendar-ui] PASS');
