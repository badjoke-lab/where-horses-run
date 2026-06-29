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
const trackerRows = trackerLines.map((line) => line.split('\t'));
const targetCountries = new Map(
  trackerRows
    .filter((row) => Number(row[deliveryIndex]) >= 21 && Number(row[deliveryIndex]) <= 36)
    .map((row) => [row[slugIndex], row[deliveryIndex]])
);

const expectedSystemCounts = new Map(Object.entries({
  hungary: 1,
  malta: 1,
  austria: 1,
  'puerto-rico': 1,
  jamaica: 1,
  'trinidad-and-tobago': 1,
  barbados: 1,
  martinique: 1,
  'united-kingdom': 1,
  'united-states': 1,
  australia: 1,
  ireland: 1,
  france: 2,
  canada: 2,
  'saudi-arabia': 1,
  india: 4,
}));

if (!['backfill_in_progress', 'complete_01_52', 'complete', 'revalidation_required'].includes(registry.bootstrap_status)) {
  fail(`unexpected bootstrap_status: ${registry.bootstrap_status}`);
}
if (!Array.isArray(registry.records)) fail('registry.records must be an array');
if (registry.programme_state?.readiness_records !== registry.records?.length) {
  fail('programme_state.readiness_records must match the registry length');
}
if ((registry.programme_state?.countries_with_closed_decision ?? 0) < 36) {
  fail('countries_with_closed_decision must be at least 36');
}

const authorityKeys = new Set((authorityInventory.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
if (authorityKeys.size !== (authorityInventory.records ?? []).length) fail('authority inventory contains duplicate compound keys');
if ((authorityInventory.records ?? []).length < 52) fail('authority inventory must retain at least the 52 records established through entry 36');

const targetRecords = (registry.records ?? []).filter((record) => targetCountries.has(record.country_id));
if (targetRecords.length !== 21) fail(`entries 21-36 must retain 21 readiness records; found ${targetRecords.length}`);

const recordsByCountry = new Map();
for (const record of targetRecords) {
  if (!recordsByCountry.has(record.country_id)) recordsByCountry.set(record.country_id, []);
  recordsByCountry.get(record.country_id).push(record);
  if (!authorityKeys.has(record.authority_source_key)) fail(`${record.readiness_id}: missing authority source key`);
  if ((record.racecourse_ids ?? []).length !== 0) fail(`${record.readiness_id}: entries 21-36 must not copy unmigrated Profile racecourse IDs`);
}

for (const [country, deliveryNo] of targetCountries) {
  const records = recordsByCountry.get(country) ?? [];
  const expectedCount = expectedSystemCounts.get(country);
  if (records.length !== expectedCount) fail(`${country}: expected ${expectedCount} records; found ${records.length}`);
  for (const record of records) {
    if (record.country_tracker_delivery_no !== deliveryNo) fail(`${record.readiness_id}: delivery number mismatch`);
  }
}

const targetReadinessCounts = targetRecords.reduce((counts, record) => {
  counts[record.readiness] = (counts[record.readiness] ?? 0) + 1;
  return counts;
}, {});
if (targetReadinessCounts.prototype_ready !== 15) fail('entries 21-36 must retain 15 prototype_ready records');
if (targetReadinessCounts.manual_ready !== 4) fail('entries 21-36 must retain 4 manual_ready records');
if (targetReadinessCounts.link_only !== 2) fail('entries 21-36 must retain 2 link_only records');
if ((targetReadinessCounts.blocked ?? 0) !== 0) fail('entries 21-36 must not contain blocked records');

const expectedLinkOnly = new Set([
  'india--india-rctc-system--rctc-home',
  'india--india-madras-race-club--madras-home',
]);
for (const record of targetRecords) {
  if (expectedLinkOnly.has(record.readiness_id) && record.readiness !== 'link_only') fail(`${record.readiness_id}: must remain link_only`);
  if (record.readiness === 'link_only' && !expectedLinkOnly.has(record.readiness_id)) fail(`${record.readiness_id}: unexpected link-only record`);
}

for (const deliveryNo of Array.from({ length: 16 }, (_, index) => String(index + 21))) {
  const row = trackerRows.find((values) => values[deliveryIndex] === deliveryNo);
  const slug = row?.[slugIndex];
  const summaryPath = slug ? `docs/timetable-source-tests/${deliveryNo}-${slug}/final-summary.json` : null;
  if (!summaryPath || !fs.existsSync(path.join(root, summaryPath))) fail(`missing source-test summary for delivery ${deliveryNo}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('CALENDAR_READINESS_BACKFILL_21_36_VALID');
console.log('TARGET_COUNTRIES: 16');
console.log('TARGET_READINESS_RECORDS: 21');
console.log('TARGET_READINESS: prototype_ready=15 manual_ready=4 link_only=2 blocked=0');
console.log(`CUMULATIVE_READINESS_RECORDS: ${registry.records.length}`);
