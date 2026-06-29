import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);
const registry = readJson('data/static/calendar-readiness-registry.json');
const inventory = readJson('data/static/authority-source-inventory.json');
const lines = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd().split(/\r?\n/);
const headers = lines.shift().split('\t');
const deliveryIndex = headers.indexOf('delivery_no');
const slugIndex = headers.indexOf('slug');
const rows = lines.map((line) => line.split('\t'));
const countries = new Map(rows.filter((row) => Number(row[deliveryIndex]) >= 37 && Number(row[deliveryIndex]) <= 52).map((row) => [row[slugIndex], row[deliveryIndex]]));
const expected = { malaysia:1, thailand:1, philippines:1, mauritius:1, argentina:1, germany:1, italy:2, spain:1, norway:2, finland:1, netherlands:1, switzerland:2, poland:1, romania:1, serbia:1, slovakia:1 };

if (registry.bootstrap_status !== 'complete') fail('bootstrap_status must be complete');
if (registry.programme_state?.countries_with_closed_decision !== 52) fail('closed country count must be 52');
if (registry.programme_state?.readiness_records !== 70 || registry.records?.length !== 70) fail('readiness count must be 70');
if (JSON.stringify(registry.programme_state?.next_backfill_work_ids ?? []) !== JSON.stringify(['WHR-ST2-53-60'])) fail('next_backfill_work_ids must point to WHR-ST2-53-60');
if (inventory.records?.length !== 70) fail('authority inventory count must be 70');

const authorityKeys = new Set((inventory.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
if (authorityKeys.size !== inventory.records?.length) fail('authority keys must be unique');
const targets = (registry.records ?? []).filter((record) => countries.has(record.country_id));
if (targets.length !== 19) fail(`target record count must be 19; found ${targets.length}`);

for (const [country, delivery] of countries) {
  const records = targets.filter((record) => record.country_id === country);
  if (records.length !== expected[country]) fail(`${country}: expected ${expected[country]} records; found ${records.length}`);
  for (const record of records) {
    if (record.country_tracker_delivery_no !== delivery) fail(`${record.readiness_id}: delivery mismatch`);
    if (!authorityKeys.has(record.authority_source_key)) fail(`${record.readiness_id}: missing authority key`);
    if ((record.racecourse_ids ?? []).length) fail(`${record.readiness_id}: unmigrated racecourse IDs are not allowed`);
    if (record.implementation_status !== 'not_started') fail(`${record.readiness_id}: implementation must remain not_started`);
  }
}

const countBy = (records) => records.reduce((counts, record) => ({ ...counts, [record.readiness]: (counts[record.readiness] ?? 0) + 1 }), {});
const targetCounts = countBy(targets);
if (targetCounts.prototype_ready !== 6 || targetCounts.manual_ready !== 13 || (targetCounts.link_only ?? 0) || (targetCounts.blocked ?? 0)) fail('target readiness mix must be prototype=6 manual=13 link=0 blocked=0');
const allCounts = countBy(registry.records ?? []);
if (allCounts.prototype_ready !== 35 || allCounts.manual_ready !== 27 || allCounts.blocked !== 4 || allCounts.link_only !== 4) fail('cumulative readiness mix is invalid');

for (let delivery = 37; delivery <= 52; delivery += 1) {
  const value = String(delivery);
  const row = rows.find((item) => item[deliveryIndex] === value);
  const ref = `docs/timetable-source-tests/${value}-${row?.[slugIndex]}/final-summary.json`;
  if (!fs.existsSync(path.join(root, ref))) fail(`missing evidence ${ref}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('CALENDAR_READINESS_BACKFILL_37_52_VALID countries=52 readiness=70 authority=70 target=19 prototype=6 manual=13');
