import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const allowedTopLevelKeys = new Set([
  'schema_version',
  'generated_at',
  'mode',
  'country_id',
  'records',
  'sources',
  'notes',
]);

const allowedEntryKeys = new Set([
  'country_id',
  'racecourse_id',
  'racecourse_name',
  'date',
  'start_time_local',
  'timezone',
  'racing_type',
  'source_id',
  'source_url',
  'last_checked_at',
  'last_checked_date',
  'status',
  'source_status',
  'capability_rank',
  'confidence',
  'notes',
]);

const forbiddenKeyPatterns = [
  /racecard/i,
  /card_body/i,
  /entries?/i,
  /horses?/i,
  /jockeys?/i,
  /odds?/i,
  /results?/i,
  /payouts?/i,
  /dividends?/i,
  /predictions?/i,
  /tips?/i,
  /raw[_-]?html/i,
  /html[_-]?body/i,
  /body[_-]?text/i,
  /page[_-]?content/i,
  /response[_-]?body/i,
  /official[_-]?page[_-]?content/i,
];

const forbiddenTextMarkers = [
  /<\s*html\b/i,
  /<\s*body\b/i,
  /<\s*script\b/i,
  /<\s*table\b/i,
];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
  if (Number.isNaN(parsed.getTime())) fail(`${label}: expected valid date-time`);
}

function requireUrl(value, label) {
  if (!requireString(value, label)) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) fail(`${label}: expected http or https URL`);
  } catch {
    fail(`${label}: invalid URL`);
  }
}

function checkForbiddenKey(key, label) {
  for (const pattern of forbiddenKeyPatterns) {
    if (pattern.test(key)) fail(`${label}: forbidden key '${key}'`);
  }
}

function checkForbiddenText(value, label) {
  if (typeof value === 'string') {
    for (const pattern of forbiddenTextMarkers) {
      if (pattern.test(value)) fail(`${label}: forbidden raw markup marker '${pattern}'`);
    }
  }
}

function walk(value, label) {
  checkForbiddenText(value, label);

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${label}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    checkForbiddenKey(key, `${label}.${key}`);
    walk(nestedValue, `${label}.${key}`);
  }
}

const data = readJson('data/generated/timetables.json');
walk(data, 'timetables');

if (!isPlainObject(data)) {
  fail('timetables: expected top-level object');
} else {
  for (const key of Object.keys(data)) {
    if (!allowedTopLevelKeys.has(key)) fail(`timetables.${key}: unsupported top-level key`);
  }

  if (data.schema_version !== 'timetable-schema-v0') {
    fail('timetables.schema_version: expected timetable-schema-v0');
  }
  requireIsoDateTime(data.generated_at, 'timetables.generated_at');
  requireString(data.mode, 'timetables.mode');
  if ('country_id' in data) requireString(data.country_id, 'timetables.country_id');
  requireArray(data.sources, 'timetables.sources');
  requireArray(data.notes, 'timetables.notes');

  if (requireArray(data.records, 'timetables.records')) {
    data.records.forEach((entry, index) => {
      const label = `timetables.records[${index}]`;
      if (!isPlainObject(entry)) {
        fail(`${label}: expected object`);
        return;
      }

      for (const key of Object.keys(entry)) {
        if (!allowedEntryKeys.has(key)) fail(`${label}.${key}: unsupported timetable field`);
      }

      for (const requiredKey of ['source_id', 'source_url', 'status', 'confidence', 'last_checked_at']) {
        if (!(requiredKey in entry)) fail(`${label}.${requiredKey}: required when timetable record is present`);
      }

      if ('country_id' in entry) requireString(entry.country_id, `${label}.country_id`);
      if ('racecourse_id' in entry) requireString(entry.racecourse_id, `${label}.racecourse_id`);
      if ('racecourse_name' in entry) requireString(entry.racecourse_name, `${label}.racecourse_name`);
      if ('date' in entry) requireIsoDate(entry.date, `${label}.date`);
      if ('start_time_local' in entry) requireString(entry.start_time_local, `${label}.start_time_local`);
      if ('timezone' in entry) requireString(entry.timezone, `${label}.timezone`);
      if ('racing_type' in entry) requireString(entry.racing_type, `${label}.racing_type`);
      if ('source_id' in entry) requireString(entry.source_id, `${label}.source_id`);
      if ('source_url' in entry) requireUrl(entry.source_url, `${label}.source_url`);
      if ('last_checked_at' in entry) requireIsoDateTime(entry.last_checked_at, `${label}.last_checked_at`);
      if ('last_checked_date' in entry) requireIsoDate(entry.last_checked_date, `${label}.last_checked_date`);
      if ('status' in entry) requireString(entry.status, `${label}.status`);
      if ('source_status' in entry) requireString(entry.source_status, `${label}.source_status`);
      if ('capability_rank' in entry && !['C', 'B', 'B+', 'A'].includes(entry.capability_rank)) {
        fail(`${label}.capability_rank: expected C, B, B+, or A`);
      }
      if ('confidence' in entry) requireString(entry.confidence, `${label}.confidence`);
      if ('notes' in entry && typeof entry.notes !== 'string' && !Array.isArray(entry.notes)) {
        fail(`${label}.notes: expected string or array`);
      }
    });
  }
}

if (errors.length) {
  console.error('Timetable schema v0 check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Timetable schema v0 check passed.');
