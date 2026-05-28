import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const parserStatusValues = new Set(['ok', 'partial', 'empty', 'stale', 'failed', 'skipped', 'unknown']);
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

function idSet(rows, label) {
  if (!Array.isArray(rows)) {
    fail(`${label}: expected array`);
    return new Set();
  }

  const ids = new Set();
  for (const row of rows) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string') continue;
    ids.add(row.id);
  }
  return ids;
}

function collectExpectedFiles(dir) {
  if (!existsSync(dir)) return [];

  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...collectExpectedFiles(fullPath));
      continue;
    }

    if (entry === 'expected.json') {
      results.push(path.relative(root, fullPath));
    }
  }

  return results.sort();
}

function validateStringArray(value, label) {
  if (!requireArray(value, label)) return;
  value.forEach((item, index) => {
    requireString(item, `${label}[${index}]`);
  });
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

function validateExpected(relativePath, refs) {
  const expected = readJson(relativePath);
  if (!expected || !requireObject(expected, relativePath)) return;

  const fixtureDir = path.dirname(relativePath);
  const fixtureSourceId = path.basename(fixtureDir);

  for (const requiredFixtureFile of ['input.html', 'notes.md']) {
    const fixtureFile = path.join(fixtureDir, requiredFixtureFile);
    if (!existsSync(path.join(root, fixtureFile))) {
      fail(`${fixtureDir}: missing ${requiredFixtureFile}`);
    }
  }

  requireString(expected.parser_version, `${relativePath}.parser_version`);
  requireString(expected.source_id, `${relativePath}.source_id`);

  if (expected.source_id && expected.source_id !== fixtureSourceId) {
    fail(`${relativePath}.source_id: expected to match fixture directory '${fixtureSourceId}'`);
  }

  if (expected.source_id && !refs.sourceIds.has(expected.source_id)) {
    fail(`${relativePath}.source_id: unknown source '${expected.source_id}'`);
  }

  if ('fixture_generated_at' in expected) {
    requireIsoDateTime(expected.fixture_generated_at, `${relativePath}.fixture_generated_at`);
  } else {
    requireIsoDateTime(expected.generated_at, `${relativePath}.generated_at`);
  }

  requireAllowed(expected.status, parserStatusValues, `${relativePath}.status`);
  validateStringArray(expected.warnings, `${relativePath}.warnings`);
  validateStringArray(expected.errors, `${relativePath}.errors`);

  if (!requireArray(expected.meetings, `${relativePath}.meetings`)) return;

  const meetingIds = new Set();
  expected.meetings.forEach((meeting, index) => {
    const meetingLabel = `${relativePath}.meetings[${index}]`;
    validateMeeting(meeting, meetingLabel, refs);

    if (meeting && typeof meeting === 'object' && typeof meeting.meeting_id === 'string') {
      if (meetingIds.has(meeting.meeting_id)) {
        fail(`${relativePath}.meetings: duplicate meeting_id '${meeting.meeting_id}'`);
      }
      meetingIds.add(meeting.meeting_id);
    }

    if (meeting && typeof meeting === 'object' && meeting.source_id && expected.source_id && meeting.source_id !== expected.source_id) {
      fail(`${meetingLabel}.source_id: expected '${expected.source_id}'`);
    }
  });
}

const countries = readJson('data/static/countries.json');
const racecourses = readJson('data/static/racecourses.json');
const sources = readJson('data/static/sources.json');

const refs = {
  countryIds: idSet(countries, 'countries'),
  racecourseIds: idSet(racecourses, 'racecourses'),
  sourceIds: idSet(sources, 'sources')
};

const expectedFiles = collectExpectedFiles(path.join(root, 'fixtures/parser'));

if (expectedFiles.length === 0) {
  fail('fixtures/parser: no expected.json files found');
}

for (const expectedFile of expectedFiles) {
  validateExpected(expectedFile, refs);
}

if (errors.length) {
  console.error('Parser fixture validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Parser fixture validation passed for ${expectedFiles.length} fixture(s).`);
