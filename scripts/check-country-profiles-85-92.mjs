import fs from 'node:fs';
import path from 'node:path';

await import('./apply-profile-v2-85-92-loader.mjs');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['85','ghana','partial','official-link-only'],
  ['86','saint-kitts-and-nevis','partial','official-link-only'],
  ['87','jordan','partial','official-link-only'],
  ['88','iraq','partial','official-link-only'],
  ['89','azerbaijan','partial','official-link-only'],
  ['90','mongolia','complete','meeting-date-only'],
  ['91','botswana','complete','meeting-date-only'],
  ['92','costa-rica','partial','official-link-only']
];

const countries = parse('data/static/country-page-countries-85-92.json');
const sources = parse('data/static/country-page-sources-85-92.json');
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
  if (!source.url?.startsWith('https://')) fail(`${source.id}: official URL must use https`);
}

for (const [deliveryNo, slug, sourceStatus, timePattern] of expected) {
  const file = `data/static/country-profiles-v2-${deliveryNo}-${slug}.json`;
  if (!fs.existsSync(path.join(root, file))) { fail(`missing ${file}`); continue; }
  const batch = parse(file);
  if (!Array.isArray(batch) || batch.length !== 1) { fail(`${slug}: exactly one profile is required`); continue; }
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
for (let deliveryNo = 85; deliveryNo <= 92; deliveryNo += 1) if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts must load profile batch ${deliveryNo}`);
for (const token of ['countryPageCountries8592','countryPageSources8592']) if (!dataText.includes(token)) fail(`data.ts must load ${token}`);

function parseTsv(file) {
  const lines = read(file).trimEnd().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.filter(Boolean).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] ?? ''])));
}
const trackerRows = parseTsv('docs/country-pages/98-country-tracker.tsv');
const trackerByDelivery = new Map(trackerRows.map((row) => [row.delivery_no, row]));
for (const file of [
  'docs/country-pages/98-country-tracker-transitions.tsv',
  'docs/country-pages/98-country-source-test-transitions-77-84.tsv',
  'docs/country-pages/98-country-note-transitions-77-84.tsv',
  'docs/country-pages/98-country-profile-transitions-77-84.tsv',
  'docs/country-pages/98-country-publication-transitions-77-84.tsv',
  'docs/country-pages/98-country-source-test-transitions-85-92.tsv',
  'docs/country-pages/98-country-note-transitions-85-92.tsv',
  'docs/country-pages/98-country-profile-transitions-85-92.tsv'
]) {
  for (const change of parseTsv(file)) {
    const row = trackerByDelivery.get(change.delivery_no);
    if (!row) { fail(`${file}: unknown delivery ${change.delivery_no}`); continue; }
    for (const [field, value] of Object.entries(change)) if (field !== 'delivery_no' && value !== '') row[field] = value;
  }
}
for (const [deliveryNo, slug] of expected) {
  const row = trackerByDelivery.get(deliveryNo);
  if (!row || row.slug !== slug) fail(`tracker mismatch for ${deliveryNo}-${slug}`);
  else {
    if (row.programme_status !== 'profile_ready') fail(`${slug}: profile_ready state required`);
    if (row.note_status !== 'reviewed' || row.profile_status !== 'reviewed') fail(`${slug}: note and profile must be reviewed`);
    if (row.profile_last_reviewed !== '2026-06-30') fail(`${slug}: profile review date mismatch`);
    if (row.en_route_status !== 'complete' || row.ja_route_status !== 'complete') fail(`${slug}: routes must be complete`);
    if (row.qa_status !== 'not_started' || row.page_published_at) fail(`${slug}: publication state must remain untouched`);
  }
}
const counts = {};
for (const row of trackerByDelivery.values()) counts[row.programme_status] = (counts[row.programme_status] || 0) + 1;
if (counts.published !== 84 || counts.profile_ready !== 8 || counts.not_started !== 6) fail(`effective programme counts mismatch ${JSON.stringify(counts)}`);

if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
console.log('COUNTRY_PROFILES_85_92_VALID countries=8 sources=8 profiles=8');
console.log('PROGRAMME_COUNTS published=84 profile_ready=8 not_started=6');
console.log('PUBLIC_CEILINGS C=8');
