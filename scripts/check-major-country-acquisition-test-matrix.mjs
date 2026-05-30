import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const matrixPath = 'data/static/major-country-acquisition-test-matrix.json';
const inventoryPath = 'data/static/major-country-racing-inventory.json';
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

const sourceFields = [
  'racecourse_inventory_sources',
  'annual_fixture_sources',
  'rolling_fixture_sources',
  'meeting_sources',
  'first_race_time_sources',
  'per_race_time_sources',
];

const resultFields = [
  'racecourse_inventory_result',
  'annual_fixture_result',
  'rolling_update_result',
  'meeting_date_result',
  'first_race_time_result',
  'per_race_time_result',
];

const requiredCountryFields = [
  'country_id',
  'update_model',
  'tested_sources_from_inventory',
  ...resultFields,
  'operator_split_required',
  'multi_system_required',
  'acquisition_unit',
  'next_required_collection_step',
];

const approvedResults = new Set([
  'source_path_exists',
  'source_path_exists_but_needs_parser',
  'operator_split_required',
  'legacy_no_active_racing',
  'source_path_missing',
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

const forbiddenProductKeys = new Set(['odds', 'payouts', 'predictions', 'tips']);

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

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//.test(value);
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
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectStrings(entry, strings);
  }
  return strings;
}

function walkObjects(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkObjects(entry, visitor, [...pathParts, String(index)]));
    return;
  }

  if (!value || typeof value !== 'object') return;

  visitor(value, pathParts);
  for (const [key, entry] of Object.entries(value)) {
    walkObjects(entry, visitor, [...pathParts, key]);
  }
}

const matrix = readJson(matrixPath);
const inventory = readJson(inventoryPath);

if (matrix?.schema_version !== 'major-country-acquisition-test-matrix-v0') {
  fail('schema_version must be major-country-acquisition-test-matrix-v0.');
}

if (matrix?.scope !== 'major-countries-v0') {
  fail('scope must be major-countries-v0.');
}

if (matrix?.source_inventory !== inventoryPath) {
  fail(`source_inventory must be ${inventoryPath}.`);
}

for (const policyFlag of [
  'annual_fixture_is_not_final_time',
  'rolling_update_required_for_active_countries',
  'racecard_or_daily_info_required_for_final_race_times',
  'no_live_fetch_runtime',
  'no_parser_implementation',
  'no_generated_timetable_records',
  'no_raw_source_body_storage',
  'no_odds',
  'no_payouts',
  'no_predictions',
  'no_tips',
]) {
  if (matrix?.source_policy?.[policyFlag] !== true) {
    fail(`source_policy.${policyFlag} must be true.`);
  }
}

const listedResults = new Set(matrix?.result_enum ?? []);
for (const result of approvedResults) {
  if (!listedResults.has(result)) {
    fail(`result_enum must include ${result}.`);
  }
}

const listedOperatorSplitCountries = new Set(matrix?.operator_split_countries ?? []);
for (const countryId of operatorSplitCountries) {
  if (!listedOperatorSplitCountries.has(countryId)) {
    fail(`operator_split_countries must include ${countryId}.`);
  }
}

const listedMultiSystemCountries = new Set(matrix?.multi_system_countries ?? []);
for (const countryId of multiSystemCountries) {
  if (!listedMultiSystemCountries.has(countryId)) {
    fail(`multi_system_countries must include ${countryId}.`);
  }
}

const inventoryCountries = new Map((inventory?.countries ?? []).map((country) => [country.country_id, country]));

if (!Array.isArray(matrix?.countries)) {
  fail('countries must be an array.');
}

const countries = matrix?.countries ?? [];
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
    fail(`${countryId}: matrix country must exist in ${inventoryPath}.`);
  }
}

for (const country of countries) {
  const label = country.country_id || '(missing country_id)';
  const inventoryCountry = inventoryCountries.get(country.country_id);

  for (const field of requiredCountryFields) {
    if (!(field in country)) {
      fail(`${label}: missing required field ${field}.`);
    }
  }

  if (!isNonEmptyString(country.country_id)) {
    fail(`${label}: country_id must be a non-empty string.`);
  }

  if (!isNonEmptyString(country.update_model)) {
    fail(`${label}: update_model must be a non-empty string.`);
  }

  if (inventoryCountry && country.update_model !== inventoryCountry.update_model) {
    fail(`${label}: update_model must match ${inventoryPath}.`);
  }

  if (!isNonEmptyString(country.acquisition_unit)) {
    fail(`${label}: acquisition_unit must be a non-empty string.`);
  }

  if (!isNonEmptyString(country.next_required_collection_step)) {
    fail(`${label}: next_required_collection_step must be a non-empty string.`);
  }

  if (!country.tested_sources_from_inventory || typeof country.tested_sources_from_inventory !== 'object' || Array.isArray(country.tested_sources_from_inventory)) {
    fail(`${label}: tested_sources_from_inventory must be an object keyed by inventory source field.`);
  }

  for (const sourceField of sourceFields) {
    const testedSources = country.tested_sources_from_inventory?.[sourceField];
    if (!Array.isArray(testedSources)) {
      fail(`${label}: tested_sources_from_inventory.${sourceField} must be an array.`);
      continue;
    }

    const inventorySources = new Set(inventoryCountry?.[sourceField] ?? []);
    for (const source of testedSources) {
      if (!inventorySources.has(source)) {
        fail(`${label}: tested source ${source} must come from inventory field ${sourceField}.`);
      }
    }
  }

  for (const field of resultFields) {
    if (!isNonEmptyString(country[field])) {
      fail(`${label}: ${field} must be a non-empty approved result string.`);
      continue;
    }
    if (!approvedResults.has(country[field])) {
      fail(`${label}: ${field} must use an approved result value.`);
    }
  }

  if (!('annual_fixture_result' in country) || !('rolling_update_result' in country)) {
    fail(`${label}: annual fixture and rolling update results must remain separate fields.`);
  }
  if (!('annual_fixture_sources' in (country.tested_sources_from_inventory ?? {})) || !('rolling_fixture_sources' in (country.tested_sources_from_inventory ?? {}))) {
    fail(`${label}: annual fixture and rolling fixture tested source arrays must remain separate fields.`);
  }

  const inventoryUrls = new Set(collectStrings(inventoryCountry).filter(isUrl));
  const testedUrls = collectStrings(country.tested_sources_from_inventory).filter(isUrl);
  const referencesInventoryUrl = testedUrls.some((url) => inventoryUrls.has(url));
  const isLegacy = country.country_id === 'singapore';

  if (!isLegacy && !referencesInventoryUrl) {
    fail(`${label}: non-legacy country must reference at least one source URL from ${inventoryPath}.`);
  }

  const hasLegacyResult = resultFields.some((field) => country[field] === 'legacy_no_active_racing');
  if (!isLegacy && hasLegacyResult) {
    fail(`${label}: Singapore is the only country allowed to use legacy_no_active_racing result values.`);
  }

  if (isLegacy) {
    for (const field of [
      'annual_fixture_result',
      'rolling_update_result',
      'meeting_date_result',
      'first_race_time_result',
      'per_race_time_result',
    ]) {
      if (country[field] !== 'legacy_no_active_racing') {
        fail(`singapore: ${field} must be legacy_no_active_racing.`);
      }
    }

    if (country.racecourse_inventory_result === 'legacy_no_active_racing') {
      fail('singapore: racecourse_inventory_result must remain legacy inventory evidence, not an active timing result.');
    }

    if (country.acquisition_unit !== 'legacy_country_not_active_timetable_target') {
      fail('singapore: acquisition_unit must mark it as not an active timetable target.');
    }
  }

  const shouldBeOperatorSplit = operatorSplitCountries.has(country.country_id);
  if (country.operator_split_required !== shouldBeOperatorSplit) {
    fail(`${label}: operator_split_required must be ${shouldBeOperatorSplit}.`);
  }

  if (shouldBeOperatorSplit) {
    for (const field of resultFields) {
      if (country[field] !== 'operator_split_required') {
        fail(`${label}: ${field} must be operator_split_required for an operator-split country.`);
      }
    }
    if (!country.acquisition_unit.includes('operator_split')) {
      fail(`${label}: acquisition_unit must explicitly identify the operator split.`);
    }
  }

  const shouldBeMultiSystem = multiSystemCountries.has(country.country_id);
  if (country.multi_system_required !== shouldBeMultiSystem) {
    fail(`${label}: multi_system_required must be ${shouldBeMultiSystem}.`);
  }
}

walkObjects(matrix, (value, pathParts) => {
  for (const [key, entry] of Object.entries(value)) {
    if (forbiddenProductKeys.has(key) && entry !== false && entry !== null) {
      fail(`${[...pathParts, key].join('.')}: acquisition test matrix must not add odds, payouts, predictions, or tips support.`);
    }
  }
});

if (errors.length > 0) {
  console.error('Major-country acquisition test matrix validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country acquisition test matrix validation passed.');
