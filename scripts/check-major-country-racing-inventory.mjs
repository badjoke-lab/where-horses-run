import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
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

const requiredCountryFields = [
  'country_id',
  'display_name',
  'update_model',
  'racing_systems',
  'disciplines',
  'authorities',
  'operators',
  'racecourses',
  'racecourse_inventory_sources',
  'annual_fixture_sources',
  'rolling_fixture_sources',
  'meeting_sources',
  'first_race_time_sources',
  'per_race_time_sources',
];

const approvedUpdateModels = new Set([
  'annual_plus_racecard',
  'season_calendar_plus_declarations',
  'weekly_fixture_plus_racecard',
  'operator_split_rolling',
  'legacy_no_active_racing',
]);

function fail(message) {
  errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function arrayHasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function objectHasArrayItems(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value).some((entry) => Array.isArray(entry) && entry.length > 0),
  );
}

function walkStrings(value, visitor) {
  if (typeof value === 'string') {
    visitor(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) walkStrings(entry, visitor);
    return;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) walkStrings(entry, visitor);
  }
}

function readInventory() {
  const absolutePath = path.join(root, inventoryPath);
  if (!existsSync(absolutePath)) {
    fail(`${inventoryPath} must exist.`);
    return {};
  }

  const text = readFileSync(absolutePath, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${inventoryPath} must parse as JSON: ${error.message}`);
    return {};
  }
}

const inventory = readInventory();

if (inventory.schema_version !== 'major-country-racing-inventory-v0') {
  fail('schema_version must be major-country-racing-inventory-v0.');
}

if (inventory.scope !== 'major-countries-v0') {
  fail('scope must be major-countries-v0.');
}

for (const policyFlag of [
  'annual_fixture_is_not_final_time',
  'rolling_update_required_for_active_countries',
  'racecard_or_daily_info_required_for_final_race_times',
  'no_odds',
  'no_payouts',
  'no_predictions',
  'no_tips',
]) {
  if (inventory.source_policy?.[policyFlag] !== true) {
    fail(`source_policy.${policyFlag} must be true.`);
  }
}

const listedUpdateModels = new Set(inventory.approved_update_models ?? []);
for (const updateModel of approvedUpdateModels) {
  if (!listedUpdateModels.has(updateModel)) {
    fail(`approved_update_models must include ${updateModel}.`);
  }
}

if (!Array.isArray(inventory.countries)) {
  fail('countries must be an array.');
}

const countries = inventory.countries ?? [];
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
}

for (const country of countries) {
  const label = country.country_id || '(missing country_id)';

  for (const field of requiredCountryFields) {
    if (!(field in country)) {
      fail(`${label}: missing required field ${field}.`);
    }
  }

  for (const field of ['country_id', 'display_name', 'update_model']) {
    if (!isNonEmptyString(country[field])) {
      fail(`${label}: ${field} must be a non-empty string.`);
    }
  }

  if (!approvedUpdateModels.has(country.update_model)) {
    fail(`${label}: update_model must be approved.`);
  }

  for (const field of ['racing_systems', 'disciplines', 'authorities', 'operators', 'racecourse_inventory_sources']) {
    if (!arrayHasItems(country[field])) {
      fail(`${label}: ${field} must be a non-empty array.`);
    }
  }

  if (!country.racecourses || typeof country.racecourses !== 'object' || Array.isArray(country.racecourses)) {
    fail(`${label}: racecourses must be an object keyed by source/system.`);
  }

  const isLegacy = country.update_model === 'legacy_no_active_racing';
  if (!isLegacy) {
    if (!objectHasArrayItems(country.racecourses)) {
      fail(`${label}: non-legacy country must have non-empty racecourses.`);
    }

    if (!arrayHasItems(country.annual_fixture_sources) && !arrayHasItems(country.rolling_fixture_sources)) {
      fail(`${label}: non-legacy country must have annual_fixture_sources or rolling_fixture_sources.`);
    }

    if (!arrayHasItems(country.first_race_time_sources)) {
      fail(`${label}: non-legacy country must have first_race_time_sources.`);
    }

    if (!arrayHasItems(country.per_race_time_sources)) {
      fail(`${label}: non-legacy country must have per_race_time_sources.`);
    }
  }

  for (const sourceField of [
    'annual_fixture_sources',
    'rolling_fixture_sources',
    'meeting_sources',
    'first_race_time_sources',
    'per_race_time_sources',
  ]) {
    if (!Array.isArray(country[sourceField])) {
      fail(`${label}: ${sourceField} must be an array.`);
    }
  }
}

const legacyCountries = countries.filter((country) => country.update_model === 'legacy_no_active_racing');
if (legacyCountries.length !== 1 || legacyCountries[0]?.country_id !== 'singapore') {
  fail('Singapore must be the only country with legacy_no_active_racing.');
}

const singapore = countries.find((country) => country.country_id === 'singapore');
if (singapore) {
  for (const field of [
    'annual_fixture_sources',
    'rolling_fixture_sources',
    'meeting_sources',
    'first_race_time_sources',
    'per_race_time_sources',
  ]) {
    if (!Array.isArray(singapore[field]) || singapore[field].length !== 0) {
      fail(`singapore: ${field} must remain empty for legacy/no active racing.`);
    }
  }

  if (singapore.legacy_status !== 'horse_racing_ended_after_final_race_on_2024-10-05') {
    fail('singapore: legacy_status must document the final racing date.');
  }
}

for (const country of countries) {
  if (!('annual_fixture_sources' in country) || !('rolling_fixture_sources' in country)) {
    fail(`${country.country_id ?? '(missing country_id)'}: annual and rolling fixture sources must remain separate fields.`);
  }
}

const placeholderValues = new Set(['tbd', 'unknown', 'needs review', 'to be confirmed']);
walkStrings(inventory, (value) => {
  if (placeholderValues.has(value.trim().toLowerCase())) {
    fail(`placeholder value is not allowed: ${value}`);
  }
});

const supportedProductKeys = new Set(['odds', 'payouts', 'predictions', 'tips']);
function walkObjects(value, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkObjects(entry, [...pathParts, String(index)]));
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, entry] of Object.entries(value)) {
    if (supportedProductKeys.has(key) && entry !== false && entry !== null) {
      fail(`${[...pathParts, key].join('.')}: inventory must not support odds, payouts, predictions, or tips.`);
    }
    walkObjects(entry, [...pathParts, key]);
  }
}
walkObjects(inventory);

if (errors.length > 0) {
  console.error('Major-country racing inventory validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country racing inventory validation passed.');
