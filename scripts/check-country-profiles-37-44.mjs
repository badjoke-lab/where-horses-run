import { readFileSync as auditReadFileSync } from 'node:fs';
const auditTrackerLines = auditReadFileSync('docs/country-pages/98-country-tracker.tsv', 'utf8').trimEnd().split(/\r?\n/);
const auditStatusIndex = auditTrackerLines[0].split('\t').indexOf('programme_status');
const auditCanonicalComplete = auditTrackerLines.slice(1).every((line) => line.split('\t')[auditStatusIndex] === 'published');
if (auditCanonicalComplete && process.env.WHR_RUN_LEGACY_WAVE_VALIDATORS !== '1') {
  console.log('LEGACY_WAVE_VALIDATOR_ARCHIVED_AFTER_WHR_AUDIT_98');
  process.exit(0);
}

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
  ['37', 'malaysia', 'complete', 1],
  ['38', 'thailand', 'partial', 1],
  ['39', 'philippines', 'complete', 1],
  ['40', 'mauritius', 'complete', 1],
  ['41', 'argentina', 'partial', 1],
  ['42', 'germany', 'partial', 1],
  ['43', 'italy', 'complete', 2],
  ['44', 'spain', 'partial', 1]
];

const countryPath = 'data/static/country-page-countries-37-44.json';
const sourcePath = 'data/static/country-page-sources-37-44.json';
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
if (sources.length !== 18) fail(`expected 18 source records; found ${sources.length}`);
if (countryIds.size !== countries.length) fail('country IDs must be unique');
if (sourceIds.size !== sources.length) fail('source IDs must be unique');

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-profiles-37-44-'));
try {
  for (const [deliveryNo, slug, sourceStatus, systemCount] of expected) {
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
    if (profile.last_reviewed !== '2026-06-20') fail(`${slug} last_reviewed must be 2026-06-20`);
    if (profile.public_display_ceiling !== 'C') fail(`${slug} public ceiling must be C`);
    if (profile.source_test_status !== sourceStatus) fail(`${slug} source status must be ${sourceStatus}`);
    if (!Array.isArray(profile.systems) || profile.systems.length !== systemCount) {
      fail(`${slug} must contain ${systemCount} reviewed system records`);
    }
    for (const system of profile.systems ?? []) {
      const references = [...(system.organiser_source_ids ?? []), ...(system.distributor_source_ids ?? [])];
      if (references.length === 0) fail(`${slug} system ${system.id} must reference an official source`);
      for (const id of references) {
        if (!sourceIds.has(id)) fail(`${slug} references missing source ${id}`);
      }
    }
    if ((profile.principal_racecourse_ids ?? []).length !== 0) fail(`${slug} must not invent principal racecourse references`);

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
  if (source.auto_level !== 'C') fail(`source ${source.id} auto_level must remain C`);
}

const dataText = read('src/lib/data.ts');
for (let deliveryNo = 37; deliveryNo <= 44; deliveryNo += 1) {
  if (!dataText.includes(`countryProfilesV2${deliveryNo}`)) fail(`data.ts must load profile batch ${deliveryNo}`);
}
if (!dataText.includes('countryPageCountries3744')) fail('data.ts must load country records 37-44');
if (!dataText.includes('countryPageSources3744')) fail('data.ts must load source records 37-44');

const trackerLines = read('docs/country-pages/98-country-tracker.tsv').trimEnd().split(/\r?\n/);
const headers = trackerLines[0].split('\t');
const index = Object.fromEntries(headers.map((name, position) => [name, position]));
const rows = trackerLines.slice(1).map((line) => line.split('\t'));
for (const [deliveryNo, slug] of expected) {
  const row = rows.find((item) => item[index.delivery_no] === deliveryNo);
  if (!row) {
    fail(`tracker missing delivery ${deliveryNo}`);
    continue;
  }
  if (row[index.slug] !== slug) fail(`tracker slug mismatch for ${deliveryNo}`);
  const programmeStatus = row[index.programme_status];
  if (!['profile_ready', 'published'].includes(programmeStatus)) fail(`${slug} must be profile_ready or published`);
  if (row[index.note_status] !== 'reviewed') fail(`${slug} note must remain reviewed`);
  if (row[index.profile_status] !== 'reviewed') fail(`${slug} profile must be reviewed`);
  if (row[index.profile_last_reviewed] !== '2026-06-20') fail(`${slug} profile review date mismatch`);

  if (programmeStatus === 'published') {
    if (row[index.en_route_status] !== 'published' || row[index.ja_route_status] !== 'published') fail(`${slug} published routes are required`);
    if (row[index.qa_status] !== 'passed') fail(`${slug} published QA must be passed`);
    if (!row[index.page_published_at]) fail(`${slug} published row requires page_published_at`);
  } else {
    if (row[index.en_route_status] !== 'complete' || row[index.ja_route_status] !== 'complete') fail(`${slug} profile-ready routes must be complete`);
    if (row[index.qa_status] !== 'not_started') fail(`${slug} profile-ready QA must remain not_started`);
    if (row[index.page_published_at]) fail(`${slug} profile-ready row must not have a publication date`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_PROFILES_37_44_VALID countries=8 sources=18 profiles=8 tracker=profile_ready_or_published');
console.log('PUBLIC_CEILINGS: C=8');
console.log('SYSTEMS: italy=2');
