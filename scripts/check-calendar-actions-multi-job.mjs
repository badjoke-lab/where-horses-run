import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  makeActionsJobStatusV1,
  matrixFromActionsMultiJobPlanV1,
  planActionsMultiJobV1,
  summarizeActionsCampaignV1,
  validateActionsJobStatusV1,
} from './timetable/actions-multi-job-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const fixtures = readJson('data/fixtures/calendar-collection-plans-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const plans = new Map(fixtures.plans.map((plan) => [plan.plan_id, plan]));
const compiled = new Map();

for (const plan of fixtures.plans) {
  try {
    const actionsPlan = planActionsMultiJobV1(plan, registry, compatibility);
    compiled.set(plan.plan_id, actionsPlan);
    const matrix = matrixFromActionsMultiJobPlanV1(actionsPlan);
    if (matrix.include.length !== actionsPlan.jobs.length) fail(`${plan.plan_id} matrix size differs from hosted Job count.`);
    const matrixIds = matrix.include.map((entry) => entry.job_id);
    const plannedIds = actionsPlan.jobs.map((entry) => entry.job_id);
    if (!exact(matrixIds, plannedIds)) fail(`${plan.plan_id} matrix Job order differs.`);
  } catch (error) {
    fail(`${plan.plan_id} compilation failed: ${error.message}`);
  }
}

const dual = compiled.get('japan-dual-runner-august-001');
if (!dual || dual.jobs.length !== 1 || dual.jobs[0].job_id !== 'nar-august-actions-plan-job-001') fail('dual-runner Plan must host only the NAR Actions Job.');
if (!dual?.excluded.some((entry) => entry.job_id === 'jra-august-local-plan-job-001' && entry.reason === 'non_actions_runner' && entry.runner === 'local')) {
  fail('dual-runner Plan must exclude JRA local Job without invalidating NAR Actions Job.');
}

const eastAsia = compiled.get('nar-hkjc-actions-window-001');
if (!eastAsia || eastAsia.jobs.length !== 2 || eastAsia.excluded.length !== 0) fail('NAR/HKJC Plan must compile two hosted Jobs.');
const eastJobs = new Map((eastAsia?.jobs ?? []).map((entry) => [entry.job_id, entry]));
const narEast = eastJobs.get('nar-september-actions-plan-job-001');
const hkjcEast = eastJobs.get('hkjc-august-actions-plan-job-001');
if (narEast?.execution.executor_id !== 'nar-incremental-v2-actions') fail('NAR hosted executor differs.');
if (hkjcEast?.execution.executor_id !== 'hkjc-bounded-generator-actions') fail('HKJC hosted executor differs.');
if (narEast?.execution.requested_scope.start_date !== '2026-09-01' || hkjcEast?.execution.requested_scope.start_date !== '2026-08-01') fail('NAR/HKJC independent windows were flattened.');
if (narEast?.batch_id === hkjcEast?.batch_id) fail('NAR/HKJC hosted Jobs must have independent batch IDs.');

const narMixed = compiled.get('nar-refresh-and-selected-retry-001');
if (!narMixed || narMixed.jobs.length !== 2) fail('NAR refresh/retry Plan must compile two hosted Jobs.');
const mixedModes = (narMixed?.jobs ?? []).map((entry) => entry.execution.collection_mode).sort();
if (!exact(mixedModes, ['date_window', 'selected_meetings'])) fail('NAR refresh/retry Plan must preserve independent collection modes.');
const selected = narMixed?.jobs.find((entry) => entry.execution.collection_mode === 'selected_meetings');
if (selected?.execution.target_rank !== 'A+' || selected?.execution.reason !== 'rank_upgrade_retry') fail('selected retry rank target/reason were not preserved.');

const baneiActions = compiled.get('banei-actions-window-selected-001');
if (!baneiActions || baneiActions.jobs.length !== 2 || baneiActions.excluded.length !== 0) fail('Banei Actions Plan must compile two hosted Jobs.');
const baneiModes = (baneiActions?.jobs ?? []).map((entry) => entry.execution.collection_mode).sort();
if (!exact(baneiModes, ['date_window', 'selected_meetings'])) fail('Banei Actions Plan must preserve date-window and selected-meeting modes.');
if (!(baneiActions?.jobs ?? []).every((entry) => entry.execution.executor_id === 'banei-schedule-detail-actions')) fail('Banei hosted executor mapping differs.');
if (new Set((baneiActions?.jobs ?? []).map((entry) => entry.batch_id)).size !== 2) fail('Banei hosted Jobs must have independent batch IDs.');
if (!(baneiActions?.jobs ?? []).every((entry) => entry.execution.runner_used === 'github_actions')) fail('Banei hosted Jobs must resolve to GitHub Actions primary runner.');

const rankIsolation = compiled.get('rank-isolation-plan-001');
if (!rankIsolation || rankIsolation.jobs.length !== 0) fail('rank-isolation Plan should have no currently executable Actions Jobs.');
if (!rankIsolation?.excluded.some((entry) => entry.job_id === 'nar-low-rank-target-job-001' && entry.reason === 'unsupported_collection_mode')) fail('NAR single-date Job must be excluded by executor mode support.');
if (!rankIsolation?.excluded.some((entry) => entry.job_id === 'jra-best-available-job-001' && entry.reason === 'non_actions_runner')) fail('JRA local Job must remain excluded from Actions runner.');

if (eastAsia && narEast && hkjcEast) {
  const narSuccess = makeActionsJobStatusV1(narEast.execution, 'success', null);
  const hkjcSourceError = makeActionsJobStatusV1(hkjcEast.execution, 'source_error', 'bounded source window unavailable');
  const summary = summarizeActionsCampaignV1(plans.get('nar-hkjc-actions-window-001'), eastAsia, [narSuccess, hkjcSourceError]);
  if (summary.counts.success !== 1 || summary.counts.source_error !== 1) fail('mixed campaign summary must preserve one success and one source_error.');
  const narResult = summary.results.find((entry) => entry.job_id === narSuccess.job_id);
  if (narResult?.status !== 'success') fail('HKJC source_error must not rewrite NAR success.');

  const missingSummary = summarizeActionsCampaignV1(plans.get('nar-hkjc-actions-window-001'), eastAsia, [narSuccess]);
  if (missingSummary.counts.success !== 1 || missingSummary.counts.not_run !== 1) fail('missing hosted status must become not_run without rewriting success.');

  let duplicateRejected = false;
  try {
    summarizeActionsCampaignV1(plans.get('nar-hkjc-actions-window-001'), eastAsia, [narSuccess, narSuccess]);
  } catch {
    duplicateRejected = true;
  }
  if (!duplicateRejected) fail('duplicate status record must be rejected.');

  let unknownRejected = false;
  try {
    summarizeActionsCampaignV1(plans.get('nar-hkjc-actions-window-001'), eastAsia, [{ ...narSuccess, job_id: 'unknown-job' }]);
  } catch {
    unknownRejected = true;
  }
  if (!unknownRejected) fail('unknown status Job must be rejected.');

  const drifted = { ...narSuccess, batch_id: 'wrong-batch' };
  if (validateActionsJobStatusV1(drifted, narEast).length === 0) fail('status identity drift must be rejected.');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-actions-multi-job-'));
  const executionPath = path.join(tempDir, 'hkjc-execution.json');
  fs.writeFileSync(executionPath, `${JSON.stringify(hkjcEast.execution, null, 2)}\n`);
  const result = spawnSync(process.execPath, [
    'scripts/timetable/run-hkjc-bounded-generator-job.mjs',
    `--execution=${executionPath}`,
    '--check-only',
  ], { cwd: root, encoding: 'utf8' });
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (result.status !== 0) fail(`HKJC check-only executor failed: ${result.stderr || result.stdout}`);
  else {
    const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
    const output = JSON.parse(lines.at(-1));
    if (output.coverage_claim !== 'none' || output.records_discovered !== 0 || output.source_error_count !== 1 || output.check_only !== true) {
      fail(`HKJC out-of-window check-only result differs: ${JSON.stringify(output)}`);
    }
  }
}

const workflow = readText('.github/workflows/calendar-actions-multi-job.yml');
for (const phrase of [
  'fail-fast: false',
  'if: always()',
  'permissions:\n  contents: read',
  'actions/upload-artifact@v4',
  'actions/download-artifact@v4',
  'Build campaign summary without rewriting independent outcomes',
]) {
  if (!workflow.includes(phrase)) fail(`Actions multi-job workflow missing ${phrase}.`);
}
if (/\bschedule\s*:|\bcron\s*:/.test(workflow)) fail('Actions multi-job workflow must not have schedule or cron trigger.');
if (/contents:\s*write/.test(workflow)) fail('Actions multi-job workflow must not have contents: write.');
for (const forbidden of ['promote-timetable', 'deploy', 'wrangler pages deploy']) {
  if (workflow.includes(forbidden)) fail(`Actions multi-job workflow contains forbidden side effect command ${forbidden}.`);
}

const docs = readText('docs/calendar/actions-multi-job-runner.md');
for (const phrase of [
  'fail-fast: false',
  'One Job failure does not rewrite another Job result',
  'source_error',
  'full Runner Gate is not complete',
  'Scheduled execution remains disabled',
]) {
  if (!docs.includes(phrase)) fail(`Actions multi-job contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of ['Stage ACP-10 — Actions multi-job runner', 'Status: complete.', 'Stage ACP-11 — local multi-job runner', 'Status: current.']) {
  if (!implementationPlan.includes(phrase)) fail(`control-plane implementation plan missing ${phrase}.`);
}

if (errors.length) {
  console.error(`CALENDAR_ACTIONS_MULTI_JOB: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_ACTIONS_MULTI_JOB: pass');
console.log(`PLANS_COMPILED: ${compiled.size}`);
console.log(`NAR_HKJC_HOSTED_JOBS: ${eastAsia.jobs.length}`);
console.log(`BANEI_HOSTED_JOBS: ${baneiActions.jobs.length}`);
console.log('INDEPENDENT_WINDOWS: pass');
console.log('INDEPENDENT_OUTCOMES: pass');
console.log('MISSING_STATUS_TO_NOT_RUN: pass');
console.log('HKJC_OUT_OF_WINDOW_SOURCE_ERROR: pass');
console.log('ACTIONS_WORKFLOW_BOUNDARY: pass');
