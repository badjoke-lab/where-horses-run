import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

const paths = {
  sourceSchema: 'data/static/source-test-v2.schema.json',
  readinessSchema: 'data/static/calendar-readiness.schema.json',
  registry: 'data/static/calendar-readiness-registry.json',
  authoritySchema: 'data/static/authority-source-inventory.schema.json',
  authorityInventory: 'data/static/authority-source-inventory.json',
  tracker: 'docs/country-pages/98-country-tracker.tsv',
  racecourses: 'data/static/racecourses.json',
  racecourseExtensions: 'data/static/racecourses-extensions.json',
  sourceContract: 'docs/calendar/source-test-v2-contract.md',
  readinessContract: 'docs/calendar/calendar-readiness-contract.md',
  machineContract: 'docs/calendar/machine-readable-contracts.md',
};

const ranks = ['C', 'B', 'B+', 'A', 'A+'];
const requiredReadinessFields = [
  'readiness_id', 'country_id', 'country_tracker_delivery_no', 'system_id', 'system_name_en',
  'authority_source_key', 'racecourse_ids', 'coverage_scope', 'technical_rank', 'public_ceiling',
  'confirmed_fields', 'source_format', 'access_mode', 'automation_mode', 'refresh_classes',
  'readiness', 'implementation_status', 'fallback', 'source_status', 'checked_date',
  'evidence_reviewed_at', 'revalidation_trigger', 'blocked_reason', 'source_test_ref', 'limitations', 'notes',
];

function readText(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}
function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return null;
  try { return JSON.parse(text); }
  catch (error) { fail(`${relativePath} must parse as JSON: ${error.message}`); return null; }
}
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function isoDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function listFiles(directory) {
  const absolute = path.join(root, directory);
  if (!existsSync(absolute)) return [];
  const output = [];
  for (const entry of readdirSync(absolute)) {
    const relative = path.join(directory, entry);
    const target = path.join(root, relative);
    if (statSync(target).isDirectory()) output.push(...listFiles(relative));
    else output.push(relative.replaceAll('\\', '/'));
  }
  return output;
}
function requirePhrases(file, phrases) {
  const text = readText(file);
  for (const phrase of phrases) if (!text.includes(phrase)) fail(`${file} must include ${phrase}.`);
}

const sourceSchema = readJson(paths.sourceSchema);
const readinessSchema = readJson(paths.readinessSchema);
const registry = readJson(paths.registry);
const authoritySchema = readJson(paths.authoritySchema);
const authorityInventory = readJson(paths.authorityInventory);
const racecourses = readJson(paths.racecourses);
const racecourseExtensions = readJson(paths.racecourseExtensions);
const trackerText = readText(paths.tracker);

if (sourceSchema?.schema_version !== 'source-test-v2-schema-v1') fail(`${paths.sourceSchema}.schema_version is invalid.`);
if (readinessSchema?.schema_version !== 'calendar-readiness-schema-v1') fail(`${paths.readinessSchema}.schema_version is invalid.`);
if (JSON.stringify(sourceSchema?.technical_rank_enum) !== JSON.stringify(ranks)) fail(`${paths.sourceSchema}.technical_rank_enum differs.`);
if (JSON.stringify(readinessSchema?.technical_rank_enum) !== JSON.stringify(ranks)) fail(`${paths.readinessSchema}.technical_rank_enum differs.`);
if (JSON.stringify(authoritySchema?.capability_rank_enum) !== JSON.stringify(ranks)) fail(`${paths.authoritySchema}.capability_rank_enum differs.`);
if (JSON.stringify(readinessSchema?.required_record_fields) !== JSON.stringify(requiredReadinessFields)) fail(`${paths.readinessSchema}.required_record_fields differs.`);

const trackerLines = trackerText.trim().split(/\r?\n/);
const trackerHeaders = (trackerLines.shift() ?? '').split('\t');
const slugIndex = trackerHeaders.indexOf('slug');
const deliveryIndex = trackerHeaders.indexOf('delivery_no');
if (slugIndex < 0 || deliveryIndex < 0) fail(`${paths.tracker} must include slug and delivery_no columns.`);
const trackerRows = trackerLines.filter(Boolean).map((line) => line.split('\t'));
if (trackerRows.length === 0) fail(`${paths.tracker} must contain at least one country.`);
const countryDelivery = new Map();
for (const row of trackerRows) {
  const slug = row[slugIndex];
  const deliveryNo = row[deliveryIndex];
  if (!nonEmpty(slug) || !nonEmpty(deliveryNo)) fail('Country tracker contains an invalid row.');
  if (countryDelivery.has(slug)) fail(`${paths.tracker} duplicates slug ${slug}.`);
  countryDelivery.set(slug, deliveryNo);
}

const authorityKeys = new Set((authorityInventory?.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
const racecourseCountry = new Map();
for (const [file, records] of [[paths.racecourses, racecourses], [paths.racecourseExtensions, racecourseExtensions]]) {
  if (!Array.isArray(records)) { fail(`${file} must be an array.`); continue; }
  for (const record of records) {
    if (!nonEmpty(record?.id)) continue;
    if (racecourseCountry.has(record.id)) fail(`racecourse registries duplicate ${record.id}.`);
    else racecourseCountry.set(record.id, record.country_id);
  }
}

if (registry?.schema_version !== 'calendar-readiness-registry-v1') fail(`${paths.registry}.schema_version is invalid.`);
if (registry?.schema_ref !== paths.readinessSchema) fail(`${paths.registry}.schema_ref differs.`);
if (registry?.source_test_schema_ref !== paths.sourceSchema) fail(`${paths.registry}.source_test_schema_ref differs.`);
if (!Array.isArray(registry?.records)) fail(`${paths.registry}.records must be an array.`);
if (registry?.programme_state?.country_target !== trackerRows.length) fail(`${paths.registry}.programme_state.country_target must match the tracker row count.`);

const rankOrder = new Map(ranks.map((rank, index) => [rank, index]));
const seenReadiness = new Set();
const closedCountries = new Set();
for (const [index, record] of (registry?.records ?? []).entries()) {
  const label = `${paths.registry}.records[${index}]`;
  if (!isObject(record)) { fail(`${label} must be an object.`); continue; }
  for (const field of requiredReadinessFields) if (!Object.hasOwn(record, field)) fail(`${label}.${field} is required.`);
  for (const key of Object.keys(record)) if (!requiredReadinessFields.includes(key)) fail(`${label}.${key} is not part of the readiness schema.`);
  if (!nonEmpty(record.readiness_id) || seenReadiness.has(record.readiness_id)) fail(`${label}.readiness_id must be unique and non-empty.`);
  seenReadiness.add(record.readiness_id);
  if (!countryDelivery.has(record.country_id)) fail(`${label}.country_id must exist in the country tracker.`);
  else if (countryDelivery.get(record.country_id) !== record.country_tracker_delivery_no) fail(`${label}.country_tracker_delivery_no must match the tracker.`);
  closedCountries.add(record.country_id);
  if (record.authority_source_key !== null && !authorityKeys.has(record.authority_source_key)) fail(`${label}.authority_source_key must resolve to authority/source inventory.`);
  if (!ranks.includes(record.technical_rank) || !ranks.includes(record.public_ceiling)) fail(`${label} uses an invalid rank.`);
  if ((rankOrder.get(record.public_ceiling) ?? 99) > (rankOrder.get(record.technical_rank) ?? -1)) fail(`${label}.public_ceiling exceeds technical_rank.`);
  for (const racecourseId of record.racecourse_ids ?? []) {
    if (!racecourseCountry.has(racecourseId)) fail(`${label}.racecourse_ids references unknown ${racecourseId}.`);
    else if (racecourseCountry.get(racecourseId) !== record.country_id) fail(`${label}.racecourse_ids ${racecourseId} belongs to another country.`);
  }
  if (!isoDate(record.checked_date) || !isoDate(record.evidence_reviewed_at)) fail(`${label} has an invalid reviewed date.`);
  if (!nonEmpty(record.source_test_ref) || !record.source_test_ref.startsWith('docs/timetable-source-tests/') || !existsSync(path.join(root, record.source_test_ref))) fail(`${label}.source_test_ref must resolve under docs/timetable-source-tests/.`);
  if (!Array.isArray(record.limitations) || !nonEmpty(record.notes) || !nonEmpty(record.revalidation_trigger)) fail(`${label} has incomplete public-safe metadata.`);
}

if (registry?.programme_state?.readiness_records !== (registry?.records?.length ?? 0)) fail(`${paths.registry}.programme_state.readiness_records must match records.length.`);
if (registry?.programme_state?.countries_with_closed_decision !== closedCountries.size) fail(`${paths.registry}.programme_state.countries_with_closed_decision must match unique record countries.`);
if (registry?.bootstrap_status === 'complete' && (registry?.programme_state?.next_backfill_work_ids?.length ?? 0) !== 0) fail(`${paths.registry}: complete bootstrap must not retain backfill work IDs.`);

const sourceTestFiles = listFiles('docs/timetable-source-tests').filter((file) => file.endsWith('/source-test-v2.json'));
for (const file of sourceTestFiles) {
  const summary = readJson(file);
  if (summary?.schema_version !== 'source-test-v2-v1') fail(`${file}.schema_version is invalid.`);
  if (!countryDelivery.has(summary?.country_id)) fail(`${file}.country_id must exist in the country tracker.`);
  if (countryDelivery.get(summary?.country_id) !== summary?.delivery_no) fail(`${file}.delivery_no must match the tracker.`);
  if (!isoDate(summary?.checked_date) || !isoDate(summary?.evidence_reviewed_at)) fail(`${file} has invalid reviewed dates.`);
  if (summary?.public_safe !== true) fail(`${file}.public_safe must be true.`);
  if (!Array.isArray(summary?.records) || summary.records.length === 0) fail(`${file}.records must contain reviewed decisions.`);
}

requirePhrases(paths.sourceContract, [paths.sourceSchema, paths.registry]);
requirePhrases(paths.readinessContract, [paths.readinessSchema, paths.registry]);
requirePhrases(paths.machineContract, [paths.sourceSchema, paths.readinessSchema, paths.registry, 'node scripts/check-calendar-contracts.mjs']);

if (errors.length) {
  console.error(`[calendar-contracts] FAIL (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('[calendar-contracts] PASS');
console.log(`TRACKER_COUNTRIES: ${countryDelivery.size}`);
console.log(`READINESS_RECORDS: ${registry.records.length}`);
console.log(`CLOSED_COUNTRIES: ${closedCountries.size}`);
console.log(`SOURCE_TEST_V2_FILES: ${sourceTestFiles.length}`);
console.log('HISTORICAL_WORK_IDS_REQUIRED: false');
console.log('FIXED_PROGRAMME_COUNTRY_COUNT_REQUIRED: false');
