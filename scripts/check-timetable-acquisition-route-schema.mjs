import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const schemaPath = 'data/static/timetable-acquisition-routes.schema.json';
const inventoryPath = 'data/static/timetable-acquisition-routes.json';
const authorityInventoryPath = 'data/static/authority-source-inventory.json';
const specPath = 'docs/specs/timetable-acquisition-route-schema.md';
const flowSpecPath = 'docs/specs/timetable-data-flow-and-display-contract.md';
const currentStatusPath = 'docs/runbooks/current-status.md';
const specsReadmePath = 'docs/specs/README.md';
const packagePath = 'package.json';
const scriptPath = 'scripts/check-timetable-acquisition-route-schema.mjs';
const packageScriptName = 'validate:timetable-acquisition-route-schema';

const requiredRecordFields = [
  'route_id',
  'authority_id',
  'official_source_id',
  'source_url',
  'acquisition_mode',
  'output_target',
  'allowed_refresh_scope',
  'last_checked_date',
  'status',
  'notes',
];
const acquisitionModeEnum = ['manual_snapshot', 'dry_run', 'scheduled_candidate', 'disabled'];
const outputTargetEnum = [
  'extracted_meeting_candidate',
  'normalized_timetable_record',
  'calendar_view_model',
  'status_only',
];
const allowedRefreshScopeEnum = ['none', 'single_date', 'date_range', 'month', 'source_defined_window'];
const statusEnum = [
  'not_reviewed',
  'candidate',
  'verified_manual',
  'dry_run_only',
  'scheduled_candidate',
  'blocked',
  'disabled',
  'stale',
];
const explicitExclusions = [
  'no real route records in the placeholder inventory',
  'no adapter implementation',
  'no scraper implementation',
  'no parser implementation',
  'no runtime fetch logic',
  'no scheduler implementation',
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
  'internal',
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

function requireAllowed(value, allowed, label) {
  requireString(value, label);
  if (!allowed.includes(value)) fail(`${label} must be one of ${allowed.join(', ')}.`);
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
const authorityInventory = readJson(authorityInventoryPath);
const specText = readText(specPath) ?? '';
const flowSpecText = readText(flowSpecPath) ?? '';
const currentStatusText = readText(currentStatusPath) ?? '';
const specsReadmeText = readText(specsReadmePath) ?? '';
const packageJson = readJson(packagePath);
const scriptText = readText(scriptPath) ?? '';

requireEqual(schema?.schema_version, 'timetable-acquisition-routes-schema-v0', `${schemaPath}.schema_version`);
requireExactArray(schema?.record_key, ['route_id'], `${schemaPath}.record_key`);
requireExactArray(schema?.required_record_fields, requiredRecordFields, `${schemaPath}.required_record_fields`);
requireExactArray(schema?.acquisition_mode_enum, acquisitionModeEnum, `${schemaPath}.acquisition_mode_enum`);
requireExactArray(schema?.output_target_enum, outputTargetEnum, `${schemaPath}.output_target_enum`);
requireExactArray(schema?.allowed_refresh_scope_enum, allowedRefreshScopeEnum, `${schemaPath}.allowed_refresh_scope_enum`);
requireExactArray(schema?.status_enum, statusEnum, `${schemaPath}.status_enum`);

for (const field of requiredRecordFields) {
  if (!isPlainObject(schema?.field_definitions) || !isNonEmptyString(schema.field_definitions[field])) {
    fail(`${schemaPath}.field_definitions.${field} must describe the field.`);
  }
}
for (const exclusion of explicitExclusions) {
  requireIncludes(schema?.explicit_exclusions, exclusion, `${schemaPath}.explicit_exclusions`);
}

requireEqual(inventory?.schema_version, 'timetable-acquisition-routes-v0', `${inventoryPath}.schema_version`);
requireEqual(inventory?.schema_ref, schemaPath, `${inventoryPath}.schema_ref`);
requireArray(inventory?.records, `${inventoryPath}.records`);

const authorityKeys = new Set();
for (const [index, record] of (authorityInventory?.records ?? []).entries()) {
  if (isPlainObject(record) && isNonEmptyString(record.authority_id) && isNonEmptyString(record.official_source_id)) {
    authorityKeys.add(`${record.authority_id}/${record.official_source_id}`);
  } else {
    fail(`${authorityInventoryPath}.records[${index}] must include authority_id and official_source_id for route linkage checks.`);
  }
}

const seenRouteIds = new Set();
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
    if (!requiredRecordFields.includes(key)) fail(`${label}.${key} is not part of the timetable acquisition route schema.`);
  }

  requireString(record.route_id, `${label}.route_id`);
  requireString(record.authority_id, `${label}.authority_id`);
  requireString(record.official_source_id, `${label}.official_source_id`);
  requireUrl(record.source_url, `${label}.source_url`);
  requireAllowed(record.acquisition_mode, acquisitionModeEnum, `${label}.acquisition_mode`);
  requireAllowed(record.output_target, outputTargetEnum, `${label}.output_target`);
  requireAllowed(record.allowed_refresh_scope, allowedRefreshScopeEnum, `${label}.allowed_refresh_scope`);
  requireNullableIsoDate(record.last_checked_date, `${label}.last_checked_date`);
  requireAllowed(record.status, statusEnum, `${label}.status`);
  requireString(record.notes, `${label}.notes`);

  if (seenRouteIds.has(record.route_id)) fail(`${label} duplicates route_id ${record.route_id}.`);
  seenRouteIds.add(record.route_id);

  const authorityKey = `${record.authority_id}/${record.official_source_id}`;
  if (!authorityKeys.has(authorityKey)) {
    fail(`${label} must link to an authority source inventory record via ${authorityKey}.`);
  }
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
  [specPath, specText],
  [flowSpecPath, flowSpecText],
  [currentStatusPath, currentStatusText],
  [specsReadmePath, specsReadmeText],
]) {
  if (!text.includes('Acquisition Route Inventory')) fail(`${label} must mention Acquisition Route Inventory.`);
}
for (const [label, text] of [
  [specPath, specText],
  [currentStatusPath, currentStatusText],
  [specsReadmePath, specsReadmeText],
]) {
  if (!text.includes('timetable-acquisition-route-schema.md')) {
    fail(`${label} must link to timetable-acquisition-route-schema.md.`);
  }
}
for (const token of [...requiredRecordFields, ...acquisitionModeEnum, ...outputTargetEnum, ...allowedRefreshScopeEnum, ...statusEnum]) {
  if (!specText.includes(token)) fail(`${specPath} must document ${token}.`);
}

const packageScript = packageJson?.scripts?.[packageScriptName];
requireEqual(packageScript, `node ${scriptPath}`, `${packagePath}.scripts.${packageScriptName}`);
if (!packageJson?.scripts?.check?.includes(`npm run ${packageScriptName}`)) {
  fail(`${packagePath}.scripts.check must run ${packageScriptName}.`);
}
if (!scriptText.includes('no live source fetching') || !scriptText.includes('no raw source body/html storage')) {
  fail(`${scriptPath} must preserve public-safe exclusion checks.`);
}

if (errors.length > 0) {
  console.error('[timetable-acquisition-route-schema] FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[timetable-acquisition-route-schema] PASS');
