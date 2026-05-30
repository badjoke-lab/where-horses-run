import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const gatePath = 'data/static/major-country-timetable-v0-completion-gate.json';
const ingestionPath = 'data/static/major-country-timetable-ingestion-v0.json';
const annualPath = 'data/static/major-country-annual-fixtures-v0.json';
const rollingPath = 'data/static/major-country-rolling-racecards-v0.json';
const timetablePath = 'data/static/major-country-timetable-v0.json';
const routePath = 'src/pages/major-countries/timetable.astro';
const errors = [];

const expectedCountries = new Set([
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
]);
const legacyKey = 'singapore/singapore-turf-club-legacy';
const requiredPolicyFlags = [
  'preview_samples_are_not_completion',
  'annual_fixture_is_candidate_until_confirmed_by_rolling_or_racecard',
  'rolling_or_racecard_source_confirms_final_times',
  'pending_records_remain_visible',
  'coverage_gaps_remain_visible',
  'no_fake_generated_times',
  'no_live_fetch_runtime',
  'no_full_automation_claim',
  'no_live_coverage_claim',
  'no_odds',
  'no_payouts',
  'no_predictions',
  'no_tips',
];
const requiredInputs = [
  'major-country-timetable-ingestion-v0.json',
  'major-country-annual-fixtures-v0.json',
  'major-country-rolling-racecards-v0.json',
  'major-country-timetable-v0.json',
  '/major-countries/timetable/',
];
const userRequirementNeedles = [
  '/major-countries/timetable/',
  'country',
  'system/operator',
  'meeting date',
  'racecourse',
  'first-race time',
  'all race times',
  'pending status',
  'coverage gaps',
  'singapore',
  'legacy/no active racing',
  'annual source',
  'rolling/racecard source',
  'source_capture_date',
  'last_checked',
  'stale_status',
  'static/manual',
  'not live coverage',
];
const operationsRequirementNeedles = [
  'ingestion/source plan layer',
  'annual candidate fixture layer',
  'rolling/racecard confirmation layer',
  'merged display timetable layer',
  'user-facing timetable route',
  'source trace',
  'annual and rolling data',
  'explicit pending records',
  'explicit coverage gaps',
  'validation coverage for the full v0 chain',
  'parser/cron/source-specific automation',
];
const nonGoalNeedles = [
  'no live coverage',
  'no full automation',
  'no scraper/parser in pr-106',
  'no cron in pr-106',
  'no odds',
  'no payouts',
  'no predictions',
  'no tips',
  'no full racecard republication',
  'no claim of complete worldwide coverage',
];
const nextPhaseNeedles = [
  'parser implementation',
  'source-specific extraction',
  'scheduled refresh/cron',
  'stale automation',
  'improved coverage window expansion',
  'country/group-by-group data quality improvement',
  'broader confirmed racecard coverage',
];
const routeNeedles = [
  'major-country-timetable-v0.json',
  'static/manual timetable',
  'not live coverage',
  'country',
  'system/operator',
  'meeting date',
  'racecourse',
  'first-race time',
  'all race times',
  'annual source',
  'rolling/racecard source',
  'source_capture_date',
  'last_checked',
];
const pendingStatuses = ['pending', 'time_pending', 'source_not_yet_published', 'needs_manual_review'];
const unsupportedFieldNames = new Set(['odds', 'payout', 'payouts', 'prediction', 'predictions', 'tip', 'tips', 'betting_advice']);
const unsupportedPositivePatterns = [
  { pattern: /\blive coverage\b/i, label: 'live coverage' },
  { pattern: /\bfull automation\b/i, label: 'full automation' },
  { pattern: /\bcomplete worldwide coverage\b/i, label: 'complete worldwide coverage' },
  { pattern: /\bgenerated fake times\b/i, label: 'generated fake times' },
  { pattern: /\bbetting advice\b/i, label: 'betting advice' },
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
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function key(record) {
  return `${record?.country_id}/${record?.group_id}`;
}
function compactText(value) {
  return Array.isArray(value) ? value.join('\n').toLowerCase() : String(value ?? '').toLowerCase();
}
function requireIncludes(haystack, needle, label) {
  if (!compactText(haystack).includes(needle.toLowerCase())) fail(`${label} must include ${needle}.`);
}
function walk(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!isObject(value)) return;
  visitor(value, pathParts);
  for (const [objectKey, entryValue] of Object.entries(value)) walk(entryValue, visitor, [...pathParts, objectKey]);
}
function hasSafetyNegation(context) {
  return /\b(?:no|not|never|without|does not|do not|must not|is not|are not)\b|\bno_|_not_|not_|no-|not-/i.test(context);
}
function rejectUnsupportedContent(value, label) {
  walk(value, (object, pathParts) => {
    for (const fieldName of Object.keys(object)) {
      if (unsupportedFieldNames.has(fieldName)) fail(`${label}.${[...pathParts, fieldName].join('.')} is unsupported.`);
    }
  });

  const lines = JSON.stringify(value, null, 2).split(/\n/);
  for (const [index, line] of lines.entries()) {
    for (const { pattern, label: claimLabel } of unsupportedPositivePatterns) {
      if (pattern.test(line) && !hasSafetyNegation(line)) {
        fail(`${label} contains unsupported positive ${claimLabel} claim on serialized line ${index + 1}.`);
      }
    }
  }
}
function rejectUnsupportedRouteText(text) {
  const lines = text.split(/\n/);
  for (const [index, line] of lines.entries()) {
    for (const { pattern, label } of unsupportedPositivePatterns) {
      if (pattern.test(line) && !hasSafetyNegation(line)) {
        fail(`${routePath} contains unsupported positive ${label} claim on line ${index + 1}.`);
      }
    }
  }
}

const gate = readJson(gatePath);
const ingestion = readJson(ingestionPath);
const annual = readJson(annualPath);
const rolling = readJson(rollingPath);
const timetable = readJson(timetablePath);
const routeText = readText(routePath) || '';

if (gate?.schema_version !== 'major-country-timetable-v0-completion-gate') fail('completion gate schema_version must be major-country-timetable-v0-completion-gate.');
if (gate?.scope !== 'major-countries-timetable-v0') fail('completion gate scope must be major-countries-timetable-v0.');
if (!isNonEmptyString(gate?.created_at)) fail('completion gate created_at must be a non-empty string.');
if (gate?.completion_status !== 'static_manual_timetable_v0_ready') fail('completion_status must be static_manual_timetable_v0_ready.');
for (const flag of requiredPolicyFlags) {
  if (gate?.source_policy?.[flag] !== true) fail(`completion gate source_policy.${flag} must be true.`);
}
for (const input of requiredInputs) requireIncludes(gate?.required_inputs, input, 'completion gate required_inputs');
for (const field of ['start_date', 'end_date', 'basis']) {
  if (gate?.coverage_window?.[field] !== timetable?.coverage_window?.[field]) fail(`completion gate coverage_window.${field} must match merged timetable.`);
}
for (const needle of userRequirementNeedles) requireIncludes(gate?.user_facing_requirements, needle, 'completion gate user_facing_requirements');
for (const needle of operationsRequirementNeedles) requireIncludes(gate?.operations_requirements, needle, 'completion gate operations_requirements');
for (const needle of nonGoalNeedles) requireIncludes(gate?.non_goals, needle, 'completion gate non_goals');
for (const needle of nextPhaseNeedles) requireIncludes(gate?.next_phase, needle, 'completion gate next_phase');

const summary = gate?.validation_summary ?? {};
if (summary.expected_country_count !== 13) fail('validation_summary.expected_country_count must be 13.');
if (summary.expected_active_group_count !== 24) fail('validation_summary.expected_active_group_count must be 24.');
if (summary.expected_legacy_group_count !== 1) fail('validation_summary.expected_legacy_group_count must be 1.');
if (summary.expected_route !== '/major-countries/timetable/') fail('validation_summary.expected_route must be /major-countries/timetable/.');
if (summary.required_confirmed_time_records_minimum !== 1) fail('validation_summary.required_confirmed_time_records_minimum must be 1.');
if (summary.pending_records_allowed !== true) fail('validation_summary.pending_records_allowed must be true.');
if (summary.coverage_gaps_allowed !== true) fail('validation_summary.coverage_gaps_allowed must be true.');
if (summary.singapore_legacy_required !== true) fail('validation_summary.singapore_legacy_required must be true.');

const ingestionRecords = Array.isArray(ingestion?.records) ? ingestion.records : [];
const activeIngestionRecords = ingestionRecords.filter((record) => record.status !== 'legacy_no_active_racing');
const legacyIngestionRecords = ingestionRecords.filter((record) => record.status === 'legacy_no_active_racing');
if (ingestion?.target_country_count !== 13) fail('PR-102 ingestion target_country_count must be 13.');
if (ingestion?.target_active_group_count !== 24) fail('PR-102 ingestion target_active_group_count must be 24.');
if (ingestion?.target_legacy_group_count !== 1) fail('PR-102 ingestion target_legacy_group_count must be 1.');
if (new Set(ingestionRecords.map((record) => record.country_id)).size !== 13) fail('PR-102 ingestion records must represent 13 countries.');
if (activeIngestionRecords.length !== 24) fail('PR-102 ingestion records must represent 24 active acquisition groups.');
if (legacyIngestionRecords.length !== 1 || key(legacyIngestionRecords[0]) !== legacyKey) fail('PR-102 ingestion records must include Singapore as the single legacy/no active racing group.');

if (!Array.isArray(annual?.records) || !Array.isArray(annual?.coverage_gaps)) fail('PR-103 annual file must have records[] and coverage_gaps[].');
if ((annual?.records?.length ?? 0) + (annual?.coverage_gaps?.length ?? 0) === 0) fail('PR-103 annual file must have candidate records or coverage gaps.');
if (!Array.isArray(rolling?.records) || !Array.isArray(rolling?.pending_records) || !Array.isArray(rolling?.coverage_gaps)) fail('PR-104 rolling file must have records[], pending_records[], and coverage_gaps[].');
if (!Array.isArray(timetable?.records) || !Array.isArray(timetable?.coverage_gaps)) fail('PR-105 merged timetable file must have records[] and coverage_gaps[].');

const timetableRecords = Array.isArray(timetable?.records) ? timetable.records : [];
const timetableGaps = Array.isArray(timetable?.coverage_gaps) ? timetable.coverage_gaps : [];
const represented = [...timetableRecords, ...timetableGaps];
const representedCountries = new Set(represented.map((record) => record.country_id));
const representedActiveKeys = new Set(represented.filter((record) => key(record) !== legacyKey).map(key));
const representedLegacyKeys = new Set(represented.filter((record) => key(record) === legacyKey).map(key));

if (representedCountries.size !== 13) fail(`merged timetable must represent 13 countries across records[] + coverage_gaps[]; found ${representedCountries.size}.`);
for (const countryId of expectedCountries) {
  if (!representedCountries.has(countryId)) fail(`merged timetable missing country ${countryId}.`);
}
if (representedActiveKeys.size !== 24) fail(`merged timetable must represent 24 active groups across records[] + coverage_gaps[]; found ${representedActiveKeys.size}.`);
if (!representedLegacyKeys.has(legacyKey)) fail('merged timetable must include Singapore legacy/no active racing.');
if (representedActiveKeys.has(legacyKey)) fail('Singapore legacy/no active racing must not be counted as active.');
for (const record of activeIngestionRecords) {
  if (!representedActiveKeys.has(key(record))) fail(`active acquisition group ${key(record)} is silently dropped from merged timetable records[] + coverage_gaps[].`);
}

const sourceTraceRecords = timetableRecords.filter((record) => isObject(record.source_trace));
if (sourceTraceRecords.length !== timetableRecords.length) fail('all merged timetable records must include source_trace.');
for (const record of sourceTraceRecords) {
  const traceText = JSON.stringify(record.source_trace).toLowerCase();
  if (!traceText.includes('annual') && !traceText.includes('rolling')) fail(`${record.timetable_id} source_trace must point back to annual and/or rolling data.`);
}

const confirmedRecords = timetableRecords.filter((record) => record.display_status === 'confirmed_times' || /confirmed/.test(String(record.final_times_status ?? record.stale_status ?? record.status ?? '')));
if (confirmedRecords.length < 1) fail('at least one confirmed timetable record is required.');
for (const record of confirmedRecords) {
  if (!isNonEmptyString(record.first_race_time)) fail(`${record.timetable_id} confirmed record must have first_race_time.`);
  if (!Array.isArray(record.races) || record.races.length === 0) fail(`${record.timetable_id} confirmed record must have non-empty races[].`);
  for (const [index, race] of (record.races ?? []).entries()) {
    if (typeof race.race_number !== 'number') fail(`${record.timetable_id}.races[${index}].race_number must be a number.`);
    if (!isNonEmptyString(race.race_time)) fail(`${record.timetable_id}.races[${index}].race_time must be a non-empty string.`);
    if (!isNonEmptyString(race.race_name_or_label)) fail(`${record.timetable_id}.races[${index}].race_name_or_label must be a non-empty string.`);
  }
}
const pendingRecords = timetableRecords.filter((record) => pendingStatuses.some((status) => JSON.stringify([record.display_status, record.stale_status, record.notes]).toLowerCase().includes(status)));
if (pendingRecords.length === 0) fail('pending records must remain visible in the merged timetable.');
if (!pendingRecords.some((record) => pendingStatuses.some((status) => JSON.stringify(record).toLowerCase().includes(status)))) fail('pending records must have pending/time_pending/source_not_yet_published/needs_manual_review style status.');
if (timetableGaps.length === 0) fail('coverage gaps must remain visible in the merged timetable.');

for (const needle of routeNeedles) requireIncludes(routeText, needle, routePath);
if (!/stale_status|pending status/i.test(routeText)) fail(`${routePath} must contain stale_status or pending status wording.`);

rejectUnsupportedContent(gate, gatePath);
rejectUnsupportedContent(timetable, timetablePath);
rejectUnsupportedRouteText(routeText);

if (errors.length > 0) {
  console.error('Major-country timetable v0 completion gate validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country timetable v0 completion gate validation passed.');
