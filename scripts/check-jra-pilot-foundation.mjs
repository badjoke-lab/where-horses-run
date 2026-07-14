import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const review = parse('data/generated/timetable/jra-pilot-review.json');
const control = parse('data/static/jra-pilot-control.json');
const candidates = parse('data/candidates/japan-jra-candidates.json');

if (review.schema_version !== 'jra-pilot-review-v1') fail('Unexpected JRA pilot review schema.');
if (review.work_id !== 'WHR-CAL-JAPAN-JRA' || review.mode !== 'fixture_review_only') fail('JRA historical pilot identity differs.');
if (control.schema_version !== 'jra-pilot-control-v1' || control.mode !== 'fixture_review_only') fail('JRA pilot control differs.');
for (const key of ['network_fetch_performed', 'source_body_stored', 'candidate_modified', 'candidate_approved', 'canonical_written', 'public_projection_written', 'scheduled_operation_active']) {
  if (review.boundaries?.[key] !== false) fail(`Historical review boundary differs: ${key}.`);
}
for (const key of ['network_fetch_allowed', 'automatic_approval_allowed', 'automatic_canonical_write_allowed', 'automatic_public_write_allowed', 'scheduled_operation_allowed', 'unattended_publication_allowed']) {
  if (control[key] !== false) fail(`JRA pilot control boundary differs: ${key}.`);
}
if (control.candidate_generation_allowed !== true) fail('JRA candidate generation must remain allowed.');
if (Object.keys(review.input_digests ?? {}).length !== 11) fail('Historical JRA pilot must retain eleven input digests.');
for (const [key, value] of Object.entries(review.input_digests ?? {})) {
  if (!key.endsWith('_sha256') || !/^[a-f0-9]{64}$/.test(value)) fail(`Invalid historical digest ${key}.`);
}
if (review.source?.source_key !== control.source_key || review.source?.system_id !== control.system_id) fail('Historical JRA pilot source identity differs.');
if (review.source?.official_host_pass !== true) fail('Historical JRA official-host validation differs.');
if (!Array.isArray(review.normalized?.meeting_ids) || review.normalized.meeting_ids.length === 0) fail('Historical JRA pilot meeting IDs missing.');
if (review.candidate?.review_status !== 'needs_review' || review.public_projection?.changed_by_review !== false) fail('Historical JRA pilot review-only state differs.');

if (candidates.schema_version !== 'timetable-candidate-v1' || candidates.adapter_id !== 'jra-normalized-programme-candidate-v1') fail('Current JRA candidate envelope differs.');
if (!Array.isArray(candidates.records) || candidates.records.length !== 24) fail(`Current JRA candidate count must be 24; got ${candidates.records?.length ?? 0}.`);
if (new Set(candidates.records.map((record) => record.meeting_id)).size !== 24) fail('Current JRA candidate IDs must be unique.');
if (candidates.records.some((record) => record.capability_rank !== 'A+' || record.review_status !== 'needs_review')) fail('Current JRA candidate review/rank boundary differs.');

const workflow = read('.github/workflows/calendar-jra-pilot-review.yml');
for (const marker of ['workflow_dispatch:', 'contents: read', 'build-jra-pilot-review.mjs', 'upload-artifact@v4']) {
  if (!workflow.includes(marker)) fail(`JRA pilot workflow missing ${marker}.`);
}
for (const forbidden of ['contents: write', 'pull-requests: write', 'create-pull-request']) {
  if (workflow.includes(forbidden)) fail(`JRA pilot workflow contains forbidden marker ${forbidden}.`);
}
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('Scheduled refresh must remain paused.');

const prohibited = ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body_content', 'stream_url'];
function inspect(value, location = 'root') {
  if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${location}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (prohibited.some((fragment) => key.toLowerCase().includes(fragment))) fail(`Prohibited key ${location}.${key}.`);
    inspect(child, `${location}.${key}`);
  }
}
inspect(review);
inspect(candidates);

if (errors.length) {
  console.error(`CALENDAR_JRA_PILOT_FOUNDATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_JRA_PILOT_FOUNDATION: pass');
console.log(`HISTORICAL_PILOT_RECORDS: ${review.normalized.meeting_ids.length}`);
console.log('CURRENT_JRA_CANDIDATES: 24');
console.log('PUBLIC_PROJECTION_WRITTEN_BY_PILOT: false');
