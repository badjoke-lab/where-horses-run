import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const routeInventoryPath = 'data/static/timetable-acquisition-routes.json';
const routeSchemaPath = 'data/static/timetable-acquisition-routes.schema.json';
const authorityInventoryPath = 'data/static/authority-source-inventory.json';
const normalizedTimetablePath = 'data/generated/normalized-timetable.json';

const docsPaths = [
  'docs/specs/README.md',
  'docs/runbooks/current-status.md',
  'docs/specs/timetable-data-flow-and-display-contract.md',
];

const packagePath = 'package.json';
const packageScriptName = 'validate:timetable-refresh-dry-run-skeleton';
const scriptPath = 'scripts/dry-run-timetable-acquisition-routes.mjs';

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

const forbiddenRouteFragments = [
  'raw_html',
  'raw-html',
  'raw html',
  'raw_body',
  'raw-body',
  'raw body',
  'source_body',
  'source-body',
  'source body',
  'body/html',
  'html body',
  'racecard',
  'racecards',
  'odds',
  'result',
  'results',
  'payout',
  'payouts',
  'prediction',
  'predictions',
  'tip',
  'tips',
  'full_entry',
  'full_entries',
  'full-entry',
  'full-entries',
  'full entry',
  'full entries',
  'entries',
];

const publicSafetyTokens = [
  'dry-run/status-only',
  'no live fetching',
  'no scheduler',
  'no generated writeback',
  'future route records can be checked through this skeleton before implementation',
];

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
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

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
}

function requireString(value, label) {
  if (!isNonEmptyString(value)) fail(`${label} must be a non-empty string.`);
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

function scanForForbiddenRouteImplications(record, label) {
  for (const [key, value] of Object.entries(record)) {
    const keyText = key.toLowerCase();
    const valueText = typeof value === 'string' ? value.toLowerCase() : '';
    for (const fragment of forbiddenRouteFragments) {
      if (keyText.includes(fragment) || valueText.includes(fragment)) {
        fail(`${label}.${key} implies prohibited route content (${fragment}).`);
      }
    }
  }
}

const schema = readJson(routeSchemaPath);
const routes = readJson(routeInventoryPath);
const authorityInventory = readJson(authorityInventoryPath);
const normalizedTimetable = readJson(normalizedTimetablePath);
const packageJson = readJson(packagePath);
const docsText = docsPaths.map((docPath) => [docPath, readText(docPath) ?? '']);

const acquisitionModes = schema?.acquisition_mode_enum ?? [];
const outputTargets = schema?.output_target_enum ?? [];
const allowedRefreshScopes = schema?.allowed_refresh_scope_enum ?? [];
const statuses = schema?.status_enum ?? [];

requireEqual(schema?.schema_version, 'timetable-acquisition-routes-schema-v0', `${routeSchemaPath}.schema_version`);
requireEqual(routes?.schema_ref, routeSchemaPath, `${routeInventoryPath}.schema_ref`);
requireArray(routes?.records, `${routeInventoryPath}.records`);
requireEqual(authorityInventory?.schema_ref, 'data/static/authority-source-inventory.schema.json', `${authorityInventoryPath}.schema_ref`);
requireArray(authorityInventory?.records, `${authorityInventoryPath}.records`);
requireEqual(normalizedTimetable?.schema_ref, 'data/generated/normalized-timetable.schema.json', `${normalizedTimetablePath}.schema_ref`);
requireArray(normalizedTimetable?.records, `${normalizedTimetablePath}.records`);

for (const field of requiredRecordFields) {
  if (!schema?.required_record_fields?.includes(field)) fail(`${routeSchemaPath}.required_record_fields must include ${field}.`);
}
for (const [enumName, values] of [
  ['acquisition_mode_enum', acquisitionModes],
  ['output_target_enum', outputTargets],
  ['allowed_refresh_scope_enum', allowedRefreshScopes],
  ['status_enum', statuses],
]) {
  if (!Array.isArray(values) || values.length === 0) fail(`${routeSchemaPath}.${enumName} must define allowed values.`);
}

const authorityPairs = new Set();
for (const [index, record] of (authorityInventory?.records ?? []).entries()) {
  if (!isPlainObject(record)) {
    fail(`${authorityInventoryPath}.records[${index}] must be an object.`);
    continue;
  }
  if (isNonEmptyString(record.authority_id) && isNonEmptyString(record.official_source_id)) {
    authorityPairs.add(`${record.authority_id}/${record.official_source_id}`);
  } else {
    fail(`${authorityInventoryPath}.records[${index}] must include authority_id and official_source_id.`);
  }
}

const routeIds = new Set();
let linkedRoutes = 0;
for (const [index, record] of (routes?.records ?? []).entries()) {
  const label = `${routeInventoryPath}.records[${index}]`;
  if (!isPlainObject(record)) {
    fail(`${label} must be an object.`);
    continue;
  }

  for (const field of requiredRecordFields) {
    if (!Object.hasOwn(record, field)) fail(`${label}.${field} is required.`);
  }
  for (const key of Object.keys(record)) {
    if (!requiredRecordFields.includes(key)) fail(`${label}.${key} is not allowed in a timetable acquisition route record.`);
  }

  requireString(record.route_id, `${label}.route_id`);
  requireString(record.authority_id, `${label}.authority_id`);
  requireString(record.official_source_id, `${label}.official_source_id`);
  requireUrl(record.source_url, `${label}.source_url`);
  requireAllowed(record.acquisition_mode, acquisitionModes, `${label}.acquisition_mode`);
  requireAllowed(record.output_target, outputTargets, `${label}.output_target`);
  requireAllowed(record.allowed_refresh_scope, allowedRefreshScopes, `${label}.allowed_refresh_scope`);
  requireNullableIsoDate(record.last_checked_date, `${label}.last_checked_date`);
  requireAllowed(record.status, statuses, `${label}.status`);
  requireString(record.notes, `${label}.notes`);

  if (routeIds.has(record.route_id)) fail(`${label}.route_id duplicates ${record.route_id}.`);
  routeIds.add(record.route_id);

  const authorityPair = `${record.authority_id}/${record.official_source_id}`;
  if (authorityPairs.has(authorityPair)) {
    linkedRoutes += 1;
  } else {
    fail(`${label} must link to an authority_id + official_source_id pair in ${authorityInventoryPath}: ${authorityPair}.`);
  }

  scanForForbiddenRouteImplications(record, label);
}

if ((routes?.records?.length ?? 0) === 0) {
  warn('No acquisition route records are present yet; this is expected until reviewed JRA/NAR/HKJC route records are added later.');
}

for (const [docPath, text] of docsText) {
  for (const token of publicSafetyTokens) {
    if (!text.toLowerCase().includes(token)) fail(`${docPath} must document ${token}.`);
  }
}

requireEqual(packageJson?.scripts?.[packageScriptName], `node ${scriptPath}`, `${packagePath}.scripts.${packageScriptName}`);
if (!packageJson?.scripts?.check?.includes(`npm run ${packageScriptName}`)) {
  fail(`${packagePath}.scripts.check must run ${packageScriptName}.`);
}

const summary = {
  mode: 'dry_run_status_only',
  live_fetching: false,
  scheduler: false,
  generated_writeback: false,
  files_read: [routeInventoryPath, routeSchemaPath, authorityInventoryPath, normalizedTimetablePath],
  route_records: routes?.records?.length ?? 0,
  authority_source_pairs: authorityPairs.size,
  linked_routes: linkedRoutes,
  normalized_timetable_records_read_only: normalizedTimetable?.records?.length ?? 0,
  allowed_acquisition_modes: acquisitionModes,
  allowed_output_targets: outputTargets,
  allowed_refresh_scopes: allowedRefreshScopes,
  forbidden_route_implications_checked: forbiddenRouteFragments,
  warnings,
};

if (errors.length > 0) {
  console.error('[timetable-refresh-dry-run-skeleton] FAIL');
  for (const error of errors) console.error(`- ${error}`);
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log('[timetable-refresh-dry-run-skeleton] PASS');
console.log(JSON.stringify(summary, null, 2));
