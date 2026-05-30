import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const paths = {
  manual: 'data/static/manual-source-snapshots-batch-001.json',
  normalized: 'data/static/normalized-timetable-samples-batch-001.json',
  preview: 'data/static/preview-timetable-samples-batch-001.json',
  plan: 'data/static/manual-source-snapshot-first-batch-plan.json',
  schema: 'data/static/manual-source-snapshot-schema.json',
  package: 'package.json',
};

const expectedGroups = [
  'japan/jra',
  'japan/nar',
  'japan/banei',
  'hong-kong/hkjc',
  'united-arab-emirates/era',
  'south-korea/kra',
];
const allowedStatuses = new Set(['captured_static_sample', 'needs_source_correction']);
const placeholderPattern = /\b(?:tbd|unknown|pending_manual_capture|needs review|placeholder|example|sample only|dummy|null|n\/a)\b|<[^>]*race[^>]*>|<race_time>/i;
const requiredNoticeWords = ['static', 'manual', 'not live', 'full country coverage is not complete'];
const prohibitedKeys = new Set([
  'raw_body',
  'raw_html',
  'raw_source_body',
  'source_body',
  'html',
  'body',
  'generated_live_timetable_records',
  'live_timetable_records',
  'odds',
  'payouts',
  'predictions',
  'tips',
]);
const scrapingDependencies = new Set(['cheerio', 'jsdom', 'puppeteer', 'playwright', 'node-fetch', 'axios', 'got']);
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

function groupKey(record) {
  return `${record?.country_id}/${record?.group_id}`;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasPlaceholder(value) {
  if (typeof value === 'string') return placeholderPattern.test(value.trim());
  if (Array.isArray(value)) return value.some(hasPlaceholder);
  if (isPlainObject(value)) return Object.values(value).some(hasPlaceholder);
  return false;
}

function requireString(value, label) {
  if (!isNonEmptyString(value)) fail(`${label} must be a non-empty string.`);
  else if (hasPlaceholder(value)) fail(`${label} must not contain placeholder text.`);
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a non-empty array.`);
}

function walk(value, visitor, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, [...trail, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  visitor(value, trail);
  for (const [key, entry] of Object.entries(value)) walk(entry, visitor, [...trail, key]);
}

function requireNoProhibitedKeys(fileLabel, value) {
  walk(value, (object, trail) => {
    for (const key of Object.keys(object)) {
      if (prohibitedKeys.has(key.toLowerCase())) fail(`${fileLabel}.${[...trail, key].join('.')} must not store prohibited data.`);
    }
  });
}

function readPackageAtHead() {
  try {
    return JSON.parse(execFileSync('git', ['show', 'HEAD:package.json'], { cwd: root, encoding: 'utf8' }));
  } catch {
    return null;
  }
}

const manual = readJson(paths.manual);
const normalized = readJson(paths.normalized);
const preview = readJson(paths.preview);
const plan = readJson(paths.plan);
const schema = readJson(paths.schema);
const packageJson = readJson(paths.package);
const packageAtHead = readPackageAtHead();

for (const [label, value] of Object.entries({ manual, normalized, preview, plan, schema })) {
  requireNoProhibitedKeys(label, value);
}

const manualRecords = Array.isArray(manual?.records) ? manual.records : [];
const normalizedRecords = Array.isArray(normalized?.records) ? normalized.records : [];
const previewRecords = Array.isArray(preview?.records) ? preview.records : [];

const manualGroups = manualRecords.map(groupKey).sort();
if (manualGroups.length !== expectedGroups.length) fail(`${paths.manual} must include exactly ${expectedGroups.length} records.`);
for (const expected of expectedGroups) {
  if (!manualGroups.includes(expected)) fail(`${paths.manual} must include ${expected}.`);
}
for (const actual of manualGroups) {
  if (!expectedGroups.includes(actual)) fail(`${paths.manual} must not include unexpected group ${actual}.`);
}
if (manualGroups.some((key) => key.startsWith('singapore/'))) fail('Manual snapshots must not include an active Singapore snapshot.');

const planGroups = (plan?.selected_groups ?? []).map(groupKey).sort();
for (const expected of expectedGroups) {
  if (!planGroups.includes(expected)) fail(`${paths.plan} selected_groups must include ${expected}.`);
}
if (!Array.isArray(schema?.required_record_fields) || !schema.required_record_fields.includes('normalized_sample')) {
  fail(`${paths.schema} must define normalized_sample as a required snapshot field.`);
}

const manualByGroup = new Map();
for (const snapshot of manualRecords) {
  const key = groupKey(snapshot);
  manualByGroup.set(key, snapshot);
  if (!allowedStatuses.has(snapshot.status)) fail(`${snapshot.snapshot_id}: status must be captured_static_sample or needs_source_correction.`);
  if (snapshot.status === 'pending_manual_capture') fail(`${snapshot.snapshot_id}: pending_manual_capture is not allowed.`);
  if (snapshot.status === 'captured_static_sample') {
    for (const field of ['racecourse_or_meeting_context', 'first_race_time_evidence', 'per_race_time_evidence']) {
      requireString(snapshot[field], `${snapshot.snapshot_id}.${field}`);
    }
    requireString(snapshot.normalized_sample?.first_race_time, `${snapshot.snapshot_id}.normalized_sample.first_race_time`);
    requireArray(snapshot.normalized_sample?.races, `${snapshot.snapshot_id}.normalized_sample.races`);
    if (hasPlaceholder(snapshot.normalized_sample?.races)) fail(`${snapshot.snapshot_id}.normalized_sample.races must not contain placeholders.`);
  }
}
if (manualRecords.filter((snapshot) => snapshot.status === 'captured_static_sample').length < 4) {
  fail('At least four manual snapshots must be captured_static_sample.');
}

for (const sample of normalizedRecords) {
  const snapshot = manualByGroup.get(groupKey(sample));
  if (!snapshot) fail(`${sample.sample_id}: normalized sample must map to a manual snapshot.`);
  else if (snapshot.status !== 'captured_static_sample') fail(`${sample.sample_id}: normalized sample must not exist for ${snapshot.status}.`);
  for (const field of ['racecourse', 'meeting_date', 'first_race_time']) requireString(sample[field], `${sample.sample_id}.${field}`);
  requireArray(sample.races, `${sample.sample_id}.races`);
  if (!isPlainObject(sample.source_trace)) fail(`${sample.sample_id}.source_trace must exist.`);
  if (sample.data_status !== 'static_manual_sample') fail(`${sample.sample_id}.data_status must be static_manual_sample.`);
  for (const [index, race] of (sample.races ?? []).entries()) {
    if (typeof race.race_number !== 'number') fail(`${sample.sample_id}.races[${index}].race_number must be a number.`);
    requireString(race.race_time, `${sample.sample_id}.races[${index}].race_time`);
    requireString(race.race_name_or_label, `${sample.sample_id}.races[${index}].race_name_or_label`);
  }
  if (hasPlaceholder(sample)) fail(`${sample.sample_id} must not contain placeholders.`);
}

const normalizedByGroup = new Map(normalizedRecords.map((sample) => [groupKey(sample), sample]));
for (const previewSample of previewRecords) {
  const normalizedSample = normalizedByGroup.get(groupKey(previewSample));
  if (!normalizedSample) fail(`${previewSample.preview_id}: preview sample must map to a normalized sample.`);
  for (const field of [
    'display_country',
    'display_system',
    'display_racecourse',
    'display_meeting_date',
    'display_first_race_time',
    'official_source_url',
    'source_capture_date',
    'status_label',
  ]) requireString(previewSample[field], `${previewSample.preview_id}.${field}`);
  requireArray(previewSample.display_races, `${previewSample.preview_id}.display_races`);
  if (!previewSample.official_source_url?.startsWith('https://')) fail(`${previewSample.preview_id}.official_source_url must be an HTTPS official source URL.`);
  const notice = String(previewSample.user_notice ?? '').toLowerCase();
  for (const phrase of requiredNoticeWords) {
    if (!notice.includes(phrase)) fail(`${previewSample.preview_id}.user_notice must state ${phrase}.`);
  }
  for (const [index, race] of (previewSample.display_races ?? []).entries()) {
    if (typeof race.race_number !== 'number') fail(`${previewSample.preview_id}.display_races[${index}].race_number must be a number.`);
    requireString(race.race_time, `${previewSample.preview_id}.display_races[${index}].race_time`);
    requireString(race.label, `${previewSample.preview_id}.display_races[${index}].label`);
  }
}
if (previewRecords.length !== normalizedRecords.length) fail(`${paths.preview} must contain one preview per normalized sample.`);

if (packageAtHead) {
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const before = packageAtHead[field] ?? {};
    const after = packageJson?.[field] ?? {};
    for (const dep of Object.keys(after)) {
      if (!(dep in before)) fail(`No new dependencies are allowed; added ${field}.${dep}.`);
      if (scrapingDependencies.has(dep)) fail(`Scraping/fetch dependency ${dep} is not allowed.`);
    }
  }
}
const scripts = packageJson?.scripts ?? {};
if (scripts['validate:preview-timetable-samples-batch-001'] !== 'node scripts/check-preview-timetable-samples-batch-001.mjs') {
  fail('package.json must define validate:preview-timetable-samples-batch-001.');
}
const check = scripts.check ?? '';
const schemaIndex = check.indexOf('validate:manual-source-snapshot-schema');
const previewIndex = check.indexOf('validate:preview-timetable-samples-batch-001');
if (schemaIndex === -1 || previewIndex === -1 || previewIndex < schemaIndex) {
  fail('npm run check must run validate:preview-timetable-samples-batch-001 immediately after validate:manual-source-snapshot-schema.');
}
const between = check.slice(schemaIndex + 'validate:manual-source-snapshot-schema'.length, previewIndex);
if (!/^\s*&&\s*npm run\s+$/.test(between)) {
  fail('validate:preview-timetable-samples-batch-001 must be immediately after validate:manual-source-snapshot-schema in npm run check.');
}

if (errors.length > 0) {
  console.error('Preview timetable samples batch 001 check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Preview timetable samples batch 001 check passed.');
