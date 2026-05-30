import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contractsPath = 'data/static/major-country-parser-contracts.json';
const sourceGroupsPath = 'data/static/major-country-acquisition-source-groups.json';
const snapshotsPath = 'data/static/major-country-sample-acquisition-output-snapshots.json';
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

const requiredOutputFields = [
  'racecourse',
  'meeting_date',
  'first_race_time',
  'races[]',
  'races[].race_number',
  'races[].race_time',
  'races[].race_name_or_label',
  'source_trace',
];

const requiredNonLegacyFields = [
  'country_id',
  'group_id',
  'parser_target',
  'input_contract',
  'output_contract',
  'normalization_rules',
  'required_output_fields',
  'annual_vs_rolling_rule',
  'timezone_rule',
  'race_number_rule',
  'race_time_rule',
  'racecourse_name_rule',
  'meeting_date_rule',
  'failure_modes',
  'next_sample_extraction_step',
];

const requiredRuleFields = [
  'annual_vs_rolling_rule',
  'timezone_rule',
  'race_number_rule',
  'race_time_rule',
  'racecourse_name_rule',
  'meeting_date_rule',
];

const requiredPolicyFlags = [
  'contracts_only',
  'annual_fixture_data_is_not_final_timing_truth',
  'rolling_or_racecard_data_can_override_annual_fixture_timing',
  'source_country_local_time_first_utc_after_normalization',
  'no_live_fetch_runtime',
  'no_parser_implementation',
  'no_generated_timetable_records',
  'no_raw_source_body_storage',
  'no_odds',
  'no_payouts',
  'no_predictions',
  'no_tips',
];

const prohibitedObjectKeys = new Set([
  'raw_body',
  'raw_html',
  'raw_source_body',
  'source_body',
  'html',
  'body',
  'odds',
  'payouts',
  'predictions',
  'tips',
  'timetable_records',
  'generated_timetable',
]);

const prohibitedRuntimePatterns = [
  { pattern: /\bfetch\s*\(/, label: 'live fetch runtime' },
  { pattern: /\bhttps?\.request\s*\(/, label: 'live HTTP runtime' },
  { pattern: /\bimport\s+[^;]*(?:cheerio|jsdom|puppeteer|playwright)\b/, label: 'scraping/parser dependency' },
  { pattern: /\b(?:function|const|let|var)\s+parse(?:Race|Fixture|Racecard|Timetable)\b/, label: 'parser implementation' },
  { pattern: /\bclass\s+.*Parser\b/, label: 'parser implementation' },
  { pattern: /writeFileSync\([^)]*(?:generated|timetable-records|raw)/i, label: 'generated timetable or raw source write' },
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

function normalizeFieldList(value) {
  return Array.isArray(value) ? value : [];
}

function requireSameSet(label, actual, expected) {
  const actualSet = new Set(normalizeFieldList(actual));
  for (const field of expected) {
    if (!actualSet.has(field)) fail(`${label} must include ${field}.`);
  }
  for (const field of actualSet) {
    if (!expected.includes(field)) fail(`${label} includes unexpected field ${field}.`);
  }
}

function sourceGroupKey(countryId, groupId) {
  return `${countryId}/${groupId}`;
}

function contractKey(contract) {
  return sourceGroupKey(contract.country_id, contract.group_id);
}

function validateNonLegacyContract(contract, sourceGroup, label) {
  for (const field of requiredNonLegacyFields) {
    if (!(field in contract)) fail(`${label}: missing required field ${field}.`);
  }

  if (contract.country_id !== sourceGroup.country_id) fail(`${label}: country_id must match PR-090 source group.`);
  if (contract.group_id !== sourceGroup.group_id) fail(`${label}: group_id must match PR-090 source group.`);
  if (contract.parser_target !== sourceGroup.parser_target) fail(`${label}: parser_target must match PR-090 source group.`);

  if (!isPlainObject(contract.input_contract)) fail(`${label}: input_contract must be an object.`);
  if (!isPlainObject(contract.output_contract)) fail(`${label}: output_contract must be an object.`);
  if (!Array.isArray(contract.normalization_rules) || contract.normalization_rules.some((entry) => !isNonEmptyString(entry))) {
    fail(`${label}: normalization_rules must be a non-empty array of strings.`);
  }
  if (!Array.isArray(contract.failure_modes) || contract.failure_modes.some((entry) => !isNonEmptyString(entry))) {
    fail(`${label}: failure_modes must be a non-empty array of strings.`);
  }
  if (!isNonEmptyString(contract.next_sample_extraction_step)) {
    fail(`${label}: next_sample_extraction_step must be a non-empty string.`);
  }

  requireSameSet(`${label}: required_output_fields`, contract.required_output_fields, requiredOutputFields);
  requireSameSet(`${label}: output_contract.required_output_fields`, contract.output_contract?.required_output_fields, requiredOutputFields);

  const shape = contract.output_contract?.normalized_output_shape;
  if (!isPlainObject(shape)) {
    fail(`${label}: output_contract.normalized_output_shape must be an object.`);
  } else {
    for (const field of ['racecourse', 'meeting_date', 'first_race_time', 'source_trace']) {
      if (!(field in shape)) fail(`${label}: normalized_output_shape must include ${field}.`);
    }
    if (!Array.isArray(shape.races)) {
      fail(`${label}: normalized_output_shape.races must be an array.`);
    } else {
      const race = shape.races[0];
      if (!isPlainObject(race)) {
        fail(`${label}: normalized_output_shape.races[0] must be an object.`);
      } else {
        for (const field of ['race_number', 'race_time', 'race_name_or_label']) {
          if (!(field in race)) fail(`${label}: normalized_output_shape.races[0] must include ${field}.`);
        }
      }
    }
  }

  for (const field of requiredRuleFields) {
    if (!isNonEmptyString(contract[field])) fail(`${label}: ${field} must be a non-empty string.`);
  }

  if (!/annual fixture data is not final timing truth/i.test(contract.annual_vs_rolling_rule)) {
    fail(`${label}: annual_vs_rolling_rule must state annual fixture data is not final timing truth.`);
  }
  if (!/(rolling|racecard).*(override|replace)|(?:override|replace).*(rolling|racecard)/i.test(contract.annual_vs_rolling_rule)) {
    fail(`${label}: annual_vs_rolling_rule must state rolling/racecard data can override annual timing.`);
  }
  if (!/local time first/i.test(contract.timezone_rule) || !/UTC.*after (?:normalization|the normalized)/i.test(contract.timezone_rule)) {
    fail(`${label}: timezone_rule must use source-country local time first and UTC later only after normalization.`);
  }
}

function validateSingaporeContract(country) {
  if (!country) {
    fail('singapore: country contract must exist.');
    return;
  }
  if (!Array.isArray(country.parser_contracts) || country.parser_contracts.length !== 1) {
    fail('singapore: must have only one legacy inventory contract.');
    return;
  }

  const contract = country.parser_contracts[0];
  if (contract.group_id !== 'singapore-turf-club-legacy') fail('singapore: only singapore-turf-club-legacy is allowed.');
  if (contract.parser_target !== 'legacy_inventory_page') fail('singapore: parser_target must be legacy_inventory_page.');
  if (contract.contract_type !== 'legacy_inventory_only') fail('singapore: contract_type must be legacy_inventory_only.');
  for (const forbiddenField of ['required_output_fields', 'annual_vs_rolling_rule', 'timezone_rule', 'race_number_rule', 'race_time_rule', 'racecourse_name_rule', 'meeting_date_rule']) {
    if (forbiddenField in contract) fail(`singapore: ${forbiddenField} must not be present for legacy inventory only.`);
  }
  const shape = contract.output_contract?.normalized_output_shape;
  if (shape) fail('singapore: must not include a normalized active timetable output shape.');
  if (contract.output_contract?.required_output_fields) fail('singapore: must not include active timetable required output fields.');
}

const contractsText = readText(contractsPath);
const contracts = readJson(contractsPath);
const sourceGroups = readJson(sourceGroupsPath);
readJson(snapshotsPath);

if (contracts?.schema_version !== 'major-country-parser-contracts-v0') {
  fail('schema_version must be major-country-parser-contracts-v0.');
}
if (contracts?.scope !== 'major-countries-v0') fail('scope must be major-countries-v0.');
if (contracts?.source_groups !== sourceGroupsPath) fail(`source_groups must be ${sourceGroupsPath}.`);
if (contracts?.sample_output_snapshots !== snapshotsPath) fail(`sample_output_snapshots must be ${snapshotsPath}.`);

for (const flag of requiredPolicyFlags) {
  if (contracts?.contract_policy?.[flag] !== true) fail(`contract_policy.${flag} must be true.`);
}
requireSameSet('required_normalized_output_fields', contracts?.required_normalized_output_fields, requiredOutputFields);

if (!Array.isArray(contracts?.countries)) fail('countries must be an array.');
const countries = contracts?.countries ?? [];
if (countries.length !== expectedCountries.length) fail(`countries must contain exactly ${expectedCountries.length} entries.`);

const countryIds = countries.map((country) => country.country_id);
if (new Set(countryIds).size !== countryIds.length) fail('countries must not contain duplicate country_id values.');
for (const countryId of expectedCountries) {
  if (!countryIds.includes(countryId)) fail(`countries must include ${countryId}.`);
}
for (const countryId of countryIds) {
  if (!expectedCountries.includes(countryId)) fail(`countries includes country outside major-countries-v0 scope: ${countryId}.`);
}

const expectedSourceGroups = new Map();
for (const country of sourceGroups?.countries ?? []) {
  for (const group of country.acquisition_groups ?? []) {
    expectedSourceGroups.set(sourceGroupKey(country.country_id, group.group_id), {
      country_id: country.country_id,
      group_id: group.group_id,
      parser_target: group.parser_target,
    });
  }
}

const contractGroups = new Map();
for (const country of countries) {
  const countryLabel = country.country_id || '(missing country_id)';
  if (!Array.isArray(country.parser_contracts)) {
    fail(`${countryLabel}: parser_contracts must be an array.`);
    continue;
  }

  const seenGroupIds = new Set();
  for (const contract of country.parser_contracts) {
    if (contract.country_id !== country.country_id) fail(`${countryLabel}: nested contract country_id must match country.`);
    if (seenGroupIds.has(contract.group_id)) fail(`${countryLabel}: parser_contracts must not contain duplicate group ${contract.group_id}.`);
    seenGroupIds.add(contract.group_id);

    const key = contractKey(contract);
    if (contractGroups.has(key)) fail(`${key}: duplicate parser contract.`);
    contractGroups.set(key, contract);
  }
}

for (const [key, sourceGroup] of expectedSourceGroups) {
  if (!contractGroups.has(key)) fail(`${key}: missing parser contract for PR-090 acquisition group.`);
  const contract = contractGroups.get(key);
  if (!contract || sourceGroup.country_id === 'singapore') continue;
  validateNonLegacyContract(contract, sourceGroup, key);
}
for (const key of contractGroups.keys()) {
  if (!expectedSourceGroups.has(key)) fail(`${key}: parser contract is not backed by a PR-090 acquisition group.`);
}
validateSingaporeContract(countries.find((country) => country.country_id === 'singapore'));

walkObjects(contracts, (object, pathParts) => {
  for (const key of Object.keys(object)) {
    if (prohibitedObjectKeys.has(key)) {
      fail(`${contractsPath}:${pathParts.concat(key).join('.')}: prohibited key ${key} must not be added.`);
    }
  }
});

const textsToScan = [
  { relativePath: contractsPath, text: contractsText ?? '' },
  { relativePath: 'scripts/check-major-country-parser-contracts.mjs', text: readText('scripts/check-major-country-parser-contracts.mjs') ?? '' },
];
for (const { relativePath, text } of textsToScan) {
  for (const { pattern, label } of prohibitedRuntimePatterns) {
    if (pattern.test(text)) fail(`${relativePath} must not add ${label}.`);
  }
}

if (errors.length > 0) {
  console.error('Major-country parser contract validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country parser contracts validated.');
