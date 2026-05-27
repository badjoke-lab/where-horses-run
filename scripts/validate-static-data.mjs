import { readFile } from 'node:fs/promises';

const jsonFiles = [
  'data/static/countries.json',
  'data/static/sources.json',
  'data/static/glossary.json',
  'data/static/archive.json',
  'data/static/i18n/en.json',
  'data/static/i18n/japanese.json',
  'data/generated/latest.json',
  'data/generated/today.json',
  'data/generated/tomorrow.json',
  'data/generated/calendar-30d.json'
];

const allowedCountryStatus = new Set(['active', 'under_review', 'archive', 'excluded', 'special']);
const allowedCoverageLevels = new Set([1, 2, 3, 4, 5]);
const allowedAutoLevels = new Set(['A', 'B', 'C', 'D', 'X']);
const allowedSourceTypes = new Set(['official', 'semi_official', 'authority', 'news', 'social', 'archive']);
const allowedDataTypes = new Set(['calendar', 'racecard', 'programme', 'results', 'link_only']);
const allowedTermsRisk = new Set(['low', 'medium', 'high', 'unknown']);
const allowedGlossaryCategories = new Set(['race_type', 'horse_type', 'role', 'data_term', 'track_term']);

const errors = [];

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    errors.push(`${path}: invalid or missing JSON (${error.message})`);
    return null;
  }
}

function requireString(object, field, label) {
  if (typeof object[field] !== 'string' || object[field].trim() === '') {
    errors.push(`${label}: missing string field ${field}`);
  }
}

function requireArray(object, field, label) {
  if (!Array.isArray(object[field])) {
    errors.push(`${label}: missing array field ${field}`);
  }
}

function assertUnique(items, field, label) {
  const seen = new Set();
  for (const item of items) {
    if (typeof item[field] !== 'string') continue;
    if (seen.has(item[field])) errors.push(`${label}: duplicate ${field} ${item[field]}`);
    seen.add(item[field]);
  }
}

function assertUrl(value, label) {
  if (typeof value !== 'string') return;
  try {
    new URL(value);
  } catch {
    errors.push(`${label}: invalid URL ${value}`);
  }
}

for (const file of jsonFiles) {
  await readJson(file);
}

const countries = await readJson('data/static/countries.json') ?? [];
const sources = await readJson('data/static/sources.json') ?? [];
const glossary = await readJson('data/static/glossary.json') ?? [];
const archive = await readJson('data/static/archive.json') ?? [];

if (!Array.isArray(countries)) errors.push('countries.json must be an array');
if (!Array.isArray(sources)) errors.push('sources.json must be an array');
if (!Array.isArray(glossary)) errors.push('glossary.json must be an array');
if (!Array.isArray(archive)) errors.push('archive.json must be an array');

const countryIds = new Set(countries.map((country) => country.id));
const glossaryIds = new Set(glossary.map((entry) => entry.id));

assertUnique(countries, 'id', 'countries');
assertUnique(countries, 'slug', 'countries');
assertUnique(sources, 'id', 'sources');
assertUnique(glossary, 'id', 'glossary');
assertUnique(glossary, 'slug', 'glossary');
assertUnique(archive, 'id', 'archive');
assertUnique(archive, 'slug', 'archive');

for (const country of countries) {
  const label = `country ${country.id ?? '(missing id)'}`;
  requireString(country, 'id', label);
  requireString(country, 'slug', label);
  requireString(country, 'name_en', label);
  requireString(country, 'region', label);
  requireArray(country, 'racing_types', label);
  requireArray(country, 'available_locales', label);
  if (!allowedCountryStatus.has(country.status)) errors.push(`${label}: invalid status`);
  if (!allowedCoverageLevels.has(country.coverage_level)) errors.push(`${label}: invalid coverage_level`);
  if (!allowedAutoLevels.has(country.auto_level)) errors.push(`${label}: invalid auto_level`);
  if (Array.isArray(country.available_locales) && !country.available_locales.includes('en')) {
    errors.push(`${label}: available_locales must include en`);
  }
}

for (const source of sources) {
  const label = `source ${source.id ?? '(missing id)'}`;
  requireString(source, 'id', label);
  requireString(source, 'country_id', label);
  requireString(source, 'url', label);
  if (!countryIds.has(source.country_id)) errors.push(`${label}: unknown country_id ${source.country_id}`);
  if (!allowedSourceTypes.has(source.source_type)) errors.push(`${label}: invalid source_type`);
  if (!allowedDataTypes.has(source.data_type)) errors.push(`${label}: invalid data_type`);
  if (!allowedAutoLevels.has(source.auto_level)) errors.push(`${label}: invalid auto_level`);
  if (!allowedTermsRisk.has(source.terms_risk)) errors.push(`${label}: invalid terms_risk`);
  assertUrl(source.url, label);
}

for (const entry of glossary) {
  const label = `glossary ${entry.id ?? '(missing id)'}`;
  requireString(entry, 'id', label);
  requireString(entry, 'slug', label);
  requireString(entry, 'term_en', label);
  requireString(entry, 'summary_en', label);
  if (!allowedGlossaryCategories.has(entry.category)) errors.push(`${label}: invalid category`);
  if (Array.isArray(entry.related_terms)) {
    for (const related of entry.related_terms) {
      if (!glossaryIds.has(related)) errors.push(`${label}: unknown related term ${related}`);
    }
  }
}

for (const item of archive) {
  const label = `archive ${item.id ?? '(missing id)'}`;
  requireString(item, 'id', label);
  requireString(item, 'slug', label);
  requireString(item, 'name_en', label);
  requireString(item, 'summary_en', label);
  if (item.status !== 'archive') errors.push(`${label}: status must be archive`);
  assertUrl(item.official_or_reference_url, label);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Static data validation passed.');
