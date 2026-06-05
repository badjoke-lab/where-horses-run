import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const schemaPath = 'data/generated/normalized-timetable.schema.json';
const dataPath = 'data/generated/normalized-timetable.json';
const countriesPath = 'data/static/countries.json';
const racecoursesPath = 'data/static/racecourses.json';
const routesPath = 'data/static/timetable-acquisition-routes.json';
const specPath = 'docs/specs/normalized-timetable-output-schema.md';
const flowSpecPath = 'docs/specs/timetable-data-flow-and-display-contract.md';
const currentStatusPath = 'docs/runbooks/current-status.md';
const specsReadmePath = 'docs/specs/README.md';
const packagePath = 'package.json';
const requiredReviewedSamples = [
  { authority_id: 'jra', source_id: 'jra-calendar', route_id: 'jra-calendar-status-route' },
  {
    authority_id: 'nar-local-government-racing',
    source_id: 'nar-monthly-convene-info',
    route_id: 'nar-local-government-monthly-status-route'
  },
  { authority_id: 'hkjc', source_id: 'hkjc-fixture-list', route_id: 'hkjc-fixture-status-route' },
];
const scriptPath = 'scripts/check-normalized-timetable-output-schema.mjs';
const packageScriptName = 'validate:normalized-timetable-output-schema';

const requiredRecordFields = [
  'meeting_id',
  'country_id',
  'authority_id',
  'racecourse_id',
  'date',
  'timezone',
  'source_id',
  'route_id',
  'source_status',
  'capability_rank',
  'first_race_time_local',
  'last_race_time_local',
  'official_source_url',
  'last_checked_date',
  'display_status',
  'notes',
];
const sourceStatusEnum = ['verified', 'partial', 'not_verified', 'stale', 'unavailable'];
const capabilityRankEnum = ['C', 'B', 'B+', 'A'];
const displayStatusEnum = ['displayable', 'partial', 'hidden', 'stale', 'unavailable'];
// Display-rule guardrail phrases:
// C: first_race_time_local and last_race_time_local must be null
// B: first_race_time_local may be set
// B+: first_race_time_local and last_race_time_local may be set
// A: monthly/day calendar summary must not expose race-by-race detail
const explicitExclusions = [
  'no automatically generated meeting records',
  'no calendar UI changes',
  'no adapters',
  'no scrapers',
  'no parsers',
  'no runtime fetch logic',
  'no scheduler logic',
  'no live source fetching',
  'no raw source body/html storage',
  'no racecards',
  'no odds',
  'no results',
  'no payouts',
  'no predictions',
  'no tips',
  'no full entries',
  'no private/internal notes',
];
const prohibitedKeyFragments = [
  'raw',
  'html',
  'body',
  'racecard',
  'odds',
  'result',
  'payout',
  'prediction',
  'tip',
  'entry',
  'entries',
  'private',
  'internal',
];
const errors = [];

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    fail(`${relativePath}: missing file`);
    return null;
  }
  return readFileSync(fullPath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath}: invalid JSON: ${error.message}`);
    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label} must equal ${JSON.stringify(expected)}.`);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
}

function requireExactArray(actual, expected, label) {
  if (!Array.isArray(actual)) {
    fail(`${label} must be an array.`);
    return;
  }
  if (actual.length !== expected.length || expected.some((value, index) => actual[index] !== value)) {
    fail(`${label} must equal ${JSON.stringify(expected)}.`);
  }
}

function requireIncludes(array, value, label) {
  if (!Array.isArray(array) || !array.includes(value)) fail(`${label} must include ${value}.`);
}

function requireString(value, label) {
  if (!isNonEmptyString(value)) fail(`${label} must be a non-empty string.`);
}

function requireNullableString(value, label) {
  if (value === null) return;
  requireString(value, label);
}

function requireAllowed(value, allowed, label) {
  requireString(value, label);
  if (isNonEmptyString(value) && !allowed.includes(value)) fail(`${label} must be one of ${allowed.join(', ')}.`);
}

function requireUrl(value, label) {
  requireString(value, label);
  if (!isNonEmptyString(value)) return;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) fail(`${label} must use http or https.`);
  } catch {
    fail(`${label} must be a valid URL.`);
  }
}

function requireIsoDate(value, label) {
  requireString(value, label);
  if (!isNonEmptyString(value)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label} must be YYYY-MM-DD.`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${label} must be a valid calendar date.`);
  }
}

function requireNullableIsoDate(value, label) {
  if (value === null) return;
  requireIsoDate(value, label);
}

function requireNullableLocalTime(value, label) {
  if (value === null) return;
  requireString(value, label);
  if (!isNonEmptyString(value)) return;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) fail(`${label} must be HH:MM or null.`);
}

function requireTimezone(value, label) {
  requireString(value, label);
  if (!isNonEmptyString(value)) return;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date('2026-01-01T00:00:00Z'));
  } catch {
    fail(`${label} must be an IANA timezone.`);
  }
}

function walkObjectKeys(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkObjectKeys(entry, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) visitor(key, [...pathParts, key]);
  for (const [key, entry] of Object.entries(value)) walkObjectKeys(entry, visitor, [...pathParts, key]);
}

const schema = readJson(schemaPath);
const data = readJson(dataPath);
const countries = readJson(countriesPath);
const racecourses = readJson(racecoursesPath);
const routes = readJson(routesPath);
const specText = readText(specPath) ?? '';
const flowSpecText = readText(flowSpecPath) ?? '';
const currentStatusText = readText(currentStatusPath) ?? '';
const specsReadmeText = readText(specsReadmePath) ?? '';
const packageJson = readJson(packagePath);
const scriptText = readText(scriptPath) ?? '';

requireEqual(schema?.schema_version, 'normalized-timetable-output-schema-v0', `${schemaPath}.schema_version`);
requireExactArray(schema?.record_key, ['meeting_id'], `${schemaPath}.record_key`);
requireExactArray(schema?.required_record_fields, requiredRecordFields, `${schemaPath}.required_record_fields`);
requireExactArray(schema?.source_status_enum, sourceStatusEnum, `${schemaPath}.source_status_enum`);
requireExactArray(schema?.capability_rank_enum, capabilityRankEnum, `${schemaPath}.capability_rank_enum`);
requireExactArray(schema?.display_status_enum, displayStatusEnum, `${schemaPath}.display_status_enum`);
requireExactArray(schema?.safe_calendar_summary_fields, requiredRecordFields, `${schemaPath}.safe_calendar_summary_fields`);

for (const field of requiredRecordFields) {
  if (!isPlainObject(schema?.field_definitions) || !isNonEmptyString(schema.field_definitions[field])) {
    fail(`${schemaPath}.field_definitions.${field} must describe the field.`);
  }
}
for (const rank of capabilityRankEnum) {
  if (!isPlainObject(schema?.display_rules) || !isNonEmptyString(schema.display_rules[rank])) {
    fail(`${schemaPath}.display_rules.${rank} must describe the display rule.`);
  }
}
for (const exclusion of explicitExclusions) {
  requireIncludes(schema?.explicit_exclusions, exclusion, `${schemaPath}.explicit_exclusions`);
}

requireEqual(data?.schema_version, 'normalized-timetable-output-v0', `${dataPath}.schema_version`);
requireEqual(data?.schema_ref, schemaPath, `${dataPath}.schema_ref`);
requireArray(data?.records, `${dataPath}.records`);

const knownCountryIds = new Set((countries?.countries ?? []).filter(isPlainObject).map((row) => row.id).filter(isNonEmptyString));
const knownRacecourseIds = new Set((racecourses?.racecourses ?? []).filter(isPlainObject).map((row) => row.id).filter(isNonEmptyString));
const knownRouteIds = new Set((routes?.records ?? []).filter(isPlainObject).map((row) => row.route_id).filter(isNonEmptyString));
const seenMeetingIds = new Set();
const reviewedSampleHits = new Set();

for (const [index, record] of (data?.records ?? []).entries()) {
  const label = `${dataPath}.records[${index}]`;
  if (!isPlainObject(record)) {
    fail(`${label} must be an object.`);
    continue;
  }

  for (const field of requiredRecordFields) {
    if (!Object.hasOwn(record, field)) fail(`${label}.${field} is required.`);
  }
  for (const key of Object.keys(record)) {
    if (!requiredRecordFields.includes(key)) fail(`${label}.${key} is not part of the normalized timetable output schema.`);
  }

  requireString(record.meeting_id, `${label}.meeting_id`);
  requireString(record.country_id, `${label}.country_id`);
  requireString(record.authority_id, `${label}.authority_id`);
  requireString(record.racecourse_id, `${label}.racecourse_id`);
  requireIsoDate(record.date, `${label}.date`);
  requireTimezone(record.timezone, `${label}.timezone`);
  requireString(record.source_id, `${label}.source_id`);
  requireNullableString(record.route_id, `${label}.route_id`);
  requireAllowed(record.source_status, sourceStatusEnum, `${label}.source_status`);
  requireAllowed(record.capability_rank, capabilityRankEnum, `${label}.capability_rank`);
  requireNullableLocalTime(record.first_race_time_local, `${label}.first_race_time_local`);
  requireNullableLocalTime(record.last_race_time_local, `${label}.last_race_time_local`);
  requireUrl(record.official_source_url, `${label}.official_source_url`);
  requireNullableIsoDate(record.last_checked_date, `${label}.last_checked_date`);
  requireAllowed(record.display_status, displayStatusEnum, `${label}.display_status`);
  requireString(record.notes, `${label}.notes`);

  if (seenMeetingIds.has(record.meeting_id)) fail(`${label} duplicates meeting_id ${record.meeting_id}.`);
  seenMeetingIds.add(record.meeting_id);

  if (isNonEmptyString(record.country_id) && knownCountryIds.size > 0 && !knownCountryIds.has(record.country_id)) {
    fail(`${label}.country_id must reference an existing country id.`);
  }
  if (isNonEmptyString(record.racecourse_id) && knownRacecourseIds.size > 0 && !knownRacecourseIds.has(record.racecourse_id)) {
    fail(`${label}.racecourse_id must reference an existing racecourse id.`);
  }
  if (isNonEmptyString(record.route_id) && knownRouteIds.size > 0 && !knownRouteIds.has(record.route_id)) {
    fail(`${label}.route_id must reference an existing timetable acquisition route id when route inventory records exist.`);
  }

  if (record.capability_rank === 'C') {
    if (record.first_race_time_local !== null) fail(`${label}.first_race_time_local must be null for capability_rank C.`);
    if (record.last_race_time_local !== null) fail(`${label}.last_race_time_local must be null for capability_rank C.`);
  }
  if (record.capability_rank === 'B' && record.last_race_time_local !== null) {
    fail(`${label}.last_race_time_local must be null for capability_rank B.`);
  }

  for (const sample of requiredReviewedSamples) {
    if (
      record.authority_id === sample.authority_id &&
      record.source_id === sample.source_id &&
      record.route_id === sample.route_id
    ) {
      reviewedSampleHits.add(sample.authority_id);
    }
  }
}

for (const sample of requiredReviewedSamples) {
  if (!reviewedSampleHits.has(sample.authority_id)) {
    fail(`${dataPath}.records must include a reviewed sample for ${sample.authority_id} using ${sample.source_id} / ${sample.route_id}.`);
  }
}

for (const [label, text] of [
  [specPath, specText],
  [flowSpecPath, flowSpecText],
  [currentStatusPath, currentStatusText],
  [specsReadmePath, specsReadmeText],
]) {
  if (!text.includes('Normalized Timetable Record')) fail(`${label} must mention Normalized Timetable Record.`);
}
for (const [label, text] of [
  [specPath, specText],
  [currentStatusPath, currentStatusText],
  [specsReadmePath, specsReadmeText],
]) {
  if (!text.includes('normalized-timetable-output-schema.md')) {
    fail(`${label} must link to normalized-timetable-output-schema.md.`);
  }
}
for (const token of [...requiredRecordFields, ...sourceStatusEnum, ...capabilityRankEnum, ...displayStatusEnum]) {
  if (!specText.includes(token)) fail(`${specPath} must document ${token}.`);
}
for (const phrase of [
  'C: first_race_time_local and last_race_time_local must be null',
  'B: first_race_time_local may be set',
  'B+: first_race_time_local and last_race_time_local may be set',
  'A: monthly/day calendar summary must not expose race-by-race detail',
]) {
  if (!scriptText.includes(phrase)) fail(`${scriptPath} must preserve display-rule check phrase: ${phrase}.`);
}

walkObjectKeys(data, (key, pathParts) => {
  const normalized = key.toLowerCase();
  for (const fragment of prohibitedKeyFragments) {
    if (normalized === fragment || normalized.includes(`${fragment}_`) || normalized.includes(`_${fragment}`)) {
      fail(`${dataPath}.${pathParts.join('.')} uses prohibited key fragment '${fragment}'.`);
    }
  }
});

const packageScript = packageJson?.scripts?.[packageScriptName];
requireEqual(packageScript, `node ${scriptPath}`, `${packagePath}.scripts.${packageScriptName}`);
if (!packageJson?.scripts?.check?.includes(`npm run ${packageScriptName}`)) {
  fail(`${packagePath}.scripts.check must run ${packageScriptName}.`);
}
if (!scriptText.includes('no live source fetching') || !scriptText.includes('no raw source body/html storage')) {
  fail(`${scriptPath} must preserve public-safe exclusion checks.`);
}

if (errors.length > 0) {
  console.error('[normalized-timetable-output-schema] FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[normalized-timetable-output-schema] PASS');
