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

if (Object.keys(review.input_digests ?? {}).length !== 8) fail('eight JRA pilot input digests are required.');
for (const [key, value] of Object.entries(review.input_digests ?? {})) {
  if (!key.endsWith('_sha256') || !/^[a-f0-9]{64}$/.test(value)) fail(`invalid digest ${key}.`);
}

if (review.source?.source_key !== control.source_key) fail('JRA source key differs from control.');
if (review.source?.system_id !== control.system_id) fail('JRA system ID differs from control.');
if (review.source?.official_host_pass !== true) fail('JRA official host validation must pass.');
if (review.source?.freshness_pass !== false) fail('current JRA fixture must remain freshness-blocked.');
if (!(review.source?.candidate_source_checked_date < review.source?.registry_minimum_date)) fail('JRA source date must predate registry minimum.');

for (const key of ['parity_pass','racecourse_scope_pass','technical_rank_pass','confirmed_fields_pass']) {
  if (review.normalized?.[key] !== true) fail(`review.normalized.${key} must pass.`);
}
if (review.normalized?.meeting_count !== 4 || review.normalized?.detail_count !== 4 || review.normalized?.candidate_count !== 4) fail('JRA pilot must retain four meeting/detail/candidate records.');
if (review.candidate?.review_status !== 'needs_review' || review.candidate?.needs_review_pass !== true) fail('JRA candidate must remain needs_review.');
if (review.candidate?.promotion_ready !== false) fail('stale JRA candidate must not be promotion-ready.');
if (JSON.stringify(review.candidate?.blockers) !== JSON.stringify(['source_fixture_predates_registry'])) fail('JRA pilot blocker set is incorrect.');
if (review.public_projection?.meeting_count !== 23 || review.public_projection?.detail_count !== 5) fail('public projection counts changed unexpectedly.');
if (review.public_projection?.changed_by_review !== false) fail('JRA review must not change public projection.');

const expectedActions = ['obtain_fresh_reviewed_jra_fixture','regenerate_normalized_jra_data','regenerate_candidate_v1','repeat_human_review'];
if (JSON.stringify(review.next_actions) !== JSON.stringify(expectedActions)) fail('JRA pilot next actions are incorrect.');

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

console.log('CALENDAR_JRA_PILOT_FOUNDATION: pass');
console.log('PROMOTION_READY: false');
console.log('BLOCKER: source_fixture_predates_registry');
console.log('NETWORK_FETCH_PERFORMED: false');
console.log('PUBLIC_PROJECTION_WRITTEN: false');
