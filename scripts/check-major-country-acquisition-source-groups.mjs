import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceGroupsPath = 'data/static/major-country-acquisition-source-groups.json';
const inventoryPath = 'data/static/major-country-racing-inventory.json';
const matrixPath = 'data/static/major-country-acquisition-test-matrix.json';
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

const operatorSplitCountries = new Set([
  'united-states',
  'canada',
  'australia',
  'south-africa',
]);

const multiSystemCountries = new Set([
  'japan',
  'france',
  'new-zealand',
  'united-states',
  'canada',
  'australia',
]);

const requiredCountryFields = ['country_id', 'update_model', 'acquisition_groups'];
const sourceFields = [
  'annual_fixture_sources',
  'rolling_fixture_sources',
  'meeting_sources',
  'first_race_time_sources',
  'per_race_time_sources',
];
const activeSourceFields = sourceFields;
const requiredGroupFields = [
  'group_id',
  'system_or_operator',
  'disciplines',
  'racecourse_scope',
  ...sourceFields,
  'acquisition_unit',
  'parser_target',
  'next_sample_test_target',
];
const approvedParserTargets = new Set([
  'fixture_page',
  'racecard_page',
  'entries_page',
  'declarations_page',
  'daily_race_info_page',
  'operator_calendar_page',
  'legacy_inventory_page',
]);
const forbiddenProductKeys = new Set(['odds', 'payouts', 'predictions', 'tips']);
const forbiddenMergedFixtureFields = new Set(['fixture_sources', 'timing_sources']);

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} must exist.`);
    return null;
  }

  const text = readFileSync(absolutePath, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must parse as JSON: ${error.message}`);
    return null;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

function collectStrings(value, strings = []) {
  if (typeof value === 'string') {
    strings.push(value);
    return strings;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, strings);
    return strings;
  }
  if (isPlainObject(value)) {
    for (const entry of Object.values(value)) collectStrings(entry, strings);
  }
  return strings;
}

function hasSourceUrlFromInventory(group, inventoryCountry) {
  const inventoryUrls = new Set(collectStrings(inventoryCountry).filter((value) => /^https?:\/\//.test(value)));
  const groupUrls = collectStrings(group).filter((value) => /^https?:\/\//.test(value));
  return groupUrls.some((url) => inventoryUrls.has(url));
}

function validateSourceArray(countryId, groupId, field, value) {
  if (!Array.isArray(value)) {
    fail(`${countryId}/${groupId}: ${field} must be an array.`);
    return;
  }

  value.forEach((entry, index) => {
    const label = `${countryId}/${groupId}: ${field}[${index}]`;
    if (!isPlainObject(entry)) {
      fail(`${label} must be a concrete source object.`);
      return;
    }
    if (!isNonEmptyString(entry.source_id)) {
      fail(`${label}.source_id must be a non-empty string.`);
    }
    if (!isNonEmptyString(entry.label)) {
      fail(`${label}.label must be a non-empty string.`);
    }
    if (!isNonEmptyString(entry.role)) {
      fail(`${label}.role must be a non-empty string.`);
    }
    if ('url' in entry && !isNonEmptyString(entry.url)) {
      fail(`${label}.url must be a non-empty string when present.`);
    }
  });
}

const sourceGroups = readJson(sourceGroupsPath);
const inventory = readJson(inventoryPath);
const matrix = readJson(matrixPath);

if (sourceGroups?.schema_version !== 'major-country-acquisition-source-groups-v0') {
  fail('schema_version must be major-country-acquisition-source-groups-v0.');
}

if (sourceGroups?.scope !== 'major-countries-v0') {
  fail('scope must be major-countries-v0.');
}

if (sourceGroups?.source_inventory !== inventoryPath) {
  fail(`source_inventory must be ${inventoryPath}.`);
}

if (sourceGroups?.acquisition_test_matrix !== matrixPath) {
  fail(`acquisition_test_matrix must be ${matrixPath}.`);
}

for (const policyFlag of [
  'annual_fixture_is_not_final_time',
  'rolling_update_required_for_active_countries',
  'annual_and_rolling_sources_are_separate_fields',
  'no_live_fetch_runtime',
  'no_parser_implementation',
  'no_generated_timetable_records',
  'no_raw_source_body_storage',
  'no_odds',
  'no_payouts',
  'no_predictions',
  'no_tips',
]) {
  if (sourceGroups?.source_policy?.[policyFlag] !== true) {
    fail(`source_policy.${policyFlag} must be true.`);
  }
}

const listedParserTargets = new Set(sourceGroups?.parser_target_enum ?? []);
for (const parserTarget of approvedParserTargets) {
  if (!listedParserTargets.has(parserTarget)) {
    fail(`parser_target_enum must include ${parserTarget}.`);
  }
}

const listedOperatorSplitCountries = new Set(sourceGroups?.operator_split_countries ?? []);
for (const countryId of operatorSplitCountries) {
  if (!listedOperatorSplitCountries.has(countryId)) {
    fail(`operator_split_countries must include ${countryId}.`);
  }
}

const listedMultiSystemCountries = new Set(sourceGroups?.multi_system_countries ?? []);
for (const countryId of multiSystemCountries) {
  if (!listedMultiSystemCountries.has(countryId)) {
    fail(`multi_system_countries must include ${countryId}.`);
  }
}

const inventoryCountries = new Map((inventory?.countries ?? []).map((country) => [country.country_id, country]));
const matrixCountries = new Map((matrix?.countries ?? []).map((country) => [country.country_id, country]));

if (!Array.isArray(sourceGroups?.countries)) {
  fail('countries must be an array.');
}

const countries = sourceGroups?.countries ?? [];
if (countries.length !== expectedCountries.length) {
  fail(`countries must contain exactly ${expectedCountries.length} entries.`);
}

const countryIds = countries.map((country) => country.country_id);
if (new Set(countryIds).size !== countryIds.length) {
  fail('countries must not contain duplicate country_id values.');
}

for (const countryId of expectedCountries) {
  if (!countryIds.includes(countryId)) {
    fail(`countries must include ${countryId}.`);
  }
}

for (const countryId of countryIds) {
  if (!expectedCountries.includes(countryId)) {
    fail(`countries includes country outside major-countries-v0 scope: ${countryId}.`);
  }
  if (!inventoryCountries.has(countryId)) {
    fail(`${countryId}: source-group country must exist in ${inventoryPath}.`);
  }
  if (!matrixCountries.has(countryId)) {
    fail(`${countryId}: source-group country must exist in ${matrixPath}.`);
  }
}

for (const country of countries) {
  const countryLabel = country.country_id || '(missing country_id)';
  const inventoryCountry = inventoryCountries.get(country.country_id);
  const matrixCountry = matrixCountries.get(country.country_id);

  for (const field of requiredCountryFields) {
    if (!(field in country)) {
      fail(`${countryLabel}: missing required field ${field}.`);
    }
  }

  if (!isNonEmptyString(country.country_id)) {
    fail(`${countryLabel}: country_id must be a non-empty string.`);
  }

  if (!isNonEmptyString(country.update_model)) {
    fail(`${countryLabel}: update_model must be a non-empty string.`);
  }

  if (inventoryCountry && country.update_model !== inventoryCountry.update_model) {
    fail(`${countryLabel}: update_model must match ${inventoryPath}.`);
  }

  if (matrixCountry && country.update_model !== matrixCountry.update_model) {
    fail(`${countryLabel}: update_model must match ${matrixPath}.`);
  }

  if (!Array.isArray(country.acquisition_groups)) {
    fail(`${countryLabel}: acquisition_groups must be an array.`);
    continue;
  }

  const expectedGroupIds = requiredGroupsByCountry.get(country.country_id) ?? [];
  const groupIds = country.acquisition_groups.map((group) => group.group_id);
  if (new Set(groupIds).size !== groupIds.length) {
    fail(`${countryLabel}: acquisition_groups must not contain duplicate group_id values.`);
  }

  if (country.acquisition_groups.length !== expectedGroupIds.length) {
    fail(`${countryLabel}: acquisition_groups must contain exactly ${expectedGroupIds.length} required group(s).`);
  }

  for (const groupId of expectedGroupIds) {
    if (!groupIds.includes(groupId)) {
      fail(`${countryLabel}: acquisition_groups must include ${groupId}.`);
    }
  }

  for (const groupId of groupIds) {
    if (!expectedGroupIds.includes(groupId)) {
      fail(`${countryLabel}: acquisition_groups includes unexpected group ${groupId}.`);
    }
  }

  const isLegacyCountry = country.country_id === 'singapore';
  if (country.update_model === 'legacy_no_active_racing' && !isLegacyCountry) {
    fail(`${countryLabel}: Singapore is the only country allowed to use legacy_no_active_racing.`);
  }
  if (isLegacyCountry && country.update_model !== 'legacy_no_active_racing') {
    fail('singapore: update_model must be legacy_no_active_racing.');
  }

  if (operatorSplitCountries.has(country.country_id) && country.acquisition_groups.length <= 1) {
    fail(`${countryLabel}: operator split countries must have more than one acquisition group.`);
  }

  if (multiSystemCountries.has(country.country_id) && country.acquisition_groups.length <= 1) {
    fail(`${countryLabel}: multi-system countries must have more than one acquisition group.`);
  }

  if (isLegacyCountry && country.acquisition_groups.length !== 1) {
    fail('singapore: must have exactly one legacy acquisition group.');
  }

  for (const group of country.acquisition_groups) {
    const groupLabel = `${countryLabel}/${group.group_id || '(missing group_id)'}`;

    for (const field of requiredGroupFields) {
      if (!(field in group)) {
        fail(`${groupLabel}: missing required field ${field}.`);
      }
    }

    for (const field of sourceFields) {
      validateSourceArray(countryLabel, group.group_id || '(missing group_id)', field, group[field]);
    }

    for (const field of ['group_id', 'system_or_operator', 'racecourse_scope', 'next_sample_test_target']) {
      if (!isNonEmptyString(group[field])) {
        fail(`${groupLabel}: ${field} must be a non-empty string.`);
      }
    }

    if (!Array.isArray(group.disciplines) || group.disciplines.length === 0 || group.disciplines.some((entry) => !isNonEmptyString(entry))) {
      fail(`${groupLabel}: disciplines must be a non-empty array of strings.`);
    }

    if (!isPlainObject(group.acquisition_unit)) {
      fail(`${groupLabel}: acquisition_unit must be an object describing the collection unit.`);
    } else {
      for (const field of ['unit_type', 'sample_grain']) {
        if (!isNonEmptyString(group.acquisition_unit[field])) {
          fail(`${groupLabel}: acquisition_unit.${field} must be a non-empty string.`);
        }
      }
      if (!Array.isArray(group.acquisition_unit.join_keys) || group.acquisition_unit.join_keys.length === 0 || group.acquisition_unit.join_keys.some((entry) => !isNonEmptyString(entry))) {
        fail(`${groupLabel}: acquisition_unit.join_keys must be a non-empty array of strings.`);
      }
    }

    if (!approvedParserTargets.has(group.parser_target)) {
      fail(`${groupLabel}: parser_target must be an approved parser target.`);
    }

    if (!('annual_fixture_sources' in group) || !('rolling_fixture_sources' in group)) {
      fail(`${groupLabel}: annual and rolling fixture sources must remain separate fields.`);
    }

    if ('fixture_sources' in group || 'timing_sources' in group) {
      fail(`${groupLabel}: annual/rolling fixtures and timing sources must not be collapsed into merged fields.`);
    }

    const sourceIdsByField = new Map();
    for (const field of sourceFields) {
      sourceIdsByField.set(field, new Set((group[field] ?? []).map((entry) => entry.source_id).filter(Boolean)));
    }
    for (const sourceId of sourceIdsByField.get('annual_fixture_sources') ?? []) {
      if (sourceIdsByField.get('rolling_fixture_sources')?.has(sourceId)) {
        fail(`${groupLabel}: annual and rolling fixture sources must use distinct source_id values even when they share a URL.`);
      }
    }

    if (isLegacyCountry) {
      if (group.group_id !== 'singapore-turf-club-legacy') {
        fail('singapore: only singapore-turf-club-legacy is allowed.');
      }
      if (group.parser_target !== 'legacy_inventory_page') {
        fail('singapore: parser_target must be legacy_inventory_page.');
      }
      if (!/legacy inventory only/i.test(group.next_sample_test_target)) {
        fail('singapore: next_sample_test_target must be legacy inventory only.');
      }
      for (const field of activeSourceFields) {
        if ((group[field] ?? []).length !== 0) {
          fail(`singapore: ${field} must stay empty for legacy inactive racing.`);
        }
      }
      continue;
    }

    if ((group.annual_fixture_sources?.length ?? 0) === 0 && (group.rolling_fixture_sources?.length ?? 0) === 0) {
      fail(`${groupLabel}: non-legacy groups must have at least one annual or rolling fixture source.`);
    }

    for (const field of ['meeting_sources', 'first_race_time_sources', 'per_race_time_sources']) {
      if ((group[field]?.length ?? 0) === 0) {
        fail(`${groupLabel}: non-legacy groups must have non-empty ${field}.`);
      }
    }

    if (group.parser_target === 'legacy_inventory_page') {
      fail(`${groupLabel}: only Singapore legacy may use legacy_inventory_page.`);
    }

    if (inventoryCountry && !hasSourceUrlFromInventory(group, inventoryCountry)) {
      fail(`${groupLabel}: non-legacy group must reference at least one source URL from ${inventoryPath}.`);
    }
  }
}

walkObjects(sourceGroups, (value, pathParts) => {
  for (const [key, entry] of Object.entries(value)) {
    if (forbiddenProductKeys.has(key) && entry !== false && entry !== null) {
      fail(`${[...pathParts, key].join('.')}: source groups must not add odds, payouts, predictions, or tips support.`);
    }
    if (forbiddenMergedFixtureFields.has(key)) {
      fail(`${[...pathParts, key].join('.')}: annual fixture and rolling fixture sources must remain separate.`);
    }
  }
});

if (errors.length > 0) {
  console.error('Major-country acquisition source groups validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country acquisition source groups validation passed.');
