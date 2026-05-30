import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const timetablePath = 'data/static/major-country-timetable-v0.json';
const annualPath = 'data/static/major-country-annual-fixtures-v0.json';
const rollingPath = 'data/static/major-country-rolling-racecards-v0.json';
const ingestionPath = 'data/static/major-country-timetable-ingestion-v0.json';
const uiPath = 'src/pages/major-countries/timetable.astro';
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
const pendingStatuses = new Set([
  'pending_racecard',
  'time_pending_official_racecard',
  'source_not_yet_published',
  'needs_manual_review',
]);
const allowedDisplayStatuses = new Set([
  'confirmed_times',
  ...pendingStatuses,
  'coverage_gap',
  'legacy_no_active_racing',
]);
const requiredPolicyFlags = [
  'annual_fixture_is_candidate_until_confirmed_by_rolling_or_racecard',
  'rolling_or_racecard_source_confirms_final_times',
  'pending_records_remain_visible',
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
  'timetable_id',
  'country_id',
  'group_id',
  'racecourse',
  'meeting_date',
  'local_timezone',
  'display_status',
  'first_race_time',
  'races',
  'annual_source',
  'rolling_source',
  'source_kind',
  'source_trace',
  'last_checked',
  'stale_status',
  'notes',
];
const requiredSourceFields = ['source_url', 'source_label', 'source_type', 'source_capture_date'];
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
const forbiddenFieldNames = new Set(['odds', 'payout', 'payouts', 'prediction', 'predictions', 'tip', 'tips']);
const forbiddenStatusFragments = [/fake/i, /synthetic/i, /placeholder/i, /estimated/i, /generated/i];

function fail(message) {
  errors.push(message);
}
function readText(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`${relativePath} must exist.`);
    return null;
  }
  return readFileSync(absolute, 'utf8');
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
function collectFieldNames(value, names = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectFieldNames(entry, names));
  } else if (isObject(value)) {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      names.push(entryKey);
      collectFieldNames(entryValue, names);
    }
  }
  return names;
}
function requireFields(record, fields, label) {
  for (const field of fields) {
    if (!(field in record)) fail(`${label}.${field} is required.`);
  }
}
function requireSource(source, label, allowEmptyUrl = false) {
  if (!isObject(source)) {
    fail(`${label} must be an object.`);
    return;
  }
  requireFields(source, requiredSourceFields, label);
  for (const field of requiredSourceFields) {
    if (field === 'source_url' && allowEmptyUrl && source[field] === '') continue;
    if (!isNonEmptyString(source[field])) fail(`${label}.${field} must be a non-empty string.`);
  }
}
function hasNegation(value) {
  return /\b(?:no|not|never|without|does not|do not|must not|is not|are not)\b/i.test(value);
}

const timetable = readJson(timetablePath);
const annual = readJson(annualPath);
const rolling = readJson(rollingPath);
const ingestion = readJson(ingestionPath);
const uiText = readText(uiPath) || '';

if (timetable?.schema_version !== 'major-country-timetable-v0') fail('schema_version must be major-country-timetable-v0.');
if (timetable?.scope !== 'major-countries-timetable-v0') fail('scope must be major-countries-timetable-v0.');
if (!isNonEmptyString(timetable?.created_at)) fail('created_at must be a non-empty string.');
for (const field of ['start_date', 'end_date', 'basis']) {
  if (timetable?.coverage_window?.[field] !== annual?.coverage_window?.[field]) fail(`coverage_window.${field} must match PR-103 annual fixtures.`);
  if (timetable?.coverage_window?.[field] !== rolling?.coverage_window?.[field]) fail(`coverage_window.${field} must match PR-104 rolling racecards.`);
}
if (timetable?.coverage_window?.start_date !== '2026-05-30') fail('coverage_window.start_date must be 2026-05-30.');
if (timetable?.coverage_window?.end_date !== '2026-06-30') fail('coverage_window.end_date must be 2026-06-30.');
if (timetable?.coverage_window?.basis !== 'static_manual_v0_window') fail('coverage_window.basis must be static_manual_v0_window.');

for (const flag of requiredPolicyFlags) {
  if (timetable?.source_policy?.[flag] !== true) fail(`source_policy.${flag} must be true.`);
}

const records = Array.isArray(timetable?.records) ? timetable.records : [];
const gaps = Array.isArray(timetable?.coverage_gaps) ? timetable.coverage_gaps : [];
if (!Array.isArray(timetable?.records)) fail('records must be an array.');
if (!Array.isArray(timetable?.coverage_gaps)) fail('coverage_gaps must be an array.');
if (records.length === 0) fail('records[] must not be empty.');

const represented = [...records, ...gaps];
const representedCountries = new Set(represented.map((record) => record.country_id));
if (representedCountries.size !== 13) fail(`records plus coverage_gaps must represent 13 countries; found ${representedCountries.size}.`);
for (const country of expectedCountries) {
  if (!representedCountries.has(country)) fail(`records plus coverage_gaps must include ${country}.`);
}

const activeIngestionKeys = new Set((ingestion?.records || []).filter((record) => record.status !== 'legacy_no_active_racing').map(key));
const representedActiveKeys = new Set(represented.filter((record) => record.country_id !== 'singapore').map(key));
if (representedActiveKeys.size !== 24) fail(`records plus coverage_gaps must represent 24 active groups; found ${representedActiveKeys.size}.`);
for (const activeKey of activeIngestionKeys) {
  if (!representedActiveKeys.has(activeKey)) fail(`active group ${activeKey} must not be silently dropped.`);
}
const singaporeLegacy = records.find((record) => record.country_id === 'singapore' && record.display_status === 'legacy_no_active_racing');
if (!singaporeLegacy) fail('Singapore legacy record must exist.');
if (representedActiveKeys.has('singapore/singapore-turf-club-legacy')) fail('Singapore legacy must not be counted as active.');

for (const [index, record] of records.entries()) {
  const label = `records[${index}]`;
  requireFields(record, requiredRecordFields, label);
  if (!('system_name' in record) && !('group_name' in record)) fail(`${label} must include system_name or group_name.`);
  if (!allowedDisplayStatuses.has(record.display_status)) fail(`${label}.display_status is not allowed.`);
  if (!Array.isArray(record.races)) fail(`${label}.races must be an array.`);
  requireSource(record.annual_source, `${label}.annual_source`, record.source_kind === 'legacy');
  if (record.rolling_source !== null) requireSource(record.rolling_source, `${label}.rolling_source`);
  if (!isObject(record.source_trace)) fail(`${label}.source_trace must be an object.`);
  const derivedFrom = record.source_trace?.derived_from;
  if (!Array.isArray(derivedFrom)) fail(`${label}.source_trace.derived_from must be an array.`);
  if (!derivedFrom?.includes('major-country-annual-fixtures-v0')) fail(`${label}.source_trace must reference major-country-annual-fixtures-v0.`);
  if (!derivedFrom?.includes('major-country-rolling-racecards-v0')) fail(`${label}.source_trace must reference major-country-rolling-racecards-v0.`);
  if (record.source_kind !== 'legacy' && !('annual_record_id' in record.source_trace) && !('annual_record_key' in record.source_trace)) {
    fail(`${label}.source_trace must include annual_record_id or annual_record_key.`);
  }
  if (record.display_status === 'confirmed_times') {
    if (!isNonEmptyString(record.first_race_time)) fail(`${label}.first_race_time is required for confirmed records.`);
    if (!Array.isArray(record.races) || record.races.length === 0) fail(`${label}.races must be non-empty for confirmed records.`);
    if (!record.rolling_source) fail(`${label}.rolling_source is required for confirmed rolling records.`);
    if (!('rolling_record_id' in record.source_trace)) fail(`${label}.source_trace.rolling_record_id is required for confirmed records.`);
    record.races?.forEach((race, raceIndex) => {
      for (const field of ['race_number', 'race_time', 'race_name_or_label']) {
        if (!(field in race)) fail(`${label}.races[${raceIndex}].${field} is required.`);
      }
    });
  }
  if (pendingStatuses.has(record.display_status)) {
    if (record.first_race_time !== null) fail(`${label}.first_race_time must be null for pending records.`);
    if (record.races?.length !== 0) fail(`${label}.races must be empty for pending records.`);
  }
  for (const fragment of forbiddenStatusFragments) {
    if (fragment.test(record.display_status) || fragment.test(record.stale_status)) fail(`${label} must not use fake/generated race-time statuses.`);
  }
}

for (const [index, gap] of gaps.entries()) {
  requireFields(gap, requiredGapFields, `coverage_gaps[${index}]`);
}
const annualGapIds = new Set((annual?.coverage_gaps || []).map((gap) => gap.gap_id));
const rollingGapIds = new Set((rolling?.coverage_gaps || []).map((gap) => gap.gap_id));
for (const gapId of annualGapIds) if (!gaps.some((gap) => gap.gap_id === gapId)) fail(`Annual coverage gap ${gapId} must be carried forward.`);
for (const gapId of rollingGapIds) if (!gaps.some((gap) => gap.gap_id === gapId)) fail(`Rolling coverage gap ${gapId} must be carried forward.`);

for (const name of collectFieldNames(timetable)) {
  if (forbiddenFieldNames.has(name)) fail(`Forbidden timetable field name: ${name}.`);
}

if (!uiText.includes('Static/manual timetable. Not live coverage. Not betting advice. No odds, payouts, predictions, or tips.')) {
  fail('UI page must contain the required static/manual not-live notice.');
}
for (const snippet of ['Annual source', 'Rolling/racecard source', 'Source capture date', 'Last checked', 'Stale/pending status']) {
  if (!uiText.includes(snippet)) fail(`UI page must show ${snippet}.`);
}
if (!uiText.includes('Official racecard/time data is pending')) fail('UI page must show a pending status message.');
if (/complete worldwide coverage/i.test(uiText)) fail('UI page must not claim complete worldwide coverage.');
if (/full automation|fully automated/i.test(uiText)) fail('UI page must not claim full automation.');
if (/preview\/sample completion|sample completion/i.test(uiText)) fail('UI page must not include preview/sample completion wording.');

const stringsToCheck = [JSON.stringify(timetable), uiText];
for (const text of stringsToCheck) {
  for (const claim of [/live coverage/i, /full automation|fully automated/i, /preview sample completion|sample completion/i]) {
    for (const match of text.matchAll(new RegExp(claim.source, 'gi'))) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(text.length, match.index + match[0].length + 40);
      const context = text.slice(start, end);
      if (!hasNegation(context)) fail(`Positive forbidden claim detected near: ${context}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Major country timetable v0 validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Major country timetable v0 validation passed for ${records.length} records and ${gaps.length} coverage gaps.`);
