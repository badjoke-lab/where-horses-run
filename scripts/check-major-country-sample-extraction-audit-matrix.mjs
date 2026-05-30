import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const auditPath = 'data/static/major-country-sample-extraction-audit-matrix.json';
const inventoryPath = 'data/static/major-country-racing-inventory.json';
const acquisitionMatrixPath = 'data/static/major-country-acquisition-test-matrix.json';
const sourceGroupsPath = 'data/static/major-country-acquisition-source-groups.json';
const fixturesPath = 'data/static/major-country-sample-acquisition-fixtures.json';
const outputSnapshotsPath = 'data/static/major-country-sample-acquisition-output-snapshots.json';
const parserContractsPath = 'data/static/major-country-parser-contracts.json';
const extractionSnapshotsPath = 'data/static/major-country-sample-extraction-snapshots.json';
const packagePath = 'package.json';
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

const relationshipToPrs = {
  'PR-088': inventoryPath,
  'PR-089': acquisitionMatrixPath,
  'PR-090': sourceGroupsPath,
  'PR-091': fixturesPath,
  'PR-092': outputSnapshotsPath,
  'PR-093': parserContractsPath,
  'PR-094': extractionSnapshotsPath,
};

const requiredPolicyFlags = [
  'static_audit_matrix_only',
  'references_existing_static_artifacts',
  'no_live_fetch_runtime',
  'no_parser_implementation',
  'no_scraping_dependency',
  'no_generated_timetable_records',
  'no_raw_source_body_storage',
  'excludes_odds_payouts_predictions_tips',
];

const allowedTraceabilityStatuses = new Set([
  'ready_for_manual_source_snapshot',
  'legacy_inventory_only',
]);

const requiredAuditEntryFields = [
  'country_id',
  'group_id',
  'update_model',
  'inventory_present',
  'acquisition_matrix_present',
  'source_group_present',
  'sample_fixtures_present',
  'output_snapshots_present',
  'parser_contract_present',
  'extraction_snapshots_present',
  'annual_fixture_sample_count',
  'rolling_fixture_sample_count',
  'extraction_snapshot_count',
  'traceability_status',
  'remaining_before_live_extraction',
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

const prohibitedTextPatterns = [
  { pattern: /\bfetch\s*\(/, label: 'live fetch runtime' },
  { pattern: /\bhttps?\.request\s*\(/, label: 'live HTTP runtime' },
  { pattern: /\bimport\s+[^;]*(?:cheerio|jsdom|puppeteer|playwright)\b/, label: 'scraping dependency' },
  { pattern: /\b(?:from|require\()\s*['\"][^'\"]*(?:cheerio|jsdom|puppeteer|playwright)[^'\"]*['\"]/, label: 'scraping dependency' },
  { pattern: /\b(?:function|const|let|var)\s+parse(?:Race|Fixture|Racecard|Timetable)\b/, label: 'parser implementation' },
  { pattern: /\bclass\s+.*Parser\b/, label: 'parser implementation' },
  { pattern: /writeFileSync\([^)]*(?:generated|timetable-records|raw)/i, label: 'generated timetable or raw source write' },
  { pattern: /"(?:raw_body|raw_html|raw_source_body|source_body|html|body|odds|payouts|predictions|tips|timetable_records|generated_timetable)"\s*:/, label: 'prohibited stored field' },
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

function sourceGroupKey(countryId, groupId) {
  return `${countryId}/${groupId}`;
}

function sampleKey(entry) {
  return [entry.country_id, entry.group_id, entry.sample_target_type, entry.sample_source_url, entry.parser_target].join(' | ');
}

function contractKey(countryId, groupId, parserTarget) {
  return [countryId, groupId, parserTarget].join(' | ');
}

function countByTargetType(fixtures, targetType) {
  return fixtures.filter((fixture) => fixture.sample_target_type === targetType).length;
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

function requireBooleanTrue(entry, field, label) {
  if (entry[field] !== true) fail(`${label}.${field} must be true.`);
}

function requireNonNegativeInteger(entry, field, label) {
  if (!Number.isInteger(entry[field]) || entry[field] < 0) {
    fail(`${label}.${field} must be a non-negative integer.`);
  }
}

const auditText = readText(auditPath);
const audit = auditText === null ? null : readJson(auditPath);
const inventory = readJson(inventoryPath);
const acquisitionMatrix = readJson(acquisitionMatrixPath);
const sourceGroups = readJson(sourceGroupsPath);
const fixtures = readJson(fixturesPath);
const outputSnapshots = readJson(outputSnapshotsPath);
const parserContracts = readJson(parserContractsPath);
const extractionSnapshots = readJson(extractionSnapshotsPath);
const packageJson = readJson(packagePath);

if (audit?.schema_version !== 'major-country-sample-extraction-audit-matrix-v0') {
  fail('schema_version must be major-country-sample-extraction-audit-matrix-v0.');
}
if (audit?.scope !== 'major-countries-v0') fail('scope must be major-countries-v0.');
for (const [pr, relativePath] of Object.entries(relationshipToPrs)) {
  if (audit?.relationship_to_prs?.[pr] !== relativePath) {
    fail(`relationship_to_prs.${pr} must be ${relativePath}.`);
  }
}
for (const flag of requiredPolicyFlags) {
  if (audit?.policy_flags?.[flag] !== true) fail(`policy_flags.${flag} must be true.`);
}
if (!Array.isArray(audit?.traceability_status_enum)) {
  fail('traceability_status_enum must be an array.');
} else {
  for (const status of allowedTraceabilityStatuses) {
    if (!audit.traceability_status_enum.includes(status)) fail(`traceability_status_enum must include ${status}.`);
  }
  for (const status of audit.traceability_status_enum) {
    if (!allowedTraceabilityStatuses.has(status)) fail(`traceability_status_enum contains unexpected status ${status}.`);
  }
}

const inventoryCountries = new Map((inventory?.countries ?? []).map((country) => [country.country_id, country]));
const acquisitionCountries = new Map((acquisitionMatrix?.countries ?? []).map((country) => [country.country_id, country]));
const sourceGroupCountries = new Map((sourceGroups?.countries ?? []).map((country) => [country.country_id, country]));
const fixtureCountries = new Map((fixtures?.countries ?? []).map((country) => [country.country_id, country]));
const outputCountries = new Map((outputSnapshots?.countries ?? []).map((country) => [country.country_id, country]));
const contractCountries = new Map((parserContracts?.countries ?? []).map((country) => [country.country_id, country]));
const extractionCountries = new Map((extractionSnapshots?.countries ?? []).map((country) => [country.country_id, country]));
const auditCountries = new Map((audit?.countries ?? []).map((country) => [country.country_id, country]));

for (const countryId of expectedCountries) {
  for (const [label, countries] of [
    [inventoryPath, inventoryCountries],
    [acquisitionMatrixPath, acquisitionCountries],
    [sourceGroupsPath, sourceGroupCountries],
    [fixturesPath, fixtureCountries],
    [outputSnapshotsPath, outputCountries],
    [parserContractsPath, contractCountries],
    [extractionSnapshotsPath, extractionCountries],
    [auditPath, auditCountries],
  ]) {
    if (!countries.has(countryId)) fail(`${label} must include country ${countryId}.`);
  }
}
for (const country of audit?.countries ?? []) {
  if (!expectedCountries.includes(country.country_id)) fail(`Unexpected audit country_id ${country.country_id}.`);
  if (!Array.isArray(country.audit_groups)) fail(`${country.country_id}.audit_groups must be an array.`);
}

const expectedGroups = new Map();
for (const country of sourceGroups?.countries ?? []) {
  for (const group of country.acquisition_groups ?? []) {
    expectedGroups.set(sourceGroupKey(country.country_id, group.group_id), {
      country_id: country.country_id,
      group_id: group.group_id,
      update_model: country.update_model,
      parser_target: group.parser_target,
    });
  }
}

const fixturesByGroup = new Map();
const fixtureKeys = new Set();
for (const country of fixtures?.countries ?? []) {
  for (const fixture of country.sample_fixtures ?? []) {
    const key = sourceGroupKey(country.country_id, fixture.group_id);
    const entries = fixturesByGroup.get(key) ?? [];
    entries.push(fixture);
    fixturesByGroup.set(key, entries);
    fixtureKeys.add(sampleKey(fixture));
  }
}

const outputKeysByGroup = new Map();
for (const country of outputSnapshots?.countries ?? []) {
  for (const snapshot of country.output_snapshots ?? []) {
    const key = sourceGroupKey(country.country_id, snapshot.group_id);
    const entries = outputKeysByGroup.get(key) ?? new Set();
    entries.add(sampleKey(snapshot));
    outputKeysByGroup.set(key, entries);
  }
}

const extractionKeysByGroup = new Map();
for (const country of extractionSnapshots?.countries ?? []) {
  for (const snapshot of country.extraction_snapshots ?? []) {
    const key = sourceGroupKey(country.country_id, snapshot.group_id);
    const entries = extractionKeysByGroup.get(key) ?? new Set();
    entries.add(sampleKey(snapshot));
    extractionKeysByGroup.set(key, entries);
  }
}

const contractKeys = new Set();
for (const country of parserContracts?.countries ?? []) {
  for (const contract of country.parser_contracts ?? []) {
    contractKeys.add(contractKey(contract.country_id, contract.group_id, contract.parser_target));
  }
}

const seenAuditGroups = new Set();
for (const country of audit?.countries ?? []) {
  for (const [index, entry] of (country.audit_groups ?? []).entries()) {
    const label = `${country.country_id}.audit_groups[${index}]`;
    if (!isPlainObject(entry)) {
      fail(`${label} must be an object.`);
      continue;
    }
    for (const field of requiredAuditEntryFields) {
      if (!(field in entry)) fail(`${label} missing required field ${field}.`);
    }
    if (entry.country_id !== country.country_id) fail(`${label}.country_id must match containing country_id.`);
    if (!isNonEmptyString(entry.country_id)) fail(`${label}.country_id must be a non-empty string.`);
    if (!isNonEmptyString(entry.group_id)) fail(`${label}.group_id must be a non-empty string.`);
    if (!isNonEmptyString(entry.update_model)) fail(`${label}.update_model must be a non-empty string.`);
    if (!isNonEmptyString(entry.remaining_before_live_extraction)) fail(`${label}.remaining_before_live_extraction must be a non-empty string.`);
    if (!allowedTraceabilityStatuses.has(entry.traceability_status)) fail(`${label}.traceability_status has unexpected value ${entry.traceability_status}.`);

    const key = sourceGroupKey(entry.country_id, entry.group_id);
    if (seenAuditGroups.has(key)) fail(`${label} duplicates audit group ${key}.`);
    seenAuditGroups.add(key);

    const expectedGroup = expectedGroups.get(key);
    if (!expectedGroup) {
      fail(`${label} must reference an existing PR-090 source group.`);
      continue;
    }
    if (entry.update_model !== expectedGroup.update_model) fail(`${label}.update_model must match PR-090 source group country update_model.`);

    const groupFixtures = fixturesByGroup.get(key) ?? [];
    const outputKeys = outputKeysByGroup.get(key) ?? new Set();
    const extractionKeys = extractionKeysByGroup.get(key) ?? new Set();
    const expectedContractKey = contractKey(entry.country_id, entry.group_id, expectedGroup.parser_target);

    if (entry.inventory_present !== inventoryCountries.has(entry.country_id)) fail(`${label}.inventory_present must reflect PR-088 country presence.`);
    if (entry.acquisition_matrix_present !== acquisitionCountries.has(entry.country_id)) fail(`${label}.acquisition_matrix_present must reflect PR-089 country presence.`);
    if (entry.source_group_present !== expectedGroups.has(key)) fail(`${label}.source_group_present must reflect PR-090 group presence.`);
    if (entry.sample_fixtures_present !== groupFixtures.length > 0) fail(`${label}.sample_fixtures_present must reflect PR-091 fixture presence.`);
    if (entry.output_snapshots_present !== (groupFixtures.length > 0 && groupFixtures.every((fixture) => outputKeys.has(sampleKey(fixture))))) {
      fail(`${label}.output_snapshots_present must reflect PR-092 snapshots for every PR-091 fixture.`);
    }
    if (entry.parser_contract_present !== contractKeys.has(expectedContractKey)) fail(`${label}.parser_contract_present must reflect PR-093 parser contract presence.`);
    if (entry.extraction_snapshots_present !== (groupFixtures.length > 0 && groupFixtures.every((fixture) => extractionKeys.has(sampleKey(fixture))))) {
      fail(`${label}.extraction_snapshots_present must reflect PR-094 extraction snapshots for every PR-091 fixture.`);
    }

    for (const field of ['annual_fixture_sample_count', 'rolling_fixture_sample_count', 'extraction_snapshot_count']) {
      requireNonNegativeInteger(entry, field, label);
    }
    if (entry.annual_fixture_sample_count !== countByTargetType(groupFixtures, 'annual_fixture')) fail(`${label}.annual_fixture_sample_count must match PR-091 fixtures.`);
    if (entry.rolling_fixture_sample_count !== countByTargetType(groupFixtures, 'rolling_fixture')) fail(`${label}.rolling_fixture_sample_count must match PR-091 fixtures.`);
    if (entry.extraction_snapshot_count !== extractionKeys.size) fail(`${label}.extraction_snapshot_count must match PR-094 extraction snapshots.`);
    if (entry.extraction_snapshot_count !== groupFixtures.length) fail(`${label}.extraction_snapshot_count must match the number of PR-091 fixtures for that group.`);

    if (entry.country_id === 'singapore') {
      if (entry.traceability_status !== 'legacy_inventory_only') fail('Singapore traceability_status must be legacy_inventory_only.');
      if ('first_race_time_sample_count' in entry) fail('Singapore audit entry must not have first_race_time_sample_count.');
      if ('per_race_time_sample_count' in entry) fail('Singapore audit entry must not have per_race_time_sample_count.');
      if (entry.extraction_snapshot_count !== 1) fail('Singapore must have exactly one extraction snapshot.');
      continue;
    }

    for (const field of ['first_race_time_sample_count', 'per_race_time_sample_count']) {
      requireNonNegativeInteger(entry, field, label);
    }
    if (entry.first_race_time_sample_count !== countByTargetType(groupFixtures, 'first_race_time')) fail(`${label}.first_race_time_sample_count must match PR-091 fixtures.`);
    if (entry.per_race_time_sample_count !== countByTargetType(groupFixtures, 'per_race_time')) fail(`${label}.per_race_time_sample_count must match PR-091 fixtures.`);
    if (entry.traceability_status !== 'ready_for_manual_source_snapshot') fail(`${label}.traceability_status must be ready_for_manual_source_snapshot.`);
    for (const field of [
      'inventory_present',
      'acquisition_matrix_present',
      'source_group_present',
      'sample_fixtures_present',
      'output_snapshots_present',
      'parser_contract_present',
      'extraction_snapshots_present',
    ]) {
      requireBooleanTrue(entry, field, label);
    }
    if (entry.first_race_time_sample_count <= 0) fail(`${label}.first_race_time_sample_count must be greater than 0 for non-legacy groups.`);
    if (entry.per_race_time_sample_count <= 0) fail(`${label}.per_race_time_sample_count must be greater than 0 for non-legacy groups.`);
  }
}

for (const key of expectedGroups.keys()) {
  if (!seenAuditGroups.has(key)) fail(`Missing audit matrix entry for PR-090 source group ${key}.`);
}
for (const key of seenAuditGroups) {
  if (!expectedGroups.has(key)) fail(`Audit matrix includes source group not present in PR-090: ${key}.`);
}

walkObjects(audit, (object, pathParts) => {
  for (const key of Object.keys(object)) {
    if (prohibitedObjectKeys.has(key)) {
      fail(`${auditPath}:${pathParts.concat(key).join('.')}: prohibited key ${key} must not be added.`);
    }
  }
});

for (const [relativePath, text] of [
  [auditPath, auditText ?? ''],
  ['scripts/check-major-country-sample-extraction-audit-matrix.mjs', readText('scripts/check-major-country-sample-extraction-audit-matrix.mjs') ?? ''],
]) {
  for (const { pattern, label } of prohibitedTextPatterns) {
    if (pattern.test(text)) fail(`${relativePath} must not add ${label}.`);
  }
}

const packageText = readText(packagePath) ?? '';
for (const dependency of ['cheerio', 'jsdom', 'puppeteer', 'playwright']) {
  if (packageJson?.dependencies?.[dependency] || packageJson?.devDependencies?.[dependency]) {
    fail(`${packagePath} must not add scraping dependency ${dependency}.`);
  }
}
if (/"(?:odds|payouts|predictions|tips)"\s*:/.test(auditText ?? '')) {
  fail(`${auditPath} must not add odds, payouts, predictions, or tips.`);
}
if (/"(?:timetable_records|generated_timetable)"\s*:/.test(auditText ?? '')) {
  fail(`${auditPath} must not add generated live timetable records.`);
}
if (/"(?:raw_body|raw_html|raw_source_body|source_body|html|body)"\s*:/.test(auditText ?? '')) {
  fail(`${auditPath} must not add raw source body/html storage.`);
}
if (!packageJson?.scripts?.['validate:major-country-sample-extraction-audit-matrix']?.includes('check-major-country-sample-extraction-audit-matrix.mjs')) {
  fail(`${packagePath} must define validate:major-country-sample-extraction-audit-matrix.`);
}
const checkScript = packageJson?.scripts?.check ?? '';
const extractionValidation = 'validate:major-country-sample-extraction-snapshots';
const auditValidation = 'validate:major-country-sample-extraction-audit-matrix';
if (!checkScript.includes(auditValidation)) fail(`${packagePath} check script must include ${auditValidation}.`);
if (checkScript.includes(extractionValidation) && checkScript.includes(auditValidation) && checkScript.indexOf(auditValidation) < checkScript.indexOf(extractionValidation)) {
  fail(`${packagePath} check script must run ${auditValidation} after ${extractionValidation}.`);
}
if (/\b(?:cheerio|jsdom|puppeteer|playwright)\b/.test(packageText)) {
  fail(`${packagePath} must not reference scraping dependencies.`);
}

if (errors.length > 0) {
  console.error('Major-country sample extraction audit matrix validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${seenAuditGroups.size} major-country sample extraction audit matrix entries across ${expectedCountries.length} countries.`);
