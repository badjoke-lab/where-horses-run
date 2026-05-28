import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const requiredFiles = [
  'data/static/countries.json',
  'data/static/racecourses.json',
  'data/static/sources.json',
  'data/static/glossary.json',
  'data/static/archive.json',
  'data/static/i18n/en.json',
  'data/static/i18n/ja.json',
  'data/generated/latest.json',
  'data/generated/today.json',
  'data/generated/tomorrow.json',
  'data/generated/calendar-30d.json',
  'data/generated/fetch-status.json'
];

const generatedStatusValues = new Set(['placeholder', 'ok', 'partial', 'stale', 'failed', 'unknown']);
const sourceStatusValues = new Set(['not_started', 'ok', 'partial', 'stale', 'failed', 'skipped', 'unknown']);
const meetingStatusValues = new Set(['placeholder', 'ok', 'partial', 'empty', 'stale', 'failed', 'skipped', 'unknown']);

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    fail(`${relativePath}: missing file`);
    return null;
  }

  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (error) {
    fail(`${relativePath}: invalid JSON: ${error.message}`);
    return null;
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label}: expected non-empty string`);
    return false;
  }
  return true;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label}: expected array`);
    return false;
  }
  return true;
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label}: expected object`);
    return false;
  }
  return true;
}

function requireAllowed(value, allowed, label) {
  if (!requireString(value, label)) return;
  if (!allowed.has(value)) {
    fail(`${label}: unexpected value '${value}'`);
  }
}

function requireIsoDate(value, label) {
  if (!requireString(value, label)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label}: expected YYYY-MM-DD`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${label}: invalid calendar date`);
  }
}

function requireIsoDateTime(value, label) {
  if (!requireString(value, label)) return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    fail(`${label}: expected valid date-time`);
  }
}

function requireUrl(value, label) {
  if (!requireString(value, label)) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) fail(`${label}: expected http or https`);
  } catch {
    fail(`${label}: invalid URL`);
  }
}

function requireUniqueIds(rows, label) {
  if (!requireArray(rows, label)) return new Set();
  const ids = new Set();
  for (const row of rows) {
    if (!requireObject(row, `${label}:entry`)) continue;
    requireString(row.id, `${label}:${row.id || 'unknown'}.id`);
    if (ids.has(row.id)) fail(`${label}: duplicate id '${row.id}'`);
    ids.add(row.id);
  }
  return ids;
}

function validateCountries(rows) {
  const ids = requireUniqueIds(rows, 'countries');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `countries:${row.id || 'unknown'}`;
    for (const key of ['slug', 'name_en', 'name_ja', 'region', 'status', 'summary_en', 'summary_ja']) {
      requireString(row[key], `${label}.${key}`);
    }
    requireArray(row.racing_types, `${label}.racing_types`);
    requireArray(row.available_locales, `${label}.available_locales`);
    if (!Number.isInteger(row.coverage_level)) fail(`${label}.coverage_level: expected integer`);
    requireString(row.auto_level, `${label}.auto_level`);
  }
  return ids;
}

function validateRacecourses(rows, countryIds) {
  const ids = requireUniqueIds(rows, 'racecourses');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `racecourses:${row.id || 'unknown'}`;
    for (const key of ['slug', 'country_id', 'name_en', 'name_ja', 'city', 'timezone', 'status']) {
      requireString(row[key], `${label}.${key}`);
    }
    if (row.country_id && !countryIds.has(row.country_id)) {
      fail(`${label}.country_id: unknown country '${row.country_id}'`);
    }
    requireArray(row.racing_types, `${label}.racing_types`);
    if (row.image) {
      requireObject(row.image, `${label}.image`);
      requireString(row.image.alt_en, `${label}.image.alt_en`);
      requireString(row.image.alt_ja, `${label}.image.alt_ja`);
      requireString(row.image.status, `${label}.image.status`);
      if (typeof row.image.is_official_photo !== 'boolean') {
        fail(`${label}.image.is_official_photo: expected boolean`);
      }
    }
  }
  return ids;
}

function validateSources(rows, countryIds) {
  const ids = requireUniqueIds(rows, 'sources');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `sources:${row.id || 'unknown'}`;
    for (const key of ['country_id', 'source_type', 'url', 'data_type', 'auto_level', 'terms_risk']) {
      requireString(row[key], `${label}.${key}`);
    }
    if (row.country_id && !countryIds.has(row.country_id)) {
      fail(`${label}.country_id: unknown country '${row.country_id}'`);
    }
    requireUrl(row.url, `${label}.url`);
  }
  return ids;
}

function validateGlossary(rows) {
  requireUniqueIds(rows, 'glossary');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `glossary:${row.id || 'unknown'}`;
    for (const key of ['slug', 'term_en', 'term_ja', 'category', 'summary_en', 'summary_ja']) {
      requireString(row[key], `${label}.${key}`);
    }
  }
}

function validateArchive(rows) {
  requireUniqueIds(rows, 'archive');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `archive:${row.id || 'unknown'}`;
    for (const key of ['slug', 'name_en', 'name_ja', 'status', 'summary_en', 'summary_ja']) {
      requireString(row[key], `${label}.${key}`);
    }
  }
}

function validateMeeting(row, label, refs) {
  if (!requireObject(row, label)) return;
  for (const key of ['meeting_id', 'country_id', 'track_id', 'track_name', 'local_date', 'timezone', 'source_id', 'source_url', 'status']) {
    requireString(row[key], `${label}.${key}`);
  }
  requireIsoDate(row.local_date, `${label}.local_date`);
  requireUrl(row.source_url, `${label}.source_url`);
  requireAllowed(row.status, meetingStatusValues, `${label}.status`);

  if (row.country_id && !refs.countryIds.has(row.country_id)) {
    fail(`${label}.country_id: unknown country '${row.country_id}'`);
  }
  if (row.track_id && !refs.racecourseIds.has(row.track_id)) {
    fail(`${label}.track_id: unknown racecourse '${row.track_id}'`);
  }
  if (row.source_id && !refs.sourceIds.has(row.source_id)) {
    fail(`${label}.source_id: unknown source '${row.source_id}'`);
  }
}

function validateMeetingArray(value, label, refs) {
  if (!requireArray(value, label)) return;
  const ids = new Set();
  for (const row of value) {
    const itemLabel = `${label}:${row && row.meeting_id ? row.meeting_id : 'unknown'}`;
    validateMeeting(row, itemLabel, refs);
    if (row && typeof row === 'object' && row.meeting_id) {
      if (ids.has(row.meeting_id)) fail(`${label}: duplicate meeting_id '${row.meeting_id}'`);
      ids.add(row.meeting_id);
    }
  }
}

function validateGeneratedSourcesList(value, label, sourceIds) {
  if (!requireArray(value, label)) return;
  for (const sourceId of value) {
    if (!requireString(sourceId, `${label}:entry`)) continue;
    if (!sourceIds.has(sourceId)) fail(`${label}: unknown source '${sourceId}'`);
  }
}

function validateGeneratedLatest(value, label) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireString(value.timezone, `${label}.timezone`);
  requireAllowed(value.status, generatedStatusValues, `${label}.status`);
  requireArray(value.notes, `${label}.notes`);

  for (const key of ['today_file', 'tomorrow_file', 'calendar_30d_file', 'fetch_status_file']) {
    requireString(value[key], `${label}.${key}`);
    if (typeof value[key] === 'string' && !existsSync(path.join(root, value[key]))) {
      fail(`${label}.${key}: referenced file does not exist`);
    }
  }
}

function validateGeneratedDaily(value, label, refs) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireString(value.date_basis, `${label}.date_basis`);
  validateMeetingArray(value.meetings, `${label}.meetings`, refs);
  validateGeneratedSourcesList(value.sources, `${label}.sources`, refs.sourceIds);
  requireArray(value.notes, `${label}.notes`);
}

function validateGeneratedCalendar30d(value, label, refs) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireIsoDate(value.start_date_utc, `${label}.start_date_utc`);
  requireIsoDate(value.end_date_utc, `${label}.end_date_utc`);
  if (
    typeof value.start_date_utc === 'string' &&
    typeof value.end_date_utc === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.start_date_utc) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.end_date_utc) &&
    value.start_date_utc > value.end_date_utc
  ) {
    fail(`${label}: start_date_utc must be before or equal to end_date_utc`);
  }
  requireString(value.date_basis, `${label}.date_basis`);
  validateMeetingArray(value.meetings, `${label}.meetings`, refs);
  validateGeneratedSourcesList(value.sources, `${label}.sources`, refs.sourceIds);
  requireArray(value.notes, `${label}.notes`);
}

function validateFetchStatus(value, label, refs) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireAllowed(value.status, generatedStatusValues, `${label}.status`);
  requireArray(value.notes, `${label}.notes`);
  if (!requireArray(value.sources, `${label}.sources`)) return;

  for (const row of value.sources) {
    const rowLabel = `${label}.sources:${row && row.source_id ? row.source_id : 'unknown'}`;
    if (!requireObject(row, rowLabel)) continue;
    for (const key of ['source_id', 'country_id', 'status', 'checked_at', 'message']) {
      requireString(row[key], `${rowLabel}.${key}`);
    }
    requireAllowed(row.status, sourceStatusValues, `${rowLabel}.status`);
    requireIsoDateTime(row.checked_at, `${rowLabel}.checked_at`);
    if (row.source_id && !refs.sourceIds.has(row.source_id)) {
      fail(`${rowLabel}.source_id: unknown source '${row.source_id}'`);
    }
    if (row.country_id && !refs.countryIds.has(row.country_id)) {
      fail(`${rowLabel}.country_id: unknown country '${row.country_id}'`);
    }
  }
}

const data = Object.fromEntries(requiredFiles.map((file) => [file, readJson(file)]));

const countryIds = validateCountries(data['data/static/countries.json']);
const racecourseIds = validateRacecourses(data['data/static/racecourses.json'], countryIds);
const sourceIds = validateSources(data['data/static/sources.json'], countryIds);
validateGlossary(data['data/static/glossary.json']);
validateArchive(data['data/static/archive.json']);
requireObject(data['data/static/i18n/en.json'], 'i18n/en');
requireObject(data['data/static/i18n/ja.json'], 'i18n/ja');

const refs = { countryIds, racecourseIds, sourceIds };

validateGeneratedLatest(data['data/generated/latest.json'], 'data/generated/latest.json');
validateGeneratedDaily(data['data/generated/today.json'], 'data/generated/today.json', refs);
validateGeneratedDaily(data['data/generated/tomorrow.json'], 'data/generated/tomorrow.json', refs);
validateGeneratedCalendar30d(data['data/generated/calendar-30d.json'], 'data/generated/calendar-30d.json', refs);
validateFetchStatus(data['data/generated/fetch-status.json'], 'data/generated/fetch-status.json', refs);

if (errors.length) {
  console.error('Data validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Data validation passed.');
