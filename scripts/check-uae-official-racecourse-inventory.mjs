import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (error) {
    fail(`${relativePath}: could not read valid JSON: ${error.message}`);
    return null;
  }
}

function walkFiles(relativeDir) {
  const fullDir = path.join(root, relativeDir);
  if (!existsSync(fullDir)) return [];

  const files = [];
  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(relativePath));
    else files.push(relativePath);
  }
  return files;
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function venueConcept(row) {
  const text = normalize(`${row?.racecourse_id ?? ''} ${row?.name ?? ''}`);
  if (text.includes('meydan')) return 'Meydan';
  if (text.includes('jebel ali')) return 'Jebel Ali';
  if (text.includes('abu dhabi')) return 'Abu Dhabi';
  if (text.includes('sharjah')) return 'Sharjah';
  if (text.includes('al ain')) return 'Al Ain';
  return null;
}

const inventory = readJson('data/static/country-racing-inventory.json');
const countries = inventory?.countries ?? [];
const uae = countries.find((country) => country.country_id === 'united-arab-emirates');

if (!uae) {
  fail('country-racing-inventory must include country_id united-arab-emirates');
} else {
  if (uae.overall_coverage_status === 'complete') fail('UAE overall_coverage_status must not be complete');
  if (uae.overall_coverage_status === 'broad') fail('UAE overall_coverage_status must not be broad');

  for (const claim of ['UAE complete', 'UAE active calendar covered', 'UAE 30-day calendar covered']) {
    if (!(uae.must_not_claim ?? []).includes(claim)) {
      fail(`UAE must_not_claim must include: ${claim}`);
    }
  }

  const era = (uae.racing_systems ?? []).find((system) => system.system_id === 'era');
  if (!era) {
    fail('UAE must include ERA racing system with system_id era');
  } else {
    const racecourses = era.racecourses ?? [];
    const conceptCounts = new Map();
    for (const racecourse of racecourses) {
      const concept = venueConcept(racecourse);
      if (!concept) {
        fail(`Unexpected UAE / ERA racecourse concept: ${JSON.stringify(racecourse)}`);
        continue;
      }
      conceptCounts.set(concept, (conceptCounts.get(concept) ?? 0) + 1);
    }

    const expectedConcepts = ['Meydan', 'Jebel Ali', 'Abu Dhabi', 'Sharjah', 'Al Ain'];
    for (const concept of expectedConcepts) {
      const count = conceptCounts.get(concept) ?? 0;
      if (count !== 1) fail(`UAE / ERA must include exactly one ${concept} venue concept; found ${count}`);
    }
    if (racecourses.length !== expectedConcepts.length) {
      fail(`UAE / ERA must include exactly ${expectedConcepts.length} official evidence-backed venue concepts; found ${racecourses.length}`);
    }

    const ids = new Set(racecourses.map((racecourse) => racecourse.racecourse_id));
    if (!ids.has('jebel-ali-racecourse')) fail('Jebel Ali Racecourse must no longer be missing from UAE / ERA inventory');
    if (!ids.has('sharjah-racecourse')) fail('Sharjah Racecourse / Sharjah Longines Racecourse must no longer be missing from UAE / ERA inventory');

    const abuDhabi = racecourses.find((racecourse) => venueConcept(racecourse) === 'Abu Dhabi');
    const abuDhabiNotes = normalize(abuDhabi?.notes);
    for (const term of ['naming', 'normalization', 'review', 'abu dhabi turf club', 'abu dhabi equestrian club']) {
      if (!abuDhabiNotes.includes(term)) fail(`Abu Dhabi racecourse notes must mention ${term}`);
    }

    if (era.coverage_status === 'complete') fail('UAE / ERA coverage_status must not be complete');
    if (era.coverage_status === 'broad') fail('UAE / ERA coverage_status must not be broad');

    const coverageNotes = normalize(era.coverage_notes);
    for (const term of ['official', 'evidence', 'missing', 'correct', 'jebel ali', 'sharjah', 'season gap']) {
      if (!coverageNotes.includes(term)) fail(`UAE / ERA coverage_notes must mention ${term}`);
    }
  }
}

for (const relativePath of [
  'data/candidates/uae-era-candidates.json',
  'data/candidates/uae-active-window-approved-candidates.json'
]) {
  const file = readJson(relativePath);
  if (!file) continue;
  if (file.country_id !== 'united-arab-emirates') fail(`${relativePath}: country_id must remain united-arab-emirates`);
  if ((file.records ?? []).length !== 0) fail(`${relativePath}: no candidate timetable records should be added for PR-083`);
  const text = normalize(readFileSync(path.join(root, relativePath), 'utf8'));
  if (!text.includes('season gap')) fail(`${relativePath}: empty active-window state must retain season-gap wording`);
  if (!text.includes('no active window')) fail(`${relativePath}: empty active-window state must retain no active-window wording`);
  if (file.review?.promotion_target !== null) fail(`${relativePath}: empty UAE bundle must not set a public overlay promotion target`);
}

for (const relativePath of [
  'data/generated/uae-active-timetable-records.json',
  'data/generated/uae-public-overlay.json',
  'data/generated/uae-timetable-overlay.json'
]) {
  if (existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: PR-083 must not add a UAE public overlay replacement`);
  }
}

for (const relativePath of walkFiles('data/generated')) {
  if (!relativePath.endsWith('.json')) continue;
  const file = readJson(relativePath);
  if (!file) continue;
  if (file.schema_version === 'timetable-overlay-promoted-v0' && file.country_id === 'united-arab-emirates') {
    fail(`${relativePath}: PR-083 must not add a promoted UAE timetable overlay`);
  }
}

const packageJson = readJson('package.json');
if (packageJson?.scripts?.['validate:uae-official-racecourse-inventory'] !== 'node scripts/check-uae-official-racecourse-inventory.mjs') {
  fail('package.json must define validate:uae-official-racecourse-inventory');
}

const checkScript = packageJson?.scripts?.check ?? '';
if (!checkScript.includes('validate:existing-countries-official-source-evidence && npm run validate:uae-official-racecourse-inventory')) {
  fail('npm run check must include validate:uae-official-racecourse-inventory after validate:existing-countries-official-source-evidence');
}

if (failures.length) {
  console.error('UAE official racecourse inventory validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('UAE official racecourse inventory validation passed.');
