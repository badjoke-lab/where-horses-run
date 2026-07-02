import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const packagePath = 'data/generated/timetable/operations-review-package.json';
const reviewPackage = parse(packagePath);
const control = parse('data/static/calendar-operations-control.json');
const jraDigestOverlay = parse('data/static/calendar-operations-jra-candidate-digest-v2.json');

const check = spawnSync(process.execPath, [
  'scripts/timetable/build-operations-review-package.mjs',
  '--check'
], { cwd: root, encoding: 'utf8' });
if (check.status !== 0) fail(`review package check failed: ${check.stderr || check.stdout}`);

if (reviewPackage.schema_version !== 'calendar-operations-review-package-v1') fail('unexpected review package schema.');
if (reviewPackage.work_id !== 'WHR-CAL-OPS-V1') fail('review package Work ID is incorrect.');
if (reviewPackage.mode !== 'paused_review_only') fail('review package must remain paused_review_only.');
if (control.mode !== reviewPackage.mode) fail('review package and control mode differ.');
if (jraDigestOverlay.schema_version !== 'calendar-operations-jra-candidate-digest-v2') fail('unexpected JRA candidate digest overlay schema.');
if (reviewPackage.input_digests?.jra_candidate_sha256 !== jraDigestOverlay.base_candidate_sha256) fail('base package JRA candidate digest differs from overlay.');
if (jraDigestOverlay.candidate_path !== 'data/candidates/japan-jra-candidates.json') fail('JRA candidate digest overlay path is incorrect.');
for (const key of ['candidate_approval_performed','canonical_write_performed','public_write_performed','unattended_publication_allowed']) {
  if (jraDigestOverlay.boundaries?.[key] !== false) fail(`JRA digest overlay boundary ${key} must be false.`);
}

for (const key of ['network_fetch_performed', 'repository_write_performed', 'candidate_approval_performed', 'canonical_write_performed', 'public_write_performed', 'pull_request_created']) {
  if (reviewPackage.boundaries?.[key] !== false) fail(`boundaries.${key} must be false.`);
}
for (const [key, digest] of Object.entries(reviewPackage.input_digests ?? {})) {
  if (!key.endsWith('_sha256') || !/^[a-f0-9]{64}$/.test(digest)) fail(`invalid input digest ${key}.`);
}
if (Object.keys(reviewPackage.input_digests ?? {}).length !== 6) fail('six input digests are required.');

if (!Array.isArray(reviewPackage.actions) || reviewPackage.actions.length === 0) fail('review actions are missing.');
for (let index = 1; index < reviewPackage.actions.length; index += 1) {
  const previous = reviewPackage.actions[index - 1];
  const current = reviewPackage.actions[index];
  if (previous.priority > current.priority) fail('review actions are not ordered by priority.');
}
if (!reviewPackage.actions.some((action) => action.type === 'refresh_before_promotion' && action.country_id === 'japan')) {
  fail('JRA refresh-before-promotion action is missing.');
}

if (!Array.isArray(reviewPackage.proposed_review?.changed_files) || reviewPackage.proposed_review.changed_files.length !== 0) {
  fail('foundation review package must propose no file changes.');
}
if (reviewPackage.proposed_review?.public_release_expected !== false) fail('public_release_expected must be false.');
if (!Array.isArray(reviewPackage.proposed_review?.required_checks) || reviewPackage.proposed_review.required_checks.length < 6) {
  fail('required review checks are incomplete.');
}

if (reviewPackage.pause_and_rollback?.current_mode !== 'paused_review_only') fail('pause control is missing.');
if (!Array.isArray(reviewPackage.pause_and_rollback?.pause_actions) || reviewPackage.pause_and_rollback.pause_actions.length < 4) fail('pause actions are incomplete.');
if (!Array.isArray(reviewPackage.pause_and_rollback?.rollback_actions) || reviewPackage.pause_and_rollback.rollback_actions.length < 4) fail('rollback actions are incomplete.');
if (!Array.isArray(reviewPackage.pause_and_rollback?.activation_prerequisites) || reviewPackage.pause_and_rollback.activation_prerequisites.length < 5) fail('activation prerequisites are incomplete.');

for (const key of ['scheduled_refresh_active', 'live_fetch_allowed', 'automatic_candidate_approval_allowed', 'automatic_canonical_write_allowed', 'automatic_public_write_allowed', 'unattended_publication_allowed']) {
  if (control[key] !== false) fail(`control.${key} must be false.`);
}

const workflow = read('.github/workflows/calendar-operations-review.yml');
if (!workflow.includes('build-operations-review-package.mjs')) fail('manual workflow must generate the review package artifact.');
if (!workflow.includes('/tmp/calendar-operations-review-package.json')) fail('manual workflow review package path is missing.');
for (const forbidden of ['contents: write', 'pull-requests: write', 'create-pull-request']) {
  if (workflow.includes(forbidden)) fail(`manual workflow contains forbidden marker ${forbidden}.`);
}

const serialized = JSON.stringify(reviewPackage).toLowerCase();
for (const forbidden of ['raw_html', 'source_body', 'sample_text', 'stream_url', 'odds', 'payout', 'prediction']) {
  if (serialized.includes(forbidden)) fail(`review package contains prohibited fragment ${forbidden}.`);
}

if (errors.length) {
  console.error(`CALENDAR_OPERATIONS_REVIEW_PACKAGE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_OPERATIONS_REVIEW_PACKAGE: pass actions=${reviewPackage.actions.length}`);
console.log('MODE: paused_review_only');
console.log('PROPOSED_CHANGED_FILES: 0');
console.log('PUBLIC_RELEASE_EXPECTED: false');
console.log('JRA_CANDIDATE_DIGEST_RESOLUTION: v2-overlay');
