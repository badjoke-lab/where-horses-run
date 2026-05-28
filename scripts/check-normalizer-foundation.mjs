import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { normalizeParserOutput } from './lib/normalize-parser-output.mjs';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return null;
  }
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

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label}: expected non-empty string`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label}: expected array`);
  }
}

function validateNormalized(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label}: expected object`);
    return;
  }

  requireString(value.generated_at, `${label}.generated_at`);
  requireString(value.status, `${label}.status`);
  requireArray(value.meetings, `${label}.meetings`);
  requireArray(value.sources, `${label}.sources`);
  requireArray(value.notes, `${label}.notes`);

  for (const [index, meeting] of (value.meetings ?? []).entries()) {
    const meetingLabel = `${label}.meetings[${index}]`;
    for (const key of [
      'meeting_id',
      'country_id',
      'track_id',
      'track_name',
      'local_date',
      'timezone',
      'source_id',
      'source_url',
      'status',
      'racing_type',
      'notes'
    ]) {
      requireString(meeting?.[key], `${meetingLabel}.${key}`);
    }
  }
}

const expectedFiles = collectExpectedFiles(path.join(root, 'fixtures/parser'));

if (expectedFiles.length === 0) {
  fail('fixtures/parser: no expected.json files found');
}

for (const expectedFile of expectedFiles) {
  const parserOutput = readJson(expectedFile);
  if (!parserOutput) continue;

  const normalized = normalizeParserOutput(parserOutput);
  validateNormalized(normalized, `${expectedFile}:normalized`);

  if (typeof parserOutput.source_id === 'string' && !normalized.sources.includes(parserOutput.source_id)) {
    fail(`${expectedFile}:normalized.sources missing parser source_id '${parserOutput.source_id}'`);
  }
}

if (errors.length) {
  console.error('Normalizer foundation check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Normalizer foundation check passed for ${expectedFiles.length} fixture(s).`);
