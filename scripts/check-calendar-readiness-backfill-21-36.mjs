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

if (registry.bootstrap_status !== 'backfill_in_progress') fail('bootstrap_status must be backfill_in_progress');
if (registry.programme_state?.countries_with_closed_decision !== 36) fail('countries_with_closed_decision must be 36');
if (registry.programme_state?.readiness_records !== 51) fail('readiness_records must be 51');
if (JSON.stringify(registry.programme_state?.next_backfill_work_ids) !== JSON.stringify(['WHR-CAL-BACKFILL-37-52'])) {
  fail('next_backfill_work_ids must contain only WHR-CAL-BACKFILL-37-52');
}
if (!Array.isArray(registry.records) || registry.records.length !== 51) fail(`expected 51 readiness records; found ${registry.records?.length ?? 0}`);
if (!Array.isArray(authorityInventory.records) || authorityInventory.records.length !== 52) fail(`expected 52 authority records; found ${authorityInventory.records?.length ?? 0}`);

const authorityKeys = new Set((authorityInventory.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
if (authorityKeys.size !== (authorityInventory.records ?? []).length) fail('authority inventory contains duplicate compound keys');

const recordsByCountry = new Map();
const readinessCounts = new Map();
let notStarted = 0;
for (const record of registry.records ?? []) {
  if (!recordsByCountry.has(record.country_id)) recordsByCountry.set(record.country_id, []);
  recordsByCountry.get(record.country_id).push(record);
  readinessCounts.set(record.readiness, (readinessCounts.get(record.readiness) ?? 0) + 1);
  if (!authorityKeys.has(record.authority_source_key)) fail(`${record.readiness_id}: missing authority source key`);
  if (record.implementation_status !== 'not_started') fail(`${record.readiness_id}: implementation_status must remain not_started`);
  else notStarted += 1;
  if ((record.racecourse_ids ?? []).length !== 0) fail(`${record.readiness_id}: this backfill must not copy unmigrated Profile racecourse IDs`);
}

for (const [country, deliveryNo] of targetCountries) {
  const records = recordsByCountry.get(country) ?? [];
  const expectedCount = expectedSystemCounts.get(country);
  if (records.length !== expectedCount) fail(`${country}: expected ${expectedCount} records; found ${records.length}`);
  for (const record of records) {
    if (record.country_tracker_delivery_no !== deliveryNo) fail(`${record.readiness_id}: delivery number mismatch`);
  }
}

const targetRecords = (registry.records ?? []).filter((record) => targetCountries.has(record.country_id));
if (targetRecords.length !== 21) fail(`expected 21 target readiness records; found ${targetRecords.length}`);
const targetReadinessCounts = targetRecords.reduce((counts, record) => {
  counts[record.readiness] = (counts[record.readiness] ?? 0) + 1;
  return counts;
}, {});
if (targetReadinessCounts.prototype_ready !== 15) fail('entries 21-36 must contain 15 prototype_ready records');
if (targetReadinessCounts.manual_ready !== 4) fail('entries 21-36 must contain 4 manual_ready records');
if (targetReadinessCounts.link_only !== 2) fail('entries 21-36 must contain 2 link_only records');
if ((targetReadinessCounts.blocked ?? 0) !== 0) fail('entries 21-36 must not add blocked records');

const expectedLinkOnly = new Set([
  'india--india-rctc-system--rctc-home',
  'india--india-madras-race-club--madras-home',
]);
for (const record of targetRecords) {
  if (expectedLinkOnly.has(record.readiness_id) && record.readiness !== 'link_only') fail(`${record.readiness_id}: must remain link_only`);
  if (record.readiness === 'link_only' && !expectedLinkOnly.has(record.readiness_id)) fail(`${record.readiness_id}: unexpected link-only record`);
}

const expectedCumulative = {
  prototype_ready: 29,
  manual_ready: 14,
  blocked: 4,
  link_only: 4,
};
for (const [status, expected] of Object.entries(expectedCumulative)) {
  if ((readinessCounts.get(status) ?? 0) !== expected) fail(`cumulative ${status} must be ${expected}`);
}
if (notStarted !== 51) fail(`implementation_status not_started must be 51; found ${notStarted}`);

for (const deliveryNo of Array.from({ length: 16 }, (_, index) => String(index + 21))) {
  const row = trackerLines.map((line) => line.split('\t')).find((values) => values[deliveryIndex] === deliveryNo);
  const slug = row?.[slugIndex];
  const summaryPath = slug ? `docs/timetable-source-tests/${deliveryNo}-${slug}/final-summary.json` : null;
  if (!summaryPath || !fs.existsSync(path.join(root, summaryPath))) fail(`missing source-test summary for delivery ${deliveryNo}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('CALENDAR_READINESS_BACKFILL_21_36_VALID');
console.log('COUNTRIES_WITH_CLOSED_DECISION: 36');
console.log('READINESS_RECORDS: 51');
console.log('AUTHORITY_SOURCE_RECORDS: 52');
console.log('TARGET_RECORDS: 21');
console.log('TARGET_READINESS: prototype_ready=15 manual_ready=4 link_only=2 blocked=0');
console.log('CUMULATIVE_READINESS: prototype_ready=29 manual_ready=14 blocked=4 link_only=4');
console.log('IMPLEMENTATION_STATUS: not_started=51');
