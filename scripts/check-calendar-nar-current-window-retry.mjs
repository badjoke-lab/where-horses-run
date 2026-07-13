import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const policy = readJson('data/static/calendar-nar-current-window-retry-policy-v1.json');
const historicalDecision = readJson('data/audits/calendar-japan-current-window-decision-2026-07-13-v1.json');
const resultAudit = readJson('data/audits/calendar-nar-current-window-retry-result-v1.json');
const approvedCandidate = readJson('data/candidates/nar-current-window-a-plus-approved.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');

if (policy.schema_version !== 'calendar-nar-current-window-retry-policy-v1') fail('NAR retry policy schema differs');
if (policy.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY' || policy.implementation_unit !== 'NAR-CURRENT-WINDOW-RETRY-01') fail('NAR retry policy identity differs');
if (policy.source_decision_ref !== 'data/audits/calendar-japan-current-window-decision-2026-07-13-v1.json' || policy.source_result_ref !== 'data/audits/calendar-nar-current-window-retry-result-v1.json') fail('NAR retry evidence references differ');
if (policy.historical_campaign?.status !== 'completed'
  || policy.historical_campaign?.selection?.selected_meeting_count !== 66
  || policy.historical_campaign?.result?.a_plus_candidate_count !== 15
  || policy.historical_campaign?.result?.retained_c_retry_target_count !== 51
  || policy.historical_campaign?.result?.source_error_count !== 0) fail('NAR completed campaign policy differs');
if (policy.remaining_campaign?.status !== 'manual_retry_available'
  || policy.remaining_campaign?.selection?.current_rank !== 'C'
  || policy.remaining_campaign?.selection?.expected_meeting_count !== 51
  || policy.remaining_campaign?.selection?.expected_first_date !== '2026-07-16'
  || policy.remaining_campaign?.selection?.expected_last_date !== '2026-07-31') fail('NAR remaining campaign policy differs');
if (policy.remaining_campaign?.job?.runner !== 'github_actions'
  || policy.remaining_campaign?.job?.collection_mode !== 'selected_meetings'
  || policy.remaining_campaign?.job?.target_rank !== 'A+'
  || policy.remaining_campaign?.job?.reason !== 'rank_upgrade_retry') fail('NAR remaining Job policy differs');
if (policy.execution_policy?.pull_request_live_fetch !== false
  || policy.execution_policy?.manual_workflow_dispatch !== true
  || policy.execution_policy?.automatic_schedule !== false) fail('NAR retry execution policy differs');
if (Object.values(policy.side_effect_boundary ?? {}).some((value) => value !== false)) fail('NAR retry policy side-effect boundary differs');

const historicalNar = historicalDecision.systems.find((record) => record.system_id === 'japan-nar-system');
if (!historicalNar || historicalNar.canonical_meeting_count !== 66 || historicalNar.rank_counts.C !== 66 || historicalNar.decision !== 'run_selected_meeting_detail_retry') fail('historical NAR source decision differs');
if (resultAudit.schema_version !== 'calendar-nar-current-window-retry-result-v1'
  || resultAudit.result?.a_plus_candidate_count !== 15
  || resultAudit.result?.schedule_c_candidate_count !== 51
  || resultAudit.result?.retry_target_count !== 51
  || resultAudit.result?.source_error_count !== 0) fail('historical NAR retry result differs');
if (resultAudit.resolved_meeting_ids.length !== 15 || resultAudit.unresolved_meeting_ids.length !== 51) fail('historical NAR result ID counts differ');
if (approvedCandidate.schema_version !== 'timetable-candidate-v1'
  || approvedCandidate.review?.status !== 'approved'
  || approvedCandidate.records?.length !== 15) fail('approved NAR Candidate differs');
if (!exact([...approvedCandidate.records.map((record) => record.meeting_id)].sort(), [...resultAudit.resolved_meeting_ids].sort())) fail('approved NAR Candidate set differs from historical resolved set');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-nar-current-window-retry-check-'));
try {
  const result = spawnSync(process.execPath, [
    'scripts/timetable/build-nar-current-window-retry-spec.mjs',
    `--output-dir=${tempDir}`,
    '--requested-at=2026-07-13T08:30:00Z',
  ], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`NAR remaining retry spec builder failed: ${result.stderr || result.stdout}`);
  } else {
    const actualFiles = fs.readdirSync(tempDir).sort();
    const expectedFiles = ['collection-job.json', 'meeting-ids.txt', 'retry-scope.json', 'runner-execution.json'];
    if (!exact(actualFiles, expectedFiles)) fail(`NAR remaining retry spec files differ: ${JSON.stringify(actualFiles)}`);
    const job = JSON.parse(fs.readFileSync(path.join(tempDir, 'collection-job.json'), 'utf8'));
    const execution = JSON.parse(fs.readFileSync(path.join(tempDir, 'runner-execution.json'), 'utf8'));
    const scope = JSON.parse(fs.readFileSync(path.join(tempDir, 'retry-scope.json'), 'utf8'));
    const ids = fs.readFileSync(path.join(tempDir, 'meeting-ids.txt'), 'utf8').trim().split(/\r?\n/);
    if (job.job_id !== policy.remaining_campaign.job.job_id || job.campaign_id !== policy.remaining_campaign.job.campaign_id) fail('NAR remaining Collection Job identity differs');
    if (job.runner_policy?.runner !== 'github_actions' || job.collection_mode !== 'selected_meetings' || job.target_rank !== 'A+' || job.reason !== 'rank_upgrade_retry') fail('NAR remaining Collection Job semantics differ');
    if (ids.length !== 51 || job.requested_scope.meeting_ids.length !== 51 || scope.selected_meeting_count !== 51) fail('NAR remaining selected count differs');
    if (!exact(ids, job.requested_scope.meeting_ids) || !exact(ids, scope.meeting_ids)) fail('NAR remaining selected IDs differ across artifacts');
    if (!exact([...ids].sort(), [...resultAudit.unresolved_meeting_ids].sort())) fail('NAR remaining scope differs from unresolved result set');
    if (scope.scope_kind !== 'remaining_after_reviewed_promotion'
      || scope.historical_selected_meeting_count !== 66
      || scope.promoted_a_plus_meeting_count !== 15
      || scope.first_meeting_date !== '2026-07-16'
      || scope.last_meeting_date !== '2026-07-31') fail('NAR remaining retry scope summary differs');
    if (scope.existing_rank_counts.C !== 51 || scope.target_rank !== 'A+') fail('NAR remaining retry rank boundary differs');
    if (execution.executor_id !== 'nar-incremental-v2-actions' || execution.runner_used !== 'github_actions') fail('NAR remaining Runner Execution differs');
    if (execution.collection_mode !== 'selected_meetings' || execution.target_rank !== 'A+' || execution.reason !== 'rank_upgrade_retry') fail('NAR remaining execution semantics differ');
    if (execution.review_required !== true || Object.values(execution.side_effect_boundary).some((value) => value !== false)) fail('NAR remaining execution safety boundary differs');
    const canonicalById = new Map(canonical.meetings.map((meeting) => [meeting.meeting_id, meeting]));
    for (const id of resultAudit.resolved_meeting_ids) {
      if (canonicalById.get(id)?.capability_rank !== 'A+') fail(`resolved NAR meeting is not current A+: ${id}`);
    }
    for (const id of ids) {
      const meeting = canonicalById.get(id);
      if (!meeting || meeting.authority_id !== 'nar-local-government-racing' || meeting.capability_rank !== 'C') fail(`remaining NAR retry meeting differs: ${id}`);
      if (meeting?.date < policy.window.start_date || meeting?.date >= policy.window.end_date_exclusive) fail(`remaining NAR meeting outside window: ${id}`);
    }
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

for (const file of [
  'data/audits/calendar-nar-current-window-retry-result-v1.json',
  'data/candidates/nar-current-window-a-plus-approved.json',
  'scripts/timetable/build-nar-current-window-retry-spec.mjs',
  '.github/workflows/calendar-nar-current-window-retry.yml',
  'docs/calendar/nar-current-window-retry.md',
]) if (!fs.existsSync(path.join(root, file))) fail(`NAR retry component missing: ${file}`);
const workflow = fs.readFileSync(path.join(root, '.github/workflows/calendar-nar-current-window-retry.yml'), 'utf8');
for (const phrase of ['workflow_dispatch:', 'contents: read', 'run-nar-incremental-v2-actions.mjs', 'actions/upload-artifact@v4', 'pull_request_live_fetch']) {
  if (!workflow.includes(phrase)) fail(`NAR retry workflow missing ${phrase}`);
}
if (/\bschedule\s*:|\bcron\s*:|contents:\s*write/.test(workflow)) fail('NAR retry workflow enables scheduled or write permission');

if (errors.length) {
  console.error(`CALENDAR_NAR_CURRENT_WINDOW_RETRY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_CURRENT_WINDOW_RETRY: pass');
console.log('HISTORICAL_SELECTED_MEETINGS: 66');
console.log('PROMOTED_A_PLUS: 15');
console.log('REMAINING_C_RETRY_TARGETS: 51');
console.log('PULL_REQUEST_LIVE_FETCH: false');
console.log('MANUAL_RETRY_AVAILABLE: true');
console.log('CANONICAL_PUBLIC_WRITE: false');
