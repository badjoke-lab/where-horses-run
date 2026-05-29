import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

const schema = readJson('docs/runbooks/timetable-candidates.schema.json');
const sample = readJson('docs/runbooks/timetable-candidates.sample.json');
const reviewDoc = read('docs/runbooks/timetable-candidate-review-format.md');

if (schema.schema_version !== 'timetable-candidates-schema-v0') fail('bad schema version');
if (sample.schema_version !== 'timetable-candidates-v0') fail('bad sample version');

for (const field of schema.required_top_level_fields ?? []) {
  if (!(field in sample)) fail(`sample missing ${field}`);
}

const requiredRecordFields = schema.record_required_fields ?? [];
const seen = new Set();

for (const record of sample.records ?? []) {
  for (const field of requiredRecordFields) {
    if (!(field in record)) fail(`${record.candidate_id ?? 'unknown'} missing ${field}`);
  }
  const key = `${record.date}:${record.racecourse_id}:${record.source_id}`;
  if (seen.has(key)) fail(`duplicate ${key}`);
  seen.add(key);
  if (record.review_status !== 'needs_review') fail(`${record.candidate_id} must remain needs_review`);
}

for (const phrase of ['review_status', 'Promotion rule', 'Forbidden data']) {
  if (!reviewDoc.includes(phrase)) fail(`review doc missing ${phrase}`);
}

if (errors.length) {
  console.error('Timetable candidate schema check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Timetable candidate schema check passed.');
