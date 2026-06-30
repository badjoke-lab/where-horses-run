import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const staticDirectory = path.join(root, 'data/static');

const profileFiles = fs.readdirSync(staticDirectory)
  .filter((name) => /^country-profiles-v2(?:-.*)?\.json$/.test(name))
  .sort();
const profiles = [];
for (const file of profileFiles) {
  const relativePath = `data/static/${file}`;
  try {
    const batch = JSON.parse(read(relativePath));
    if (!Array.isArray(batch)) fail(`${relativePath} must contain an array`);
    else profiles.push(...batch);
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

const seenCountryIds = new Set();
const seenSlugs = new Set();
const prohibitedKeys = new Set([
  'horse', 'horses', 'horse_name', 'horse_names',
  'jockey', 'jockeys', 'trainer', 'trainers', 'owner', 'owners',
  'odds', 'result', 'results', 'payout', 'payouts', 'prediction', 'predictions',
  'bet', 'bets', 'betting_tip', 'betting_tips', 'raw_html', 'raw_text',
  'stream_url', 'direct_stream_url'
]);

const inspectKeys = (value, location) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (prohibitedKeys.has(key)) fail(`prohibited profile field ${key} at ${location}`);
    inspectKeys(child, `${location}.${key}`);
  }
};

for (const [index, profile] of profiles.entries()) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    fail(`profile ${index} must be an object`);
    continue;
  }
  if (profile.schema_version !== '2.0.0') fail(`profile ${index} must use schema_version 2.0.0`);
  if (seenCountryIds.has(profile.country_id)) fail(`duplicate country_id: ${profile.country_id}`);
  if (seenSlugs.has(profile.slug)) fail(`duplicate slug: ${profile.slug}`);
  seenCountryIds.add(profile.country_id);
  seenSlugs.add(profile.slug);
  inspectKeys(profile, `profiles[${index}]`);
}

if (profiles.length !== 76) fail(`runtime must contain 76 profile-v2 records; found ${profiles.length}`);
for (const countryId of ['japan', 'hong-kong', 'malaysia', 'thailand', 'philippines', 'mauritius', 'argentina', 'germany', 'italy', 'spain', 'norway', 'finland', 'netherlands', 'switzerland', 'poland', 'romania', 'serbia', 'slovakia', 'cyprus', 'panama', 'kuwait', 'kenya', 'pakistan', 'ecuador', 'venezuela', 'belgium', 'slovenia', 'croatia', 'dominican-republic', 'tunisia', 'lebanon', 'libya', 'mainland-china', 'indonesia', 'russia', 'namibia', 'nigeria', 'belize', 'colombia', 'lithuania', 'estonia', 'guyana']) {
  if (!seenCountryIds.has(countryId)) fail(`missing profile-v2 record: ${countryId}`);
}

const runtimeText = read('src/lib/country-profile-runtime.ts');
if (!runtimeText.includes("profile_origin: 'v2'")) fail('runtime must mark v2 profiles');
if (!runtimeText.includes('return v2Profiles.map(adaptCountryProfileV2)')) fail('runtime must build from v2 profiles');
if (!runtimeText.includes('organiser_source_ids') || !runtimeText.includes('distributor_source_ids')) {
  fail('runtime must preserve source roles');
}

const dataText = read('src/lib/data.ts');
if (!dataText.includes('const allProfilesV2 = [')) fail('data.ts must combine profile-v2 batches');
if (!dataText.includes('buildCountryDetailProfiles(allProfilesV2)')) fail('data.ts must build the runtime profile collection');
for (let deliveryNo = 13; deliveryNo <= 76; deliveryNo += 1) {
  if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts must load profile batch ${deliveryNo}`);
}
for (const token of ['countryPageCountries3744', 'countryPageSources3744', 'countryPageCountries4552', 'countryPageSources4552', 'countryPageCountries5360', 'countryPageSources5360', 'countryPageCountries6168', 'countryPageSources6168', 'countryPageCountries6976', 'countryPageSources6976']) {
  if (!dataText.includes(token)) fail(`data.ts must load ${token}`);
}

const componentText = read('src/components/CountryDetailPage.astro');
if (!componentText.includes('getCountryProfileByCountryId(country.id)')) fail('CountryDetailPage must use the profile getter');
for (const routePath of ['src/pages/countries/[slug].astro', 'src/pages/ja/countries/[slug].astro']) {
  if (!read(routePath).includes('CountryDetailPage')) fail(`${routePath} must render CountryDetailPage`);
}

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-profile-v2-'));
try {
  profiles.forEach((profile, index) => {
    const tempFile = path.join(tempDirectory, `${String(index + 1).padStart(3, '0')}-${profile.slug}.json`);
    fs.writeFileSync(tempFile, `${JSON.stringify(profile, null, 2)}\n`);
    const result = spawnSync(process.execPath, ['scripts/check-country-profile-v2.mjs', tempFile], {
      cwd: root,
      encoding: 'utf8'
    });
    if (result.status !== 0) fail(`profile validation failed for ${profile.slug}: ${(result.stderr || result.stdout).trim()}`);
  });
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log(`COUNTRY_DETAIL_PROFILE_RUNTIME_VALID v2=${profiles.length} files=${profileFiles.length}`);
