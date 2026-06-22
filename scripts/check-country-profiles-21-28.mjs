import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const parse = (p) => JSON.parse(read(p));
const errors = [];
const fail = (message) => errors.push(message);

const expected = [
  ['21', 'hungary', 'A', 'complete'],
  ['22', 'malta', 'C', 'complete'],
  ['23', 'austria', 'C', 'partial'],
  ['24', 'puerto-rico', 'A', 'complete'],
  ['25', 'jamaica', 'A', 'complete'],
  ['26', 'trinidad-and-tobago', 'A', 'complete'],
  ['27', 'barbados', 'A', 'complete'],
  ['28', 'martinique', 'C', 'partial']
];
const stageOrder = ['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'];

const countryPath = 'data/static/country-page-countries-21-28.json';
const sourcePath = 'data/static/country-page-sources-21-28.json';
for (const p of [countryPath, sourcePath, 'src/lib/data.ts', 'docs/country-pages/98-country-tracker.tsv']) {
  if (!fs.existsSync(path.join(root, p))) fail(`missing ${p}`);
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
if (sources.length !== 15) fail(`expected 15 source records; found ${sources.length}`);
if (countryIds.size !== countries.length) fail('country IDs must be unique');
if (sourceIds.size !== sources.length) fail('source IDs must be unique');

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-profiles-21-28-'));
try {
  for (const [deliveryNo, slug, ceiling, sourceStatus] of expected) {
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
    if (profile.country_id !== slug || profile.slug !== slug) fail(`${slug} profile identity mismatch`);
    if (profile.status !== 'reviewed') fail(`${slug} profile must be reviewed`);
    if (profile.page_kind !== 'country') fail(`${slug} page_kind must be country`);
    if (profile.last_reviewed !== '2026-06-19') fail(`${slug} last_reviewed must be 2026-06-19`);
    if (profile.public_display_ceiling !== ceiling) fail(`${slug} public ceiling must be ${ceiling}`);
    if (profile.source_test_status !== sourceStatus) fail(`${slug} source status must be ${sourceStatus}`);
    if (!Array.isArray(profile.systems) || profile.systems.length < 1) fail(`${slug} must contain a reviewed system`);
    for (const system of profile.systems ?? []) {
      for (const id of [...(system.organiser_source_ids ?? []), ...(system.distributor_source_ids ?? [])]) {
        if (!sourceIds.has(id)) fail(`${slug} references missing source ${id}`);
      }
    }

    const tempProfilePath = path.join(tempDirectory, `${deliveryNo}-${slug}.json`);
    fs.writeFileSync(tempProfilePath, `${JSON.stringify(profile, null, 2)}\n`);
    const result = spawnSync(process.execPath, ['scripts/check-country-profile-v2.mjs', tempProfilePath], {
      cwd: root,
      encoding: 'utf8'
    });
    if (result.status !== 0) fail(`${slug} schema validation failed: ${(result.stderr || result.stdout).trim()}`);
  }
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

for (const source of sources) {
  if (!countryIds.has(source.country_id)) fail(`source ${source.id} references missing country ${source.country_id}`);
  if (source.source_type !== 'official') fail(`source ${source.id} must be official`);
  if (source.data_type !== 'link_only') fail(`source ${source.id} must be link_only`);
}

const dataText = read('src/lib/data.ts');
for (let deliveryNo = 21; deliveryNo <= 28; deliveryNo += 1) {
  if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts must load delivery ${deliveryNo}`);
}
if (!dataText.includes('countryPageCountries2128')) fail('data.ts must load country records 21-28');
if (!dataText.includes('countryPageSources2128')) fail('data.ts must load source records 21-28');

const trackerLines = read('docs/country-pages/98-country-tracker.tsv').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const index = Object.fromEntries(headers.map((name, i) => [name, i]));
const rows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item[index.delivery_no] === deliveryNo);
  if (!row) {
    fail(`tracker missing delivery ${deliveryNo}`);
    continue;
  }
  if (row[index.slug] !== slug) fail(`tracker slug mismatch for ${deliveryNo}`);
  if (stageOrder.indexOf(row[index.programme_status]) < stageOrder.indexOf('profile_ready')) fail(`${slug} must be at least profile_ready`);
  if (row[index.note_status] !== 'reviewed') fail(`${slug} note must remain reviewed`);
  if (row[index.profile_status] !== 'reviewed') fail(`${slug} profile must be reviewed`);
  if (row[index.profile_last_reviewed] !== '2026-06-19') fail(`${slug} profile review date mismatch`);

  if (row[index.programme_status] === 'published') {
    if (row[index.en_route_status] !== 'published' || row[index.ja_route_status] !== 'published') fail(`${slug} published routes are required`);
    if (row[index.qa_status] !== 'passed') fail(`${slug} published QA must be passed`);
    if (!row[index.page_published_at]) fail(`${slug} published row requires page_published_at`);
  } else if (row[index.programme_status] === 'page_qa') {
    if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(`${slug} page-QA routes must be complete`);
    if (row[index.qa_status] !== 'pending') fail(`${slug} page-QA status must be pending`);
    if (row[index.page_published_at]) fail(`${slug} page-QA row must not have a publication date`);
  } else {
    if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(`${slug} profile-ready routes must be complete`);
    if (row[index.qa_status] !== 'not_started') fail(`${slug} profile-ready QA must be not_started`);
    if (row[index.page_published_at]) fail(`${slug} profile-ready row must not have a publication date`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PROFILES_21_28_VALID countries=8 sources=15 profiles=8 tracker=at_least_profile_ready');
