import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const scopeDocPath = 'docs/runbooks/major-countries-v0-scope.md';
const scopeJsonPath = 'data/static/major-countries-v0-scope.json';
const packageJsonPath = 'package.json';

const targetCountries = [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'united-kingdom',
  'ireland',
  'france',
  'united-states',
  'canada',
  'australia',
  'new-zealand',
  'south-africa',
  'south-korea',
  'singapore',
];

const approvedCoverageDepth = new Set([
  'level_1_country_profile',
  'level_2_racecourse_inventory',
  'level_3_official_calendar_links',
  'level_4_active_window_meeting_dates',
  'level_5_first_race_times_optional',
]);

const approvedActiveWindowTargets = new Set(['yes', 'partial', 'no', 'later']);
const requiredCountryFields = [
  'country_id',
  'display_name',
  'priority_tier',
  'expected_racing_systems',
  'expected_source_categories',
  'expected_coverage_depth_v0',
  'timetable_active_window_target',
  'public_status_label',
];
const requiredSourceCategories = [
  'authority',
  'racecourse_inventory',
  'fixture_calendar',
  'meeting_date',
  'first_race_time_optional',
];

function fail(message) {
  failures.push(message);
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readRequired(relativePath) {
  const filePath = absolute(relativePath);
  if (!existsSync(filePath)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(filePath, 'utf8');
}

function readJsonRequired(relativePath) {
  const text = readRequired(relativePath);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must be valid JSON: ${error.message}`);
    return {};
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function arrayHasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasNegatedCoverageContext(text, phrase) {
  const lower = text.toLowerCase();
  const needle = phrase.toLowerCase();
  let index = lower.indexOf(needle);
  while (index !== -1) {
    const context = lower.slice(Math.max(0, index - 90), index + needle.length + 90);
    if (
      context.includes('not claim') ||
      context.includes('not claimed') ||
      context.includes('does not claim') ||
      context.includes('no public page') ||
      context.includes('should not present') ||
      context.includes('not a promise')
    ) {
      return true;
    }
    index = lower.indexOf(needle, index + needle.length);
  }
  return false;
}

if (!existsSync(absolute(scopeDocPath))) fail(`${scopeDocPath} must exist.`);
if (!existsSync(absolute(scopeJsonPath))) fail(`${scopeJsonPath} must exist.`);

const scopeDoc = readRequired(scopeDocPath);
const scope = readJsonRequired(scopeJsonPath);
const packageJson = readJsonRequired(packageJsonPath);

if (!scopeDoc.includes('PR-096')) {
  fail(`${scopeDocPath} must include PR-096.`);
}

if (!scopeDoc.includes('per-country micro PRs are paused')) {
  fail(`${scopeDocPath} must include "per-country micro PRs are paused".`);
}

for (const requiredPhrase of [
  'gap-report-only PRs are paused',
  'source-evidence-only PRs are paused unless bundled with data/schema/page changes',
  'Japan/Hong Kong/UAE existing data remains partial',
  'Major-countries v0 means usable major-country index, not full worldwide timetable completion',
]) {
  if (!scopeDoc.includes(requiredPhrase)) {
    fail(`${scopeDocPath} must include "${requiredPhrase}".`);
  }
}

if (!hasNegatedCoverageContext(scopeDoc, 'complete global coverage')) {
  fail(`${scopeDocPath} must explicitly avoid claiming complete global coverage.`);
}

if (!hasNegatedCoverageContext(scopeDoc, 'every major country has active-window timetables')) {
  fail(`${scopeDocPath} must explicitly avoid claiming every major country has active-window timetables.`);
}

for (const forbiddenPattern of [
  /complete global coverage is claimed/i,
  /claims complete global coverage/i,
  /all major countries have active-window timetables/i,
  /every major country has active-window timetables\./i,
]) {
  const match = scopeDoc.match(forbiddenPattern);
  if (match) {
    const context = scopeDoc.slice(Math.max(0, match.index - 90), match.index + match[0].length + 90).toLowerCase();
    if (!context.includes('does not') && !context.includes('not claim') && !context.includes('no public page')) {
      fail(`${scopeDocPath} must not make forbidden coverage claim: ${match[0]}`);
    }
  }
}

if (scope.schema_version !== 'major-countries-v0-scope-v0') {
  fail(`${scopeJsonPath} schema_version must be major-countries-v0-scope-v0.`);
}

if (!Array.isArray(scope.countries)) {
  fail(`${scopeJsonPath} must include a countries array.`);
}

const countries = scope.countries ?? [];
const countryIds = countries.map((country) => country.country_id);
for (const countryId of targetCountries) {
  if (!countryIds.includes(countryId)) {
    fail(`${scopeJsonPath} must include ${countryId}.`);
  }
}

for (const countryId of countryIds) {
  if (!targetCountries.includes(countryId)) {
    fail(`${scopeJsonPath} includes country outside locked scope: ${countryId}.`);
  }
}

if (new Set(countryIds).size !== countryIds.length) {
  fail(`${scopeJsonPath} must not contain duplicate country_id values.`);
}

for (const country of countries) {
  const label = country.country_id || '(missing country_id)';

  for (const field of requiredCountryFields) {
    if (!(field in country)) {
      fail(`${label}: missing required field ${field}.`);
    }
  }

  for (const field of ['country_id', 'display_name', 'priority_tier', 'timetable_active_window_target', 'public_status_label']) {
    if (!isNonEmptyString(country[field])) {
      fail(`${label}: ${field} must be a non-empty string.`);
    }
  }

  for (const field of ['expected_racing_systems', 'expected_racing_types', 'expected_coverage_depth_v0']) {
    if (!arrayHasItems(country[field])) {
      fail(`${label}: ${field} must be a non-empty array.`);
    }
  }

  if (!country.expected_coverage_depth_v0?.includes('level_1_country_profile')) {
    fail(`${label}: expected_coverage_depth_v0 must include level_1_country_profile.`);
  }

  for (const depth of country.expected_coverage_depth_v0 ?? []) {
    if (!approvedCoverageDepth.has(depth)) {
      fail(`${label}: invalid coverage depth ${depth}.`);
    }
  }

  if (!approvedActiveWindowTargets.has(country.timetable_active_window_target)) {
    fail(`${label}: timetable_active_window_target must be one of yes / partial / no / later.`);
  }

  if (!country.expected_source_categories || typeof country.expected_source_categories !== 'object' || Array.isArray(country.expected_source_categories)) {
    fail(`${label}: expected_source_categories must be an object.`);
  } else {
    for (const category of requiredSourceCategories) {
      if (!isNonEmptyString(country.expected_source_categories[category])) {
        fail(`${label}: expected_source_categories.${category} must be a non-empty string.`);
      }
    }
  }
}

if (packageJson.scripts?.['validate:major-countries-v0-scope'] !== 'node scripts/check-major-countries-v0-scope.mjs') {
  fail('package.json must define validate:major-countries-v0-scope.');
}

const checkScript = packageJson.scripts?.check ?? '';
if (!checkScript.includes('npm run validate:jra-record-level-source-verification && npm run validate:major-countries-v0-scope')) {
  fail('package.json check must include validate:major-countries-v0-scope after validate:jra-record-level-source-verification.');
}

if (failures.length > 0) {
  console.error('Major-countries v0 scope validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Major-countries v0 scope validation passed.');
