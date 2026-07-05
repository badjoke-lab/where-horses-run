import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const statusPath = 'data/generated/timetable/operations-status.json';
const status = parse(statusPath);
const readiness = loadCalendarReadinessV1(root);
const candidate = parse('data/candidates/japan-jra-candidates.json');
const publicMeetings = parse('data/generated/timetable/public/meeting-list.json');
const publicDetails = parse('data/generated/timetable/public/meeting-details.json');

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

const readinessCount = readiness.records?.length ?? 0;
if (!Number.isInteger(readinessCount) || readinessCount < 1) fail('readiness registry must contain records.');
if (status.source_summary?.readiness_record_count !== readinessCount) fail(`operations status must cover all ${readinessCount} readiness records.`);
if (!Number.isInteger(status.source_summary?.revalidation_due_count)) fail('revalidation_due_count is missing.');
if (!Array.isArray(status.sources) || status.sources.length !== readinessCount) fail(`source operation rows must contain ${readinessCount} records.`);

for (const row of status.sources ?? []) {
  for (const key of ['readiness_id', 'country_id', 'readiness', 'implementation_status', 'automation_mode', 'source_status', 'checked_date', 'age_days', 'revalidation_due', 'action', 'fallback']) {
    if (!(key in row)) fail(`${row.readiness_id ?? 'unknown'} missing ${key}.`);
  }
  if (row.threshold_days !== null && !Number.isInteger(row.threshold_days)) fail(`${row.readiness_id} threshold_days is invalid.`);
}

const candidateRecords = candidate.records ?? [];
const sourceDates = candidateRecords.map((record) => record.source?.checked_at?.slice(0, 10)).filter(Boolean).sort();
const candidateSourceDate = sourceDates.at(-1) ?? null;
const jraReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/jra/jra-programme');
const inventory = parse('data/static/authority-source-inventory.json');
const jraInventory = inventory.records.find((record) => record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme');
const registryMinimum = [jraReadiness?.checked_date, jraInventory?.last_checked_date].filter(Boolean).sort().at(-1) ?? null;
const freshnessBlocked = Boolean(candidateSourceDate && registryMinimum && candidateSourceDate < registryMinimum);
const expectedCandidateAction = freshnessBlocked ? 'refresh_before_promotion' : 'human_review_required';

if (status.candidate_summary?.path !== 'data/candidates/japan-jra-candidates.json') fail('JRA candidate path is incorrect.');
if (status.candidate_summary?.review_status !== candidate.review?.status) fail('JRA candidate review status differs from candidate file.');
if (status.candidate_summary?.record_count !== candidateRecords.length) fail('JRA candidate count differs from candidate file.');
if (status.candidate_summary?.source_checked_date !== candidateSourceDate) fail('JRA candidate source date differs from candidate file.');
if (status.candidate_summary?.registry_minimum_date !== registryMinimum) fail('JRA registry minimum date is incorrect.');
if (status.candidate_summary?.promotion_blocked_by_freshness !== freshnessBlocked) fail('JRA freshness blocker state is incorrect.');
if (status.candidate_summary?.action !== expectedCandidateAction) fail(`JRA operator action must be ${expectedCandidateAction}.`);

if (status.public_projection?.meeting_count !== publicMeetings.meetings.length) fail('public meeting count differs from current public JSON.');
if (status.public_projection?.detail_count !== publicDetails.details.length) fail('public detail count differs from current public JSON.');
if (status.public_projection?.generated_at !== publicMeetings.generated_at) fail('public projection generated_at differs from meeting list.');
if (publicMeetings.generated_at !== publicDetails.generated_at) fail('public meeting/detail generated_at values must match.');
if (status.public_projection?.current_window_start !== status.as_of_date) fail('current window must start at as_of_date.');
if (status.public_projection?.current_window_end_exclusive <= status.as_of_date) fail('current window end is invalid.');

if (!Array.isArray(status.operator_actions) || status.operator_actions.length === 0) fail('operator_actions must not be empty.');
const sortedActions = [...status.operator_actions].sort((a, b) => `${a.type}:${a.country_id}:${a.key}`.localeCompare(`${b.type}:${b.country_id}:${b.key}`));
if (JSON.stringify(status.operator_actions) !== JSON.stringify(sortedActions)) fail('operator_actions must use stable ordering.');
if (!status.operator_actions.some((action) => action.type === expectedCandidateAction && action.country_id === 'japan' && action.key === 'data/candidates/japan-jra-candidates.json')) {
  fail(`JRA ${expectedCandidateAction} action is missing.`);
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
console.log(`JRA_CANDIDATES: ${candidateRecords.length}`);
console.log(`JRA_ACTION: ${expectedCandidateAction}`);
console.log(`PUBLIC_MEETINGS: ${publicMeetings.meetings.length}`);
console.log(`PUBLIC_DETAILS: ${publicDetails.details.length}`);
console.log(`REVALIDATION_DUE: ${status.source_summary.revalidation_due_count}`);
console.log('NETWORK_FETCH_PERFORMED: false');
console.log('PUBLIC_PROJECTION_WRITTEN: false');
console.log('SCHEDULED_REFRESH_ACTIVE: false');
