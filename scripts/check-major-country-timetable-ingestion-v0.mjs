import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ingestionPath = 'data/static/major-country-timetable-ingestion-v0.json';
const sourceGroupsPath = 'data/static/major-country-acquisition-source-groups.json';
const previewPaths = [
  'data/static/preview-timetable-samples-batch-001.json',
  'data/static/preview-timetable-samples-batch-002.json',
  'docs/runbooks/pr-099.md',
  'docs/runbooks/pr-100.md',
  'docs/runbooks/pr-101.md',
];
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
const requiredRecordFields = [
  'country_id',
  'group_id',
  'racecourses',
  'annual_fixture_sources',
  'rolling_update_sources',
  'racecard_entries_declarations_daily_info_sources',
  'annual_schedule_records',
  'rolling_update_records',
  'per_race_time_records',
  'source_priority',
  'update_frequency',
  'last_checked',
  'status',
];
const requiredPolicyFlags = [
  'preview_samples_are_not_production_timetable',
  'manual_static_ingestion_only',
  'no_live_fetch_runtime',
  'no_full_automation_claim',
  'no_live_coverage_claim',
  'no_odds',
  'no_payouts',
  'no_predictions',
  'no_tips',
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

function key(record) {
  return `${record?.country_id}/${record?.group_id}`;
}

const ingestion = readJson(ingestionPath);
const sourceGroups = readJson(sourceGroupsPath);

if (ingestion?.schema_version !== 'major-country-timetable-ingestion-v0') {
  fail('schema_version must be major-country-timetable-ingestion-v0.');
}
if (ingestion?.scope !== 'major-countries-timetable-v0') {
  fail('scope must be major-countries-timetable-v0.');
}
if (ingestion?.target_country_count !== 13) fail('target_country_count must be 13.');
if (ingestion?.target_active_group_count !== 24) fail('target_active_group_count must be 24.');
if (ingestion?.target_legacy_group_count !== 1) fail('target_legacy_group_count must be 1.');

for (const flag of requiredPolicyFlags) {
  if (ingestion?.source_policy?.[flag] !== true) fail(`source_policy.${flag} must be true.`);
}

const coveragePolicyText = collectStrings(ingestion?.v0_coverage_policy).join('\n').toLowerCase();
for (const pr of ['pr-103', 'pr-104']) {
  if (!coveragePolicyText.includes(pr) || !coveragePolicyText.includes('not one sample per group')) {
    fail(`v0_coverage_policy must state that ${pr.toUpperCase()} cannot be satisfied by one sample per group.`);
  }
}
for (const phrase of ['unresolved items must not be dropped', 'missing structured source data must be represented explicitly']) {
  if (!coveragePolicyText.includes(phrase)) fail(`v0_coverage_policy must include: ${phrase}.`);
}

const records = Array.isArray(ingestion?.records) ? ingestion.records : [];
if (!Array.isArray(ingestion?.records)) fail('records must be an array.');

const representedCountries = new Set(records.map((record) => record.country_id));
if (representedCountries.size !== 13) fail(`records must represent 13 countries; found ${representedCountries.size}.`);
for (const country of expectedCountries) {
  if (!representedCountries.has(country)) fail(`records must include country ${country}.`);
}

const activeRecords = records.filter((record) => record.status !== 'legacy_no_active_racing');
const legacyRecords = records.filter((record) => record.country_id === 'singapore' || record.status === 'legacy_no_active_racing');
if (activeRecords.length !== 24) fail(`records must include 24 active groups; found ${activeRecords.length}.`);
if (activeRecords.some((record) => record.country_id === 'singapore')) fail('Singapore must not be counted as an active group.');
if (legacyRecords.length !== 1 || legacyRecords[0]?.country_id !== 'singapore' || legacyRecords[0]?.status !== 'legacy_no_active_racing') {
  fail('Singapore legacy record must exist exactly once with status legacy_no_active_racing.');
}

const sourceRecords = [];
for (const country of sourceGroups?.countries ?? []) {
  for (const group of country.acquisition_groups ?? []) {
    sourceRecords.push(`${country.country_id}/${group.group_id}`);
  }
}
const ingestionKeys = new Set(records.map(key));
for (const sourceKey of sourceRecords) {
  if (!ingestionKeys.has(sourceKey)) fail(`${ingestionPath} must include source group ${sourceKey}.`);
}

for (const record of records) {
  const recordKey = key(record);
  for (const field of requiredRecordFields) {
    if (!(field in record)) fail(`${recordKey}: ${field} is required.`);
  }
  if (!('system_name' in record) && !('group_name' in record)) fail(`${recordKey}: system_name or group_name is required.`);
  for (const field of ['racecourses', 'annual_fixture_sources', 'rolling_update_sources', 'racecard_entries_declarations_daily_info_sources', 'annual_schedule_records', 'rolling_update_records', 'per_race_time_records']) {
    if (!Array.isArray(record[field])) fail(`${recordKey}: ${field} must be an array.`);
  }
  for (const field of ['annual_schedule_records', 'rolling_update_records', 'per_race_time_records']) {
    if (Array.isArray(record[field]) && record[field].length !== 0) fail(`${recordKey}: ${field} must remain empty in PR-102.`);
  }
  if (!Array.isArray(record.source_priority) || record.source_priority.length === 0) fail(`${recordKey}: source_priority must be a non-empty array.`);
  const priorityText = collectStrings(record.source_priority).join(' ').toLowerCase();
  if (!priorityText.includes('racecard') || !priorityText.includes('rolling') || !priorityText.includes('annual')) {
    fail(`${recordKey}: source_priority must mention racecard/daily info, rolling update, and annual fixture priority.`);
  }
  if (!isNonEmptyString(record.update_frequency)) fail(`${recordKey}: update_frequency must be a non-empty string.`);
  if (!isNonEmptyString(record.last_checked)) fail(`${recordKey}: last_checked must be a non-empty string.`);
  if (record.country_id === 'singapore') {
    if (record.status !== 'legacy_no_active_racing') fail(`${recordKey}: Singapore must use legacy_no_active_racing.`);
  } else if (!['active_ingestion_planned', 'source_plan_ready'].includes(record.status)) {
    fail(`${recordKey}: active groups must use active_ingestion_planned or source_plan_ready.`);
  }
}

const forbiddenPreviewProductionClaims = [
  /preview[^\n.]{0,120}(?:production[- ]complete|production coverage|production timetable coverage|live coverage|full coverage)/i,
  /sample[^\n.]{0,120}(?:production[- ]complete|production coverage|production timetable coverage|live coverage|full coverage)/i,
  /(?:production[- ]complete|production coverage|production timetable coverage|live coverage|full coverage)[^\n.]{0,120}(?:preview|sample)/i,
];
for (const previewPath of previewPaths) {
  const text = readText(previewPath);
  if (text === null) continue;
  for (const pattern of forbiddenPreviewProductionClaims) {
    const match = text.match(pattern);
    if (!match) continue;
    const claim = match[0];
    if (/\b(?:not|no|never|must not|does not|do not|is not|are not)\b/i.test(claim)) continue;
    fail(`${previewPath} must not use production-complete wording for preview/sample data: ${claim}`);
  }
}

if (errors.length > 0) {
  console.error('Major-country timetable ingestion v0 validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country timetable ingestion v0 validation passed.');
