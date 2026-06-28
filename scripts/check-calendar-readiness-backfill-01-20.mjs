import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const registry = readJson('data/static/calendar-readiness-registry.json');
const authorityInventory = readJson('data/static/authority-source-inventory.json');
const trackerText = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd();
const trackerLines = trackerText.split(/\r?\n/);
const headers = trackerLines.shift().split('\t');
const deliveryIndex = headers.indexOf('delivery_no');
const slugIndex = headers.indexOf('slug');
const targetCountries = new Map(
  trackerLines
    .map((line) => line.split('\t'))
    .filter((row) => Number(row[deliveryIndex]) >= 1 && Number(row[deliveryIndex]) <= 20)
    .map((row) => [row[slugIndex], row[deliveryIndex]])
);

const expectedSystemCounts = new Map(Object.entries({
  'united-arab-emirates': 1,
  'south-korea': 1,
  turkey: 1,
  morocco: 1,
  chile: 1,
  peru: 1,
  mexico: 1,
  brazil: 4,
  bahrain: 1,
  qatar: 1,
  oman: 1,
  zimbabwe: 1,
  japan: 3,
  'hong-kong': 1,
  'new-zealand': 2,
  'south-africa': 2,
  uruguay: 1,
  sweden: 1,
  denmark: 2,
  'czech-republic': 3,
}));

if (registry.bootstrap_status !== 'backfill_in_progress') fail('bootstrap_status must be backfill_in_progress');
if (registry.programme_state?.countries_with_closed_decision !== 20) fail('countries_with_closed_decision must be 20');
if (registry.programme_state?.readiness_records !== 30) fail('readiness_records must be 30');
if (JSON.stringify(registry.programme_state?.next_backfill_work_ids) !== JSON.stringify(['WHR-CAL-BACKFILL-21-36', 'WHR-CAL-BACKFILL-37-52'])) {
  fail('next_backfill_work_ids must contain 21-36 and 37-52');
}
if (!Array.isArray(registry.records) || registry.records.length !== 30) fail(`expected 30 readiness records; found ${registry.records?.length ?? 0}`);

const authorityKeys = new Set((authorityInventory.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
if (authorityKeys.size !== (authorityInventory.records ?? []).length) fail('authority inventory contains duplicate compound keys');
if ((authorityInventory.records ?? []).length !== 31) fail(`expected 31 authority records after backfill; found ${(authorityInventory.records ?? []).length}`);

const recordsByCountry = new Map();
for (const record of registry.records ?? []) {
  if (!recordsByCountry.has(record.country_id)) recordsByCountry.set(record.country_id, []);
  recordsByCountry.get(record.country_id).push(record);
  if (!authorityKeys.has(record.authority_source_key)) fail(`${record.readiness_id}: missing authority source key`);
  if (record.implementation_status !== 'not_started') fail(`${record.readiness_id}: implementation_status must remain not_started`);
  if (record.coverage_scope === 'unknown' && record.readiness !== 'blocked') fail(`${record.readiness_id}: unknown coverage may only remain on blocked records`);
}

for (const [country, deliveryNo] of targetCountries) {
  const records = recordsByCountry.get(country) ?? [];
  const expectedCount = expectedSystemCounts.get(country);
  if (records.length !== expectedCount) fail(`${country}: expected ${expectedCount} records; found ${records.length}`);
  for (const record of records) {
    if (record.country_tracker_delivery_no !== deliveryNo) fail(`${record.readiness_id}: delivery number mismatch`);
  }
}
for (const country of recordsByCountry.keys()) {
  if (!targetCountries.has(country)) fail(`backfill includes out-of-range country ${country}`);
}

const expectedBlocked = new Set([
  'morocco--sorec-racing-information-system--sorec-racing-and-racecourses',
  'mexico--mexico-candidate-route--hipodromo-site-candidate',
  'brazil--brazil-sorocaba-system--sorocaba-programme',
  'oman--oman-source-led-racing-system--oman-official-news-and-club-channel',
]);
const expectedLinkOnly = new Set([
  'japan--japan-nar-system--nar-monthly-convene-info',
  'japan--japan-banei-system--banei-official-schedule',
]);

for (const record of registry.records ?? []) {
  if (expectedBlocked.has(record.readiness_id) && record.readiness !== 'blocked') fail(`${record.readiness_id}: must remain blocked`);
  if (expectedLinkOnly.has(record.readiness_id) && record.readiness !== 'link_only') fail(`${record.readiness_id}: must remain link_only`);
  if (record.readiness === 'blocked' && !expectedBlocked.has(record.readiness_id)) fail(`${record.readiness_id}: unexpected blocked record`);
  if (record.readiness === 'link_only' && !expectedLinkOnly.has(record.readiness_id)) fail(`${record.readiness_id}: unexpected link-only record`);
}

for (const required of [
  'docs/timetable-source-tests/01-united-arab-emirates/backfill-summary.json',
  'docs/timetable-source-tests/04-morocco/pending-summary.json',
  'docs/timetable-source-tests/07-mexico/final-summary.json',
  'docs/timetable-source-tests/11-oman/final-summary.json',
]) {
  if (!fs.existsSync(path.join(root, required))) fail(`missing required source evidence: ${required}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('CALENDAR_READINESS_BACKFILL_01_20_VALID');
console.log('COUNTRIES_WITH_CLOSED_DECISION: 20');
console.log('READINESS_RECORDS: 30');
console.log('AUTHORITY_SOURCE_RECORDS: 31');
console.log('BLOCKED_RECORDS: 4');
console.log('LINK_ONLY_RECORDS: 2');
console.log('IMPLEMENTATION_STATUS: not_started=30');
