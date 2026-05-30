import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const snapshotsPath = 'data/static/major-country-sample-acquisition-output-snapshots.json';
const fixturesPath = 'data/static/major-country-sample-acquisition-fixtures.json';
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
]);
const prohibitedSnapshotTextPatterns = [
  { pattern: /"timetable_records"\s*:/, label: 'generated timetable records' },
  { pattern: /"generated_timetable"\s*:/, label: 'generated timetable records' },
  { pattern: /"raw_(?:source_)?body"\s*:/, label: 'raw source body storage' },
  { pattern: /"raw_html"\s*:/, label: 'raw source body storage' },
  { pattern: /"(?:odds|payouts|predictions|tips)"\s*:/, label: 'odds, payouts, predictions, or tips support' },
];
const prohibitedScriptPatterns = [
  { pattern: /\bfetch\s*\(/, label: 'live fetch runtime' },
  { pattern: /\bhttps?\.request\s*\(/, label: 'live HTTP runtime' },
  { pattern: /\bparse(?:Race|Fixture|Racecard|Timetable)\b/, label: 'parser implementation' },
  { pattern: /writeFileSync\([^)]*generated/i, label: 'generated timetable write' },
];
const placeholderRace = {
  race_number: '<race_number>',
  race_time: '<race_time>',
  race_name_or_label: '<race_name_or_label>',
};

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

function snapshotKey(entry) {
  return [entry.country_id, entry.group_id, entry.sample_target_type, entry.sample_source_url, entry.parser_target].join(' | ');
}

function validateSourceFields(snapshot, fixture, label) {
  for (const field of ['country_id', 'group_id', 'sample_target_type', 'sample_source_url', 'parser_target', 'annual_vs_rolling_rule']) {
    if (snapshot[field] !== fixture[field]) fail(`${label}.${field} must match the PR-091 sample fixture.`);
  }

  if (!isPlainObject(snapshot.source_trace)) {
    fail(`${label}.source_trace must be an object.`);
    return;
  }
  if (snapshot.source_trace.source_url !== fixture.sample_source_url) fail(`${label}.source_trace.source_url must match sample_source_url.`);
  if (snapshot.source_trace.source_role !== fixture.sample_target_type) fail(`${label}.source_trace.source_role must match sample_target_type.`);
  if (snapshot.source_trace.source_group_id !== fixture.group_id) fail(`${label}.source_trace.source_group_id must match group_id.`);
}

function validateNonLegacySnapshot(snapshot, label) {
  if (snapshot.snapshot_kind !== 'normalized_expected_output') fail(`${label}.snapshot_kind must be normalized_expected_output.`);
  if (snapshot.snapshot_status !== 'static_expected_shape_only') fail(`${label}.snapshot_status must be static_expected_shape_only.`);
  if (!isPlainObject(snapshot.normalized_output)) {
    fail(`${label}.normalized_output must be an object.`);
    return;
  }

  for (const field of ['racecourse', 'meeting_date', 'first_race_time']) {
    if (!isNonEmptyString(snapshot.normalized_output[field])) fail(`${label}.normalized_output.${field} must be a non-empty placeholder string.`);
  }
  if (!Array.isArray(snapshot.normalized_output.races)) {
    fail(`${label}.normalized_output.races must be an array.`);
    return;
  }
  if (snapshot.normalized_output.races.length !== 1) {
    fail(`${label}.normalized_output.races must contain exactly one placeholder race shape, not generated/live race rows.`);
    return;
  }

  const race = snapshot.normalized_output.races[0];
  if (!isPlainObject(race)) {
    fail(`${label}.normalized_output.races[0] must be an object.`);
    return;
  }
  const keys = Object.keys(race).sort();
  const expectedKeys = Object.keys(placeholderRace).sort();
  if (keys.join('|') !== expectedKeys.join('|')) {
    fail(`${label}.normalized_output.races[0] must only contain race_number, race_time, and race_name_or_label.`);
  }
  for (const [field, expected] of Object.entries(placeholderRace)) {
    if (race[field] !== expected) fail(`${label}.normalized_output.races[0].${field} must be placeholder ${expected}.`);
  }
}

function validateSingaporeSnapshot(snapshot, fixture, label) {
  validateSourceFields(snapshot, fixture, label);
  if (snapshot.snapshot_kind !== 'legacy_inventory_expected_output') fail(`${label}.snapshot_kind must be legacy_inventory_expected_output.`);
  if (snapshot.snapshot_status !== 'legacy_inventory_only') fail(`${label}.snapshot_status must be legacy_inventory_only.`);
  if (snapshot.sample_target_type !== 'racecourse_inventory') fail(`${label}.sample_target_type must be racecourse_inventory.`);
  if (!isPlainObject(snapshot.normalized_output)) {
    fail(`${label}.normalized_output must be an object.`);
    return;
  }
  if ('first_race_time' in snapshot.normalized_output) fail(`${label}.normalized_output must not include first_race_time for Singapore legacy inventory.`);
  if ('races' in snapshot.normalized_output) fail(`${label}.normalized_output must not include per-race rows for Singapore legacy inventory.`);
  for (const field of ['racecourse', 'meeting_date']) {
    if (!isNonEmptyString(snapshot.normalized_output[field])) fail(`${label}.normalized_output.${field} must be a non-empty legacy placeholder string.`);
  }
}

const snapshotsText = readText(snapshotsPath);
const snapshots = snapshotsText === null ? null : readJson(snapshotsPath);
const fixtures = readJson(fixturesPath);

if (snapshots?.schema_version !== 'major-country-sample-acquisition-output-snapshots-v0') {
  fail('schema_version must be major-country-sample-acquisition-output-snapshots-v0.');
}
if (snapshots?.scope !== 'major-countries-v0') fail('scope must be major-countries-v0.');
if (snapshots?.sample_acquisition_fixtures !== fixturesPath) fail(`sample_acquisition_fixtures must be ${fixturesPath}.`);

for (const [flag, expected] of Object.entries({
  static_expected_shape_only: true,
  snapshots_match_pr_091_fixtures: true,
  placeholders_only: true,
  singapore_legacy_inventory_only: true,
  no_live_fetch_runtime: true,
  no_parser_implementation: true,
  no_generated_timetable_records: true,
  no_raw_source_body_storage: true,
  excludes_odds_payouts_predictions_tips: true,
})) {
  if (snapshots?.policy_flags?.[flag] !== expected) fail(`policy_flags.${flag} must be ${expected}.`);
}

const fixtureCountries = new Map((fixtures?.countries ?? []).map((country) => [country.country_id, country]));
const snapshotCountries = new Map((snapshots?.countries ?? []).map((country) => [country.country_id, country]));
for (const countryId of expectedCountries) {
  if (!fixtureCountries.has(countryId)) fail(`${fixturesPath} must include country ${countryId}.`);
  if (!snapshotCountries.has(countryId)) fail(`${snapshotsPath} must include country ${countryId}.`);
}
for (const country of snapshots?.countries ?? []) {
  if (!expectedCountries.includes(country.country_id)) fail(`Unexpected country_id ${country.country_id}.`);
  if (!Array.isArray(country.output_snapshots)) fail(`${country.country_id}.output_snapshots must be an array.`);
}

const fixturesByKey = new Map();
for (const country of fixtures?.countries ?? []) {
  for (const fixture of country.sample_fixtures ?? []) {
    fixturesByKey.set(snapshotKey(fixture), fixture);
  }
}

const snapshotsByKey = new Map();
for (const country of snapshots?.countries ?? []) {
  for (const [index, snapshot] of (country.output_snapshots ?? []).entries()) {
    const label = `${country.country_id}.output_snapshots[${index}]`;
    if (!isPlainObject(snapshot)) {
      fail(`${label} must be an object.`);
      continue;
    }
    if (snapshot.country_id !== country.country_id) fail(`${label}.country_id must match containing country_id.`);
    for (const field of ['country_id', 'group_id', 'sample_target_type', 'sample_source_url', 'parser_target', 'snapshot_kind', 'annual_vs_rolling_rule', 'snapshot_status']) {
      if (!isNonEmptyString(snapshot[field])) fail(`${label}.${field} must be a non-empty string.`);
    }

    const key = snapshotKey(snapshot);
    if (snapshotsByKey.has(key)) fail(`${label} duplicates snapshot key ${key}.`);
    snapshotsByKey.set(key, snapshot);
    const fixture = fixturesByKey.get(key);
    if (!fixture) {
      fail(`${label} must match a PR-091 sample fixture.`);
      continue;
    }

    if (country.country_id === 'singapore') validateSingaporeSnapshot(snapshot, fixture, label);
    else {
      validateSourceFields(snapshot, fixture, label);
      validateNonLegacySnapshot(snapshot, label);
    }
  }
}

for (const [key, fixture] of fixturesByKey) {
  if (!snapshotsByKey.has(key)) fail(`Missing output snapshot for PR-091 fixture ${key}.`);
  if (fixture.country_id === 'singapore') continue;
}

const singapore = snapshotCountries.get('singapore');
const singaporeSnapshots = singapore?.output_snapshots ?? [];
if (singaporeSnapshots.length !== 1) fail('Singapore must have exactly one legacy inventory output snapshot.');
if (singaporeSnapshots.some((snapshot) => snapshot.snapshot_status !== 'legacy_inventory_only')) {
  fail('Singapore must not include active timetable output snapshots.');
}
if (singaporeSnapshots.some((snapshot) => ['annual_fixture', 'rolling_fixture', 'first_race_time', 'per_race_time'].includes(snapshot.sample_target_type))) {
  fail('Singapore must not include annual, rolling, first-race, or per-race timetable output.');
}

walkObjects(snapshots, (object, pathParts) => {
  for (const key of Object.keys(object)) {
    if (prohibitedObjectKeys.has(key)) {
      fail(`${snapshotsPath}:${pathParts.concat(key).join('.')}: prohibited key ${key} must not be added.`);
    }
  }
});

if (snapshotsText !== null) {
  for (const { pattern, label } of prohibitedSnapshotTextPatterns) {
    if (pattern.test(snapshotsText)) fail(`${snapshotsPath} must not add ${label}.`);
  }
}

const validatorText = readText('scripts/check-major-country-sample-acquisition-output-snapshots.mjs') ?? '';
for (const { pattern, label } of prohibitedScriptPatterns) {
  if (pattern.test(validatorText)) fail('Validator must not add ' + label + '.');
}

if (errors.length > 0) {
  console.error('Major-country sample acquisition output snapshot validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Major-country sample acquisition output snapshots validated.');
