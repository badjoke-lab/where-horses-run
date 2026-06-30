import { readFileSync as auditReadFileSync } from 'node:fs';
const auditTrackerLines = auditReadFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const auditStatusIndex = auditTrackerLines[0].split('\t').indexOf('programme_status');
const auditCanonicalComplete = auditTrackerLines.slice(1).every((line) => line.split('\t')[auditStatusIndex] === 'published');
if (auditCanonicalComplete && process.env.WHR_RUN_LEGACY_WAVE_VALIDATORS !== '1') {
  console.log('LEGACY_WAVE_VALIDATOR_ARCHIVED_AFTER_WHR_AUDIT_98');
  process.exit(0);
}

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['69','russia','partial','official-link-only'],
  ['70','namibia','partial','official-link-only'],
  ['71','nigeria','partial','official-link-only'],
  ['72','belize','complete','meeting-date-only'],
  ['73','colombia','partial','official-link-only'],
  ['74','lithuania','complete','meeting-date-only'],
  ['75','estonia','complete','meeting-date-only'],
  ['76','guyana','partial','official-link-only']
];

const countries = parse('data/static/country-page-countries-69-76.json');
const sources = parse('data/static/country-page-sources-69-76.json');
const countryIds = new Set(countries.map((item) => item.id));
const sourceIds = new Set(sources.map((item) => item.id));
if (countries.length !== 8 || countryIds.size !== 8) fail('country records must contain 8 unique entries');
if (sources.length !== 8 || sourceIds.size !== 8) fail('source records must contain 8 unique entries');
for (const country of countries) {
  if (country.auto_level !== 'C') fail(`${country.id}: auto_level must be C`);
  if (JSON.stringify(country.available_locales) !== JSON.stringify(['en','ja'])) fail(`${country.id}: locales must be en and ja`);
}
for (const source of sources) {
  if (!countryIds.has(source.country_id)) fail(`${source.id}: missing country ${source.country_id}`);
  if (source.source_type !== 'official' || source.data_type !== 'link_only' || source.auto_level !== 'C') fail(`${source.id}: source boundary mismatch`);
}

for (const [deliveryNo, slug, sourceStatus, timePattern] of expected) {
  const file = `data/static/country-profiles-v2-${deliveryNo}-${slug}.json`;
  if (!fs.existsSync(path.join(root,file))) {
    fail(`missing ${file}`);
    continue;
  }
  const batch = parse(file);
  if (!Array.isArray(batch) || batch.length !== 1) {
    fail(`${slug}: exactly one profile is required`);
    continue;
  }
  const profile = batch[0];
  if (profile.schema_version !== '2.0.0' || profile.country_id !== slug || profile.slug !== slug) fail(`${slug}: identity mismatch`);
  if (profile.status !== 'reviewed' || profile.page_kind !== 'country') fail(`${slug}: profile state mismatch`);
  if (profile.last_reviewed !== '2026-06-30') fail(`${slug}: review date mismatch`);
  if (profile.public_display_ceiling !== 'C') fail(`${slug}: public ceiling must be C`);
  if (profile.source_test_status !== sourceStatus) fail(`${slug}: source status mismatch`);
  if (!profile.hero?.summary_en || !profile.hero?.summary_ja) fail(`${slug}: bilingual hero required`);
  if (!profile.schedule?.time_patterns?.includes(timePattern)) fail(`${slug}: schedule boundary must include ${timePattern}`);
  if (!Array.isArray(profile.systems) || profile.systems.length !== 1) fail(`${slug}: exactly one system required`);
  for (const system of profile.systems ?? []) {
    const refs = [...(system.organiser_source_ids ?? []), ...(system.distributor_source_ids ?? [])];
    if (refs.length !== 1 || !sourceIds.has(refs[0])) fail(`${slug}: official source reference mismatch`);
  }
  if ((profile.principal_racecourse_ids ?? []).length !== 0) fail(`${slug}: racecourse IDs must remain empty`);
}

const dataText = read('src/lib/data.ts');
for (let deliveryNo = 69; deliveryNo <= 76; deliveryNo += 1) if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts must load profile batch ${deliveryNo}`);
for (const token of ['countryPageCountries6976','countryPageSources6976']) if (!dataText.includes(token)) fail(`data.ts must load ${token}`);

const lines = read('docs/country-pages/98-country-tracker.tsv').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) fail(`tracker mismatch for ${deliveryNo}-${slug}`);
  else {
    if (!['profile_ready','page_qa','published'].includes(row[index.programme_status])) fail(`${slug}: profile completion state required`);
    if (row[index.note_status] !== 'reviewed' || row[index.profile_status] !== 'reviewed') fail(`${slug}: note and profile must be reviewed`);
    if (row[index.profile_last_reviewed] !== '2026-06-30') fail(`${slug}: profile review date mismatch`);
    if (row[index.programme_status] === 'profile_ready') {
      if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(`${slug}: routes must be complete`);
      if (row[index.qa_status] !== 'not_started' || row[index.page_published_at]) fail(`${slug}: publication state must remain untouched`);
    }
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PROFILES_69_76_VALID countries=8 sources=8 profiles=8');
console.log('PUBLIC_CEILINGS: C=8');
await import('./check-country-profiles-77-84.mjs');
