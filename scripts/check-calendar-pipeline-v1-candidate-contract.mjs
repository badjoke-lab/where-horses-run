import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ranks = new Set(['C', 'B', 'B+', 'A', 'A+']);
const statuses = new Set(['needs_review', 'approved', 'rejected']);
const confidence = new Set(['low', 'medium', 'high']);
const methods = new Set(['manual_import', 'fixture_parser', 'adapter_candidate', 'reviewed_snapshot']);
const topKeys = new Set(['schema_version','generated_at','adapter_id','country_id','authority_id','source_id','candidate_window','records','review']);
const recordKeys = new Set(['candidate_id','meeting_id','country_id','authority_id','racing_system_id','racecourse_id','date','timezone','capability_rank','first_race_time_local','last_race_time_local','timetable_rows','source','confidence','review_status','notes']);
const sourceKeys = new Set(['source_id','official_url','checked_at','extraction_method']);
const rowKeysA = new Set(['label', 'post_time_local']);
const rowKeysAPlus = new Set(['label','post_time_local','race_name','distance_m','surface','course_label']);
const reviewKeys = new Set(['status','reviewed_at','reviewer','summary','promotion_target']);
const forbiddenKeyMarkers = ['horse','runner','jockey','trainer','draw','gate','post_position','weight','odds','result','payout','prediction','tip','betting','racecard','raw_html','raw_markup','source_body','direct_stream','stream_url','video_embed'];

function unknownKeys(value, allowed, label, errors) {
  for (const key of Object.keys(value ?? {})) {
    if (!allowed.has(key)) errors.push(`${label} has unsupported field ${key}`);
  }
}

function scanForbiddenKeys(value, label, errors) {
  if (Array.isArray(value)) return value.forEach((item, index) => scanForbiddenKeys(item, `${label}[${index}]`, errors));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    const marker = forbiddenKeyMarkers.find((item) => normalized.includes(item));
    if (marker) errors.push(`${label}.${key} contains forbidden field marker ${marker}`);
    scanForbiddenKeys(child, `${label}.${key}`, errors);
  }
}

function requireId(value, label, errors) {
  if (typeof value !== 'string' || !idPattern.test(value)) errors.push(`${label} must be a kebab-case stable id`);
}
function requireDate(value, label, errors) {
  if (typeof value !== 'string' || !datePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) errors.push(`${label} must be a real YYYY-MM-DD date`);
}
function requireTimeOrNull(value, label, errors) {
  if (value !== null && (typeof value !== 'string' || !timePattern.test(value))) errors.push(`${label} must be HH:MM or null`);
}
function requireDateTime(value, label, errors, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) errors.push(`${label} must be an ISO date-time${nullable ? ' or null' : ''}`);
}

function validateCandidate(candidate) {
  const errors = [];
  unknownKeys(candidate, topKeys, 'candidate', errors);
  scanForbiddenKeys(candidate, 'candidate', errors);
  if (candidate.schema_version !== 'timetable-candidate-v1') errors.push('schema_version must be timetable-candidate-v1');
  requireDateTime(candidate.generated_at, 'generated_at', errors);
  for (const key of ['adapter_id','country_id','authority_id','source_id']) requireId(candidate[key], key, errors);

  const window = candidate.candidate_window ?? {};
  unknownKeys(window, new Set(['start_date','end_date_exclusive','timezone']), 'candidate_window', errors);
  requireDate(window.start_date, 'candidate_window.start_date', errors);
  requireDate(window.end_date_exclusive, 'candidate_window.end_date_exclusive', errors);
  if (window.start_date >= window.end_date_exclusive) errors.push('candidate_window must have start_date before end_date_exclusive');
  if (typeof window.timezone !== 'string' || !window.timezone.includes('/')) errors.push('candidate_window.timezone must be an IANA-style timezone');

  if (!Array.isArray(candidate.records)) errors.push('records must be an array');
  const ids = new Set();
  const meetingKeys = new Set();
  for (const [index, record] of (candidate.records ?? []).entries()) {
    const label = `records[${index}]`;
    unknownKeys(record, recordKeys, label, errors);
    for (const key of ['candidate_id','meeting_id','country_id','authority_id','racing_system_id','racecourse_id']) requireId(record[key], `${label}.${key}`, errors);
    if (ids.has(record.candidate_id)) errors.push(`${label}.candidate_id is duplicated`); else ids.add(record.candidate_id);
    requireDate(record.date, `${label}.date`, errors);
    if (record.date < window.start_date || record.date >= window.end_date_exclusive) errors.push(`${label}.date is outside candidate_window`);
    if (record.country_id !== candidate.country_id) errors.push(`${label}.country_id must match envelope`);
    if (record.authority_id !== candidate.authority_id) errors.push(`${label}.authority_id must match envelope`);
    if (record.timezone !== window.timezone) errors.push(`${label}.timezone must match candidate_window`);
    if (!ranks.has(record.capability_rank)) errors.push(`${label}.capability_rank is invalid`);
    requireTimeOrNull(record.first_race_time_local, `${label}.first_race_time_local`, errors);
    requireTimeOrNull(record.last_race_time_local, `${label}.last_race_time_local`, errors);
    if (!confidence.has(record.confidence)) errors.push(`${label}.confidence is invalid`);
    if (!statuses.has(record.review_status)) errors.push(`${label}.review_status is invalid`);
    if (typeof record.notes !== 'string') errors.push(`${label}.notes must be a string`);

    const source = record.source ?? {};
    unknownKeys(source, sourceKeys, `${label}.source`, errors);
    if (source.source_id !== candidate.source_id) errors.push(`${label}.source.source_id must match envelope`);
    if (typeof source.official_url !== 'string' || !source.official_url.startsWith('https://')) errors.push(`${label}.source.official_url must be HTTPS`);
    requireDateTime(source.checked_at, `${label}.source.checked_at`, errors);
    if (!methods.has(source.extraction_method)) errors.push(`${label}.source.extraction_method is invalid`);

    if (!Array.isArray(record.timetable_rows)) errors.push(`${label}.timetable_rows must be an array`);
    const rows = record.timetable_rows ?? [];
    if (record.capability_rank === 'C') {
      if (record.first_race_time_local !== null || record.last_race_time_local !== null || rows.length) errors.push(`${label}: C candidates must contain no race times or rows`);
    } else if (record.capability_rank === 'B') {
      if (!timePattern.test(record.first_race_time_local ?? '') || record.last_race_time_local !== null || rows.length) errors.push(`${label}: B candidates require first time only`);
    } else if (record.capability_rank === 'B+') {
      if (!timePattern.test(record.first_race_time_local ?? '') || !timePattern.test(record.last_race_time_local ?? '') || rows.length) errors.push(`${label}: B+ candidates require first and last time only`);
    } else {
      if (!rows.length) errors.push(`${label}: A/A+ candidates require timetable_rows`);
      if (rows.length) {
        if (record.first_race_time_local !== rows[0].post_time_local) errors.push(`${label}: first time must equal first timetable row`);
        if (record.last_race_time_local !== rows.at(-1).post_time_local) errors.push(`${label}: last time must equal last timetable row`);
      }
    }

    for (const [rowIndex, row] of rows.entries()) {
      const rowLabel = `${label}.timetable_rows[${rowIndex}]`;
      unknownKeys(row, record.capability_rank === 'A+' ? rowKeysAPlus : rowKeysA, rowLabel, errors);
      if (typeof row.label !== 'string' || !row.label.trim()) errors.push(`${rowLabel}.label is required`);
      if (!timePattern.test(row.post_time_local ?? '')) errors.push(`${rowLabel}.post_time_local must be HH:MM`);
      if (row.distance_m != null && (!Number.isInteger(row.distance_m) || row.distance_m < 1)) errors.push(`${rowLabel}.distance_m must be a positive integer or null`);
    }

    const meetingKey = `${record.date}:${record.racecourse_id}:${source.source_id}`;
    if (meetingKeys.has(meetingKey)) errors.push(`${label} duplicates meeting/source key ${meetingKey}`); else meetingKeys.add(meetingKey);
  }

  const review = candidate.review ?? {};
  unknownKeys(review, reviewKeys, 'review', errors);
  if (!statuses.has(review.status)) errors.push('review.status is invalid');
  requireDateTime(review.reviewed_at, 'review.reviewed_at', errors, true);
  if (review.reviewer !== null && typeof review.reviewer !== 'string') errors.push('review.reviewer must be string or null');
  if (typeof review.summary !== 'string') errors.push('review.summary must be a string');
  if (review.promotion_target !== null && typeof review.promotion_target !== 'string') errors.push('review.promotion_target must be string or null');
  if (review.status === 'approved') {
    if (!review.reviewed_at || !review.reviewer || !review.promotion_target) errors.push('approved review requires reviewed_at, reviewer, and promotion_target');
    if ((candidate.records ?? []).some((record) => record.review_status !== 'approved')) errors.push('approved envelope may contain approved records only');
  } else if (review.status === 'needs_review') {
    if (review.reviewed_at !== null || review.reviewer !== null || review.promotion_target !== null) errors.push('needs_review envelope must not claim review or promotion metadata');
  }

  return errors;
}

const schema = parse('data/static/timetable-candidate-v1.schema.json');
const sample = parse('data/candidates/pipeline-v1.sample.json');
const types = read('src/lib/timetable/pipelineTypes.ts');
const errors = validateCandidate(sample);

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || schema.properties?.schema_version?.const !== 'timetable-candidate-v1') errors.push('candidate schema metadata is invalid');
for (const token of ['TimetableCandidateFileV1','TimetableCandidateRecordV1','TimetableCandidateRowV1','publish_without_review: false',"allowed_output: 'meeting_and_timetable_summary_only'"]) {
  if (!types.includes(token)) errors.push(`pipelineTypes.ts missing ${token}`);
}
if (sample.review?.status !== 'needs_review') errors.push('contract fixture must remain needs_review');

const forbiddenFixture = structuredClone(sample);
forbiddenFixture.records[0].odds = '2.0';
if (!validateCandidate(forbiddenFixture).some((error) => error.includes('odds'))) errors.push('validator must reject odds fields');
const rankFixture = structuredClone(sample);
rankFixture.records[0].capability_rank = 'B';
if (!validateCandidate(rankFixture).some((error) => error.includes('B candidates require first time only'))) errors.push('validator must enforce rank-specific field limits');
const approvalFixture = structuredClone(sample);
approvalFixture.review.status = 'approved';
if (!validateCandidate(approvalFixture).some((error) => error.includes('approved review requires'))) errors.push('validator must reject unreviewed approval claims');

if (errors.length) {
  console.error(`CALENDAR_PIPELINE_V1_CANDIDATE_CONTRACT: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_PIPELINE_V1_CANDIDATE_CONTRACT: pass records=${sample.records.length}`);
console.log('PROMOTION_STATE: human-review-required');
console.log('PUBLICATION_STATE: not-published');
