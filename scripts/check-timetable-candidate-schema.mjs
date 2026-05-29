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

const schema = readJson('data/generated/timetable-candidates.schema.json');
const sample = readJson('data/generated/timetable-candidates.sample.json');
const reviewDoc = read('docs/runbooks/timetable-candidate-review-format.md');

if (schema.schema_version !== 'timetable-candidates-schema-v0') {
  fail('candidate schema_version must be timetable-candidates-schema-v0');
}

if (sample.schema_version !== 'timetable-candidates-v0') {
  fail('sample candidate schema_version must be timetable-candidates-v0');
}

for (const field of schema.required_top_level_fields ?? []) {
  if (!(field in sample)) {
    fail(`sample candidate missing top-level field: ${field}`);
  }
}

const allowedStatuses = new Set(schema.allowed_status_values ?? []);
const allowedReviewStatuses = new Set(schema.allowed_review_status_values ?? []);
const allowedExtractionMethods = new Set(schema.allowed_extraction_methods ?? []);
const requiredRecordFields = schema.record_required_fields ?? [];

const window = sample.candidate_window;
if (!window?.start_date || !window?.end_date_exclusive || !window?.timezone) {
  fail('sample candidate_window must include start_date, end_date_exclusive, and timezone');
}

const windowStart = new Date(`${window.start_date}T00:00:00.000Z`);
const windowEnd = new Date(`${window.end_date_exclusive}T00:00:00.000Z`);
const seenKeys = new Set();
const seenCandidateIds = new Set();

for (const record of sample.records ?? []) {
  for (const field of requiredRecordFields) {
    if (!(field in record)) {
      fail(`${record.candidate_id ?? 'unknown'} missing required field: ${field}`);
    }
  }

  if (record.country_id !== sample.country_id) {
    fail(`${record.candidate_id}: record country_id must match sample country_id`);
  }

  if (!allowedStatuses.has(record.status)) {
    fail(`${record.candidate_id}: unsupported status ${record.status}`);
  }
  if (!allowedReviewStatuses.has(record.review_status)) {
    fail(`${record.candidate_id}: unsupported review_status ${record.review_status}`);
  }
  if (!allowedExtractionMethods.has(record.extraction_method)) {
    fail(`${record.candidate_id}: unsupported extraction_method ${record.extraction_method}`);
  }

  const recordDate = new Date(`${record.date}T00:00:00.000Z`);
  if (recordDate < windowStart || recordDate >= windowEnd) {
    fail(`${record.candidate_id}: record date must be inside candidate_window`);
  }

  const candidateId = record.candidate_id;
  if (seenCandidateIds.has(candidateId)) fail(`duplicate candidate_id: ${candidateId}`);
  seenCandidateIds.add(candidateId);

  const key = `${record.date}:${record.racecourse_id}:${record.source_id}`;
  if (seenKeys.has(key)) fail(`duplicate candidate key: ${key}`);
  seenKeys.add(key);

  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of schema.forbidden_content ?? []) {
    const marker = String(forbidden).toLowerCase();
    if (serialized.includes(marker)) {
      fail(`${record.candidate_id}: forbidden content marker found: ${forbidden}`);
    }
  }
}

for (const phrase of [
  'Candidate files are not public coverage by themselves',
  'review_status',
  'approved',
  'rejected',
  'Promotion rule',
  'Forbidden data'
]) {
  if (!reviewDoc.includes(phrase)) {
    fail(`review format doc must include: ${phrase}`);
  }
}

for (const requiredRule of [
  'Only approved candidate records may be promoted to an overlay file.',
  'Rejected records must never be promoted.',
  'Candidate generation must not automatically publish to production-facing overlay files without review.'
]) {
  if (!(schema.promotion_rules ?? []).includes(requiredRule)) {
    fail(`schema promotion_rules must include: ${requiredRule}`);
  }
}

if (errors.length) {
  console.error('Timetable candidate schema check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Timetable candidate schema check passed.');
