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

const schema = readJson('data/static/calendar-daily-acquisition-activation-status.schema.json');
if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('activation status schema draft differs');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-daily-acquisition-activation-status.schema.json') fail('activation status schema ID differs');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('activation status schema must be a closed object');
if (schema.properties?.schema_version?.const !== 'calendar-daily-acquisition-activation-status-v1') fail('activation status schema version differs');
if (!exact(schema.properties?.review_branch, { const: 'automation/calendar-daily-acquisition-review' })) fail('activation status stable review branch differs');
if (!schema.required?.includes('publication_freshness')) fail('activation status must require publication_freshness');
for (const key of ['public_horizon_end_date', 'required_horizon_end_date', 'publication_review_required']) {
  if (!schema.properties?.publication_freshness?.required?.includes(key)) fail(`publication freshness missing required key ${key}`);
}
for (const key of ['automatic_approval', 'canonical_written', 'public_projection_written', 'automatic_merge', 'deployment_performed']) {
  if (schema.properties?.publication_boundary?.properties?.[key]?.const !== false) fail(`activation status ${key} must be false`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-daily-activation-status-'));
const completeFixture = path.join(tempDir, 'complete-meetings.json');
const staleFixture = path.join(tempDir, 'stale-meetings.json');
const coveredPlannerFixture = path.join(tempDir, 'covered-planner.json');
const gapPlannerFixture = path.join(tempDir, 'gap-planner.json');
const unknownPlannerFixture = path.join(tempDir, 'unknown-planner.json');
fs.writeFileSync(completeFixture, `${JSON.stringify({ meetings: [{ date: '2026-09-06' }] }, null, 2)}\n`);
fs.writeFileSync(staleFixture, `${JSON.stringify({ meetings: [{ date: '2026-08-17' }] }, null, 2)}\n`);
fs.writeFileSync(coveredPlannerFixture, `${JSON.stringify({
  schema_version: 'calendar-due-job-planner-state-v1',
  as_of: '2026-08-08T13:44:00Z',
  system_states: [
    { system_id: 'fixture-active', season_state: 'active', coverage_gaps: [] },
    { system_id: 'fixture-offseason', season_state: 'offseason', coverage_gaps: [] },
  ],
}, null, 2)}\n`);
fs.writeFileSync(gapPlannerFixture, `${JSON.stringify({
  schema_version: 'calendar-due-job-planner-state-v1',
  as_of: '2026-08-08T13:44:00Z',
  system_states: [
    {
      system_id: 'fixture-active',
      season_state: 'active',
      coverage_gaps: [{ start_date: '2026-08-18', end_date_exclusive: '2026-09-07', timezone: 'UTC' }],
    },
  ],
}, null, 2)}\n`);
fs.writeFileSync(unknownPlannerFixture, `${JSON.stringify({
  schema_version: 'calendar-due-job-planner-state-v1',
  as_of: '2026-08-08T13:44:00Z',
  system_states: [{ system_id: 'fixture-unknown', season_state: 'unknown', coverage_gaps: [] }],
}, null, 2)}\n`);

const output = path.join(tempDir, 'status.json');
const baseArgs = [
  'scripts/timetable/write-calendar-daily-acquisition-status.mjs',
  '--run-id=29690000000',
  '--run-attempt=1',
  '--event-name=push',
  '--source-sha=0123456789abcdef0123456789abcdef01234567',
  '--source-ref=refs/heads/main',
  '--plan-result=success',
  '--execute-result=failure',
  '--hosted-jobs=2',
  '--plan-id=due-job-plan-2026-08-08',
  '--review-branch=automation/calendar-daily-acquisition-review',
];

function runWriter(extraArgs, filePath) {
  return spawnSync(process.execPath, [...baseArgs, ...extraArgs, `--output=${filePath}`], { cwd: root, encoding: 'utf8' });
}

const run = runWriter([
  '--generated-at=2026-08-08T13:45:00Z',
  `--meeting-list=${completeFixture}`,
], output);
if (run.status !== 0) fail(`activation status writer failed: ${run.stderr || run.stdout}`);
else {
  const status = JSON.parse(fs.readFileSync(output, 'utf8'));
  if (status.schema_version !== 'calendar-daily-acquisition-activation-status-v1') fail('written activation status schema differs');
  if (status.plan_result !== 'success' || status.execute_result !== 'failure') fail('written activation job results differ');
  if (status.hosted_jobs !== 2 || status.plan_id !== 'due-job-plan-2026-08-08') fail('written activation plan identity differs');
  if (status.review_branch !== 'automation/calendar-daily-acquisition-review') fail('written activation review branch differs');
  if (status.publication_freshness?.public_horizon_end_date !== '2026-09-06') fail('complete fixture public horizon differs');
  if (status.publication_freshness?.required_horizon_end_date !== '2026-09-06') fail('complete fixture required horizon differs');
  if (status.publication_freshness?.publication_review_required !== false) fail('complete fixture should not require publication review');
  if (Object.values(status.publication_boundary).some((value) => value !== false)) fail('written activation status enables a publication side effect');
}

const staleOutput = path.join(tempDir, 'stale.json');
const staleRun = runWriter([
  '--generated-at=2026-08-08T13:45:00Z',
  '--run-id=29690000002',
  `--meeting-list=${staleFixture}`,
], staleOutput);
if (staleRun.status !== 0) fail(`stale-horizon activation writer failed: ${staleRun.stderr || staleRun.stdout}`);
else {
  const status = JSON.parse(fs.readFileSync(staleOutput, 'utf8'));
  if (status.publication_freshness?.public_horizon_end_date !== '2026-08-17') fail('stale fixture public horizon differs');
  if (status.publication_freshness?.required_horizon_end_date !== '2026-09-06') fail('stale fixture required rolling horizon differs');
  if (status.publication_freshness?.publication_review_required !== true) fail('stale fixture without planner coverage must require publication review');
}

const coveredOutput = path.join(tempDir, 'covered.json');
const coveredRun = runWriter([
  '--generated-at=2026-08-08T13:45:00Z',
  '--run-id=29690000003',
  `--meeting-list=${staleFixture}`,
  `--planner-state=${coveredPlannerFixture}`,
], coveredOutput);
if (coveredRun.status !== 0) fail(`covered-planner activation writer failed: ${coveredRun.stderr || coveredRun.stdout}`);
else {
  const status = JSON.parse(fs.readFileSync(coveredOutput, 'utf8'));
  if (status.publication_freshness?.public_horizon_end_date !== '2026-08-17') fail('covered planner must preserve raw public horizon');
  if (status.publication_freshness?.required_horizon_end_date !== '2026-09-06') fail('covered planner required horizon differs');
  if (status.publication_freshness?.publication_review_required !== false) {
    fail('reviewed complete planner coverage must suppress raw-horizon publication false positive');
  }
}

const gapOutput = path.join(tempDir, 'gap.json');
const gapRun = runWriter([
  '--generated-at=2026-08-08T13:45:00Z',
  '--run-id=29690000004',
  `--meeting-list=${completeFixture}`,
  `--planner-state=${gapPlannerFixture}`,
], gapOutput);
if (gapRun.status !== 0) fail(`gap-planner activation writer failed: ${gapRun.stderr || gapRun.stdout}`);
else if (JSON.parse(fs.readFileSync(gapOutput, 'utf8')).publication_freshness?.publication_review_required !== true) {
  fail('planner coverage gap must require publication review even when raw public horizon looks complete');
}

const unknownOutput = path.join(tempDir, 'unknown.json');
const unknownRun = runWriter([
  '--generated-at=2026-08-08T13:45:00Z',
  '--run-id=29690000005',
  `--meeting-list=${completeFixture}`,
  `--planner-state=${unknownPlannerFixture}`,
], unknownOutput);
if (unknownRun.status !== 0) fail(`unknown-season activation writer failed: ${unknownRun.stderr || unknownRun.stdout}`);
else if (JSON.parse(fs.readFileSync(unknownOutput, 'utf8')).publication_freshness?.publication_review_required !== true) {
  fail('unknown planner season must require publication review');
}

const currentPlanner = path.join(tempDir, 'current-planner.json');
const currentPlannerRun = spawnSync(process.execPath, [
  'scripts/timetable/build-calendar-live-planner-state.mjs',
  '--as-of=2026-08-24T04:06:08Z',
  '--window-days=30',
  `--output=${currentPlanner}`,
], { cwd: root, encoding: 'utf8' });
if (currentPlannerRun.status !== 0) fail(`current reviewed coverage planner build failed: ${currentPlannerRun.stderr || currentPlannerRun.stdout}`);
else {
  const planner = JSON.parse(fs.readFileSync(currentPlanner, 'utf8'));
  const reviewSignals = planner.system_states.filter((system) => system.season_state === 'unknown' || system.coverage_gaps.length > 0);
  if (reviewSignals.length !== 0) fail(`current reviewed 30-day planner should have zero coverage review signals: ${JSON.stringify(reviewSignals)}`);
  const hkjc = planner.system_states.find((system) => system.system_id === 'hong-kong-hkjc-system');
  if (hkjc?.source_visible_horizon_end_exclusive !== '2026-09-23') fail('current HKJC reviewed source horizon must extend through September 22');

  const currentOutput = path.join(tempDir, 'current.json');
  const currentRun = runWriter([
    '--generated-at=2026-08-24T04:08:13Z',
    '--run-id=32688744520',
    '--execute-result=success',
    '--hosted-jobs=1',
    '--plan-id=due-job-plan-2026-08-24',
    `--planner-state=${currentPlanner}`,
  ], currentOutput);
  if (currentRun.status !== 0) fail(`current coverage-aware activation writer failed: ${currentRun.stderr || currentRun.stdout}`);
  else {
    const status = JSON.parse(fs.readFileSync(currentOutput, 'utf8'));
    if (status.publication_freshness?.required_horizon_end_date !== '2026-09-22') fail('current coverage-aware required horizon differs');
    if (status.publication_freshness?.publication_review_required !== false) fail('current reviewed 30-day coverage must not require publication review');
  }
}

const noPlanOutput = path.join(tempDir, 'no-plan.json');
const noPlanRun = spawnSync(process.execPath, [
  'scripts/timetable/write-calendar-daily-acquisition-status.mjs',
  '--generated-at=2026-08-08T13:46:00Z',
  '--run-id=29690000001',
  '--run-attempt=1',
  '--event-name=schedule',
  '--source-sha=0123456789abcdef0123456789abcdef01234567',
  '--source-ref=refs/heads/main',
  '--plan-result=failure',
  '--execute-result=skipped',
  '--hosted-jobs=',
  '--plan-id=',
  '--review-branch=automation/calendar-daily-acquisition-review',
  `--meeting-list=${completeFixture}`,
  `--output=${noPlanOutput}`,
], { cwd: root, encoding: 'utf8' });
if (noPlanRun.status !== 0) fail(`activation status failure writer failed: ${noPlanRun.stderr || noPlanRun.stdout}`);
else {
  const status = JSON.parse(fs.readFileSync(noPlanOutput, 'utf8'));
  if (status.hosted_jobs !== null || status.plan_id !== null) fail('failed planning status must preserve null plan outputs');
}

const badRun = spawnSync(process.execPath, [
  ...baseArgs.filter((entry) => !entry.startsWith('--execute-result=')),
  '--generated-at=2026-08-08T13:45:00Z',
  '--execute-result=unknown',
  `--meeting-list=${completeFixture}`,
  `--output=${path.join(tempDir, 'invalid.json')}`,
], { cwd: root, encoding: 'utf8' });
if (badRun.status === 0) fail('unsupported activation Job result was accepted');
fs.rmSync(tempDir, { recursive: true, force: true });

const deliveryRun = spawnSync(process.execPath, ['scripts/check-calendar-daily-review-artifact-delivery.mjs'], { cwd: root, encoding: 'utf8' });
if (deliveryRun.status !== 0) fail(`daily review artifact delivery failed: ${deliveryRun.stderr || deliveryRun.stdout}`);

const workflow = readText('.github/workflows/calendar-daily-acquisition.yml');
for (const phrase of [
  'data/generated/timetable/daily-acquisition-status/latest.json',
  'data/generated/timetable/daily-acquisition-status/runs/${GITHUB_RUN_ID}.json',
  'automation/calendar-daily-acquisition-review',
  'write-calendar-daily-acquisition-status.mjs',
  'path: /tmp/calendar-daily-plan',
  '.calendar-live-state.json',
  'git push origin "HEAD:${REVIEW_BRANCH}"',
  'if: always()',
]) {
  if (!workflow.includes(phrase)) fail(`daily workflow missing activation evidence phrase ${phrase}`);
}
if (/peter-evans\/create-pull-request/.test(workflow)) fail('daily workflow must not depend on automatic PR creation');
if (/pull-requests:\s*write/.test(workflow)) fail('daily workflow must not require pull-request write permission');
if (!/review-pr:[\s\S]*permissions:\n\s+contents: write/.test(workflow)) fail('review branch update job must have contents write permission');
for (const forbidden of ['promote-timetable', 'build-public-timetable-view', 'wrangler pages deploy', 'gh pr merge']) {
  if (workflow.includes(forbidden)) fail(`daily workflow contains forbidden command ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_DAILY_ACQUISITION_ACTIVATION_STATUS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DAILY_ACQUISITION_ACTIVATION_STATUS: pass');
console.log('STABLE_REVIEW_BRANCH: automation/calendar-daily-acquisition-review');
console.log('PLAN_FAILURE_STATUS: retained');
console.log('EXECUTION_FAILURE_STATUS: retained');
console.log('PUBLICATION_FRESHNESS_SIGNAL: raw public horizon retained; review requirement uses planner coverage when available');
console.log('CURRENT_REVIEWED_30_DAY_COVERAGE: no review required');
console.log('REVIEW_ARTIFACT_DELIVERY: verified');
console.log('PR_CREATION_PERMISSION: not required');
console.log('PUBLICATION_SIDE_EFFECTS: disabled');
