import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const schemaPath = 'data/static/authority-source-inventory.schema.json';
const inventoryPath = 'data/static/authority-source-inventory.json';
const specPath = 'docs/specs/authority-source-inventory-schema.md';
const currentStatusPath = 'docs/runbooks/current-status.md';
const docsReadmePath = 'docs/README.md';
const specsReadmePath = 'docs/specs/README.md';

const requiredRecordFields = [
  'country_id',
  'authority_id',
  'authority_name_en',
  'authority_name_local',
  'authority_type',
  'racecourse_scope',
  'official_source_id',
  'official_source_url',
  'source_kind',
  'source_status',
  'last_checked_date',
  'capability_rank',
  'adapter_candidate_status',
  'notes',
];
const sourceStatusEnum = ['verified', 'partial', 'not_verified', 'stale', 'unavailable'];
const capabilityRankEnum = ['C', 'B', 'B+', 'A'];
const authorityTypeEnum = ['national', 'regional', 'state', 'provincial', 'racecourse_operator', 'other'];
const racecourseScopeEnum = [
  'all_authority_racecourses',
  'subset_of_authority_racecourses',
  'single_racecourse',
  'countrywide',
  'unknown',
];
const sourceKindEnum = ['calendar', 'timetable', 'programme', 'racecard', 'official_link', 'source_index', 'other'];
const adapterCandidateStatusEnum = ['not_reviewed', 'candidate', 'needs_review', 'blocked', 'not_applicable'];
const prohibitedKeyFragments = [
  'odds',
  'payout',
  'prediction',
  'tip',
  'entry',
  'entries',
  'result',
  'raw_html',
  'raw_body',
  'source_body',
  'private',
  'budget',
  'monetization',
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

function requireEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label} must be ${JSON.stringify(expected)}.`);
}

function requireString(value, label) {
  if (!isNonEmptyString(value)) fail(`${label} must be a non-empty string.`);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
}

function requireIncludes(array, value, label) {
  if (!Array.isArray(array) || !array.includes(value)) fail(`${label} must include ${value}.`);
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

function requireNullableIsoDate(value, label) {
  if (value === null) return;
  requireString(value, label);
  if (!isNonEmptyString(value)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label} must be YYYY-MM-DD or null.`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${label} must be a valid calendar date or null.`);
  }
}

function requireAllowed(value, allowed, label) {
  requireString(value, label);
  if (!allowed.includes(value)) fail(`${label} must be one of ${allowed.join(', ')}.`);
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
const inventory = readJson(inventoryPath);
const specText = readText(specPath) ?? '';
const currentStatusText = readText(currentStatusPath) ?? '';
const docsReadmeText = readText(docsReadmePath) ?? '';
const specsReadmeText = readText(specsReadmePath) ?? '';

requireEqual(schema?.schema_version, 'authority-source-inventory-schema-v0', `${schemaPath}.schema_version`);
requireExactArray(schema?.required_record_fields, requiredRecordFields, `${schemaPath}.required_record_fields`);
requireExactArray(schema?.source_status_enum, sourceStatusEnum, `${schemaPath}.source_status_enum`);
requireExactArray(schema?.capability_rank_enum, capabilityRankEnum, `${schemaPath}.capability_rank_enum`);
requireExactArray(schema?.authority_type_enum, authorityTypeEnum, `${schemaPath}.authority_type_enum`);
requireExactArray(schema?.racecourse_scope_enum, racecourseScopeEnum, `${schemaPath}.racecourse_scope_enum`);
requireExactArray(schema?.source_kind_enum, sourceKindEnum, `${schemaPath}.source_kind_enum`);
requireExactArray(schema?.adapter_candidate_status_enum, adapterCandidateStatusEnum, `${schemaPath}.adapter_candidate_status_enum`);

for (const field of requiredRecordFields) {
  if (!isPlainObject(schema?.field_definitions) || !isNonEmptyString(schema.field_definitions[field])) {
    fail(`${schemaPath}.field_definitions.${field} must describe the field.`);
  }
}

for (const exclusion of [
  'no adapter implementation',
  'no scraper implementation',
  'no parser implementation',
  'no runtime fetch logic',
  'no racecards',
  'no odds',
  'no results',
  'no payouts',
  'no tips',
  'no full entries',
  'no JRA-centered special fields',
  'no internal strategy',
  'no budget notes',
  'no monetization notes',
  'no private workflow notes',
]) {
  requireIncludes(schema?.explicit_exclusions, exclusion, `${schemaPath}.explicit_exclusions`);
}

requireEqual(inventory?.schema_version, 'authority-source-inventory-v0', `${inventoryPath}.schema_version`);
requireEqual(inventory?.schema_ref, schemaPath, `${inventoryPath}.schema_ref`);
requireArray(inventory?.records, `${inventoryPath}.records`);

const seenKeys = new Set();
for (const [index, record] of (inventory?.records ?? []).entries()) {
  const label = `${inventoryPath}.records[${index}]`;
  if (!isPlainObject(record)) {
    fail(`${label} must be an object.`);
    continue;
  }

  for (const field of requiredRecordFields) {
    if (!Object.hasOwn(record, field)) fail(`${label}.${field} is required.`);
  }
  for (const key of Object.keys(record)) {
    if (!requiredRecordFields.includes(key)) fail(`${label}.${key} is not part of the authority source inventory schema.`);
  }

  requireString(record.country_id, `${label}.country_id`);
  requireString(record.authority_id, `${label}.authority_id`);
  requireString(record.authority_name_en, `${label}.authority_name_en`);
  if (record.authority_name_local !== null) requireString(record.authority_name_local, `${label}.authority_name_local`);
  requireAllowed(record.authority_type, authorityTypeEnum, `${label}.authority_type`);
  requireAllowed(record.racecourse_scope, racecourseScopeEnum, `${label}.racecourse_scope`);
  requireString(record.official_source_id, `${label}.official_source_id`);
  requireUrl(record.official_source_url, `${label}.official_source_url`);
  requireAllowed(record.source_kind, sourceKindEnum, `${label}.source_kind`);
  requireAllowed(record.source_status, sourceStatusEnum, `${label}.source_status`);
  requireNullableIsoDate(record.last_checked_date, `${label}.last_checked_date`);
  requireAllowed(record.capability_rank, capabilityRankEnum, `${label}.capability_rank`);
  requireAllowed(record.adapter_candidate_status, adapterCandidateStatusEnum, `${label}.adapter_candidate_status`);
  requireString(record.notes, `${label}.notes`);

  const key = `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
  if (seenKeys.has(key)) fail(`${label} duplicates inventory key ${key}.`);
  seenKeys.add(key);
}

walkObjectKeys(inventory, (key, pathParts) => {
  const normalized = key.toLowerCase();
  for (const fragment of prohibitedKeyFragments) {
    if (normalized === fragment || normalized.includes(`${fragment}_`) || normalized.includes(`_${fragment}`)) {
      fail(`${inventoryPath}.${pathParts.join('.')} uses prohibited key fragment '${fragment}'.`);
    }
  }
});

for (const [label, text] of [
  [currentStatusPath, currentStatusText],
  [docsReadmePath, docsReadmeText],
  [specsReadmePath, specsReadmeText],
]) {
  if (!text.includes('authority-source-inventory-schema.md')) fail(`${label} must link to authority-source-inventory-schema.md.`);
}
if (!specText.includes('GlobalTimetableSourceStatus') || !specText.includes('GlobalTimetableCapabilityRank')) {
  fail(`${specPath} must explicitly reuse global timetable source status and capability rank.`);
}

if (errors.length > 0) {
  console.error('[authority-source-inventory-schema] FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[authority-source-inventory-schema] PASS');
