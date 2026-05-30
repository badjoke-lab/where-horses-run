import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const requiredValidationScripts = [
  'validate:japan-jra-candidate-generator',
  'validate:japan-nar-candidate-generator',
  'validate:japan-banei-candidate-generator',
  'validate:hong-kong-active-window-approved-candidates',
  'validate:uae-era-candidate-generator',
  'validate:uae-active-window-approved-candidates',
  'validate:cross-country-candidate-validator'
];

const requiredCandidateFiles = [
  'data/candidates/japan-active-window-approved-candidates.json',
  'data/candidates/hong-kong-active-window-approved-candidates.json',
  'data/candidates/uae-active-window-approved-candidates.json',
  'data/candidates/hong-kong-hkjc-candidates.json',
  'data/candidates/uae-era-candidates.json'
];

const forbiddenMarkers = [
  'raw html',
  'source body',
  'source response body',
  'racecard',
  'entries',
  'horse names',
  'jockey names',
  'trainer names',
  'odds',
  'results',
  'payouts',
  'prediction',
  'tips'
];

const requiredCurrentStatusPhrases = [
  'Current phase: M3 v0 generator foundation release gate',
  'M3 v0 generator foundation is complete',
  'public coverage remains partial',
  'UAE is season gap / no active-window meetings',
  'no live fetch is enabled',
  'no source page parsing',
  'no raw source body storage',
  'No public complete coverage claim',
  'No racecards, odds, results, payouts, predictions, or tips are stored'
];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  const text = read(relativePath);
  try {
    return { text, data: JSON.parse(text) };
  } catch (error) {
    fail(`${relativePath}: must be valid JSON (${error.message})`);
    return { text, data: null };
  }
}

function hasString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function checkPackageScripts() {
  const { data: packageJson } = readJson('package.json');
  if (!packageJson) return;
  const scripts = packageJson.scripts ?? {};

  for (const scriptName of requiredValidationScripts) {
    if (!hasString(scripts[scriptName])) fail(`package.json: missing npm script ${scriptName}`);
  }

  if (!hasString(scripts['validate:m3-v0-release-gate'])) {
    fail('package.json: missing npm script validate:m3-v0-release-gate');
  }

  const check = scripts.check ?? '';
  const crossCountryCommand = 'npm run validate:cross-country-candidate-validator';
  const releaseGateCommand = 'npm run validate:m3-v0-release-gate';
  if (!check.includes(crossCountryCommand)) fail('package.json: npm run check must include validate:cross-country-candidate-validator');
  if (!check.includes(releaseGateCommand)) fail('package.json: npm run check must include validate:m3-v0-release-gate');
  if (check.includes(crossCountryCommand) && check.includes(releaseGateCommand) && check.indexOf(releaseGateCommand) < check.indexOf(crossCountryCommand)) {
    fail('package.json: validate:m3-v0-release-gate must run after validate:cross-country-candidate-validator');
  }
}

function checkCandidateFile(relativePath) {
  if (!existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: required candidate/bundle file does not exist`);
    return;
  }

  const { text, data } = readJson(relativePath);
  if (!data) return;
  const lowerText = text.toLowerCase();

  if (data.schema_version !== 'timetable-candidates-v0') fail(`${relativePath}: schema_version must be timetable-candidates-v0`);
  if (!data.candidate_window || typeof data.candidate_window !== 'object' || Array.isArray(data.candidate_window)) {
    fail(`${relativePath}: candidate_window must be present`);
  } else {
    for (const key of ['start_date', 'end_date_exclusive', 'timezone']) {
      if (!hasString(data.candidate_window[key])) fail(`${relativePath}: candidate_window.${key} must be present`);
    }
  }

  if (!data.review || typeof data.review !== 'object' || Array.isArray(data.review)) {
    fail(`${relativePath}: review metadata must be present`);
  } else {
    if (!hasString(data.review.review_status)) fail(`${relativePath}: review.review_status must be present`);
    if (!hasOwn(data.review, 'reviewed_at')) fail(`${relativePath}: review.reviewed_at key must be present`);
    if (!hasOwn(data.review, 'reviewer')) fail(`${relativePath}: review.reviewer key must be present`);
    if (!hasString(data.review.summary)) fail(`${relativePath}: review.summary must be present`);
    if (!hasOwn(data.review, 'promotion_target')) fail(`${relativePath}: review.promotion_target key must be present`);
  }

  if (!Array.isArray(data.records)) fail(`${relativePath}: records must be an array`);

  for (const marker of forbiddenMarkers) {
    if (lowerText.includes(marker)) fail(`${relativePath}: forbidden marker found: ${marker}`);
  }

  for (const phrase of ['complete public coverage', 'public complete coverage', 'full public coverage', 'complete coverage']) {
    if (lowerText.includes(phrase)) fail(`${relativePath}: must not claim ${phrase}`);
  }

  if (relativePath === 'data/candidates/uae-active-window-approved-candidates.json' && Array.isArray(data.records) && data.records.length === 0) {
    if (!lowerText.includes('season gap')) fail(`${relativePath}: empty UAE approved bundle must state season gap`);
    if (!lowerText.includes('no active-window')) fail(`${relativePath}: empty UAE approved bundle must state no active-window meetings`);
    if (!lowerText.includes('not public coverage')) fail(`${relativePath}: empty UAE approved bundle must state it is not public coverage`);
  }
}

function checkCurrentStatus() {
  const relativePath = 'docs/runbooks/current-status.md';
  if (!existsSync(path.join(root, relativePath))) {
    fail(`${relativePath}: required status document is missing`);
    return;
  }
  const text = read(relativePath);
  const lowerText = text.toLowerCase();

  for (const phrase of requiredCurrentStatusPhrases) {
    if (!lowerText.includes(phrase.toLowerCase())) fail(`${relativePath}: missing required public-facing wording: ${phrase}`);
  }

  if (lowerText.includes('m3 is fully complete') || lowerText.includes('m3 fully complete')) {
    fail(`${relativePath}: must not claim M3 is fully complete; only the M3 v0 generator foundation may be complete`);
  }
}

function checkCountryCoverageClaims() {
  const { data: countries } = readJson('data/static/countries.json');
  const { data: inventory } = readJson('data/static/country-racing-inventory.json');
  const targetIds = new Set(['japan', 'hong-kong', 'united-arab-emirates']);

  if (Array.isArray(countries)) {
    for (const country of countries.filter((entry) => targetIds.has(entry.id))) {
      const searchable = `${country.summary_en ?? ''} ${country.summary_ja ?? ''} ${country.notes ?? ''}`.toLowerCase();
      for (const phrase of ['complete coverage', 'full coverage', 'fully covered']) {
        if (searchable.includes(phrase)) fail(`data/static/countries.json: ${country.id} must not claim ${phrase}`);
      }
    }
  }

  if (Array.isArray(inventory?.countries)) {
    for (const country of inventory.countries.filter((entry) => targetIds.has(entry.country_id))) {
      if (country.overall_coverage_status === 'complete') {
        fail(`data/static/country-racing-inventory.json: ${country.country_id} must not have complete coverage status for M3 v0`);
      }
      for (const system of country.racing_systems ?? []) {
        if (system.coverage_status === 'complete') {
          fail(`data/static/country-racing-inventory.json: ${country.country_id}/${system.system_id} must not have complete coverage status for M3 v0`);
        }
      }
    }
  }
}

checkPackageScripts();
for (const relativePath of requiredCandidateFiles) checkCandidateFile(relativePath);
checkCurrentStatus();
checkCountryCoverageClaims();

if (errors.length) {
  console.error('M3 v0 release gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('M3 v0 release gate passed.');
