import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const statusPath = 'data/generated/timetable/operations-status.json';
const status = parse(statusPath);

const check = spawnSync(process.execPath, [
  'scripts/timetable/build-operations-status.mjs',
  '--reference-date', status.as_of_date,
  '--check'
], { cwd: root, encoding: 'utf8' });
if (check.status !== 0) fail(`operations status check failed: ${check.stderr || check.stdout}`);

if (status.schema_version !== 'calendar-operations-status-v1') fail('unexpected operations status schema.');
if (status.mode !== 'review_only_no_network') fail('operations status must remain review-only.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(status.as_of_date ?? '')) fail('as_of_date must use YYYY-MM-DD.');
if (status.generated_at !== `${status.as_of_date}T00:00:00.000Z`) fail('generated_at must derive deterministically from as_of_date.');

for (const key of ['network_fetch_performed', 'canonical_written', 'public_projection_written', 'scheduled_refresh_active']) {
  if (status.boundaries?.[key] !== false) fail(`boundaries.${key} must be false.`);
}

if (status.source_summary?.readiness_record_count !== 116) fail('operations status must cover all 116 readiness records.');
if (!Number.isInteger(status.source_summary?.revalidation_due_count)) fail('revalidation_due_count is missing.');
if (!Array.isArray(status.sources) || status.sources.length !== 116) fail('source operation rows must contain 116 records.');

for (const row of status.sources ?? []) {
  for (const key of ['readiness_id', 'country_id', 'readiness', 'implementation_status', 'automation_mode', 'source_status', 'checked_date', 'age_days', 'revalidation_due', 'action', 'fallback']) {
    if (!(key in row)) fail(`${row.readiness_id ?? 'unknown'} missing ${key}.`);
  }
  if (row.threshold_days !== null && !Number.isInteger(row.threshold_days)) fail(`${row.readiness_id} threshold_days is invalid.`);
}

if (status.candidate_summary?.path !== 'data/candidates/japan-jra-candidates.json') fail('JRA candidate path is incorrect.');
if (status.candidate_summary?.review_status !== 'needs_review') fail('JRA candidate must remain needs_review.');
if (status.candidate_summary?.record_count !== 4) fail('JRA candidate count must remain four.');
if (status.candidate_summary?.promotion_blocked_by_freshness !== true) fail('JRA reference candidate must remain freshness-blocked.');
if (status.candidate_summary?.action !== 'refresh_before_promotion') fail('JRA operator action must require refresh before promotion.');

if (status.public_projection?.meeting_count !== 23) fail('public meeting count changed unexpectedly.');
if (status.public_projection?.detail_count !== 5) fail('public detail count changed unexpectedly.');
if (status.public_projection?.current_window_start !== status.as_of_date) fail('current window must start at as_of_date.');
if (status.public_projection?.current_window_end_exclusive <= status.as_of_date) fail('current window end is invalid.');

if (!Array.isArray(status.operator_actions) || status.operator_actions.length === 0) fail('operator_actions must not be empty.');
const sortedActions = [...status.operator_actions].sort((a, b) => `${a.type}:${a.country_id}:${a.key}`.localeCompare(`${b.type}:${b.country_id}:${b.key}`));
if (JSON.stringify(status.operator_actions) !== JSON.stringify(sortedActions)) fail('operator_actions must use stable ordering.');
if (!status.operator_actions.some((action) => action.type === 'refresh_before_promotion' && action.country_id === 'japan')) {
  fail('JRA refresh-before-promotion action is missing.');
}

const prohibitedKeyFragments = ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'sample_text', 'stream_url'];
function inspectKeys(value, location = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, location + '[' + index + ']'));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const fragment = prohibitedKeyFragments.find((item) => lower.includes(item));
    if (fragment) fail('operations status contains prohibited key ' + location + '.' + key + '.');
    inspectKeys(child, location + '.' + key);
  }
}
inspectKeys(status);

const manualWorkflow = read('.github/workflows/calendar-operations-review.yml');
for (const marker of ['workflow_dispatch:', 'contents: read', 'build-operations-status.mjs', 'upload-artifact@v4']) {
  if (!manualWorkflow.includes(marker)) fail(`manual operations workflow missing ${marker}.`);
}
for (const forbidden of ['contents: write', 'pull-requests: write', 'create-pull-request', 'WHR_LIVE_FETCH: 1']) {
  if (manualWorkflow.includes(forbidden)) fail(`manual operations workflow contains forbidden marker ${forbidden}.`);
}

const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain paused.');

if (errors.length) {
  console.error(`CALENDAR_OPERATIONS_STATUS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_OPERATIONS_STATUS: pass as_of=${status.as_of_date} actions=${status.operator_actions.length}`);
console.log(`REVALIDATION_DUE: ${status.source_summary.revalidation_due_count}`);
console.log('NETWORK_FETCH_PERFORMED: false');
console.log('PUBLIC_PROJECTION_WRITTEN: false');
console.log('SCHEDULED_REFRESH_ACTIVE: false');
