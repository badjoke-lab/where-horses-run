import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const schemaPath = 'data/static/authority-source-inventory.schema.json';
const inventoryPath = 'data/static/authority-source-inventory.json';
const specPath = 'docs/specs/authority-source-inventory-schema.md';
const addendumPath = 'docs/specs/authority-source-inventory-2026-06-28-addendum.md';
const machineContractPath = 'docs/calendar/machine-readable-contracts.md';
const errors = [];
const fail = (message) => errors.push(message);

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
const capabilityRankEnum = ['C', 'B', 'B+', 'A', 'A+'];
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
  'runner',
  'jockey',
  'trainer',
  'raw_html',
  'raw_body',
  'source_body',
  'credential',
  'cookie',
  'token',
  'private',
  'budget',
  'monetization',
];

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return null;
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

function requireExactArray(actual, expected, label) {
  if (!Array.isArray(actual)) {
    fail(`${label} must be an array.`);
    return;
  }
  if (actual.length !== expected.length || expected.some((value, index) => actual[index] !== value)) {
    fail(`${label} must equal ${JSON.stringify(expected)}.`);
  }
}

function requireAllowed(value, allowed, label) {
  if (!allowed.includes(value)) fail(`${label} must be one of ${allowed.join(', ')}.`);
}

function requireUrl(value, label) {
  if (!isNonEmptyString(value)) {
    fail(`${label} must be a non-empty URL.`);
    return;
  }
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) fail(`${label} must use http or https.`);
  } catch {
    fail(`${label} must be a valid URL.`);
  }
}

function requireNullableIsoDate(value, label) {
  if (value === null) return;
  if (!isNonEmptyString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label} must be YYYY-MM-DD or null.`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(`${label} must be a valid date.`);
}

function walkKeys(value, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkKeys(entry, [...trail, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (prohibitedKeyFragments.some((fragment) => normalized.includes(fragment))) {
      fail(`${inventoryPath}.${[...trail, key].join('.')} uses prohibited key fragment.`);
    }
    walkKeys(entry, [...trail, key]);
  }
}

const schema = readJson(schemaPath);
const inventory = readJson(inventoryPath);
const specText = readText(specPath);
const addendumText = readText(addendumPath);
const machineContractText = readText(machineContractPath);

if (schema?.schema_version !== 'authority-source-inventory-schema-v1') fail(`${schemaPath}.schema_version must be authority-source-inventory-schema-v1.`);
requireExactArray(schema?.required_record_fields, requiredRecordFields, `${schemaPath}.required_record_fields`);
requireExactArray(schema?.source_status_enum, sourceStatusEnum, `${schemaPath}.source_status_enum`);
requireExactArray(schema?.capability_rank_enum, capabilityRankEnum, `${schemaPath}.capability_rank_enum`);
requireExactArray(schema?.authority_type_enum, authorityTypeEnum, `${schemaPath}.authority_type_enum`);
requireExactArray(schema?.racecourse_scope_enum, racecourseScopeEnum, `${schemaPath}.racecourse_scope_enum`);
requireExactArray(schema?.source_kind_enum, sourceKindEnum, `${schemaPath}.source_kind_enum`);
requireExactArray(schema?.adapter_candidate_status_enum, adapterCandidateStatusEnum, `${schemaPath}.adapter_candidate_status_enum`);

if (inventory?.schema_version !== 'authority-source-inventory-v1') fail(`${inventoryPath}.schema_version must be authority-source-inventory-v1.`);
if (inventory?.schema_ref !== schemaPath) fail(`${inventoryPath}.schema_ref must reference ${schemaPath}.`);
if (!Array.isArray(inventory?.records)) fail(`${inventoryPath}.records must be an array.`);

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
    if (!requiredRecordFields.includes(key)) fail(`${label}.${key} is not allowed.`);
  }
  for (const field of ['country_id', 'authority_id', 'authority_name_en', 'official_source_id', 'notes']) {
    if (!isNonEmptyString(record[field])) fail(`${label}.${field} must be a non-empty string.`);
  }
  if (record.authority_name_local !== null && !isNonEmptyString(record.authority_name_local)) fail(`${label}.authority_name_local must be a string or null.`);
  requireAllowed(record.authority_type, authorityTypeEnum, `${label}.authority_type`);
  requireAllowed(record.racecourse_scope, racecourseScopeEnum, `${label}.racecourse_scope`);
  requireUrl(record.official_source_url, `${label}.official_source_url`);
  requireAllowed(record.source_kind, sourceKindEnum, `${label}.source_kind`);
  requireAllowed(record.source_status, sourceStatusEnum, `${label}.source_status`);
  requireNullableIsoDate(record.last_checked_date, `${label}.last_checked_date`);
  requireAllowed(record.capability_rank, capabilityRankEnum, `${label}.capability_rank`);
  requireAllowed(record.adapter_candidate_status, adapterCandidateStatusEnum, `${label}.adapter_candidate_status`);

  const key = `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
  if (seenKeys.has(key)) fail(`${label} duplicates ${key}.`);
  seenKeys.add(key);
}
walkKeys(inventory);

for (const [file, text, phrases] of [
  [specPath, specText, ['GlobalTimetableSourceStatus', 'GlobalTimetableCapabilityRank', 'A+']],
  [addendumPath, addendumText, ['Calendar Readiness', 'A+']],
  [machineContractPath, machineContractText, [schemaPath, inventoryPath]],
]) {
  for (const phrase of phrases) {
    if (!text.includes(phrase)) fail(`${file} must include ${phrase}.`);
  }
}

if (errors.length) {
  console.error('[authority-source-inventory-schema] FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[authority-source-inventory-schema] PASS');
console.log(`RECORDS: ${inventory.records.length}`);
console.log(`CAPABILITY_RANKS: ${capabilityRankEnum.join(',')}`);
