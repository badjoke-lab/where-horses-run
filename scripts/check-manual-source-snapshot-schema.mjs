import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const schemaPath = 'data/static/manual-source-snapshot-schema.json';
const firstBatchPath = 'data/static/manual-source-snapshot-first-batch-plan.json';
const pr096PlanPath = 'data/static/major-country-manual-source-snapshot-plan.json';
const pr096GatePath = 'data/static/major-country-v0-completion-gate.json';
const sourceGroupsPath = 'data/static/major-country-acquisition-source-groups.json';
const packagePath = 'package.json';
const scriptPath = 'scripts/check-manual-source-snapshot-schema.mjs';

const requiredRecordFields = [
  'snapshot_id',
  'country_id',
  'group_id',
  'source_url',
  'source_label',
  'source_type',
  'source_capture_date',
  'source_local_date_context',
  'racecourse_or_meeting_context',
  'annual_or_rolling_context',
  'first_race_time_evidence',
  'per_race_time_evidence',
  'normalized_sample',
  'source_trace',
  'user_visible_result',
  'reviewer_notes',
  'status',
];
const allowedSourceTypes = [
  'racecourse_inventory',
  'annual_fixture',
  'season_fixture',
  'rolling_fixture',
  'racecard',
  'entries',
  'declarations',
  'daily_race_info',
  'operator_calendar',
  'legacy_inventory',
];
const annualOrRollingContext = [
  'annual_fixture_is_coarse_schedule_only',
  'rolling_or_racecard_required_for_final_time',
];
const normalizedSampleRequiredFields = [
  'racecourse',
  'meeting_date',
  'first_race_time',
  'races[]',
  'source_trace',
];
const normalizedRaceRequiredFields = [
  'races[].race_number',
  'races[].race_time',
  'races[].race_name_or_label',
];
const sourceTraceRequiredFields = [
  'source_url',
  'source_label',
  'source_type',
  'source_capture_date',
  'country_id',
  'group_id',
];
const statusEnum = [
  'pending_manual_capture',
  'captured_static_sample',
  'needs_source_correction',
  'legacy_no_active_racing',
];
const explicitExclusions = [
  'no live fetch runtime',
  'no parser implementation',
  'no scraping dependency',
  'no raw source body/html storage',
  'no generated live timetable records',
  'no odds',
  'no payouts',
  'no predictions',
  'no tips',
];
const expectedSelectedGroups = [
  ['japan', 'jra'],
  ['japan', 'nar'],
  ['japan', 'banei'],
  ['hong-kong', 'hkjc'],
  ['united-arab-emirates', 'era'],
  ['south-korea', 'kra'],
];
const requiredEvidence = [
  'racecourse_or_meeting_context',
  'annual_or_rolling_fixture',
  'first_race_time',
  'per_race_time',
  'official_source_url',
  'source_capture_date',
];
const prohibitedKeys = new Set([
  'raw_body',
  'raw_html',
  'raw_source_body',
  'source_body',
  'html',
  'body',
  'timetable_records',
  'generated_timetable',
  'odds',
  'payouts',
  'predictions',
  'tips',
]);
const prohibitedCodePatterns = [
  { pattern: new RegExp(`\\b${['fet', 'ch'].join('')}\\s*\\(`), label: 'live fetch runtime' },
  { pattern: /\bglobalThis\[['"]fetch['"]\]\s*\(/, label: 'live fetch runtime' },
  { pattern: /\bhttps?\.(?:request|get)\s*\(/, label: 'HTTP request runtime' },
  { pattern: /\b(?:import\s+[^;]*(?:cheerio|jsdom|puppeteer|playwright)|from\s+['"][^'"]*(?:cheerio|jsdom|puppeteer|playwright)[^'"]*['"]|require\(\s*['"][^'"]*(?:cheerio|jsdom|puppeteer|playwright)[^'"]*['"]\s*\))/, label: 'scraping dependency' },
  { pattern: /\b(?:function|const|let|var)\s+parse(?:Race|Fixture|Racecard|Timetable)\b/, label: 'parser implementation' },
  { pattern: /\bclass\s+parse(?:Race|Fixture|Racecard|Timetable)\b/i, label: 'parser implementation' },
];
const errors = [];

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

function key(countryId, groupId) {
  return `${countryId}/${groupId}`;
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label} must be ${expected}.`);
}

function requireIncludes(array, value, label) {
  if (!Array.isArray(array) || !array.includes(value)) fail(`${label} must include ${value}.`);
}

function requireAllIncludes(array, values, label) {
  for (const value of values) requireIncludes(array, value, label);
}

function walk(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  visitor(value, pathParts);
  for (const [objectKey, entry] of Object.entries(value)) walk(entry, visitor, [...pathParts, objectKey]);
}

function readPackageAtHead() {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${packagePath}`], { cwd: root, encoding: 'utf8' }));
  } catch {
    return null;
  }
}

const schema = readJson(schemaPath);
const firstBatch = readJson(firstBatchPath);
const pr096Plan = readJson(pr096PlanPath);
const pr096Gate = readJson(pr096GatePath);
const sourceGroups = readJson(sourceGroupsPath);
const packageJson = readJson(packagePath);
const packageAtHead = readPackageAtHead();

requireEqual(schema?.schema_version, 'manual-source-snapshot-schema-v0', `${schemaPath}.schema_version`);
requireEqual(schema?.scope, 'major-countries-v0', `${schemaPath}.scope`);
requireAllIncludes(schema?.required_record_fields, requiredRecordFields, `${schemaPath}.required_record_fields`);
requireAllIncludes(schema?.allowed_source_type, allowedSourceTypes, `${schemaPath}.allowed_source_type`);
requireAllIncludes(schema?.annual_or_rolling_context, annualOrRollingContext, `${schemaPath}.annual_or_rolling_context`);
requireAllIncludes(schema?.normalized_sample?.required_fields, normalizedSampleRequiredFields, `${schemaPath}.normalized_sample.required_fields`);
requireAllIncludes(schema?.normalized_sample?.races_required_fields, normalizedRaceRequiredFields, `${schemaPath}.normalized_sample.races_required_fields`);
requireAllIncludes(schema?.source_trace?.required_fields, sourceTraceRequiredFields, `${schemaPath}.source_trace.required_fields`);
requireAllIncludes(schema?.status_enum, statusEnum, `${schemaPath}.status_enum`);
requireAllIncludes(schema?.explicit_exclusions, explicitExclusions, `${schemaPath}.explicit_exclusions`);

requireEqual(firstBatch?.schema_version, 'manual-source-snapshot-first-batch-plan-v0', `${firstBatchPath}.schema_version`);
requireEqual(firstBatch?.scope, 'major-countries-v0', `${firstBatchPath}.scope`);
requireEqual(firstBatch?.batch_id, 'manual-source-snapshot-batch-001', `${firstBatchPath}.batch_id`);
requireEqual(firstBatch?.batch_status, 'planned', `${firstBatchPath}.batch_status`);

const expectedGroupKeys = expectedSelectedGroups.map(([countryId, groupId]) => key(countryId, groupId));
const selectedGroups = Array.isArray(firstBatch?.selected_groups) ? firstBatch.selected_groups : [];
const selectedGroupKeys = selectedGroups.map((group) => key(group.country_id, group.group_id));
if (selectedGroupKeys.length !== expectedGroupKeys.length) {
  fail(`${firstBatchPath}.selected_groups must include exactly ${expectedGroupKeys.length} groups.`);
}
for (const expectedKey of expectedGroupKeys) {
  if (!selectedGroupKeys.includes(expectedKey)) fail(`${firstBatchPath}.selected_groups must include ${expectedKey}.`);
}
for (const selectedKey of selectedGroupKeys) {
  if (!expectedGroupKeys.includes(selectedKey)) fail(`${firstBatchPath}.selected_groups must not include unexpected group ${selectedKey}.`);
}
if (selectedGroupKeys.includes('singapore/singapore-turf-club-legacy')) {
  fail('Singapore must not be inside selected_groups.');
}

const sourceGroupKeys = new Set();
for (const country of sourceGroups?.countries ?? []) {
  for (const group of country.acquisition_groups ?? []) sourceGroupKeys.add(key(country.country_id, group.group_id));
}
const pr096PlanGroups = new Map();
for (const country of pr096Plan?.countries ?? []) {
  for (const group of country.manual_snapshot_groups ?? []) pr096PlanGroups.set(key(group.country_id, group.group_id), group);
}

for (const group of selectedGroups) {
  const groupKey = key(group.country_id, group.group_id);
  if (!sourceGroupKeys.has(groupKey)) fail(`${groupKey} must exist in ${sourceGroupsPath}.`);
  const pr096Group = pr096PlanGroups.get(groupKey);
  if (!pr096Group) fail(`${groupKey} must exist in ${pr096PlanPath}.`);
  requireEqual(group.source_basis_from_pr096, true, `${groupKey}.source_basis_from_pr096`);
  requireEqual(group.manual_snapshot_required, true, `${groupKey}.manual_snapshot_required`);
  requireEqual(group.planned_snapshot_status, 'pending_manual_capture', `${groupKey}.planned_snapshot_status`);
  requireEqual(group.source_capture_mode, 'manual_static_source_snapshot', `${groupKey}.source_capture_mode`);
  requireEqual(group.next_capture_pr, 'PR-098', `${groupKey}.next_capture_pr`);
  requireAllIncludes(group.required_evidence, requiredEvidence, `${groupKey}.required_evidence`);
  if (!isNonEmptyString(group.user_visible_expected_result)) fail(`${groupKey}.user_visible_expected_result must be a non-empty string.`);
  if (!isNonEmptyString(group.operation_expected_result)) fail(`${groupKey}.operation_expected_result must be a non-empty string.`);
  if (pr096Group?.traceability_status_from_pr095 !== 'ready_for_manual_source_snapshot') {
    fail(`${groupKey} must be ready_for_manual_source_snapshot in ${pr096PlanPath}.`);
  }
}

const singaporeStatus = firstBatch?.singapore_status;
if (!isPlainObject(singaporeStatus)) {
  fail(`${firstBatchPath}.singapore_status must exist.`);
} else {
  requireEqual(singaporeStatus.country_id, 'singapore', 'singapore_status.country_id');
  requireEqual(singaporeStatus.group_id, 'singapore-turf-club-legacy', 'singapore_status.group_id');
  requireEqual(singaporeStatus.status, 'legacy_no_active_racing', 'singapore_status.status');
  requireEqual(singaporeStatus.manual_snapshot_required, false, 'singapore_status.manual_snapshot_required');
  requireEqual(
    singaporeStatus.next_action,
    'keep legacy inventory only unless racing resumes or an approved successor source exists',
    'singapore_status.next_action',
  );
}

requireEqual(pr096Gate?.status, 'static_acquisition_readiness_complete', `${pr096GatePath}.status`);
requireIncludes(pr096Gate?.next_phase, 'manual_static_source_snapshots', `${pr096GatePath}.next_phase`);
requireEqual(pr096Gate?.next_pr, 'PR-097', `${pr096GatePath}.next_pr`);

for (const json of [schema, firstBatch]) {
  walk(json, (object, pathParts) => {
    for (const objectKey of Object.keys(object)) {
      if (prohibitedKeys.has(objectKey)) fail(`${pathParts.concat(objectKey).join('.')} must not add prohibited field ${objectKey}.`);
    }
  });
}

const newPackageScripts = packageJson?.scripts ?? {};
if (newPackageScripts['validate:manual-source-snapshot-schema'] !== `node ${scriptPath}`) {
  fail('package.json must add validate:manual-source-snapshot-schema with the manual source snapshot validator.');
}
const checkScript = newPackageScripts.check ?? '';
const previousGateCommand = 'npm run validate:major-country-v0-completion-gate';
const newCommand = 'npm run validate:manual-source-snapshot-schema';
if (!checkScript.includes(`${previousGateCommand} && ${newCommand}`)) {
  fail('npm run check must run validate:manual-source-snapshot-schema immediately after validate:major-country-v0-completion-gate.');
}

if (packageAtHead) {
  for (const dependencyField of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const before = packageAtHead[dependencyField] ?? {};
    const after = packageJson?.[dependencyField] ?? {};
    for (const dependencyName of Object.keys(after)) {
      if (!(dependencyName in before)) fail(`package.json must not add new dependency ${dependencyName}.`);
    }
  }
}

for (const relativePath of [schemaPath, firstBatchPath, packagePath]) {
  const text = readText(relativePath) ?? '';
  for (const { pattern, label } of prohibitedCodePatterns) {
    if (pattern.test(text)) fail(`${relativePath} must not add ${label}.`);
  }
}

if (errors.length > 0) {
  console.error('Manual source snapshot schema validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Manual source snapshot schema validation passed.');
