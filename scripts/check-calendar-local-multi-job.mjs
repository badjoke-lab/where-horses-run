import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';
import {
  makeLocalJobStatusV1,
  planLocalMultiJobV1,
  summarizeLocalCampaignV1,
} from './timetable/local-multi-job-core.mjs';
import { validateCollectionResultManifestV1 } from './timetable/collection-result-manifest-validation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const baseFixtures = readJson('data/fixtures/calendar-collection-plans-v1.json');
const localFixtures = readJson('data/fixtures/calendar-local-multi-job-fixtures-v1.json');
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const plans = [...baseFixtures.plans, ...localFixtures.plans];
const byPlanId = new Map(plans.map((plan) => [plan.plan_id, plan]));
const compiled = new Map();

for (const plan of plans) {
  try {
    compiled.set(plan.plan_id, planLocalMultiJobV1(plan, registry, compatibility));
  } catch (error) {
    fail(`${plan.plan_id} local compilation failed: ${error.message}`);
  }
}

const dual = compiled.get('japan-dual-runner-august-001');
if (!dual || dual.jobs.length !== 1 || dual.jobs[0].job_id !== 'jra-august-local-plan-job-001') {
  fail('dual-runner Plan must include only JRA local Job in local execution.');
}
if (!dual?.excluded.some((entry) => entry.job_id === 'nar-august-actions-plan-job-001' && entry.reason === 'non_local_runner')) {
  fail('dual-runner Plan must exclude NAR Actions Job without failing JRA local Job.');
}

const rankIsolation = compiled.get('rank-isolation-plan-001');
if (!rankIsolation || rankIsolation.jobs.length !== 0) fail('rank-isolation Plan should have no currently executable local Jobs.');
if (!rankIsolation?.excluded.some((entry) => entry.job_id === 'jra-best-available-job-001' && entry.reason === 'unsupported_collection_mode')) {
  fail('JRA single-date Job must be excluded until local executor supports single_date.');
}
if (!rankIsolation?.excluded.some((entry) => entry.job_id === 'nar-low-rank-target-job-001' && entry.reason === 'non_local_runner')) {
  fail('NAR primary Actions Job must be excluded from local runner.');
}

const twoWindowPlan = byPlanId.get('jra-two-window-local-001');
const twoWindow = compiled.get('jra-two-window-local-001');
if (!twoWindow || twoWindow.jobs.length !== 2 || twoWindow.excluded.length !== 0) {
  fail('two-window JRA Plan must compile two independent local Jobs.');
}
if (twoWindow) {
  const batchIds = new Set(twoWindow.jobs.map((entry) => entry.batch_id));
  if (batchIds.size !== 2) fail('two-window JRA Jobs must have independent batch IDs.');
  const scopes = twoWindow.jobs.map((entry) => entry.execution.requested_scope.start_date);
  if (!exact(scopes, ['2026-07-01', '2026-08-10'])) fail('two-window JRA scopes were flattened or reordered.');
  if (!twoWindow.jobs.every((entry) => entry.execution.runner_used === 'local' && entry.execution.executor_id === 'jra-refresh-local')) {
    fail('two-window JRA Jobs must resolve to local jra-refresh-local executor.');
  }
}

function manifestFor(plannedJob, { coverageClaim = 'source_window_complete', ranks = { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 1 }, unresolvedDates = [], sourceErrors = [] } = {}) {
  const execution = plannedJob.execution;
  const discovered = Object.values(ranks).reduce((sum, value) => sum + value, 0);
  const scope = execution.requested_scope;
  const manifest = {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: execution.campaign_id,
    job_id: execution.job_id,
    batch_id: execution.batch_id,
    system_id: execution.system_id,
    runner_used: 'local',
    requested_scope: structuredClone(scope),
    observed_scope: {
      kind: 'date_window',
      start_date: scope.start_date,
      end_date_exclusive: scope.end_date_exclusive,
      timezone: scope.timezone,
    },
    coverage_claim: coverageClaim,
    records_discovered: discovered,
    records_updated: discovered,
    rank_counts: structuredClone(ranks),
    unresolved_dates: structuredClone(unresolvedDates),
    unresolved_meeting_ids: [],
    source_errors: structuredClone(sourceErrors),
    artifact_refs: {
      candidate_ref: `data/generated/timetable/local-multi-job/${execution.batch_id}/candidate.json`,
      coverage_observation_ref: `data/generated/timetable/local-multi-job/${execution.batch_id}/coverage-observation.json`,
      collection_report_ref: `data/generated/timetable/local-multi-job/${execution.batch_id}/collection-report.json`,
    },
  };
  const structural = validateCollectionResultManifestV1(manifest);
  if (structural.length) throw new Error(`synthetic manifest invalid: ${structural.join('; ')}`);
  return manifest;
}

if (twoWindow && twoWindowPlan) {
  const first = twoWindow.jobs[0];
  const second = twoWindow.jobs[1];
  const firstSuccess = makeLocalJobStatusV1(first.execution, 'success', null);
  const secondSourceError = makeLocalJobStatusV1(second.execution, 'source_error', 'bounded source failure');
  const firstManifest = manifestFor(first, { ranks: { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 24 } });
  const mixedSummary = summarizeLocalCampaignV1(twoWindowPlan, twoWindow, [firstSuccess, secondSourceError], [{
    status: 'success',
    manifest: firstManifest,
    manifest_ref: `data/generated/timetable/local-multi-job/${first.batch_id}/result-manifest.json`,
  }]);
  if (mixedSummary.counts.success !== 1 || mixedSummary.counts.source_error !== 1) {
    fail('local mixed summary must preserve one success and one source_error.');
  }
  if (mixedSummary.review_queue.entries.length !== 1 || mixedSummary.review_queue.entries[0].job_id !== first.job_id) {
    fail('source_error local Job must not erase success or enter Review Queue.');
  }

  const secondPartial = makeLocalJobStatusV1(second.execution, 'partial', null);
  const secondManifest = manifestFor(second, {
    coverageClaim: 'partial',
    ranks: { C: 2, B: 0, 'B+': 0, A: 0, 'A+': 1 },
    unresolvedDates: ['2026-08-20'],
    sourceErrors: [{
      code: 'unexpected_response',
      scope_ref: '2026-08-20',
      message: 'Bounded fixture source error.',
    }],
  });
  const partialSummary = summarizeLocalCampaignV1(twoWindowPlan, twoWindow, [firstSuccess, secondPartial], [
    {
      status: 'success',
      manifest: firstManifest,
      manifest_ref: `data/generated/timetable/local-multi-job/${first.batch_id}/result-manifest.json`,
    },
    {
      status: 'partial',
      manifest: secondManifest,
      manifest_ref: `data/generated/timetable/local-multi-job/${second.batch_id}/result-manifest.json`,
    },
  ]);
  if (partialSummary.counts.success !== 1 || partialSummary.counts.partial !== 1 || partialSummary.review_queue.entries.length !== 2) {
    fail('success and partial local batches must remain independent and review-ready.');
  }

  const missingSummary = summarizeLocalCampaignV1(twoWindowPlan, twoWindow, [firstSuccess], [{
    status: 'success',
    manifest: firstManifest,
    manifest_ref: `data/generated/timetable/local-multi-job/${first.batch_id}/result-manifest.json`,
  }]);
  if (missingSummary.counts.success !== 1 || missingSummary.counts.not_run !== 1) {
    fail('missing local status must become not_run without rewriting success.');
  }

  let duplicateRejected = false;
  try {
    summarizeLocalCampaignV1(twoWindowPlan, twoWindow, [firstSuccess, firstSuccess], []);
  } catch {
    duplicateRejected = true;
  }
  if (!duplicateRejected) fail('duplicate local status must be rejected.');

  let manifestDriftRejected = false;
  try {
    summarizeLocalCampaignV1(twoWindowPlan, twoWindow, [firstSuccess], [{
      status: 'success',
      manifest: { ...firstManifest, batch_id: 'wrong-batch' },
      manifest_ref: `data/generated/timetable/local-multi-job/${first.batch_id}/result-manifest.json`,
    }]);
  } catch {
    manifestDriftRejected = true;
  }
  if (!manifestDriftRejected) fail('local Manifest identity drift must be rejected.');
}

if (twoWindow) {
  const july = twoWindow.jobs.find((entry) => entry.execution.requested_scope.start_date === '2026-07-01');
  const julyJob = twoWindowPlan.jobs.find((entry) => entry.job_id === july.job_id);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-local-check-'));
  const executionPath = path.join(tempDir, 'execution.json');
  const jobPath = path.join(tempDir, 'job.json');
  fs.writeFileSync(executionPath, `${JSON.stringify(july.execution, null, 2)}\n`);
  fs.writeFileSync(jobPath, `${JSON.stringify(julyJob, null, 2)}\n`);
  const batchDir = path.join(root, `data/generated/timetable/local-multi-job/${july.batch_id}`);
  const existedBefore = fs.existsSync(batchDir);
  const result = spawnSync(process.execPath, [
    'scripts/timetable/run-jra-local-review-job.mjs',
    `--execution=${executionPath}`,
    `--job=${jobPath}`,
    '--source-root=.',
    '--check-only',
  ], { cwd: root, encoding: 'utf8' });
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (result.status !== 0) fail(`JRA local check-only executor failed: ${result.stderr || result.stdout}`);
  else {
    const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
    const output = JSON.parse(lines.at(-1));
    if (output.outcome !== 'success'
      || output.records_discovered !== 24
      || output.records_updated !== 24
      || output.rank_counts?.['A+'] !== 24
      || output.check_only !== true) {
      fail(`JRA July check-only normalization differs: ${JSON.stringify(output)}`);
    }
  }
  if (!existedBefore && fs.existsSync(batchDir)) fail('JRA check-only executor must not write batch output directory.');
}

const executorText = readText('scripts/timetable/run-jra-local-review-job.mjs');
for (const phrase of [
  "git', ['worktree', 'add'",
  "git', ['worktree', 'remove'",
  "publication_effect: 'none'",
  'human review and Promotion Validation remain separate',
]) {
  if (!executorText.includes(phrase)) fail(`JRA local executor missing isolation marker ${phrase}.`);
}

const runnerText = readText('scripts/timetable/run-calendar-local-plan.mjs');
for (const phrase of [
  'for (const plannedJob of localPlan.jobs)',
  "'source_error'",
  'summarizeLocalCampaignV1',
  '-review-queue.json',
]) {
  if (!runnerText.includes(phrase)) fail(`local Plan runner missing ${phrase}.`);
}

const docs = readText('docs/calendar/local-multi-job-runner.md');
for (const phrase of [
  'one plan command',
  'temporary detached git worktree',
  'one bounded Job failure does not stop the next independent local Job',
  '24 A+ meetings',
  'full Runner Gate is complete',
]) {
  if (!docs.includes(phrase)) fail(`local multi-job contract missing ${phrase}.`);
}
const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const heading of [
  'Stage ACP-11 — local multi-job runner',
  'Stage ACP-12 — review cohort planner',
]) {
  if (!implementationPlan.includes(heading)) fail(`control-plane implementation plan missing ${heading}.`);
}
const acp11Section = implementationPlan.split('## Stage ACP-11 — local multi-job runner')[1]?.split('## Stage ACP-12 — review cohort planner')[0] ?? '';
const acp12Section = implementationPlan.split('## Stage ACP-12 — review cohort planner')[1]?.split('## Stage ACP-13 — automatic review PR preparation')[0] ?? '';
if (!acp11Section.includes('Status: complete.')) fail('control-plane implementation plan must mark ACP-11 complete.');
if (!acp12Section.includes('Status: complete.')) fail('control-plane implementation plan must mark ACP-12 complete.');

if (errors.length) {
  console.error(`CALENDAR_LOCAL_MULTI_JOB: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_LOCAL_MULTI_JOB: pass');
console.log(`PLANS_COMPILED: ${compiled.size}`);
console.log('DUAL_RUNNER_LOCAL_FILTER: pass');
console.log('TWO_WINDOW_JRA_ISOLATION: pass');
console.log('SUCCESS_SOURCE_ERROR_ISOLATION: pass');
console.log('SUCCESS_PARTIAL_REVIEW_QUEUE: pass');
console.log('MISSING_STATUS_TO_NOT_RUN: pass');
console.log('JRA_JULY_REVIEW_ONLY_NORMALIZATION: pass 24 meetings / 24 A+');
console.log('WORKTREE_WRITE_ISOLATION: pass');
