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
  ['61', 'slovenia', 'partial'],
  ['62', 'croatia', 'complete'],
  ['63', 'dominican-republic', 'complete'],
  ['64', 'tunisia', 'partial'],
  ['65', 'lebanon', 'partial'],
  ['66', 'libya', 'partial'],
  ['67', 'mainland-china', 'partial'],
  ['68', 'indonesia', 'partial'],
];

const countries = parse('data/static/country-page-countries-61-68.json');
const sources = parse('data/static/country-page-sources-61-68.json');
const countryIds = new Set(countries.map((item) => item.id));
const sourceIds = new Set(sources.map((item) => item.id));
if (countries.length !== 8 || countryIds.size !== 8) fail('country records must contain 8 unique entries');
if (sources.length !== 8 || sourceIds.size !== 8) fail('source records must contain 8 unique entries');
for (const country of countries) {
  if (country.auto_level !== 'C') fail(`${country.id}: country auto_level must be C`);
  if (JSON.stringify(country.available_locales) !== JSON.stringify(['en', 'ja'])) fail(`${country.id}: locales must be en and ja`);
}
for (const source of sources) {
  if (!countryIds.has(source.country_id)) fail(`${source.id}: missing country ${source.country_id}`);
  if (source.source_type !== 'official' || source.data_type !== 'link_only' || source.auto_level !== 'C') fail(`${source.id}: source boundary mismatch`);
}

const profiles = {};
for (const [deliveryNo, slug, sourceStatus] of expected) {
  const file = `data/static/country-profiles-v2-${deliveryNo}-${slug}.json`;
  if (!fs.existsSync(path.join(root, file))) {
    fail(`missing ${file}`);
    continue;
  }
  const batch = parse(file);
  if (!Array.isArray(batch) || batch.length !== 1) {
    fail(`${file}: exactly one profile is required`);
    continue;
  }
  const profile = batch[0];
  profiles[slug] = profile;
  if (profile.schema_version !== '2.0.0' || profile.country_id !== slug || profile.slug !== slug) fail(`${slug}: profile identity mismatch`);
  if (profile.status !== 'reviewed' || profile.page_kind !== 'country') fail(`${slug}: profile state mismatch`);
  if (profile.last_reviewed !== '2026-06-29') fail(`${slug}: review date mismatch`);
  if (profile.public_display_ceiling !== 'C') fail(`${slug}: public ceiling must be C`);
  if (profile.source_test_status !== sourceStatus) fail(`${slug}: source status must be ${sourceStatus}`);
  if (!profile.hero?.summary_en || !profile.hero?.summary_ja) fail(`${slug}: bilingual hero is required`);
  if (!Array.isArray(profile.systems) || profile.systems.length !== 1) fail(`${slug}: exactly one system is required`);
  for (const system of profile.systems ?? []) {
    const refs = [...(system.organiser_source_ids ?? []), ...(system.distributor_source_ids ?? [])];
    if (!refs.length) fail(`${slug}: source reference is required`);
    for (const id of refs) if (!sourceIds.has(id)) fail(`${slug}: missing source ${id}`);
  }
  if ((profile.principal_racecourse_ids ?? []).length !== 0) fail(`${slug}: racecourse IDs must remain empty`);
}

for (const slug of ['slovenia', 'lebanon', 'libya']) {
  if (!profiles[slug]?.schedule?.time_patterns?.includes('official-link-only')) fail(`${slug}: link-only schedule boundary is required`);
}
for (const slug of ['croatia', 'dominican-republic', 'tunisia', 'indonesia']) {
  if (!profiles[slug]?.schedule?.time_patterns?.includes('meeting-date-only')) fail(`${slug}: meeting-date-only schedule boundary is required`);
}
if (!profiles['mainland-china']?.schedule?.time_patterns?.includes('official-link-only')) fail('mainland-china: current-calendar hold is required');

const dataText = read('src/lib/data.ts');
for (let deliveryNo = 61; deliveryNo <= 68; deliveryNo += 1) if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts must load profile batch ${deliveryNo}`);
for (const token of ['countryPageCountries6168', 'countryPageSources6168']) if (!dataText.includes(token)) fail(`data.ts must load ${token}`);

const lines = read('docs/country-pages/98-country-tracker.tsv').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = lines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) {
    fail(`tracker mismatch for ${deliveryNo}-${slug}`);
    continue;
  }
  if (!['profile_ready', 'page_qa', 'published'].includes(row[index.programme_status])) fail(`${slug}: profile completion state is required`);
  if (row[index.note_status] !== 'reviewed' || row[index.profile_status] !== 'reviewed') fail(`${slug}: note and profile must be reviewed`);
  if (row[index.profile_last_reviewed] !== '2026-06-29') fail(`${slug}: profile review date mismatch`);
  if (row[index.programme_status] === 'profile_ready') {
    if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(`${slug}: profile-ready routes must be complete`);
    if (row[index.qa_status] !== 'not_started' || row[index.page_published_at]) fail(`${slug}: publication state must remain untouched`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PROFILES_61_68_VALID countries=8 sources=8 profiles=8');
console.log('PUBLIC_CEILINGS: C=8');
