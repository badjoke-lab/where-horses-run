import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const parse = (relativePath) => JSON.parse(read(relativePath));
const errors = [];
const fail = (message) => errors.push(message);

const expected = [
  ['53', 'cyprus', 'complete'],
  ['54', 'panama', 'partial'],
  ['55', 'kuwait', 'partial'],
  ['56', 'kenya', 'partial'],
  ['57', 'pakistan', 'partial'],
  ['58', 'ecuador', 'partial'],
  ['59', 'venezuela', 'partial'],
  ['60', 'belgium', 'complete'],
];

const countryPath = 'data/static/country-page-countries-53-60.json';
const sourcePath = 'data/static/country-page-sources-53-60.json';
for (const relativePath of [countryPath, sourcePath, 'src/lib/data.ts', 'docs/country-pages/98-country-tracker.tsv']) {
  if (!fs.existsSync(path.join(root, relativePath))) fail(`missing ${relativePath}`);
}
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

const countries = parse(countryPath);
const sources = parse(sourcePath);
const countryIds = new Set(countries.map((item) => item.id));
const sourceIds = new Set(sources.map((item) => item.id));
if (countries.length !== 8) fail(`expected 8 country records; found ${countries.length}`);
if (sources.length !== 8) fail(`expected 8 source records; found ${sources.length}`);
if (countryIds.size !== countries.length) fail('country IDs must be unique');
if (sourceIds.size !== sources.length) fail('source IDs must be unique');

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-profiles-53-60-'));
try {
  for (const [deliveryNo, slug, sourceStatus] of expected) {
    if (!countryIds.has(slug)) fail(`missing country record ${slug}`);
    const profilePath = `data/static/country-profiles-v2-${deliveryNo}-${slug}.json`;
    if (!fs.existsSync(path.join(root, profilePath))) {
      fail(`missing ${profilePath}`);
      continue;
    }
    const batch = parse(profilePath);
    if (!Array.isArray(batch) || batch.length !== 1) {
      fail(`${profilePath} must contain exactly one profile`);
      continue;
    }
    const profile = batch[0];
    if (profile.country_id !== slug || profile.slug !== slug) fail(`${slug}: profile identity mismatch`);
    if (profile.status !== 'reviewed' || profile.page_kind !== 'country') fail(`${slug}: profile must be a reviewed country page`);
    if (profile.last_reviewed !== '2026-06-29') fail(`${slug}: review date mismatch`);
    if (profile.public_display_ceiling !== 'C') fail(`${slug}: public ceiling must remain C`);
    if (profile.source_test_status !== sourceStatus) fail(`${slug}: source status must be ${sourceStatus}`);
    if (!Array.isArray(profile.systems) || profile.systems.length !== 1) fail(`${slug}: exactly one reviewed system is required`);
    for (const system of profile.systems ?? []) {
      const references = [...(system.organiser_source_ids ?? []), ...(system.distributor_source_ids ?? [])];
      if (references.length === 0) fail(`${slug}: system must reference an official source`);
      for (const id of references) if (!sourceIds.has(id)) fail(`${slug}: missing source ${id}`);
    }
    if ((profile.principal_racecourse_ids ?? []).length !== 0) fail(`${slug}: principal racecourse IDs must remain empty pending inventory migration`);

    const tempProfilePath = path.join(tempDirectory, `${deliveryNo}-${slug}.json`);
    fs.writeFileSync(tempProfilePath, `${JSON.stringify(profile, null, 2)}\n`);
    const result = spawnSync(process.execPath, ['scripts/check-country-profile-v2.mjs', tempProfilePath], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) fail(`${slug}: schema validation failed: ${(result.stderr || result.stdout).trim()}`);
  }
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

for (const source of sources) {
  if (!countryIds.has(source.country_id)) fail(`source ${source.id} references missing country ${source.country_id}`);
  if (source.source_type !== 'official') fail(`source ${source.id} must be official`);
  if (source.data_type !== 'link_only') fail(`source ${source.id} must be link_only`);
  if (source.auto_level !== 'C') fail(`source ${source.id} auto_level must remain C`);
}

const profiles = Object.fromEntries(expected.map(([deliveryNo, slug]) => [slug, parse(`data/static/country-profiles-v2-${deliveryNo}-${slug}.json`)[0]]));
if (!profiles.kuwait.schedule.time_patterns.includes('official-link-only')) fail('kuwait must remain official-link-only');
if (!profiles.pakistan.schedule.time_patterns.includes('official-link-only')) fail('pakistan must remain official-link-only');
if (!profiles.venezuela.calendar_guidance_en.includes('Do not create current meeting rows')) fail('venezuela must remain blocked for current-calendar rows');
if (profiles.belgium.public_display_ceiling !== 'C' || !profiles.belgium.schedule.time_patterns.includes('meeting-date-only')) fail('belgium must retain C-level country output');

const dataText = read('src/lib/data.ts');
for (let deliveryNo = 53; deliveryNo <= 60; deliveryNo += 1) {
  if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts must load profile batch ${deliveryNo}`);
}
if (!dataText.includes('countryPageCountries5360')) fail('data.ts must load country records 53-60');
if (!dataText.includes('countryPageSources5360')) fail('data.ts must load source records 53-60');

const trackerLines = read('docs/country-pages/98-country-tracker.tsv').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item[index.delivery_no] === deliveryNo);
  if (!row || row[index.slug] !== slug) {
    fail(`tracker mismatch for ${deliveryNo}-${slug}`);
    continue;
  }
  if (!['profile_ready', 'published'].includes(row[index.programme_status])) fail(`${slug}: must be profile_ready or published`);
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
console.log('COUNTRY_PROFILES_53_60_VALID countries=8 sources=8 profiles=8 tracker=profile_ready_or_published');
console.log('PUBLIC_CEILINGS: C=8');
console.log('BOUNDARIES: link_only=kuwait,pakistan blocked_calendar=venezuela technical_A_public_C=belgium');
