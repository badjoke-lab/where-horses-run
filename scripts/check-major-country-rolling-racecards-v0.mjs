import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rollingPath = 'data/static/major-country-rolling-racecards-v0.json';
const annualPath = 'data/static/major-country-annual-fixtures-v0.json';
const ingestionPath = 'data/static/major-country-timetable-ingestion-v0.json';
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
const requiredPolicyFlags = [
  'rolling_or_racecard_source_confirms_final_times',
  'annual_fixture_is_candidate_until_confirmed_by_rolling_or_racecard',
  'no_preview_samples',
  'no_one_record_per_group_completion',
  'no_fake_generated_times',
  'no_live_fetch_runtime',
  'no_full_automation_claim',
  'no_live_coverage_claim',
  'no_odds',
  'no_payouts',
  'no_predictions',
  'no_tips',
];
const requiredRecordFields = [
  'record_id',
  'country_id',
  'group_id',
  'racecourse',
  'meeting_date',
  'first_race_time',
  'races',
  'source_url',
  'source_label',
  'source_type',
  'source_capture_date',
  'local_timezone',
  'confidence',
  'status',
  'replaces_or_confirms_annual_fixture',
  'final_times_status',
  'source_trace',
];
const requiredPendingFields = [
  'pending_id',
  'country_id',
  'group_id',
  'racecourse',
  'meeting_date',
  'source_url',
  'source_label',
  'source_type',
  'source_capture_date',
  'status',
  'final_times_status',
  'notes',
  'required_follow_up',
];
const requiredGapFields = [
  'gap_id',
  'country_id',
  'group_id',
  'source_url',
  'source_label',
  'gap_type',
  'status',
  'source_capture_date',
  'notes',
  'required_follow_up',
];
const allowedSourceTypes = new Set(['racecard', 'entries', 'declarations', 'daily_race_info', 'rolling_fixture', 'fields', 'acceptances']);
const allowedFinalStatuses = new Set([
  'confirmed_by_official_racecard',
  'confirmed_by_entries',
  'confirmed_by_daily_info',
  'confirmed_by_fields',
  'confirmed_by_acceptances',
]);
const allowedPendingStatuses = new Set(['pending_racecard', 'time_pending_official_racecard', 'source_not_yet_published', 'needs_manual_review']);
const allowedGapTypes = new Set([
  'racecard_not_available',
  'entries_not_available',
  'declarations_not_available',
  'daily_info_not_available',
  'source_not_structured',
  'source_requires_manual_review',
  'no_active_racing',
]);
const allowedPolicyKeysWithForbiddenWords = new Set(requiredPolicyFlags);
const forbiddenFieldNames = new Set(['odds', 'payout', 'payouts', 'prediction', 'predictions', 'tip', 'tips', 'selection', 'selections']);
const forbiddenStatusFragments = [/fake/i, /generated/i, /synthetic/i, /placeholder/i, /estimated/i];
const forbiddenPositiveWording = [
  /(?:^|\b)(?:live coverage|live-covered|live covered)(?:\b|$)/i,
  /(?:^|\b)(?:full automation|fully automated|automated end-to-end)(?:\b|$)/i,
  /(?:^|\b)(?:preview sample|preview samples|sample completion|sample-only completion)(?:\b|$)/i,
];
const forbiddenCompletionWording = /one record per group completion/i;

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

function groupKey(record) {
  return `${record?.country_id}/${record?.group_id}`;
}

function meetingKey(record) {
  return `${record?.country_id}/${record?.group_id}/${record?.meeting_date}/${record?.racecourse}`;
}

function requireStringField(record, field, label) {
  if (!isNonEmptyString(record?.[field])) fail(`${label}.${field} must be a non-empty string.`);
}

function requireFields(record, fields, label) {
  for (const field of fields) {
    if (!(field in record)) fail(`${label}.${field} is required.`);
  }
}

function collectFieldNames(value, names = [], pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectFieldNames(entry, names, [...pathParts, String(index)]));
    return names;
  }
  if (isPlainObject(value)) {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      names.push({ name: entryKey, path: [...pathParts, entryKey].join('.') });
      collectFieldNames(entryValue, names, [...pathParts, entryKey]);
    }
  }
  return names;
}

function collectStrings(value, strings = [], pathParts = []) {
  if (typeof value === 'string') {
    strings.push({ path: pathParts.join('.'), value });
    return strings;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectStrings(entry, strings, [...pathParts, String(index)]));
    return strings;
  }
  if (isPlainObject(value)) {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      collectStrings(entryValue, strings, [...pathParts, entryKey]);
    }
  }
  return strings;
}

function hasNegation(value) {
  return /\b(?:no|not|never|without|does not|do not|must not|is not|are not)\b/i.test(value);
}

const rolling = readJson(rollingPath);
const annual = readJson(annualPath);
const ingestion = readJson(ingestionPath);

if (rolling?.schema_version !== 'major-country-rolling-racecards-v0') fail('schema_version must be major-country-rolling-racecards-v0.');
if (rolling?.scope !== 'major-countries-timetable-v0') fail('scope must be major-countries-timetable-v0.');
if (!isNonEmptyString(rolling?.created_at)) fail('created_at must be a non-empty string.');
if (rolling?.coverage_window?.start_date !== '2026-05-30') fail('coverage_window.start_date must be 2026-05-30.');
if (rolling?.coverage_window?.end_date !== '2026-06-30') fail('coverage_window.end_date must be 2026-06-30.');
if (rolling?.coverage_window?.basis !== 'static_manual_v0_window') fail('coverage_window.basis must be static_manual_v0_window.');
if (rolling?.coverage_window?.start_date !== annual?.coverage_window?.start_date || rolling?.coverage_window?.end_date !== annual?.coverage_window?.end_date) {
  fail('coverage window must match PR-103 annual fixtures.');
}

for (const flag of requiredPolicyFlags) {
  if (rolling?.source_policy?.[flag] !== true) fail(`source_policy.${flag} must be true.`);
}

const records = Array.isArray(rolling?.records) ? rolling.records : [];
const pendingRecords = Array.isArray(rolling?.pending_records) ? rolling.pending_records : [];
const coverageGaps = Array.isArray(rolling?.coverage_gaps) ? rolling.coverage_gaps : [];
if (!Array.isArray(rolling?.records)) fail('records must be an array.');
if (!Array.isArray(rolling?.pending_records)) fail('pending_records must be an array.');
if (!Array.isArray(rolling?.coverage_gaps)) fail('coverage_gaps must be an array.');
if (records.length === 0) fail('records must not be empty.');

const ingestionRecords = Array.isArray(ingestion?.records) ? ingestion.records : [];
const activeIngestion = ingestionRecords.filter((record) => record.status !== 'legacy_no_active_racing');
const expectedActiveKeys = new Set(activeIngestion.map(groupKey));
const representedItems = [...records, ...pendingRecords, ...coverageGaps];
const representedCountries = new Set(representedItems.map((record) => record.country_id));
const representedActiveKeys = new Set(representedItems.filter((record) => groupKey(record) !== 'singapore/singapore-turf-club-legacy').map(groupKey));

for (const country of expectedCountries) {
  if (!representedCountries.has(country)) fail(`country ${country} must be represented across records, pending_records, or coverage_gaps.`);
}
if (representedCountries.size !== expectedCountries.length) fail(`expected exactly ${expectedCountries.length} represented countries, found ${representedCountries.size}.`);
for (const key of expectedActiveKeys) {
  if (!representedActiveKeys.has(key)) fail(`active group ${key} must be represented and not silently dropped.`);
}
if (representedActiveKeys.size !== 24) fail(`expected 24 active represented groups, found ${representedActiveKeys.size}.`);

const singaporeLegacy = coverageGaps.find((gap) => gap.country_id === 'singapore' && gap.group_id === 'singapore-turf-club-legacy');
if (!singaporeLegacy) fail('Singapore legacy coverage gap is required.');
if (singaporeLegacy?.gap_type !== 'no_active_racing') fail('Singapore legacy gap_type must be no_active_racing.');
if (singaporeLegacy?.status !== 'legacy_no_active_racing') fail('Singapore legacy status must be legacy_no_active_racing.');
if (representedActiveKeys.has('singapore/singapore-turf-club-legacy')) fail('Singapore legacy must not be counted as active.');

const recordGroups = new Set(records.map(groupKey));
if (records.length <= recordGroups.size) fail('records must not be merely one confirmed record per group.');

const annualRecordIds = new Set((annual?.records ?? []).map((record) => record.record_id));
const annualMeetingKeys = new Set((annual?.records ?? []).map(meetingKey));
const pendingAnnualIds = new Set(pendingRecords.map((record) => record.annual_record_id).filter(Boolean));
for (const recordId of annualRecordIds) {
  if (!pendingAnnualIds.has(recordId)) fail(`annual candidate ${recordId} must be preserved in pending_records unless confirmed.`);
}

records.forEach((record, index) => {
  const label = `records[${index}]`;
  requireFields(record, requiredRecordFields, label);
  for (const field of ['record_id', 'country_id', 'group_id', 'racecourse', 'meeting_date', 'first_race_time', 'source_url', 'source_label', 'source_type', 'source_capture_date', 'local_timezone', 'confidence', 'status', 'final_times_status']) {
    requireStringField(record, field, label);
  }
  if (!allowedSourceTypes.has(record.source_type)) fail(`${label}.source_type must be an allowed rolling/racecard type.`);
  if (!allowedFinalStatuses.has(record.final_times_status)) fail(`${label}.final_times_status must be an allowed confirmed status.`);
  if (typeof record.replaces_or_confirms_annual_fixture !== 'boolean') fail(`${label}.replaces_or_confirms_annual_fixture must be boolean.`);
  if (!('matched_annual_record_id' in record) && !('annual_record_key' in record)) fail(`${label} must include matched_annual_record_id or annual_record_key.`);
  if (record.matched_annual_record_id && !annualRecordIds.has(record.matched_annual_record_id)) fail(`${label}.matched_annual_record_id must reference PR-103 annual records.`);
  if (record.annual_record_key && annualMeetingKeys.has(record.annual_record_key)) fail(`${label}.annual_record_key should use matched_annual_record_id when a PR-103 record exists.`);
  if (!Array.isArray(record.races) || record.races.length === 0) fail(`${label}.races must be a non-empty array.`);
  (Array.isArray(record.races) ? record.races : []).forEach((race, raceIndex) => {
    const raceLabel = `${label}.races[${raceIndex}]`;
    for (const field of ['race_number', 'race_time', 'race_name_or_label']) {
      if (!(field in race)) fail(`${raceLabel}.${field} is required.`);
    }
    if (typeof race.race_number !== 'number' || race.race_number < 1) fail(`${raceLabel}.race_number must be a positive number.`);
    requireStringField(race, 'race_time', raceLabel);
    requireStringField(race, 'race_name_or_label', raceLabel);
  });
  const trace = record.source_trace;
  for (const field of ['rolling_source_url', 'rolling_source_label', 'source_capture_date', 'annual_fixture_source_url', 'derived_from']) {
    if (!(field in (trace ?? {}))) fail(`${label}.source_trace.${field} is required.`);
  }
  if (!Array.isArray(trace?.derived_from)) fail(`${label}.source_trace.derived_from must be an array.`);
  for (const source of ['major-country-timetable-ingestion-v0', 'major-country-annual-fixtures-v0']) {
    if (!trace?.derived_from?.includes(source)) fail(`${label}.source_trace.derived_from must include ${source}.`);
  }
});

pendingRecords.forEach((record, index) => {
  const label = `pending_records[${index}]`;
  requireFields(record, requiredPendingFields, label);
  for (const field of ['pending_id', 'country_id', 'group_id', 'racecourse', 'meeting_date', 'source_url', 'source_label', 'source_type', 'source_capture_date', 'status', 'final_times_status', 'notes', 'required_follow_up']) {
    requireStringField(record, field, label);
  }
  if (!('annual_record_id' in record) && !('annual_record_key' in record)) fail(`${label} must include annual_record_id or annual_record_key.`);
  if (record.annual_record_id && !annualRecordIds.has(record.annual_record_id)) fail(`${label}.annual_record_id must reference PR-103 annual records.`);
  if (!allowedPendingStatuses.has(record.status)) fail(`${label}.status must be an allowed pending status.`);
  if (record.final_times_status !== 'pending_racecard') fail(`${label}.final_times_status must be pending_racecard.`);
});

coverageGaps.forEach((gap, index) => {
  const label = `coverage_gaps[${index}]`;
  requireFields(gap, requiredGapFields, label);
  for (const field of ['gap_id', 'country_id', 'group_id', 'source_url', 'source_label', 'gap_type', 'status', 'source_capture_date', 'notes', 'required_follow_up']) {
    requireStringField(gap, field, label);
  }
  if (!allowedGapTypes.has(gap.gap_type)) fail(`${label}.gap_type must be an allowed rolling/racecard gap type.`);
});

for (const { name, path: fieldPath } of collectFieldNames(rolling)) {
  if (forbiddenFieldNames.has(name) && !allowedPolicyKeysWithForbiddenWords.has(name)) {
    fail(`${fieldPath} must not use forbidden field name ${name}.`);
  }
  if (/^(?:no_)?(?:odds|payouts?|predictions?|tips?)$/i.test(name) && !allowedPolicyKeysWithForbiddenWords.has(name)) {
    fail(`${fieldPath} must not use commercial/pick fields outside source_policy guardrails.`);
  }
}

for (const { path: stringPath, value } of collectStrings(rolling)) {
  const policyKey = stringPath.startsWith('source_policy.') ? stringPath.split('.')[1] : null;
  if (policyKey && allowedPolicyKeysWithForbiddenWords.has(policyKey)) continue;
  if (/(?:fake|generated|synthetic|placeholder|estimated)/i.test(value) && /time|status/i.test(stringPath)) {
    fail(`${stringPath} must not use fake/generated race-time status wording.`);
  }
  if (/(?:odds|payouts?|predictions?|tips?)/i.test(value)) {
    fail(`${stringPath} must not contain odds, payouts, predictions, or tips wording.`);
  }
  for (const claimPattern of forbiddenPositiveWording) {
    if (claimPattern.test(value) && !hasNegation(value)) fail(`${stringPath} must not make a live/full-automation/preview claim.`);
  }
  if (forbiddenCompletionWording.test(value) && !hasNegation(value)) fail(`${stringPath} must not use one-record-per-group completion wording.`);
}

for (const record of [...records, ...pendingRecords]) {
  for (const field of ['status', 'final_times_status']) {
    for (const fragment of forbiddenStatusFragments) {
      if (fragment.test(record[field] ?? '')) fail(`${record.record_id ?? record.pending_id}.${field} must not use fake/generated race-time status.`);
    }
  }
}

if (errors.length > 0) {
  console.error('Major-country rolling racecards v0 validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Major-country rolling racecards v0 validation passed (${records.length} confirmed, ${pendingRecords.length} pending, ${coverageGaps.length} gaps).`);
