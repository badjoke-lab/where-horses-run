import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import { planActionsMultiJobV1 } from './timetable/actions-multi-job-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function hashFile(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex');
}

const plans = readJson('data/fixtures/calendar-collection-plans-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const activation = readJson('data/audits/calendar-hkjc-detail-operator-activation-v1.json');
const profile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
const plan = plans.plans.find((entry) => entry.plan_id === 'nar-hkjc-actions-window-001');

if (!profile) fail('HKJC Registry profile missing.');
else {
  if (profile.profile_status !== 'provisional') fail('HKJC Registry profile must remain provisional.');
  if (profile.primary_runner !== 'github_actions') fail('HKJC schedule primary runner must remain GitHub Actions.');
  if (profile.fallback_runner !== null || !profile.pending_fields?.includes('fallback_runner')) fail('HKJC fallback runner must remain pending.');
  if (profile.schedule_source_id !== 'hkjc-fixture-list' || profile.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('HKJC schedule route differs.');
  if (profile.detail_source_id !== 'hkjc-detail-reviewed-import' || profile.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('HKJC operator detail route activation differs.');
  if (!exact(profile.supported_observation_ranks, ['C', 'B', 'B+', 'A', 'A+'])) fail('HKJC observed rank set differs.');
  if (profile.public_ceiling !== 'A') fail('HKJC public ceiling must remain A.');
  if (profile.supports_selected_meetings !== false || profile.supports_rank_upgrade_retry !== false) fail('HKJC selected-meeting retry ownership must remain pending.');
}
if (activation.decision !== 'activate_operator_reviewed_detail_path') fail('HKJC detail activation audit differs.');

const executor = compatibility.executors.find((entry) => entry.system_id === 'hong-kong-hkjc-system' && entry.runner === 'github_actions');
if (!executor) fail('HKJC Actions executor mapping missing.');
else {
  if (executor.executor_id !== 'hkjc-live-fixture-actions') fail('HKJC Actions executor ID differs.');
  if (executor.entry_point !== 'scripts/timetable/run-hkjc-live-fixture-job.mjs') fail('HKJC Actions entry point differs.');
  if (executor.output_model !== 'hkjc-live-fixture-artifact-batch') fail('HKJC Actions output model differs.');
  if (!exact(executor.supported_collection_modes, ['date_window'])) fail('HKJC Actions collection modes differ.');
}

let actionsPlan = null;
try {
  actionsPlan = planActionsMultiJobV1(plan, registry, compatibility);
} catch (error) {
  fail(`HKJC/NAR Actions Plan compilation failed: ${error.message}`);
}
const hkjcPlanned = actionsPlan?.jobs.find((entry) => entry.job_id === 'hkjc-august-actions-plan-job-001');
if (!hkjcPlanned) fail('compiled HKJC Actions Job missing.');
else {
  const execution = hkjcPlanned.execution;
  if (execution.executor_id !== 'hkjc-live-fixture-actions') fail('compiled HKJC execution does not use live fixture executor.');
  if (execution.source_route.schedule_source_id !== 'hkjc-fixture-list'
    || execution.source_route.schedule_adapter_id !== 'hkjc-fixture-artifact-bridge-v1') fail('compiled HKJC schedule route differs.');
  if (execution.source_route.detail_source_id !== 'hkjc-detail-reviewed-import'
    || execution.source_route.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('compiled HKJC Registry route snapshot does not include current detail identity.');
  if (execution.runner_used !== 'github_actions' || execution.collection_mode !== 'date_window') fail('compiled HKJC schedule execution routing differs.');
  if (execution.review_required !== true) fail('compiled HKJC execution must require review.');
  if (Object.values(execution.side_effect_boundary).some((value) => value !== false)) fail('compiled HKJC execution side-effect boundary must remain all false.');

  const protectedFiles = [
    'data/generated/timetable/canonical/meetings.json',
    'data/generated/timetable/canonical/meeting-details.json',
    'data/generated/timetable/public/meeting-list.json',
    'data/generated/timetable/public/meeting-details.json',
    'data/sources/timetable/hkjc-racecard-route.json',
  ];
  const before = Object.fromEntries(protectedFiles.map((file) => [file, hashFile(file)]));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-hkjc-shared-actions-check-'));
  const executionPath = path.join(tempDir, 'execution.json');
  fs.writeFileSync(executionPath, `${JSON.stringify(execution, null, 2)}\n`);

  for (const [fixtureId, expected] of [
    ['august-actions-success', { claim: 'source_window_complete', records: 3, errors: 0 }],
    ['august-actions-source-error', { claim: 'none', records: 0, errors: 1 }],
  ]) {
    const result = spawnSync(process.execPath, [
      'scripts/timetable/run-hkjc-live-fixture-job.mjs',
      `--execution=${executionPath}`,
      `--check-only-fixture=${fixtureId}`,
    ], { cwd: root, encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      fail(`${fixtureId} check-only execution failed: ${result.stderr || result.stdout}`);
      continue;
    }
    const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
    const output = JSON.parse(lines.at(-1));
    if (output.execution_mode !== 'fixture_check_only') fail(`${fixtureId} execution mode differs.`);
    if (output.coverage_claim !== expected.claim || output.records_discovered !== expected.records || output.source_error_count !== expected.errors) fail(`${fixtureId} result summary differs.`);
    if (output.repository_write !== false || output.canonical_write !== false || output.public_write !== false) fail(`${fixtureId} side-effect report differs.`);
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  const after = Object.fromEntries(protectedFiles.map((file) => [file, hashFile(file)]));
  if (!exact(before, after)) fail('HKJC shared check-only execution modified protected repository state.');
}

const dispatcherSource = readText('scripts/timetable/run-calendar-actions-job.mjs');
if (!dispatcherSource.includes("execution.executor_id === 'hkjc-live-fixture-actions'") || !dispatcherSource.includes('run-hkjc-live-fixture-job.mjs')) fail('shared dispatcher HKJC schedule branch missing.');
const executorSource = readText('scripts/timetable/run-hkjc-live-fixture-job.mjs');
for (const forbiddenWriter of ['build-canonical-timetable.mjs','merge-hkjc-normalized-into-canonical.mjs','build-public-timetable-view.mjs','data/generated/timetable/canonical/meetings.json','data/generated/timetable/public/meeting-list.json']) {
  if (executorSource.includes(forbiddenWriter)) fail(`HKJC schedule executor references forbidden writer/target ${forbiddenWriter}.`);
}
if (!executorSource.includes('collect-hkjc-fixture-artifacts.mjs')) fail('HKJC shared executor must reuse the external collector boundary.');
if (!executorSource.includes('needs_review')) fail('HKJC schedule executor review-state guard missing.');
if (!executorSource.includes("record.capability_rank !== 'C'")) fail('HKJC schedule executor C-only guard missing.');
if (executorSource.includes('build-hkjc-detail-reviewed-import-package.mjs')) fail('HKJC schedule executor must not invoke the operator-only detail route.');

const workflow = readText('.github/workflows/calendar-actions-multi-job.yml');
for (const phrase of ['nar-hkjc-actions-window-001','run-calendar-actions-job.mjs','run-hkjc-live-fixture-job.mjs','fail-fast: false','actions/upload-artifact@v4','contents: read']) {
  if (!workflow.includes(phrase)) fail(`shared Actions workflow missing ${phrase}.`);
}
if (/\bschedule\s*:|\bcron\s*:/.test(workflow) || /contents:\s*write/.test(workflow)) fail('shared Actions workflow trigger/permission boundary differs.');

const liveEvidenceWorkflow = readText('.github/workflows/calendar-hkjc-shared-actions-live-evidence.yml');
for (const phrase of ['HKJC-PILOT-03','nar-hkjc-actions-window-001','run-calendar-actions-job.mjs','actions/upload-artifact@v4','contents: read','Review bounded live evidence summary']) {
  if (!liveEvidenceWorkflow.includes(phrase)) fail(`HKJC live-evidence workflow missing ${phrase}.`);
}
if (/\bschedule\s*:|\bcron\s*:/.test(liveEvidenceWorkflow) || /contents:\s*write/.test(liveEvidenceWorkflow)) fail('HKJC live-evidence workflow trigger/permission boundary differs.');

const doc = readText('docs/calendar/hkjc-shared-actions-live-evidence.md');
for (const phrase of ['HKJC-PILOT-03','profile remains provisional','actual live artifact evidence','human review','no automatic promotion','HKJC-PILOT-04']) {
  if (!doc.includes(phrase)) fail(`HKJC PILOT-03 document missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_HKJC_SHARED_ACTIONS_LIVE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_HKJC_SHARED_ACTIONS_LIVE_EVIDENCE: pass');
console.log('SCHEDULE_EXECUTOR: hkjc-live-fixture-actions / C-only');
console.log('OPERATOR_DETAIL_SOURCE_ADAPTER: active but not invoked by schedule executor');
console.log('SELECTED_MEETING_RANK_RETRY: pending');
console.log('CANONICAL_PUBLIC_WRITE: false');
