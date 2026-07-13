import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const policy = readJson('data/static/calendar-banei-current-window-policy-v1.json');
const sourceDecision = readJson(policy.source_decision_ref);
const canonical = readJson('data/generated/timetable/canonical/meetings.json');

if (policy.schema_version !== 'calendar-banei-current-window-policy-v1') fail('Banei current-window policy schema differs');
if (policy.work_id !== 'WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-ACQUISITION' || policy.implementation_unit !== 'BANEI-CURRENT-WINDOW-01') fail('Banei current-window policy identity differs');
if (!exact(policy.window, { start_date: '2026-07-13', end_date_exclusive: '2026-08-12', timezone: 'Asia/Tokyo' })) fail('Banei current-window policy window differs');
if (!exact(policy.month_jobs.map((entry) => entry.target_month), ['2026-07', '2026-08'])) fail('Banei current-window month split differs');
if (policy.job_contract?.system_id !== 'japan-banei-system'
  || policy.job_contract?.runner_policy?.mode !== 'registry_primary'
  || policy.job_contract?.collection_mode !== 'date_window'
  || policy.job_contract?.rank_strategy !== 'best_available'
  || policy.job_contract?.target_rank !== null
  || policy.job_contract?.reason !== 'regular_refresh') fail('Banei current-window Job contract differs');
if (!exact(policy.campaign_result_contract?.accepted_ranks, ['C', 'B', 'B+', 'A+'])) fail('Banei accepted rank boundary differs');
if (Object.values(policy.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Banei current-window side-effect boundary differs');
const historicalBanei = sourceDecision.systems?.find((record) => record.system_id === 'japan-banei-system');
if (!historicalBanei || historicalBanei.canonical_meeting_count !== 0 || historicalBanei.decision !== 'acquire_schedule_before_detail_retry') fail('Banei source decision differs');
const currentBanei = canonical.meetings.filter((meeting) => meeting.authority_id === 'banei-tokachi' && meeting.date >= policy.window.start_date && meeting.date < policy.window.end_date_exclusive);
if (currentBanei.length !== 0) fail(`Banei current-window baseline must remain zero before acquisition, got ${currentBanei.length}`);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-banei-current-window-spec-'));
try {
  const result = spawnSync(process.execPath, [
    'scripts/timetable/build-banei-current-window-spec.mjs',
    `--output-dir=${tempDir}`,
    '--requested-at=2026-07-14T00:00:00Z',
  ], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`Banei current-window spec builder failed: ${result.stderr || result.stdout}`);
  } else {
    const expectedFiles = [
      '2026-07-execution.json',
      '2026-07-job.json',
      '2026-08-execution.json',
      '2026-08-job.json',
      'campaign-scope.json',
      'collection-plan.json',
    ];
    const actualFiles = fs.readdirSync(tempDir).sort();
    if (!exact(actualFiles, expectedFiles)) fail(`Banei current-window spec files differ: ${JSON.stringify(actualFiles)}`);
    const plan = JSON.parse(fs.readFileSync(path.join(tempDir, 'collection-plan.json'), 'utf8'));
    const scope = JSON.parse(fs.readFileSync(path.join(tempDir, 'campaign-scope.json'), 'utf8'));
    if (plan.schema_version !== 'calendar-collection-plan-v1' || plan.jobs.length !== 2) fail('Banei current-window Collection Plan differs');
    if (scope.schema_version !== 'calendar-banei-current-window-scope-v1' || scope.month_job_count !== 2 || scope.baseline_canonical_meeting_count !== 0) fail('Banei current-window scope differs');
    if (!exact(scope.accepted_observation_ranks, ['C', 'B', 'B+', 'A+'])) fail('Banei current-window scope rank boundary differs');
    for (const [index, targetMonth] of ['2026-07', '2026-08'].entries()) {
      const job = JSON.parse(fs.readFileSync(path.join(tempDir, `${targetMonth}-job.json`), 'utf8'));
      const execution = JSON.parse(fs.readFileSync(path.join(tempDir, `${targetMonth}-execution.json`), 'utf8'));
      const monthPolicy = policy.month_jobs[index];
      if (job.job_id !== monthPolicy.job_id || job.campaign_id !== monthPolicy.campaign_id) fail(`${targetMonth} Banei Job identity differs`);
      if (job.requested_scope.start_date !== monthPolicy.start_date || job.requested_scope.end_date_exclusive !== monthPolicy.end_date_exclusive || job.requested_scope.timezone !== 'Asia/Tokyo') fail(`${targetMonth} Banei Job scope differs`);
      if (execution.batch_id !== monthPolicy.batch_id || execution.executor_id !== 'banei-schedule-detail-actions' || execution.runner_used !== 'github_actions') fail(`${targetMonth} Banei Runner Execution differs`);
      if (execution.collection_mode !== 'date_window' || execution.review_required !== true || Object.values(execution.side_effect_boundary).some((value) => value !== false)) fail(`${targetMonth} Banei execution boundary differs`);
    }
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const collector = readText('scripts/timetable/collect-banei-full-month-calendar.mjs');
for (const phrase of [
  "args.get('--target-month') ?? '2026-07'",
  "args.get('--candidate-output')",
  "args.get('--report-output')",
  'public_safe_extracted_fields_only_no_raw_html',
  'raw_source_storage',
  'Banei full-month schedule parser found no meetings for',
]) if (!collector.includes(phrase)) fail(`Banei monthly collector missing ${phrase}`);
const runner = readText('scripts/timetable/run-banei-actions-job.mjs');
for (const phrase of [
  'executionTargetMonth',
  'must remain within one calendar month',
  '--target-month=',
  '--candidate-output=',
  '--report-output=',
  'collect-banei-detail-window.mjs',
]) if (!runner.includes(phrase)) fail(`Banei Actions runner missing ${phrase}`);
for (const forbidden of [
  "const defaultScheduleCandidate = 'data/candidates/banei-monthly-2026-07-full-month-candidates.json'",
  'build-canonical-timetable.mjs',
  'build-public-timetable-view.mjs',
]) if (runner.includes(forbidden)) fail(`Banei Actions runner contains forbidden fixed/write path ${forbidden}`);

for (const file of [
  'docs/calendar/banei-current-window-acquisition.md',
  '.github/workflows/calendar-banei-current-window-acquisition.yml',
]) if (!fs.existsSync(path.join(root, file))) fail(`Banei current-window component missing: ${file}`);
const workflow = readText('.github/workflows/calendar-banei-current-window-acquisition.yml');
for (const phrase of [
  'contents: read',
  'build-banei-current-window-spec.mjs',
  'run-banei-actions-job.mjs',
  'actions/upload-artifact@v4',
  'Prove protected state unchanged',
]) if (!workflow.includes(phrase)) fail(`Banei current-window workflow missing ${phrase}`);
if (/\bschedule\s*:|\bcron\s*:|contents:\s*write/.test(workflow)) fail('Banei current-window workflow enables scheduled or write operation');

if (errors.length) {
  console.error(`CALENDAR_BANEI_CURRENT_WINDOW_ACQUISITION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_BANEI_CURRENT_WINDOW_ACQUISITION: pass');
console.log('BASELINE_CANONICAL_MEETINGS: 0');
console.log('MONTH_JOBS: 2026-07,2026-08');
console.log('COLLECTION_MODE: date_window');
console.log('ACCEPTED_RANKS: C,B,B+,A+');
console.log('CANONICAL_PUBLIC_WRITE: false');
