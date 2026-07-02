import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const review = parse('data/generated/timetable/jra-pilot-review.json');
const control = parse('data/static/jra-pilot-control.json');

const check = spawnSync(process.execPath, ['scripts/timetable/build-jra-pilot-review.mjs', '--check'], { cwd: root, encoding: 'utf8' });
if (check.status !== 0) fail(`JRA pilot review check failed: ${check.stderr || check.stdout}`);

if (review.schema_version !== 'jra-pilot-review-v1') fail('unexpected JRA pilot review schema.');
if (review.work_id !== 'WHR-CAL-JAPAN-JRA') fail('JRA pilot Work ID is incorrect.');
if (review.mode !== 'fixture_review_only') fail('JRA pilot must remain fixture_review_only.');
if (control.schema_version !== 'jra-pilot-control-v1' || control.mode !== review.mode) fail('JRA pilot control mismatch.');

for (const key of ['network_fetch_performed','source_body_stored','candidate_modified','candidate_approved','canonical_written','public_projection_written','scheduled_operation_active']) {
  if (review.boundaries?.[key] !== false) fail(`review.boundaries.${key} must be false.`);
}
for (const key of ['network_fetch_allowed','automatic_approval_allowed','automatic_canonical_write_allowed','automatic_public_write_allowed','scheduled_operation_allowed','unattended_publication_allowed']) {
  if (control[key] !== false) fail(`control.${key} must be false.`);
}
if (control.candidate_generation_allowed !== true) fail('candidate generation must remain allowed.');

if (Object.keys(review.input_digests ?? {}).length !== 11) fail('eleven JRA pilot input digests are required.');
for (const [key, value] of Object.entries(review.input_digests ?? {})) {
  if (!key.endsWith('_sha256') || !/^[a-f0-9]{64}$/.test(value)) fail(`invalid digest ${key}.`);
}

if (review.source?.source_key !== control.source_key) fail('JRA source key differs from control.');
if (review.source?.system_id !== control.system_id) fail('JRA system ID differs from control.');
if (review.source?.official_host_pass !== true) fail('JRA official host validation must pass.');
const sourceDate = review.source?.candidate_source_checked_date;
const registryDate = review.source?.registry_minimum_date;
if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate ?? '')) fail('JRA candidate source date is invalid.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(registryDate ?? '')) fail('JRA registry minimum date is invalid.');
if (review.source?.freshness_pass === true && sourceDate < registryDate) fail('fresh JRA source date predates the registry minimum.');
if (review.source?.freshness_pass === false && !(sourceDate < registryDate)) fail('stale JRA source date must predate the registry minimum.');
if (typeof review.source?.freshness_pass !== 'boolean') fail('JRA freshness_pass must be boolean.');

for (const key of ['parity_pass','racecourse_scope_pass','technical_rank_pass','confirmed_fields_pass']) {
  if (review.normalized?.[key] !== true) fail(`review.normalized.${key} must pass.`);
}
const meetingCount = review.normalized?.meeting_count;
const detailCount = review.normalized?.detail_count;
const candidateCount = review.normalized?.candidate_count;
if (![meetingCount, detailCount, candidateCount].every((value) => Number.isInteger(value) && value > 0)) {
  fail('JRA pilot meeting/detail/candidate counts must be positive integers.');
}
if (meetingCount !== detailCount || meetingCount !== candidateCount) fail('JRA pilot meeting/detail/candidate counts must match.');
if (!Array.isArray(review.normalized?.meeting_ids) || review.normalized.meeting_ids.length !== meetingCount) fail('JRA pilot meeting ID count must match normalized records.');
if (new Set(review.normalized?.meeting_ids ?? []).size !== meetingCount) fail('JRA pilot meeting IDs must be unique.');

if (review.candidate?.review_status !== 'needs_review' || review.candidate?.needs_review_pass !== true) fail('JRA candidate must remain needs_review.');
const expectedBlockers = [];
if (review.source?.freshness_pass !== true) expectedBlockers.push('source_fixture_predates_registry');
if (review.source?.official_host_pass !== true) expectedBlockers.push('official_host_mismatch');
if (review.normalized?.parity_pass !== true) expectedBlockers.push('meeting_detail_candidate_id_mismatch');
if (review.normalized?.racecourse_scope_pass !== true) expectedBlockers.push('racecourse_or_system_scope_mismatch');
if (review.normalized?.technical_rank_pass !== true) expectedBlockers.push('technical_rank_mismatch');
if (review.normalized?.confirmed_fields_pass !== true) expectedBlockers.push('unconfirmed_optional_field_present');
if (review.candidate?.needs_review_pass !== true) expectedBlockers.push('candidate_review_state_invalid');
if (JSON.stringify(review.candidate?.blockers ?? []) !== JSON.stringify(expectedBlockers)) fail('JRA pilot blocker set is inconsistent with review checks.');
if (review.candidate?.promotion_ready !== (expectedBlockers.length === 0)) fail('JRA pilot promotion_ready is inconsistent with blocker state.');

if (!Number.isInteger(review.public_projection?.meeting_count) || review.public_projection.meeting_count < 1) fail('public projection meeting count is invalid.');
if (!Number.isInteger(review.public_projection?.detail_count) || review.public_projection.detail_count < 1) fail('public projection detail count is invalid.');
if (review.public_projection?.changed_by_review !== false) fail('JRA review must not change public projection.');

const expectedActions = expectedBlockers.length
  ? ['obtain_fresh_reviewed_jra_fixture','regenerate_normalized_jra_data','regenerate_candidate_v1','repeat_human_review']
  : ['assign_human_reviewer','review_candidate_v1','run_canonical_promotion_dry_run'];
if (JSON.stringify(review.next_actions) !== JSON.stringify(expectedActions)) fail('JRA pilot next actions are inconsistent with blocker state.');

const workflow = read('.github/workflows/calendar-jra-pilot-review.yml');
for (const marker of ['workflow_dispatch:', 'contents: read', 'build-jra-pilot-review.mjs', 'upload-artifact@v4']) {
  if (!workflow.includes(marker)) fail(`JRA pilot review workflow missing ${marker}.`);
}
for (const forbidden of ['contents: write', 'pull-requests: write', 'create-pull-request']) {
  if (workflow.includes(forbidden)) fail(`JRA pilot review workflow contains forbidden marker ${forbidden}.`);
}

const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain paused.');

const prohibitedKeyFragments = ['horse_name','jockey_name','trainer_name','odds','payout','prediction','raw_html','source_body_content','stream_url'];
function inspectKeys(value, location = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (prohibitedKeyFragments.some((item) => key.toLowerCase().includes(item))) fail(`JRA pilot review contains prohibited key ${location}.${key}.`);
    inspectKeys(child, `${location}.${key}`);
  }
}
inspectKeys(review);

if (errors.length) {
  console.error(`CALENDAR_JRA_PILOT_FOUNDATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_JRA_PILOT_FOUNDATION: pass records=${meetingCount}`);
console.log(`PROMOTION_READY: ${review.candidate.promotion_ready}`);
console.log(`BLOCKERS: ${expectedBlockers.length ? expectedBlockers.join(',') : 'none'}`);
console.log('NETWORK_FETCH_PERFORMED: false');
console.log('PUBLIC_PROJECTION_WRITTEN: false');
