import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const staticDirectory = path.join(root, 'data/static');
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const expected = [
  ['13', 'japan', 'A', 'partial'],
  ['14', 'hong-kong', 'A', 'complete'],
  ['15', 'new-zealand', 'A', 'partial'],
  ['16', 'south-africa', 'A', 'partial'],
  ['17', 'uruguay', 'C', 'complete'],
  ['18', 'sweden', 'C', 'complete'],
  ['19', 'denmark', 'C', 'partial'],
  ['20', 'czech-republic', 'C', 'partial']
];

const countryFiles = fs.readdirSync(staticDirectory)
  .filter((name) => name === 'countries.json' || /^country-page-countries-.*\.json$/.test(name))
  .sort();
const sourceFiles = fs.readdirSync(staticDirectory)
  .filter((name) => name === 'sources.json' || /^country-page-sources-.*\.json$/.test(name))
  .sort();
const racecourseFiles = fs.readdirSync(staticDirectory)
  .filter((name) => ['racecourses.json', 'racecourses-extensions.json'].includes(name) || /^country-page-racecourses-.*\.json$/.test(name))
  .sort();

const countries = countryFiles.flatMap((file) => readJson(`data/static/${file}`));
const sources = sourceFiles.flatMap((file) => readJson(`data/static/${file}`));
const racecourses = racecourseFiles.flatMap((file) => readJson(`data/static/${file}`));
const countryById = new Map(countries.map((entry) => [entry.id, entry]));
const sourceById = new Map();
const racecourseById = new Map();

for (const source of sources) {
  if (sourceById.has(source.id)) fail(`duplicate source id: ${source.id}`);
  sourceById.set(source.id, source);
}
for (const racecourse of racecourses) {
  const existing = racecourseById.get(racecourse.id);
  if (existing && existing.country_id !== racecourse.country_id) fail(`conflicting racecourse id: ${racecourse.id}`);
  if (!existing) racecourseById.set(racecourse.id, racecourse);
}

const prohibitedKeys = new Set([
  'horse', 'horses', 'horse_name', 'horse_names', 'jockey', 'jockeys',
  'trainer', 'trainers', 'owner', 'owners', 'odds', 'result', 'results',
  'payout', 'payouts', 'prediction', 'predictions', 'raw_html', 'raw_text',
  'stream_url', 'direct_stream_url'
]);
const inspectKeys = (value, location) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (prohibitedKeys.has(key)) fail(`prohibited field ${key} at ${location}`);
    inspectKeys(child, `${location}.${key}`);
  }
};

const profiles = new Map();
for (const [deliveryNo, slug, ceiling, sourceStatus] of expected) {
  const relativePath = `data/static/country-profiles-v2-${deliveryNo}-${slug}.json`;
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    continue;
  }
  const batch = readJson(relativePath);
  if (!Array.isArray(batch) || batch.length !== 1) {
    fail(`${relativePath} must contain exactly one profile`);
    continue;
  }
  const profile = batch[0];
  profiles.set(slug, profile);
  if (profile.country_id !== slug || profile.slug !== slug) fail(`${slug} profile identity mismatch`);
  if (profile.schema_version !== '2.0.0') fail(`${slug} must use schema_version 2.0.0`);
  if (profile.status !== 'reviewed') fail(`${slug} status must be reviewed`);
  if (profile.page_kind !== 'country') fail(`${slug} page_kind must be country`);
  if (profile.public_display_ceiling !== ceiling) fail(`${slug} public_display_ceiling must be ${ceiling}`);
  if (profile.source_test_status !== sourceStatus) fail(`${slug} source_test_status must be ${sourceStatus}`);
  if (!/^2026-06-(17|18)$/.test(profile.last_reviewed ?? '')) fail(`${slug} last_reviewed is invalid`);
  if (!countryById.has(slug)) fail(`${slug} is missing from country registries`);
  if (!Array.isArray(profile.systems) || profile.systems.length === 0) fail(`${slug} requires at least one racing system`);
  for (const system of profile.systems ?? []) {
    for (const sourceId of [...(system.organiser_source_ids ?? []), ...(system.distributor_source_ids ?? [])]) {
      const source = sourceById.get(sourceId);
      if (!source) fail(`${slug} has dangling source id: ${sourceId}`);
      else if (source.country_id !== slug) fail(`${slug} source country mismatch: ${sourceId}`);
    }
  }
  for (const racecourseId of profile.principal_racecourse_ids ?? []) {
    const racecourse = racecourseById.get(racecourseId);
    if (!racecourse) fail(`${slug} has dangling principal racecourse id: ${racecourseId}`);
    else if (racecourse.country_id !== slug) fail(`${slug} racecourse country mismatch: ${racecourseId}`);
  }
  inspectKeys(profile, slug);
}

if (profiles.size !== 8) fail(`expected 8 profiles; found ${profiles.size}`);

const dataText = fs.readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');
for (const [deliveryNo] of expected) {
  if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts does not load profile ${deliveryNo}`);
}
for (const file of [
  'countryPageCountries1520',
  'countryPageSources14HongKong',
  'countryPageSources15NewZealandHarness',
  'countryPageSources15NewZealandThoroughbred',
  'countryPageSources16SouthAfrica',
  'countryPageSources17Uruguay',
  'countryPageSources18Sweden',
  'countryPageSources19Denmark',
  'countryPageSources20CzechRepublic'
]) {
  if (!dataText.includes(file)) fail(`data.ts is missing ${file}`);
}
if (dataText.includes('legacyCountryProfiles')) fail('data.ts must not use legacy country profiles');

const runtimeText = fs.readFileSync(path.join(root, 'src/lib/country-profile-runtime.ts'), 'utf8');
if (runtimeText.includes('legacy-compat') || runtimeText.includes('adaptLegacyCountryProfile')) {
  fail('country profile runtime must be v2-only');
}

const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const trackerLines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const rows = trackerLines.slice(1).map((line) => {
  const values = line.split('\t');
  while (values.length < headers.length) values.push('');
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
});
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) fail(`tracker delivery ${deliveryNo} must be ${slug}`);
  if (row?.programme_status !== 'profile_ready') fail(`${slug} programme_status must be profile_ready`);
  if (row?.profile_status !== 'reviewed') fail(`${slug} profile_status must be reviewed`);
  if (row?.note_status !== 'reviewed') fail(`${slug} note_status must remain reviewed`);
  if (row?.en_route_status !== 'complete' || row?.ja_route_status !== 'complete') fail(`${slug} routes must be complete`);
  if (!row?.profile_last_reviewed) fail(`${slug} requires profile_last_reviewed`);
}

const counts = rows.reduce((result, row) => {
  result[row.programme_status] = (result[row.programme_status] ?? 0) + 1;
  return result;
}, {});
if ((counts.published ?? 0) !== 12) fail('tracker must contain 12 published rows');
if ((counts.profile_ready ?? 0) !== 8) fail('tracker must contain 8 profile_ready rows');
if ((counts.note_reviewed ?? 0) !== 0) fail('tracker must contain 0 note_reviewed rows');
if ((counts.not_started ?? 0) !== 78) fail('tracker must contain 78 not_started rows');

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_PROFILES_13_20_VALID');
console.log('PROFILE_V2_RECORDS: 8');
console.log('RUNTIME: v2-only; legacy compatibility removed');
console.log('TRACKER_COUNTS: published=12 profile_ready=8 not_started=78');
