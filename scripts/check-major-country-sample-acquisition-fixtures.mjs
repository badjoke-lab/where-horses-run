import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fixturesPath = 'data/static/major-country-sample-acquisition-fixtures.json';
const sourceGroupsPath = 'data/static/major-country-acquisition-source-groups.json';
const errors = [];

const expectedCountries = [
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

const requiredGroupsByCountry = new Map([
  ['japan', ['jra', 'nar', 'banei']],
  ['hong-kong', ['hkjc']],
  ['united-arab-emirates', ['era']],
  ['united-kingdom', ['bha', 'point-to-point', 'purebred-arabian']],
  ['ireland', ['hri']],
  ['france', ['france-galop', 'letrot']],
  ['united-states', ['equibase-thoroughbred', 'usta-harness', 'aqha-quarter-horse']],
  ['canada', ['standardbred-canada', 'woodbine-thoroughbred']],
  ['australia', ['racing-australia-thoroughbred', 'harness-australia']],
  ['new-zealand', ['loveracing-thoroughbred', 'hrnz-harness']],
  ['south-africa', ['nhra', 'four-racing', 'gold-circle']],
  ['south-korea', ['kra']],
  ['singapore', ['singapore-turf-club-legacy']],
]);

const sourceFields = [
  'annual_fixture_sources',
  'rolling_fixture_sources',
  'meeting_sources',
  'first_race_time_sources',
  'per_race_time_sources',
];
const requiredFixtureFields = [
  'country_id',
  'group_id',
  'parser_target',
  'sample_target_type',
  'sample_source_url',
  'sample_grain',
  'expected_fields',
  'annual_vs_rolling_rule',
  'notes',
];
const allowedTargetTypes = new Set([
  'racecourse_inventory',
  'annual_fixture',
  'rolling_fixture',
  'meeting_date',
  'first_race_time',
  'per_race_time',
]);
const expectedFieldKeys = ['racecourse', 'meeting_date', 'first_race_time', 'races'];
const prohibitedSampleKeys = new Set([
  'raw_body',
  'raw_html',
  'html',
  'body',
  'odds',
  'payouts',
  'predictions',
  'tips',
]);
const prohibitedScriptPatterns = [
  { pattern: /\bfetch\s*\(/, label: 'live fetch runtime' },
  { pattern: /\bhttps?\.request\s*\(/, label: 'live HTTP runtime' },
  { pattern: /\bparse(?:Race|Fixture|Racecard|Timetable)\b/, label: 'parser implementation' },
  { pattern: /writeFileSync\([^)]*generated/i, label: 'generated timetable write' },
];
const prohibitedFixtureTextPatterns = [
  { pattern: /"timetable_records"\s*:/, label: 'generated timetable records' },
  { pattern: /"generated_timetable"\s*:/, label: 'generated timetable records' },
  { pattern: /"raw_(?:source_)?body"\s*:/, label: 'raw source body storage' },
  { pattern: /"raw_html"\s*:/, label: 'raw source body storage' },
  { pattern: /"(?:odds|payouts|predictions|tips)"\s*:/, label: 'odds, payouts, predictions, or tips support' },
];

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} must exist.`);
    return null;
  }
  return readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must parse as JSON: ${error.message}`);
    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function walkObjects(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkObjects(entry, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;

  visitor(value, pathParts);
  for (const [key, entry] of Object.entries(value)) {
    walkObjects(entry, visitor, [...pathParts, key]);
  }
}

function groupKey(countryId, groupId) {
  return `${countryId}/${groupId}`;
}

function buildSourceIndexes(sourceGroups) {
  const groupByKey = new Map();
  for (const country of sourceGroups?.countries ?? []) {
    for (const group of country.acquisition_groups ?? []) {
      groupByKey.set(groupKey(country.country_id, group.group_id), group);
    }
  }
  return groupByKey;
}

function sourceTokensForGroup(group) {
  const tokens = new Set();
  for (const field of sourceFields) {
    for (const source of group[field] ?? []) {
      if (isNonEmptyString(source.url)) tokens.add(source.url);
      if (isNonEmptyString(source.source_id)) tokens.add(`derived:${source.source_id}`);
    }
  }
  return tokens;
}

function validateFixtureShape(countryId, fixture, index) {
  const label = `${countryId}: sample_fixtures[${index}]`;
  if (!isPlainObject(fixture)) {
    fail(`${label} must be an object.`);
    return;
  }

  for (const field of requiredFixtureFields) {
    if (!(field in fixture)) fail(`${label}.${field} is required.`);
  }
  if (fixture.country_id !== countryId) fail(`${label}.country_id must match containing country_id.`);
  if (!allowedTargetTypes.has(fixture.sample_target_type)) {
    fail(`${label}.sample_target_type must be one of ${[...allowedTargetTypes].join(', ')}.`);
  }
  for (const field of ['country_id', 'group_id', 'parser_target', 'sample_source_url', 'sample_grain', 'annual_vs_rolling_rule', 'notes']) {
    if (!isNonEmptyString(fixture[field])) fail(`${label}.${field} must be a non-empty string.`);
  }
  if (!isPlainObject(fixture.expected_fields)) {
    fail(`${label}.expected_fields must be an object.`);
    return;
  }
  for (const field of expectedFieldKeys) {
    if (!(field in fixture.expected_fields)) fail(`${label}.expected_fields.${field} is required.`);
  }
  if (!Array.isArray(fixture.expected_fields.races)) {
    fail(`${label}.expected_fields.races must be an array.`);
  }
}

const fixturesText = readText(fixturesPath);
const fixtures = readJson(fixturesPath);
const sourceGroups = readJson(sourceGroupsPath);
const groupByKey = buildSourceIndexes(sourceGroups);

if (fixtures?.schema_version !== 'major-country-sample-acquisition-fixtures-v0') {
  fail('schema_version must be major-country-sample-acquisition-fixtures-v0.');
}
if (fixtures?.scope !== 'major-countries-v0') fail('scope must be major-countries-v0.');
if (fixtures?.source_groups !== sourceGroupsPath) fail(`source_groups must be ${sourceGroupsPath}.`);

for (const [flag, expected] of Object.entries({
  sample_targets_only: true,
  annual_and_rolling_targets_are_separate: true,
  no_live_fetch_runtime: true,
  no_parser_implementation: true,
  no_generated_timetable_records: true,
  no_raw_source_body_storage: true,
  excludes_odds_payouts_predictions_tips: true,
})) {
  if (fixtures?.policy_flags?.[flag] !== expected) fail(`policy_flags.${flag} must be ${expected}.`);
}

const countries = new Map((fixtures?.countries ?? []).map((country) => [country.country_id, country]));
for (const countryId of expectedCountries) {
  if (!countries.has(countryId)) fail(`${fixturesPath} must include country ${countryId}.`);
}
for (const country of fixtures?.countries ?? []) {
  if (!expectedCountries.includes(country.country_id)) fail(`Unexpected country_id ${country.country_id}.`);
  if (!Array.isArray(country.sample_fixtures)) fail(`${country.country_id}.sample_fixtures must be an array.`);
}

for (const [countryId, groupIds] of requiredGroupsByCountry) {
  const country = countries.get(countryId);
  const sampleFixtures = country?.sample_fixtures ?? [];
  const fixturesByGroup = new Map();
  sampleFixtures.forEach((fixture, index) => {
    validateFixtureShape(countryId, fixture, index);
    if (!fixturesByGroup.has(fixture.group_id)) fixturesByGroup.set(fixture.group_id, []);
    fixturesByGroup.get(fixture.group_id).push(fixture);
  });

  for (const groupId of groupIds) {
    const label = groupKey(countryId, groupId);
    const group = groupByKey.get(label);
    const groupFixtures = fixturesByGroup.get(groupId) ?? [];
    if (!group) fail(`${label}: matching PR-090 source group must exist.`);
    if (groupFixtures.length === 0) fail(`${label}: must have sample fixtures.`);

    if (groupId === 'singapore-turf-club-legacy') {
      if (groupFixtures.length !== 1) fail(`${label}: Singapore must have exactly one legacy inventory sample target.`);
      const legacy = groupFixtures[0];
      if (legacy?.sample_target_type !== 'racecourse_inventory') fail(`${label}: Singapore sample target must be racecourse_inventory.`);
      if (groupFixtures.some((fixture) => ['first_race_time', 'per_race_time'].includes(fixture.sample_target_type))) {
        fail(`${label}: Singapore must not include first_race_time or per_race_time sample targets.`);
      }
      const legacyText = `${legacy?.annual_vs_rolling_rule ?? ''} ${legacy?.notes ?? ''}`.toLowerCase();
      if (!legacyText.includes('active racing ended') || !legacyText.includes('no active timetable')) {
        fail(`${label}: Singapore notes must state active racing ended and no active timetable target is generated.`);
      }
      continue;
    }

    const targetTypes = new Set(groupFixtures.map((fixture) => fixture.sample_target_type));
    if (!targetTypes.has('annual_fixture') && !targetTypes.has('rolling_fixture')) {
      fail(`${label}: must include at least one annual_fixture or rolling_fixture sample target.`);
    }
    if (!targetTypes.has('first_race_time')) fail(`${label}: must include a first_race_time sample target.`);
    if (!targetTypes.has('per_race_time')) fail(`${label}: must include a per_race_time sample target.`);
    if (targetTypes.has('fixture')) fail(`${label}: must not collapse annual and rolling samples into a generic fixture target.`);

    if ((group?.annual_fixture_sources?.length ?? 0) > 0 && !targetTypes.has('annual_fixture')) {
      fail(`${label}: annual fixture sources must map to a separate annual_fixture sample target.`);
    }
    if ((group?.rolling_fixture_sources?.length ?? 0) > 0 && !targetTypes.has('rolling_fixture')) {
      fail(`${label}: rolling fixture sources must map to a separate rolling_fixture sample target.`);
    }

    const sourceTokens = sourceTokensForGroup(group ?? {});
    for (const fixture of groupFixtures) {
      if (fixture.parser_target !== group?.parser_target) fail(`${label}: parser_target must match PR-090 group parser_target.`);
      if (!sourceTokens.has(fixture.sample_source_url)) {
        fail(`${label}: sample_source_url ${fixture.sample_source_url} must exist in the matching PR-090 source arrays or be a derived:<source_id> racecard link.`);
      }
    }
  }
}

walkObjects(fixtures, (object, pathParts) => {
  for (const key of Object.keys(object)) {
    if (prohibitedSampleKeys.has(key)) {
      fail(`${fixturesPath}:${pathParts.concat(key).join('.')}: prohibited sample key ${key} must not be added.`);
    }
  }
});

if (fixturesText !== null) {
  for (const { pattern, label } of prohibitedFixtureTextPatterns) {
    if (pattern.test(fixturesText)) fail(`${fixturesPath} must not add ${label}.`);
  }
}

const validatorText = readText('scripts/check-major-country-sample-acquisition-fixtures.mjs') ?? '';
for (const { pattern, label } of prohibitedScriptPatterns) {
  if (pattern.test(validatorText)) fail('Validator must not add ' + label + '.');
}

if (errors.length > 0) {
  console.error('Major-country sample acquisition fixture validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country sample acquisition fixtures validated.');
