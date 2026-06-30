import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

await import('./apply-profile-v2-85-92-loader.mjs');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const fail = (message) => errors.push(message);
const staticDir = path.join(root, 'data/static');
const files = fs.readdirSync(staticDir).filter((name) => /^country-profiles-v2(?:-.*)?\.json$/.test(name)).sort();
const profiles = [];

for (const file of files) {
  try {
    const batch = JSON.parse(read(`data/static/${file}`));
    if (!Array.isArray(batch)) fail(`${file}: array required`);
    else profiles.push(...batch);
  } catch (error) {
    fail(`${file}: invalid JSON: ${error.message}`);
  }
}

const countryIds = new Set();
const slugs = new Set();
for (const profile of profiles) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    fail('profile object required');
    continue;
  }
  if (profile.schema_version !== '2.0.0') fail(`${profile.slug || 'unknown'}: schema mismatch`);
  if (countryIds.has(profile.country_id)) fail(`duplicate country_id ${profile.country_id}`);
  if (slugs.has(profile.slug)) fail(`duplicate slug ${profile.slug}`);
  countryIds.add(profile.country_id);
  slugs.add(profile.slug);
}

if (profiles.length !== 92) fail(`runtime must contain 92 profiles; found ${profiles.length}`);
for (const countryId of ['ghana','saint-kitts-and-nevis','jordan','iraq','azerbaijan','mongolia','botswana','costa-rica']) {
  if (!countryIds.has(countryId)) fail(`missing profile ${countryId}`);
}

const runtime = read('src/lib/country-profile-runtime.ts');
if (!runtime.includes("profile_origin: 'v2'")) fail('runtime origin marker missing');
if (!runtime.includes('return v2Profiles.map(adaptCountryProfileV2)')) fail('runtime adapter collection missing');
if (!runtime.includes('organiser_source_ids') || !runtime.includes('distributor_source_ids')) fail('runtime source roles missing');

const data = read('src/lib/data.ts');
if (!data.includes('buildCountryDetailProfiles(allProfilesV2)')) fail('data runtime builder missing');
for (let deliveryNo = 13; deliveryNo <= 92; deliveryNo += 1) {
  if (!data.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts missing profile ${deliveryNo}`);
}
for (const token of ['countryPageCountries8592','countryPageSources8592']) {
  if (!data.includes(token)) fail(`data.ts missing ${token}`);
}

const component = read('src/components/CountryDetailPage.astro');
if (!component.includes('getCountryProfileByCountryId(country.id)')) fail('country detail profile lookup missing');
for (const route of ['src/pages/countries/[slug].astro','src/pages/ja/countries/[slug].astro']) {
  if (!read(route).includes('CountryDetailPage')) fail(`${route}: CountryDetailPage missing`);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-profile-v2-'));
try {
  profiles.forEach((profile, index) => {
    const target = path.join(temp, `${String(index + 1).padStart(3, '0')}-${profile.slug}.json`);
    fs.writeFileSync(target, `${JSON.stringify(profile, null, 2)}\n`);
    const result = spawnSync(process.execPath, ['scripts/check-country-profile-v2.mjs', target], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) fail(`${profile.slug}: ${(result.stderr || result.stdout).trim()}`);
  });
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log(`COUNTRY_DETAIL_PROFILE_RUNTIME_VALID v2=${profiles.length} files=${files.length}`);
await import('./check-country-profiles-85-92.mjs');
