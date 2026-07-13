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
const decision = readJson('data/audits/calendar-japan-current-window-decision-2026-07-13-v1.json');
const resultAudit = readJson('data/audits/calendar-nar-current-window-retry-result-v1.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');

if (policy.schema_version !== 'calendar-nar-current-window-retry-policy-v1') fail('NAR retry policy schema differs');
if (policy.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY' || policy.implementation_unit !== 'NAR-CURRENT-WINDOW-RETRY-01') fail('NAR retry policy identity differs');
if (policy.source_decision_ref !== 'data/audits/calendar-japan-current-window-decision-2026-07-13-v1.json') fail('NAR retry decision reference differs');
if (policy.selection.expected_meeting_count !== 66 || policy.selection.current_rank !== 'C') fail('NAR retry selected baseline differs');
if (policy.job.runner !== 'github_actions' || policy.job.collection_mode !== 'selected_meetings' || policy.job.target_rank !== 'A+' || policy.job.reason !== 'rank_upgrade_retry') fail('NAR retry Job policy differs');
if (Object.values(policy.side_effect_boundary ?? {}).some((value) => value !== false)) fail('NAR retry policy side-effect boundary differs');
const narDecision = decision.systems.find((record) => record.system_id === 'japan-nar-system');
if (!narDecision || narDecision.canonical_meeting_count !== 66 || narDecision.rank_counts.C !== 66 || narDecision.decision !== 'run_selected_meeting_detail_retry') fail('NAR retry source decision differs');

if (resultAudit.schema_version !== 'calendar-nar-current-window-retry-result-v1') fail('NAR retry result audit schema differs');
if (resultAudit.work_id !== policy.work_id || resultAudit.implementation_unit !== policy.implementation_unit) fail('NAR retry result audit identity differs');
if (resultAudit.decision !== 'accept_review_only_retry_result') fail('NAR retry result decision differs');
if (resultAudit.batch_id !== policy.job.batch_id) fail('NAR retry result batch differs');
if (resultAudit.evidence?.workflow_run_id !== 29233820152 || resultAudit.evidence?.artifact_id !== 8272633802) fail('NAR retry evidence identity differs');
if (resultAudit.evidence?.artifact_digest !== 'sha256:304e980b2d011383fae62fc69d3b3708784aa4b49ef02e94c267862300e94421') fail('NAR retry evidence digest differs');
if (resultAudit.scope?.selected_meeting_count !== 66 || resultAudit.scope?.current_rank !== 'C' || resultAudit.scope?.target_rank !== 'A+') fail('NAR retry result scope differs');
if (resultAudit.result?.coverage_claim !== 'source_window_complete') fail('NAR retry result coverage differs');
if (resultAudit.result?.a_plus_candidate_count !== 15 || resultAudit.result?.schedule_c_candidate_count !== 51) fail('NAR retry result candidate counts differ');
if (resultAudit.result?.detail_blocker_count !== 51 || resultAudit.result?.unresolved_meeting_count !== 51 || resultAudit.result?.retry_target_count !== 51) fail('NAR retry result unresolved counts differ');
if (resultAudit.result?.source_error_count !== 0) fail('NAR retry result source error count differs');
if (resultAudit.result?.review_state !== 'needs_review' || resultAudit.result?.promotion_eligible !== false || resultAudit.result?.publication_effect !== 'none') fail('NAR retry result review/publication boundary differs');
if (resultAudit.resolved_meeting_ids.length !== 15 || resultAudit.unresolved_meeting_ids.length !== 51) fail('NAR retry result ID counts differ');
if (new Set(resultAudit.resolved_meeting_ids).size !== 15 || new Set(resultAudit.unresolved_meeting_ids).size !== 51) fail('NAR retry result IDs contain duplicates');
if (resultAudit.resolved_meeting_ids.some((id) => resultAudit.unresolved_meeting_ids.includes(id))) fail('NAR retry resolved and unresolved sets overlap');
if (new Set([...resultAudit.resolved_meeting_ids, ...resultAudit.unresolved_meeting_ids]).size !== 66) fail('NAR retry result ID closure differs');
if (resultAudit.next_work?.[0]?.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-PROMOTION-REVIEW' || resultAudit.next_work?.[0]?.priority !== 1) fail('NAR promotion review next work differs');
if (resultAudit.next_work?.[1]?.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY-REMAINING' || resultAudit.next_work?.[1]?.priority !== 2) fail('NAR remaining retry next work differs');
if (Object.values(resultAudit.side_effect_boundary ?? {}).some((value) => value !== false)) fail('NAR retry result side-effect boundary differs');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-nar-current-window-retry-check-'));
try {
  const result = spawnSync(process.execPath, [
    'scripts/timetable/build-nar-current-window-retry-spec.mjs',
    `--output-dir=${tempDir}`,
    '--requested-at=2026-07-13T08:15:00Z',
  ], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`NAR retry spec builder failed: ${result.stderr || result.stdout}`);
  } else {
    const actualFiles = fs.readdirSync(tempDir).sort();
    const expectedFiles = ['collection-job.json', 'meeting-ids.txt', 'retry-scope.json', 'runner-execution.json'];
    if (!exact(actualFiles, expectedFiles)) fail(`NAR retry spec files differ: ${JSON.stringify(actualFiles)}`);
    const job = JSON.parse(fs.readFileSync(path.join(tempDir, 'collection-job.json'), 'utf8'));
    const execution = JSON.parse(fs.readFileSync(path.join(tempDir, 'runner-execution.json'), 'utf8'));
    const scope = JSON.parse(fs.readFileSync(path.join(tempDir, 'retry-scope.json'), 'utf8'));
    const ids = fs.readFileSync(path.join(tempDir, 'meeting-ids.txt'), 'utf8').trim().split(/\r?\n/);
    if (job.schema_version !== 'calendar-collection-job-v1' || job.job_id !== policy.job.job_id || job.campaign_id !== policy.job.campaign_id) fail('NAR retry Collection Job identity differs');
    if (job.runner_policy.mode !== 'exact' || job.runner_policy.runner !== 'github_actions') fail('NAR retry Collection Job runner differs');
    if (job.collection_mode !== 'selected_meetings' || job.target_rank !== 'A+' || job.reason !== 'rank_upgrade_retry') fail('NAR retry Collection Job semantics differ');
    if (ids.length !== 66 || job.requested_scope.meeting_ids.length !== 66 || scope.selected_meeting_count !== 66) fail('NAR retry selected count differs');
    if (!exact(ids, job.requested_scope.meeting_ids) || !exact(ids, scope.meeting_ids)) fail('NAR retry selected IDs differ across artifacts');
    if (new Set(ids).size !== ids.length) fail('NAR retry selected IDs contain duplicates');
    if (scope.first_meeting_date !== '2026-07-13' || scope.last_meeting_date !== '2026-07-31') fail('NAR retry scope date boundary differs');
    if (scope.existing_rank_counts.C !== 66 || scope.target_rank !== 'A+') fail('NAR retry scope rank boundary differs');
    if (execution.executor_id !== 'nar-incremental-v2-actions' || execution.runner_used !== 'github_actions') fail('NAR retry Runner Execution differs');
    if (execution.collection_mode !== 'selected_meetings' || execution.target_rank !== 'A+' || execution.reason !== 'rank_upgrade_retry') fail('NAR retry execution semantics differ');
    if (execution.review_required !== true || Object.values(execution.side_effect_boundary).some((value) => value !== false)) fail('NAR retry execution safety boundary differs');
    const canonicalById = new Map(canonical.meetings.map((meeting) => [meeting.meeting_id, meeting]));
    for (const id of ids) {
      const meeting = canonicalById.get(id);
      if (!meeting || meeting.authority_id !== 'nar-local-government-racing' || meeting.capability_rank !== 'C') fail(`NAR retry selected meeting differs: ${id}`);
      if (meeting?.date < policy.window.start_date || meeting?.date >= policy.window.end_date_exclusive) fail(`NAR retry selected meeting outside window: ${id}`);
    }
    const recordedIds = [...resultAudit.resolved_meeting_ids, ...resultAudit.unresolved_meeting_ids].sort();
    if (!exact(recordedIds, [...ids].sort())) fail('NAR retry historical result scope differs from current deterministic scope');
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

for (const file of [
  'data/audits/calendar-nar-current-window-retry-result-v1.json',
  'scripts/timetable/build-nar-current-window-retry-spec.mjs',
  '.github/workflows/calendar-nar-current-window-retry.yml',
  'docs/calendar/nar-current-window-retry.md',
]) if (!fs.existsSync(path.join(root, file))) fail(`NAR retry component missing: ${file}`);
const workflow = fs.readFileSync(path.join(root, '.github/workflows/calendar-nar-current-window-retry.yml'), 'utf8');
for (const phrase of ['contents: read', 'run-nar-incremental-v2-actions.mjs', 'check-calendar-nar-incremental-v2.mjs', 'actions/upload-artifact@v4', 'Prove protected state unchanged']) {
  if (!workflow.includes(phrase)) fail(`NAR retry workflow missing ${phrase}`);
}
if (/\bschedule\s*:|\bcron\s*:|contents:\s*write/.test(workflow)) fail('NAR retry workflow enables scheduled or write permission');

if (errors.length) {
  console.error(`CALENDAR_NAR_CURRENT_WINDOW_RETRY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_CURRENT_WINDOW_RETRY: pass');
console.log('SELECTED_MEETINGS: 66');
console.log('A_PLUS_CANDIDATES: 15');
console.log('REMAINING_C_RETRY_TARGETS: 51');
console.log('SOURCE_ERRORS: 0');
console.log('NEXT_WORK: WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-PROMOTION-REVIEW');
console.log('CANONICAL_PUBLIC_WRITE: false');
