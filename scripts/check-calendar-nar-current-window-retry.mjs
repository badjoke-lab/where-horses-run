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
const canonical = readJson('data/generated/timetable/canonical/meetings.json');

if (policy.schema_version !== 'calendar-nar-current-window-retry-policy-v1') fail('NAR retry policy schema differs');
if (policy.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY' || policy.implementation_unit !== 'NAR-CURRENT-WINDOW-RETRY-01') fail('NAR retry policy identity differs');
if (policy.source_decision_ref !== 'data/audits/calendar-japan-current-window-decision-2026-07-13-v1.json') fail('NAR retry decision reference differs');
if (policy.selection.expected_meeting_count !== 66 || policy.selection.current_rank !== 'C') fail('NAR retry selected baseline differs');
if (policy.job.runner !== 'github_actions' || policy.job.collection_mode !== 'selected_meetings' || policy.job.target_rank !== 'A+' || policy.job.reason !== 'rank_upgrade_retry') fail('NAR retry Job policy differs');
if (Object.values(policy.side_effect_boundary ?? {}).some((value) => value !== false)) fail('NAR retry policy side-effect boundary differs');
const narDecision = decision.systems.find((record) => record.system_id === 'japan-nar-system');
if (!narDecision || narDecision.canonical_meeting_count !== 66 || narDecision.rank_counts.C !== 66 || narDecision.decision !== 'run_selected_meeting_detail_retry') fail('NAR retry source decision differs');

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
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

for (const file of [
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
console.log('CURRENT_RANK: C');
console.log('TARGET_RANK: A+');
console.log('RUNNER: github_actions');
console.log('CANONICAL_PUBLIC_WRITE: false');
