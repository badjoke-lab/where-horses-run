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
  sourceContract: 'docs/calendar/source-test-v2-contract.md',
  readinessContract: 'docs/calendar/calendar-readiness-contract.md',
  machineContract: 'docs/calendar/machine-readable-contracts.md',
  roadmap: 'docs/project-roadmap.md',
  startHere: 'START-HERE.md',
};

const expected = {
  ranks: ['C', 'B', 'B+', 'A', 'A+'],
  coverageScopes: [
    'countrywide',
    'authority_wide',
    'subset_of_authority_racecourses',
    'single_racecourse',
    'system_only',
    'archive_or_explanatory',
    'unknown',
  ],
  sourceFormats: [
    'html',
    'json',
    'api',
    'pdf',
    'csv',
    'ics',
    'javascript_rendered',
    'mobile_app_only',
    'mixed',
    'unknown',
  ],
  accessModes: [
    'direct',
    'date_route',
    'query_parameter',
    'api_call',
    'javascript_required',
    'login_required',
    'local_required',
    'unreachable',
    'unknown',
  ],
  automationModes: [
    'automatic',
    'semi_automatic',
    'manual_import',
    'manual_confirmation',
    'link_only',
    'blocked',
    'not_applicable',
  ],
  refreshClasses: [
    'daily',
    'near_meeting',
    'weekly',
    'monthly',
    'seasonal',
    'event_driven',
    'manual',
    'none',
  ],
  readiness: ['ready', 'prototype_ready', 'manual_ready', 'link_only', 'blocked', 'not_applicable'],
  implementationStatuses: [
    'not_started',
    'prototype',
    'fixture_validated',
    'candidate_active',
    'manual_operation',
    'scheduled_candidate_active',
    'public_active',
    'paused',
    'retired',
  ],
  fallbacks: [
    'keep_last_verified_and_mark_stale',
    'downgrade_to_C',
    'official_link_only',
    'hide_from_current_calendar',
    'archive_last_verified',
    'not_applicable',
  ],
  sourceStatuses: ['verified', 'partial', 'not_verified', 'stale', 'unavailable'],
  confirmedFields: [
    'meeting_date',
    'racecourse',
    'first_race_time',
    'last_race_time',
    'per_race_post_times',
    'race_name',
    'distance',
    'surface',
    'course',
  ],
};

const requiredReadinessFields = [
  'readiness_id',
  'country_id',
  'country_tracker_delivery_no',
  'system_id',
  'system_name_en',
  'authority_source_key',
  'racecourse_ids',
  'coverage_scope',
  'technical_rank',
  'public_ceiling',
  'confirmed_fields',
  'source_format',
  'access_mode',
  'automation_mode',
  'refresh_classes',
  'readiness',
  'implementation_status',
  'fallback',
  'source_status',
  'checked_date',
  'evidence_reviewed_at',
  'revalidation_trigger',
  'blocked_reason',
  'source_test_ref',
  'limitations',
  'notes',
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

function requireExactArray(actual, expectedArray, label) {
  if (!Array.isArray(actual)) {
    fail(`${label} must be an array.`);
    return;
  }
  if (actual.length !== expectedArray.length || expectedArray.some((value, index) => actual[index] !== value)) {
    fail(`${label} must equal ${JSON.stringify(expectedArray)}.`);
  }
}

function requireAllowed(value, allowed, label) {
  if (!allowed.includes(value)) fail(`${label} must be one of ${allowed.join(', ')}.`);
}

function requireIsoDate(value, label) {
  if (!isNonEmptyString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label} must be YYYY-MM-DD.`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${label} must be a valid calendar date.`);
  }
}

function requireStringArray(value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array.`);
    return [];
  }
  if (!allowEmpty && value.length === 0) fail(`${label} must not be empty.`);
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) fail(`${label}[${index}] must be a non-empty string.`);
  });
  if (new Set(value).size !== value.length) fail(`${label} must not contain duplicates.`);
  return value;
}

function walkKeys(value, visitor, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkKeys(entry, visitor, [...trail, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    visitor(key, [...trail, key]);
    walkKeys(entry, visitor, [...trail, key]);
  }
}

function listFiles(directory) {
  const absolute = path.join(root, directory);
  if (!existsSync(absolute)) return [];
  const output = [];
  for (const entry of readdirSync(absolute)) {
    const relative = path.join(directory, entry);
    const absoluteEntry = path.join(root, relative);
    if (statSync(absoluteEntry).isDirectory()) output.push(...listFiles(relative));
    else output.push(relative.replaceAll('\\', '/'));
  }
  return output;
}

const sourceSchema = readJson(paths.sourceSchema);
const readinessSchema = readJson(paths.readinessSchema);
const registry = readJson(paths.registry);
const authoritySchema = readJson(paths.authoritySchema);
const authorityInventory = readJson(paths.authorityInventory);
const racecourses = readJson(paths.racecourses);
const trackerText = readText(paths.tracker);
const sourceContractText = readText(paths.sourceContract);
const readinessContractText = readText(paths.readinessContract);
const machineContractText = readText(paths.machineContract);
const roadmapText = readText(paths.roadmap);
const startHereText = readText(paths.startHere);

if (sourceSchema?.schema_version !== 'source-test-v2-schema-v1') fail(`${paths.sourceSchema}.schema_version is invalid.`);
if (readinessSchema?.schema_version !== 'calendar-readiness-schema-v1') fail(`${paths.readinessSchema}.schema_version is invalid.`);

for (const [field, values] of [
  ['technical_rank_enum', expected.ranks],
  ['public_ceiling_enum', expected.ranks],
  ['coverage_scope_enum', expected.coverageScopes],
  ['source_format_enum', expected.sourceFormats],
  ['access_mode_enum', expected.accessModes],
  ['automation_mode_enum', expected.automationModes],
  ['refresh_class_enum', expected.refreshClasses],
  ['readiness_enum', expected.readiness],
  ['implementation_status_enum', expected.implementationStatuses],
  ['fallback_enum', expected.fallbacks],
  ['source_status_enum', expected.sourceStatuses],
  ['confirmed_field_keys', expected.confirmedFields],
]) {
  requireExactArray(sourceSchema?.[field], values, `${paths.sourceSchema}.${field}`);
  requireExactArray(readinessSchema?.[field], values, `${paths.readinessSchema}.${field}`);
}

requireExactArray(readinessSchema?.required_record_fields, requiredReadinessFields, `${paths.readinessSchema}.required_record_fields`);
requireExactArray(authoritySchema?.capability_rank_enum, expected.ranks, `${paths.authoritySchema}.capability_rank_enum`);

const trackerLines = trackerText.trim().split(/\r?\n/);
const trackerHeaders = (trackerLines.shift() ?? '').split('\t');
const trackerSlugIndex = trackerHeaders.indexOf('slug');
const trackerDeliveryIndex = trackerHeaders.indexOf('delivery_no');
if (trackerSlugIndex < 0 || trackerDeliveryIndex < 0) fail(`${paths.tracker} must include slug and delivery_no columns.`);
const trackerRows = trackerLines.filter(Boolean).map((line) => line.split('\t'));
if (trackerRows.length !== 98) fail(`${paths.tracker} must contain exactly 98 data rows; found ${trackerRows.length}.`);
const countryDelivery = new Map();
for (const row of trackerRows) {
  const slug = row[trackerSlugIndex];
  const deliveryNo = row[trackerDeliveryIndex];
  if (!isNonEmptyString(slug) || !/^\d{2}$/.test(deliveryNo ?? '')) fail(`Invalid tracker row for ${slug || '(missing slug)'}.`);
  if (countryDelivery.has(slug)) fail(`${paths.tracker} duplicates slug ${slug}.`);
  countryDelivery.set(slug, deliveryNo);
}

const authorityKeys = new Set();
for (const record of authorityInventory?.records ?? []) {
  const key = `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
  authorityKeys.add(key);
}

const racecourseCountry = new Map();
if (!Array.isArray(racecourses)) fail(`${paths.racecourses} must be an array.`);
for (const record of racecourses ?? []) {
  if (isNonEmptyString(record?.id)) racecourseCountry.set(record.id, record.country_id);
}

if (registry?.schema_version !== 'calendar-readiness-registry-v1') fail(`${paths.registry}.schema_version is invalid.`);
if (registry?.schema_ref !== paths.readinessSchema) fail(`${paths.registry}.schema_ref must reference ${paths.readinessSchema}.`);
if (registry?.source_test_schema_ref !== paths.sourceSchema) fail(`${paths.registry}.source_test_schema_ref must reference ${paths.sourceSchema}.`);
requireAllowed(registry?.bootstrap_status, ['pending_backfill_01_52', 'backfill_in_progress', 'source_test_v2_active', 'complete'], `${paths.registry}.bootstrap_status`);
if (!isPlainObject(registry?.programme_state)) fail(`${paths.registry}.programme_state must be an object.`);
if (registry?.programme_state?.country_target !== 98) fail(`${paths.registry}.programme_state.country_target must be 98.`);
const nextBackfillWorkIds = requireStringArray(registry?.programme_state?.next_backfill_work_ids, `${paths.registry}.programme_state.next_backfill_work_ids`);
if (registry?.bootstrap_status === 'complete' && nextBackfillWorkIds.length !== 0) fail(`${paths.registry}.programme_state.next_backfill_work_ids must be empty when complete.`);
if (registry?.bootstrap_status !== 'complete' && nextBackfillWorkIds.length === 0) fail(`${paths.registry}.programme_state.next_backfill_work_ids must not be empty before completion.`);
if (!Array.isArray(registry?.records)) fail(`${paths.registry}.records must be an array.`);

const rankOrder = new Map(expected.ranks.map((rank, index) => [rank, index]));
const seenReadinessIds = new Set();
const closedCountries = new Set();
const prohibitedKeyFragments = ['raw_html', 'raw_body', 'source_body', 'runner', 'jockey', 'trainer', 'odds', 'payout', 'prediction', 'tip', 'credential', 'cookie', 'token', 'private'];

for (const [index, record] of (registry?.records ?? []).entries()) {
  const label = `${paths.registry}.records[${index}]`;
  if (!isPlainObject(record)) {
    fail(`${label} must be an object.`);
    continue;
  }
  for (const field of requiredReadinessFields) {
    if (!Object.hasOwn(record, field)) fail(`${label}.${field} is required.`);
  }
  for (const key of Object.keys(record)) {
    if (!requiredReadinessFields.includes(key)) fail(`${label}.${key} is not part of the readiness schema.`);
  }

  if (!isNonEmptyString(record.readiness_id) || !/^[a-z0-9-]+--[a-z0-9-]+--[a-z0-9-]+$/.test(record.readiness_id)) {
    fail(`${label}.readiness_id must use country--system--source-or-scope slug format.`);
  }
  if (seenReadinessIds.has(record.readiness_id)) fail(`${label}.readiness_id duplicates ${record.readiness_id}.`);
  seenReadinessIds.add(record.readiness_id);

  if (!countryDelivery.has(record.country_id)) fail(`${label}.country_id must exist in the 98-country tracker.`);
  else if (countryDelivery.get(record.country_id) !== record.country_tracker_delivery_no) {
    fail(`${label}.country_tracker_delivery_no does not match the tracker.`);
  }
  closedCountries.add(record.country_id);

  if (!isNonEmptyString(record.system_id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.system_id)) fail(`${label}.system_id must be a slug.`);
  if (!isNonEmptyString(record.system_name_en)) fail(`${label}.system_name_en must be a non-empty string.`);

  if (record.authority_source_key !== null) {
    if (!isNonEmptyString(record.authority_source_key) || !authorityKeys.has(record.authority_source_key)) {
      fail(`${label}.authority_source_key must match the authority source inventory or be null.`);
    } else if (!record.authority_source_key.startsWith(`${record.country_id}/`)) {
      fail(`${label}.authority_source_key must belong to ${record.country_id}.`);
    }
  }

  const racecourseIds = requireStringArray(record.racecourse_ids, `${label}.racecourse_ids`);
  for (const racecourseId of racecourseIds) {
    if (!racecourseCountry.has(racecourseId)) fail(`${label}.racecourse_ids references unknown racecourse ${racecourseId}.`);
    else if (racecourseCountry.get(racecourseId) !== record.country_id) fail(`${label}.racecourse_ids ${racecourseId} belongs to another country.`);
  }

  requireAllowed(record.coverage_scope, expected.coverageScopes, `${label}.coverage_scope`);
  requireAllowed(record.technical_rank, expected.ranks, `${label}.technical_rank`);
  requireAllowed(record.public_ceiling, expected.ranks, `${label}.public_ceiling`);
  if ((rankOrder.get(record.public_ceiling) ?? 99) > (rankOrder.get(record.technical_rank) ?? -1)) {
    fail(`${label}.public_ceiling must not exceed technical_rank.`);
  }

  if (!isPlainObject(record.confirmed_fields)) fail(`${label}.confirmed_fields must be an object.`);
  else {
    requireExactArray(Object.keys(record.confirmed_fields), expected.confirmedFields, `${label}.confirmed_fields keys`);
    for (const field of expected.confirmedFields) {
      if (typeof record.confirmed_fields[field] !== 'boolean') fail(`${label}.confirmed_fields.${field} must be boolean.`);
    }
  }

  requireAllowed(record.source_format, expected.sourceFormats, `${label}.source_format`);
  requireAllowed(record.access_mode, expected.accessModes, `${label}.access_mode`);
  requireAllowed(record.automation_mode, expected.automationModes, `${label}.automation_mode`);
  const refreshClasses = requireStringArray(record.refresh_classes, `${label}.refresh_classes`, { allowEmpty: false });
  refreshClasses.forEach((value) => requireAllowed(value, expected.refreshClasses, `${label}.refresh_classes`));
  requireAllowed(record.readiness, expected.readiness, `${label}.readiness`);
  requireAllowed(record.implementation_status, expected.implementationStatuses, `${label}.implementation_status`);
  requireAllowed(record.fallback, expected.fallbacks, `${label}.fallback`);
  requireAllowed(record.source_status, expected.sourceStatuses, `${label}.source_status`);
  requireIsoDate(record.checked_date, `${label}.checked_date`);
  requireIsoDate(record.evidence_reviewed_at, `${label}.evidence_reviewed_at`);
  if (!isNonEmptyString(record.revalidation_trigger)) fail(`${label}.revalidation_trigger must be a non-empty string.`);

  if (record.readiness === 'blocked') {
    if (record.automation_mode !== 'blocked') fail(`${label}: blocked readiness requires blocked automation_mode.`);
    if (!isNonEmptyString(record.blocked_reason)) fail(`${label}: blocked readiness requires blocked_reason.`);
  } else if (record.blocked_reason !== null) {
    fail(`${label}.blocked_reason must be null unless readiness is blocked.`);
  }
  if (record.readiness === 'not_applicable') {
    if (record.automation_mode !== 'not_applicable' || record.fallback !== 'not_applicable') fail(`${label}: not_applicable states must align.`);
  }
  if (record.readiness === 'link_only') {
    if (record.automation_mode !== 'link_only' || record.fallback !== 'official_link_only') fail(`${label}: link_only states must align.`);
  }
  if (record.readiness === 'manual_ready' && !['manual_import', 'manual_confirmation'].includes(record.automation_mode)) {
    fail(`${label}: manual_ready requires a manual automation mode.`);
  }
  if (['ready', 'prototype_ready', 'manual_ready', 'link_only'].includes(record.readiness) && record.authority_source_key === null) {
    fail(`${label}: ${record.readiness} requires authority_source_key.`);
  }
  if (['ready', 'prototype_ready', 'manual_ready'].includes(record.readiness) && record.fallback === 'not_applicable') {
    fail(`${label}: operational readiness requires an operational fallback.`);
  }
  if (record.implementation_status === 'public_active' && !['ready', 'manual_ready'].includes(record.readiness)) {
    fail(`${label}: public_active requires ready or manual_ready.`);
  }

  if (!isNonEmptyString(record.source_test_ref) || !record.source_test_ref.startsWith('docs/timetable-source-tests/')) {
    fail(`${label}.source_test_ref must point under docs/timetable-source-tests/.`);
  } else if (!existsSync(path.join(root, record.source_test_ref))) {
    fail(`${label}.source_test_ref does not exist: ${record.source_test_ref}.`);
  }
  requireStringArray(record.limitations, `${label}.limitations`);
  if (!isNonEmptyString(record.notes)) fail(`${label}.notes must be a non-empty public-safe string.`);
}

walkKeys(registry, (key, trail) => {
  const normalized = key.toLowerCase();
  if (prohibitedKeyFragments.some((fragment) => normalized.includes(fragment))) {
    fail(`${paths.registry}.${trail.join('.')} uses prohibited key fragment.`);
  }
});

if (registry?.programme_state?.readiness_records !== (registry?.records?.length ?? 0)) {
  fail(`${paths.registry}.programme_state.readiness_records must match records.length.`);
}
if (registry?.programme_state?.countries_with_closed_decision !== closedCountries.size) {
  fail(`${paths.registry}.programme_state.countries_with_closed_decision must match unique record countries.`);
}
if ((registry?.records?.length ?? 0) === 0 && registry?.bootstrap_status !== 'pending_backfill_01_52') {
  fail(`${paths.registry}: an empty registry must use pending_backfill_01_52.`);
}

const sourceTestV2Files = listFiles('docs/timetable-source-tests').filter((file) => file.endsWith('/source-test-v2.json'));
for (const file of sourceTestV2Files) {
  const summary = readJson(file);
  const label = file;
  for (const field of sourceSchema?.required_summary_fields ?? []) {
    if (!Object.hasOwn(summary ?? {}, field)) fail(`${label}.${field} is required by Source Test v2.`);
  }
  if (summary?.schema_version !== 'source-test-v2-v1') fail(`${label}.schema_version must be source-test-v2-v1.`);
  if (!countryDelivery.has(summary?.country_id)) fail(`${label}.country_id must exist in the 98-country tracker.`);
  if (countryDelivery.get(summary?.country_id) !== summary?.delivery_no) fail(`${label}.delivery_no must match the tracker.`);
  requireIsoDate(summary?.checked_date, `${label}.checked_date`);
  requireIsoDate(summary?.evidence_reviewed_at, `${label}.evidence_reviewed_at`);
  requireAllowed(summary?.country_completeness, sourceSchema?.country_completeness_enum ?? [], `${label}.country_completeness`);
  if (summary?.public_safe !== true) fail(`${label}.public_safe must be true.`);
  if (!Array.isArray(summary?.records) || summary.records.length === 0) fail(`${label}.records must contain at least one reviewed decision.`);
}

for (const [file, text, phrases] of [
  [paths.sourceContract, sourceContractText, [paths.sourceSchema, paths.registry, 'WHR-CAL-CONTRACT-02']],
  [paths.readinessContract, readinessContractText, [paths.readinessSchema, paths.registry, 'WHR-CAL-CONTRACT-02']],
  [paths.machineContract, machineContractText, [paths.sourceSchema, paths.readinessSchema, paths.registry, 'node scripts/check-calendar-contracts.mjs']],
  [paths.roadmap, roadmapText, ['Country-page programme: complete', 'Current Work ID: `WHR-CAL-DYNAMIC-DATES`', 'Completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-BASELINE-RECONCILE']],
  [paths.startHere, startHereText, ['Previous completed Work ID: `WHR-CAL-PIPELINE-V1`', 'WHR-CAL-DYNAMIC-DATES', 'WHR-CAL-OPS-V1']],
]) {
  for (const phrase of phrases) {
    if (!text.includes(phrase)) fail(`${file} must include ${phrase}.`);
  }
}

if (errors.length > 0) {
  console.error('[calendar-contracts] FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[calendar-contracts] PASS');
console.log(`TRACKER_COUNTRIES: ${countryDelivery.size}`);
console.log(`AUTHORITY_SOURCE_KEYS: ${authorityKeys.size}`);
console.log(`RACECOURSE_IDS: ${racecourseCountry.size}`);
console.log(`READINESS_RECORDS: ${registry.records.length}`);
console.log(`CLOSED_COUNTRIES: ${closedCountries.size}`);
console.log(`SOURCE_TEST_V2_FILES: ${sourceTestV2Files.length}`);
console.log('CURRENT_WORK_ID: WHR-CAL-DYNAMIC-DATES');
console.log('NEXT_WORK_ID: WHR-CAL-OPS-V1');
