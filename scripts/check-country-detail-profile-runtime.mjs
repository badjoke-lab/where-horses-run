import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
};

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const staticDirectory = path.join(root, 'data/static');
const profileFiles = fs.readdirSync(staticDirectory)
  .filter((name) => /^country-profiles-v2(?:-.*)?\.json$/.test(name))
  .sort();
const requiredPaths = [
  'data/static/country-profiles-v2.json',
  'src/lib/country-profile-runtime.ts',
  'src/lib/data.ts',
  'src/components/CountryDetailPage.astro',
  'src/pages/countries/[slug].astro',
  'src/pages/ja/countries/[slug].astro'
];

for (const relativePath of requiredPaths) {
  if (!fs.existsSync(path.join(root, relativePath))) fail(`missing ${relativePath}`);
}
if (!profileFiles.length) fail('no country-profile-v2 batch files found');
if (process.exitCode) process.exit(process.exitCode);

const profiles = [];
for (const file of profileFiles) {
  const relativePath = `data/static/${file}`;
  try {
    const batch = JSON.parse(read(relativePath));
    if (!Array.isArray(batch)) {
      fail(`${relativePath} must contain an array`);
      continue;
    }
    profiles.push(...batch);
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

const runtimeText = read('src/lib/country-profile-runtime.ts');
const allowlistMatch = runtimeText.match(/LEGACY_COUNTRY_PROFILE_COMPATIBILITY_IDS\s*=\s*\[([^\]]*)\]\s*as const/);
if (!allowlistMatch) {
  fail('runtime must declare the legacy compatibility allowlist');
} else {
  const ids = [...allowlistMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
  if (JSON.stringify(ids) !== JSON.stringify(['japan', 'hong-kong'])) {
    fail(`legacy compatibility allowlist must be exactly japan and hong-kong; found ${ids.join(', ')}`);
  }
}

const v2AdaptPosition = runtimeText.indexOf('const adaptedV2Profiles = v2Profiles.map(adaptCountryProfileV2)');
const compatibilityPosition = runtimeText.indexOf('const compatibilityProfiles = legacyProfiles');
if (v2AdaptPosition < 0 || compatibilityPosition < 0 || v2AdaptPosition > compatibilityPosition) {
  fail('runtime must adapt v2 profiles before evaluating legacy compatibility profiles');
}
if (!runtimeText.includes("profile_origin: 'v2'")) fail('runtime must mark v2 profiles');
if (!runtimeText.includes("profile_origin: 'legacy-compat'")) fail('runtime must mark legacy compatibility profiles');
if (!runtimeText.includes('!v2CountryIds.has(countryId)')) fail('a v2 profile must override the legacy compatibility record');
if (!runtimeText.includes('organiser_source_ids') || !runtimeText.includes('distributor_source_ids')) {
  fail('runtime must preserve organiser and distributor source roles');
}

const dataText = read('src/lib/data.ts');
if (!dataText.includes("import countryProfilesV2 from '../../data/static/country-profiles-v2.json'")) {
  fail('data.ts must import the canonical v2 collection');
}
if (!dataText.includes('const allProfilesV2 = [')) fail('data.ts must combine profile-v2 batches');
if (!dataText.includes('buildCountryDetailProfiles(allProfilesV2, legacyCountryProfiles)')) {
  fail('data.ts must build the runtime profile collection from all v2 batches first');
}
if (!dataText.includes('return countryProfiles.find((profile) => profile.country_id === countryId)')) {
  fail('country profile lookup must use the normalized runtime collection');
}

const componentText = read('src/components/CountryDetailPage.astro');
if (!componentText.includes('getCountryProfileByCountryId(country.id)')) {
  fail('CountryDetailPage must obtain its profile through the normalized data getter');
}
if (componentText.includes("from '../../data/static/country-profiles")) {
  fail('CountryDetailPage must not import a profile JSON file directly');
}

for (const routePath of ['src/pages/countries/[slug].astro', 'src/pages/ja/countries/[slug].astro']) {
  const routeText = read(routePath);
  if (!routeText.includes('CountryDetailPage')) fail(`${routePath} must render the shared CountryDetailPage`);
}

if (profiles.length > 0) {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-profile-v2-'));
  try {
    profiles.forEach((profile, index) => {
      const tempFile = path.join(tempDirectory, `${String(index + 1).padStart(3, '0')}-${profile.slug}.json`);
      fs.writeFileSync(tempFile, `${JSON.stringify(profile, null, 2)}\n`);
      const result = spawnSync(process.execPath, ['scripts/check-country-profile-v2.mjs', tempFile], {
        cwd: root,
        encoding: 'utf8'
      });
      if (result.status !== 0) {
        fail(`v2 profile validation failed for ${profile.slug}: ${(result.stderr || result.stdout).trim()}`);
      }
    });
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
}

if (!process.exitCode) {
  console.log(`COUNTRY_DETAIL_PROFILE_RUNTIME_VALID v2=${profiles.length} files=${profileFiles.length} legacy_compat=2`);
}
