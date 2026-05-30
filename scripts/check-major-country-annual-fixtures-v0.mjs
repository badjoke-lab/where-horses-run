import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fixturesPath = 'data/static/major-country-annual-fixtures-v0.json';
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
  'annual_fixture_is_candidate_until_confirmed_by_rolling_or_racecard',
  'annual_fixture_does_not_confirm_final_race_times',
  'rolling_or_racecard_required_for_final_times',
  'no_preview_samples',
  'no_one_record_per_group_completion',
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
  'source_url',
  'source_label',
  'source_type',
  'source_capture_date',
  'local_timezone',
  'confidence',
  'status',
  'notes',
  'annual_fixture_role',
  'final_times_status',
  'source_trace',
];
const requiredTraceFields = [
  'annual_fixture_source_url',
  'annual_fixture_source_label',
  'source_capture_date',
  'derived_from',
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
const allowedSourceTypes = new Set(['annual_fixture', 'season_fixture', 'fixture_calendar', 'fixture_list']);
const allowedGapTypes = new Set([
  'source_not_structured',
  'annual_source_not_available',
  'source_requires_manual_review',
  'no_active_racing',
  'official_source_available_but_records_pending',
]);
const forbiddenSemanticFields = new Set([
  'odds',
  'payout',
  'payouts',
  'prediction',
  'predictions',
  'tip',
  'tips',
  'selection',
  'selections',
]);
const forbiddenPositiveWording = [
  /(?:^|\b)(?:live coverage|live-covered|live covered)(?:\b|$)/i,
  /(?:^|\b)(?:full automation|fully automated|automated end-to-end)(?:\b|$)/i,
  /(?:^|\b)(?:preview sample|preview samples|sample completion|sample-only completion|one record per group completion)(?:\b|$)/i,
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

function key(record) {
  return `${record?.country_id}/${record?.group_id}`;
}

function collectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectKeys(entry, keys);
  } else if (isPlainObject(value)) {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      keys.push(entryKey);
      collectKeys(entryValue, keys);
    }
  }
  return keys;
}

function collectStringsOutsidePolicy(value, strings = [], pathParts = []) {
  if (pathParts[0] === 'source_policy') return strings;
  if (typeof value === 'string') {
    strings.push({ path: pathParts.join('.'), value });
    return strings;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectStringsOutsidePolicy(entry, strings, [...pathParts, String(index)]));
    return strings;
  }
  if (isPlainObject(value)) {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      collectStringsOutsidePolicy(entryValue, strings, [...pathParts, entryKey]);
    }
  }
  return strings;
}

function hasNegationNearClaim(value) {
  return /\b(?:no|not|never|without|does not|do not|must not|is not|are not|pending|candidate)\b/i.test(value);
}

const fixtures = readJson(fixturesPath);
const ingestion = readJson(ingestionPath);

if (fixtures?.schema_version !== 'major-country-annual-fixtures-v0') {
  fail('schema_version must be major-country-annual-fixtures-v0.');
}
if (fixtures?.scope !== 'major-countries-timetable-v0') {
  fail('scope must be major-countries-timetable-v0.');
}
if (!isNonEmptyString(fixtures?.created_at)) fail('created_at must be a non-empty string.');
if (fixtures?.coverage_window?.start_date !== '2026-05-30') fail('coverage_window.start_date must be 2026-05-30.');
if (fixtures?.coverage_window?.end_date !== '2026-06-30') fail('coverage_window.end_date must be 2026-06-30.');
if (fixtures?.coverage_window?.basis !== 'static_manual_v0_window') fail('coverage_window.basis must be static_manual_v0_window.');

for (const flag of requiredPolicyFlags) {
  if (fixtures?.source_policy?.[flag] !== true) fail(`source_policy.${flag} must be true.`);
}

const records = Array.isArray(fixtures?.records) ? fixtures.records : [];
const coverageGaps = Array.isArray(fixtures?.coverage_gaps) ? fixtures.coverage_gaps : [];
if (!Array.isArray(fixtures?.records)) fail('records must be an array.');
if (!Array.isArray(fixtures?.coverage_gaps)) fail('coverage_gaps must be an array.');
if (records.length === 0) fail('records must not be empty.');

const ingestionRecords = Array.isArray(ingestion?.records) ? ingestion.records : [];
const activeIngestionRecords = ingestionRecords.filter((record) => record.status !== 'legacy_no_active_racing');
const expectedActiveKeys = new Set(activeIngestionRecords.map(key));
const represented = [...records, ...coverageGaps];
const representedCountries = new Set(represented.map((record) => record.country_id));
if (representedCountries.size !== 13) fail(`records plus coverage_gaps must represent 13 countries; found ${representedCountries.size}.`);
for (const country of expectedCountries) {
  if (!representedCountries.has(country)) fail(`records plus coverage_gaps must include ${country}.`);
}

const representedActiveKeys = new Set(
  represented.filter((record) => record.country_id !== 'singapore').map(key),
);
if (representedActiveKeys.size !== 24) fail(`records plus coverage_gaps must represent 24 active groups; found ${representedActiveKeys.size}.`);
for (const activeKey of expectedActiveKeys) {
  if (!representedActiveKeys.has(activeKey)) fail(`active group ${activeKey} must not be silently dropped.`);
}

const singaporeGaps = coverageGaps.filter((gap) => gap.country_id === 'singapore' && gap.group_id === 'singapore-turf-club-legacy');
if (singaporeGaps.length !== 1) fail('Singapore legacy coverage gap must exist exactly once.');
if (singaporeGaps[0]?.gap_type !== 'no_active_racing' || singaporeGaps[0]?.status !== 'legacy_no_active_racing') {
  fail('Singapore legacy gap must use no_active_racing and legacy_no_active_racing.');
}

const recordGroups = new Set(records.map(key));
if (records.length <= recordGroups.size) {
  fail('records must not be merely one annual fixture record per group.');
}

const recordIds = new Set();
for (const record of records) {
  const recordKey = key(record);
  for (const field of requiredRecordFields) {
    if (!(field in record)) fail(`${recordKey}: ${field} is required.`);
  }
  if (!('linked_ingestion_record_id' in record) && !('ingestion_group_key' in record)) {
    fail(`${recordKey}: linked_ingestion_record_id or ingestion_group_key is required.`);
  }
  for (const field of ['record_id', 'country_id', 'group_id', 'racecourse', 'meeting_date', 'source_url', 'source_label', 'source_capture_date', 'local_timezone', 'confidence', 'status', 'notes']) {
    if (!isNonEmptyString(record[field])) fail(`${recordKey}: ${field} must be a non-empty string.`);
  }
  if (recordIds.has(record.record_id)) fail(`${record.record_id} must be unique.`);
  recordIds.add(record.record_id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.meeting_date)) fail(`${record.record_id}: meeting_date must be YYYY-MM-DD.`);
  if (record.meeting_date < fixtures.coverage_window.start_date || record.meeting_date > fixtures.coverage_window.end_date) {
    fail(`${record.record_id}: meeting_date must be within the coverage window.`);
  }
  if (!allowedSourceTypes.has(record.source_type)) fail(`${record.record_id}: source_type is invalid.`);
  if (record.annual_fixture_role !== 'candidate_meeting') fail(`${record.record_id}: annual_fixture_role must be candidate_meeting.`);
  if (record.final_times_status !== 'pending_racecard') fail(`${record.record_id}: final_times_status must be pending_racecard.`);
  if (!String(record.status).includes('candidate') || !String(record.status).includes('pending_racecard')) {
    fail(`${record.record_id}: status must clearly mark a candidate meeting pending racecard confirmation.`);
  }
  if (!isPlainObject(record.source_trace)) fail(`${record.record_id}: source_trace must be an object.`);
  for (const field of requiredTraceFields) {
    if (!isNonEmptyString(record.source_trace?.[field])) fail(`${record.record_id}: source_trace.${field} must be a non-empty string.`);
  }
  if (record.source_trace?.derived_from !== 'major-country-timetable-ingestion-v0') {
    fail(`${record.record_id}: source_trace.derived_from must be major-country-timetable-ingestion-v0.`);
  }
}

const gapIds = new Set();
for (const gap of coverageGaps) {
  const gapKey = key(gap);
  for (const field of requiredGapFields) {
    if (!(field in gap)) fail(`${gapKey}: ${field} is required.`);
  }
  for (const field of requiredGapFields) {
    if (!isNonEmptyString(gap[field])) fail(`${gapKey}: ${field} must be a non-empty string.`);
  }
  if (gapIds.has(gap.gap_id)) fail(`${gap.gap_id} must be unique.`);
  gapIds.add(gap.gap_id);
  if (!allowedGapTypes.has(gap.gap_type)) fail(`${gap.gap_id}: gap_type is invalid.`);
}

for (const entryKey of collectKeys(fixtures)) {
  if (entryKey.startsWith('no_')) continue;
  const normalized = entryKey.toLowerCase().replace(/[-\s]/g, '_');
  if (forbiddenSemanticFields.has(normalized)) fail(`Forbidden wagering/advice field is not allowed: ${entryKey}.`);
}
for (const { path: stringPath, value } of collectStringsOutsidePolicy(fixtures)) {
  for (const pattern of forbiddenPositiveWording) {
    const match = value.match(pattern);
    if (match && !hasNegationNearClaim(value)) fail(`${stringPath} must not contain unsupported claim wording: ${match[0]}.`);
  }
}

if (errors.length > 0) {
  console.error('Major-country annual fixtures v0 validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country annual fixtures v0 validation passed.');
