import fs from 'node:fs';

const paths = {
  manual: 'data/static/manual-source-snapshots-batch-002.json',
  normalized: 'data/static/normalized-timetable-samples-batch-002.json',
  preview: 'data/static/preview-timetable-samples-batch-002.json',
  schema: 'data/static/manual-source-snapshot-schema.json',
  sourceGroups: 'data/static/major-country-acquisition-source-groups.json',
  plan: 'data/static/major-country-manual-source-snapshot-plan.json',
  previewBatch001: 'data/static/preview-timetable-samples-batch-001.json',
  packageJson: 'package.json',
};

const remainingActiveGroups = [
  'united-kingdom/bha',
  'united-kingdom/point-to-point',
  'united-kingdom/purebred-arabian',
  'ireland/hri',
  'france/france-galop',
  'france/letrot',
  'united-states/equibase-thoroughbred',
  'united-states/usta-harness',
  'united-states/aqha-quarter-horse',
  'canada/standardbred-canada',
  'canada/woodbine-thoroughbred',
  'australia/racing-australia-thoroughbred',
  'australia/harness-australia',
  'new-zealand/loveracing-thoroughbred',
  'new-zealand/hrnz-harness',
  'south-africa/nhra',
  'south-africa/four-racing',
  'south-africa/gold-circle',
];

const batch001Groups = [
  'japan/jra',
  'japan/nar',
  'japan/banei',
  'hong-kong/hkjc',
  'united-arab-emirates/era',
  'south-korea/kra',
];

const allActiveGroups = [...batch001Groups, ...remainingActiveGroups];
const allowedStatuses = new Set(['captured_static_sample', 'needs_source_correction']);
const placeholderPattern = /\b(TBD|unknown|needs review|to be confirmed|<race_time>|pending_manual_capture)\b/i;

function fail(message) {
  console.error(`PR-100 preview timetable sample validation failed: ${message}`);
  process.exit(1);
}

function readJson(path) {
  if (!fs.existsSync(path)) {
    fail(`${path} must exist.`);
  }
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} must parse as JSON: ${error.message}`);
  }
}

function recordsOf(document, path) {
  if (!Array.isArray(document?.records)) {
    fail(`${path} must contain a records array.`);
  }
  return document.records;
}

function keyOf(record) {
  return `${record.country_id}/${record.group_id}`;
}

function requireNonEmpty(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label} must be a non-empty string.`);
  }
  if (placeholderPattern.test(value)) {
    fail(`${label} must not contain placeholder text.`);
  }
}

function requireNoPlaceholderDeep(value, label) {
  if (typeof value === 'string' && placeholderPattern.test(value)) {
    fail(`${label} must not contain placeholder text.`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => requireNoPlaceholderDeep(item, `${label}[${index}]`));
  } else if (value && typeof value === 'object') {
    for (const [field, child] of Object.entries(value)) {
      requireNoPlaceholderDeep(child, `${label}.${field}`);
    }
  }
}

function requireRaceRows(races, label, raceNameField) {
  if (!Array.isArray(races) || races.length === 0) {
    fail(`${label} must include at least one race row.`);
  }
  races.forEach((race, index) => {
    if (!Number.isInteger(race.race_number) || race.race_number < 1) {
      fail(`${label}[${index}].race_number must be a positive integer.`);
    }
    requireNonEmpty(race.race_time, `${label}[${index}].race_time`);
    requireNonEmpty(race[raceNameField], `${label}[${index}].${raceNameField}`);
  });
}

const manual = readJson(paths.manual);
const normalized = readJson(paths.normalized);
const preview = readJson(paths.preview);
readJson(paths.schema);
readJson(paths.sourceGroups);
readJson(paths.plan);
const previewBatch001 = readJson(paths.previewBatch001);
const packageJson = readJson(paths.packageJson);

if (manual.schema_version !== 'manual-source-snapshots-batch-002-v0') {
  fail(`${paths.manual}.schema_version must be manual-source-snapshots-batch-002-v0.`);
}
if (manual.scope !== 'major-countries-v0') {
  fail(`${paths.manual}.scope must be major-countries-v0.`);
}
if (manual.batch_id !== 'manual-source-snapshot-batch-002') {
  fail(`${paths.manual}.batch_id must be manual-source-snapshot-batch-002.`);
}
if (manual.source_schema !== paths.schema) {
  fail(`${paths.manual}.source_schema must reference ${paths.schema}.`);
}
if (manual.status !== 'captured_static_sample') {
  fail(`${paths.manual}.status must be captured_static_sample.`);
}
for (const [field, expected] of Object.entries({
  manual_static_source_snapshots_only: true,
  no_live_fetch_runtime: true,
  no_parser_implementation: true,
  no_scraping_dependency: true,
  no_raw_source_body_storage: true,
  no_generated_live_timetable_records: true,
  excludes_odds_payouts_predictions_tips: true,
})) {
  if (manual.capture_policy?.[field] !== expected) {
    fail(`${paths.manual}.capture_policy.${field} must be ${expected}.`);
  }
}

const manualRecords = recordsOf(manual, paths.manual);
const normalizedRecords = recordsOf(normalized, paths.normalized);
const previewRecords = recordsOf(preview, paths.preview);
const previewBatch001Records = recordsOf(previewBatch001, paths.previewBatch001);

const manualKeys = manualRecords.map(keyOf).sort();
const expectedKeys = [...remainingActiveGroups].sort();
if (manualKeys.length !== expectedKeys.length || manualKeys.some((key, index) => key !== expectedKeys[index])) {
  fail(`${paths.manual} must include exactly the 18 remaining active group records.`);
}
for (const duplicate of batch001Groups) {
  if (manualKeys.includes(duplicate)) {
    fail(`${paths.manual} must not duplicate PR-098 batch-001 group ${duplicate}.`);
  }
}
if (manualKeys.some((key) => key.startsWith('singapore/'))) {
  fail(`${paths.manual} must not include an active Singapore snapshot.`);
}

let capturedCount = 0;
const capturedKeys = new Set();
const correctionKeys = new Set();
const snapshotByKey = new Map();
manualRecords.forEach((record, index) => {
  const key = keyOf(record);
  snapshotByKey.set(key, record);
  if (!allowedStatuses.has(record.status)) {
    fail(`${paths.manual}.records[${index}].status must be captured_static_sample or needs_source_correction.`);
  }
  if (record.status === 'pending_manual_capture') {
    fail(`${paths.manual}.records[${index}] must not remain pending_manual_capture.`);
  }
  for (const field of [
    'snapshot_id',
    'country_id',
    'group_id',
    'source_url',
    'source_label',
    'source_type',
    'source_capture_date',
    'source_local_date_context',
    'racecourse_or_meeting_context',
    'annual_or_rolling_context',
    'first_race_time_evidence',
    'per_race_time_evidence',
    'user_visible_result',
    'reviewer_notes',
    'status',
  ]) {
    requireNonEmpty(record[field], `${paths.manual}.records[${index}].${field}`);
  }
  if (!record.source_url.startsWith('https://')) {
    fail(`${paths.manual}.records[${index}].source_url must start with https://.`);
  }
  if (record.source_capture_date !== '2026-05-30') {
    fail(`${paths.manual}.records[${index}].source_capture_date must be 2026-05-30.`);
  }
  if (!record.normalized_sample || typeof record.normalized_sample !== 'object') {
    fail(`${paths.manual}.records[${index}].normalized_sample must exist.`);
  }
  if (!record.source_trace || typeof record.source_trace !== 'object') {
    fail(`${paths.manual}.records[${index}].source_trace must exist.`);
  }
  if (record.status === 'captured_static_sample') {
    capturedCount += 1;
    capturedKeys.add(key);
    requireNoPlaceholderDeep(record, `${paths.manual}.records[${index}]`);
    requireNonEmpty(record.racecourse_or_meeting_context, `${paths.manual}.records[${index}].racecourse_or_meeting_context`);
    requireNonEmpty(record.first_race_time_evidence, `${paths.manual}.records[${index}].first_race_time_evidence`);
    requireNonEmpty(record.per_race_time_evidence, `${paths.manual}.records[${index}].per_race_time_evidence`);
    requireNonEmpty(record.normalized_sample.first_race_time, `${paths.manual}.records[${index}].normalized_sample.first_race_time`);
    requireRaceRows(record.normalized_sample.races, `${paths.manual}.records[${index}].normalized_sample.races`, 'race_name_or_label');
  } else {
    correctionKeys.add(key);
  }
});
if (capturedCount < 12) {
  fail(`${paths.manual} must include at least 12 captured_static_sample records.`);
}

const normalizedKeys = new Set();
normalizedRecords.forEach((record, index) => {
  const key = keyOf(record);
  if (!capturedKeys.has(key)) {
    fail(`${paths.normalized}.records[${index}] must map to a captured_static_sample snapshot.`);
  }
  if (correctionKeys.has(key)) {
    fail(`${paths.normalized}.records[${index}] must not exist for a needs_source_correction snapshot.`);
  }
  normalizedKeys.add(key);
  for (const field of ['sample_id', 'country_id', 'group_id', 'racecourse', 'meeting_date', 'local_timezone_label', 'first_race_time', 'data_status', 'user_visible_summary']) {
    requireNonEmpty(record[field], `${paths.normalized}.records[${index}].${field}`);
  }
  if (record.data_status !== 'static_manual_sample') {
    fail(`${paths.normalized}.records[${index}].data_status must be static_manual_sample.`);
  }
  if (!record.source_trace || typeof record.source_trace !== 'object') {
    fail(`${paths.normalized}.records[${index}].source_trace must exist.`);
  }
  requireNoPlaceholderDeep(record, `${paths.normalized}.records[${index}]`);
  requireRaceRows(record.races, `${paths.normalized}.records[${index}].races`, 'race_name_or_label');
});

previewRecords.forEach((record, index) => {
  const key = keyOf(record);
  if (!normalizedKeys.has(key)) {
    fail(`${paths.preview}.records[${index}] must map to a normalized sample.`);
  }
  for (const field of ['preview_id', 'country_id', 'group_id', 'display_country', 'display_system', 'display_racecourse', 'display_meeting_date', 'display_first_race_time', 'official_source_url', 'source_capture_date', 'status_label', 'user_notice']) {
    requireNonEmpty(record[field], `${paths.preview}.records[${index}].${field}`);
  }
  if (!record.official_source_url.startsWith('https://')) {
    fail(`${paths.preview}.records[${index}].official_source_url must start with https://.`);
  }
  requireRaceRows(record.display_races, `${paths.preview}.records[${index}].display_races`, 'label');
  const notice = record.user_notice.toLowerCase();
  for (const phrase of ['static manual sample', 'not live coverage', 'full country coverage is not complete']) {
    if (!notice.includes(phrase)) {
      fail(`${paths.preview}.records[${index}].user_notice must state ${phrase}.`);
    }
  }
  const normalizedRecord = normalizedRecords.find((sample) => keyOf(sample) === key);
  if (normalizedRecord?.user_visible_summary.toLowerCase().includes('partial static manual sample') && !notice.includes('partial')) {
    fail(`${paths.preview}.records[${index}].user_notice must say partial sample when normalized sample is partial.`);
  }
});

const combinedPreviewGroups = new Set([...previewBatch001Records, ...previewRecords].map(keyOf));
for (const key of allActiveGroups) {
  if (!combinedPreviewGroups.has(key)) {
    fail(`Combined batch 001 and batch 002 preview samples must include active group ${key}.`);
  }
}
for (const key of combinedPreviewGroups) {
  if (key.startsWith('singapore/')) {
    fail('Singapore must remain absent from active preview samples.');
  }
}

const dependencyText = JSON.stringify({ dependencies: packageJson.dependencies ?? {}, devDependencies: packageJson.devDependencies ?? {} });
for (const disallowedDependency of ['cheerio', 'jsdom', 'puppeteer', 'playwright', 'node-fetch', 'axios', 'got']) {
  if (dependencyText.includes(`"${disallowedDependency}"`)) {
    fail(`package.json must not add scraping/request dependency ${disallowedDependency}.`);
  }
}

for (const [path, text] of [
  [paths.manual, fs.readFileSync(paths.manual, 'utf8')],
  [paths.normalized, fs.readFileSync(paths.normalized, 'utf8')],
  [paths.preview, fs.readFileSync(paths.preview, 'utf8')],
  ['scripts/check-preview-timetable-samples-batch-002.mjs', fs.readFileSync('scripts/check-preview-timetable-samples-batch-002.mjs', 'utf8')],
]) {
  for (const prohibitedField of ['raw_body', 'raw_html', 'raw_source_body', 'source_body', 'generated_live_timetable_records', 'live_timetable_records', 'timetable_records', 'generated_timetable']) {
    if (text.includes(`"${prohibitedField}"`)) {
      fail(`${path} must not add prohibited field ${prohibitedField}.`);
    }
  }
  for (const parserName of ['parseRace', 'parseFixture', 'parseRacecard', 'parseTimetable']) {
    if (text.includes(`function ${parserName}`) || text.includes(`const ${parserName}`) || text.includes(`export function ${parserName}`)) {
      fail(`${path} must not add parser implementation ${parserName}.`);
    }
  }
}

const scripts = packageJson.scripts ?? {};
if (scripts['validate:preview-timetable-samples-batch-002'] !== 'node scripts/check-preview-timetable-samples-batch-002.mjs') {
  fail('package.json must define validate:preview-timetable-samples-batch-002.');
}
const check = scripts.check ?? '';
const uiIndex = check.indexOf('validate:preview-timetable-ui');
const batch002Index = check.indexOf('validate:preview-timetable-samples-batch-002');
if (uiIndex === -1 || batch002Index === -1 || batch002Index < uiIndex) {
  fail('npm run check must run validate:preview-timetable-samples-batch-002 immediately after validate:preview-timetable-ui.');
}
const between = check.slice(uiIndex + 'validate:preview-timetable-ui'.length, batch002Index);
if (between !== ' && npm run ') {
  fail('validate:preview-timetable-samples-batch-002 must be immediately after validate:preview-timetable-ui in npm run check.');
}

console.log('PR-100 preview timetable batch 002 samples validated.');
