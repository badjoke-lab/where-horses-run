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
  }
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
  requireUniqueIds(rows, 'racecourses');
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
}

function validateSources(rows, countryIds) {
  requireUniqueIds(rows, 'sources');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `sources:${row.id || 'unknown'}`;
    for (const key of ['country_id', 'source_type', 'url', 'data_type', 'auto_level', 'terms_risk']) {
      requireString(row[key], `${label}.${key}`);
    }
    if (row.country_id && !countryIds.has(row.country_id)) {
      fail(`${label}.country_id: unknown country '${row.country_id}'`);
    }
    try {
      const url = new URL(row.url);
      if (!['http:', 'https:'].includes(url.protocol)) fail(`${label}.url: expected http or https`);
    } catch {
      fail(`${label}.url: invalid URL`);
    }
  }
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

function validateGenerated(value, label) {
  if (!requireObject(value, label)) return;
  requireString(value.generated_at, `${label}.generated_at`);
  if ('meetings' in value) requireArray(value.meetings, `${label}.meetings`);
  if ('sources' in value) requireArray(value.sources, `${label}.sources`);
  if ('notes' in value) requireArray(value.notes, `${label}.notes`);
}

const data = Object.fromEntries(requiredFiles.map((file) => [file, readJson(file)]));

const countryIds = validateCountries(data['data/static/countries.json']);
validateRacecourses(data['data/static/racecourses.json'], countryIds);
validateSources(data['data/static/sources.json'], countryIds);
validateGlossary(data['data/static/glossary.json']);
validateArchive(data['data/static/archive.json']);
requireObject(data['data/static/i18n/en.json'], 'i18n/en');
requireObject(data['data/static/i18n/ja.json'], 'i18n/ja');

for (const file of ['data/generated/latest.json', 'data/generated/today.json', 'data/generated/tomorrow.json', 'data/generated/calendar-30d.json', 'data/generated/fetch-status.json']) {
  validateGenerated(data[file], file);
}

const latest = data['data/generated/latest.json'];
if (latest && typeof latest === 'object') {
  for (const key of ['today_file', 'tomorrow_file', 'calendar_30d_file', 'fetch_status_file']) {
    requireString(latest[key], `latest.${key}`);
    if (typeof latest[key] === 'string' && !existsSync(path.join(root, latest[key]))) {
      fail(`latest.${key}: referenced file does not exist`);
    }
  }
}

if (errors.length) {
  console.error('Data validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Data validation passed.');
