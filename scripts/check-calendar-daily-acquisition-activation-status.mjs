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
  '--plan-id=due-job-plan-2026-07-19',
  '--review-branch=automation/calendar-daily-acquisition-review',
];
const run = spawnSync(process.execPath, [
  ...baseArgs,
  '--generated-at=2026-07-19T15:30:00Z',
  `--output=${output}`,
], { cwd: root, encoding: 'utf8' });
if (run.status !== 0) fail(`activation status writer failed: ${run.stderr || run.stdout}`);
else {
  const status = JSON.parse(fs.readFileSync(output, 'utf8'));
  if (status.schema_version !== 'calendar-daily-acquisition-activation-status-v1') fail('written activation status schema differs');
  if (status.plan_result !== 'success' || status.execute_result !== 'failure') fail('written activation job results differ');
  if (status.hosted_jobs !== 2 || status.plan_id !== 'due-job-plan-2026-07-19') fail('written activation plan identity differs');
  if (status.review_branch !== 'automation/calendar-daily-acquisition-review') fail('written activation review branch differs');
  if (status.publication_freshness?.public_horizon_end_date !== '2026-08-17') fail('July fixture public horizon differs');
  if (status.publication_freshness?.required_horizon_end_date !== '2026-08-17') fail('July fixture required horizon differs');
  if (status.publication_freshness?.publication_review_required !== false) fail('July fixture should be horizon-complete');
  if (Object.values(status.publication_boundary).some((value) => value !== false)) fail('written activation status enables a publication side effect');
}

const staleOutput = path.join(tempDir, 'stale.json');
const staleRun = spawnSync(process.execPath, [
  ...baseArgs,
  '--generated-at=2026-08-08T13:45:00Z',
  '--run-id=29690000002',
  `--output=${staleOutput}`,
], { cwd: root, encoding: 'utf8' });
if (staleRun.status !== 0) fail(`stale-horizon activation writer failed: ${staleRun.stderr || staleRun.stdout}`);
else {
  const status = JSON.parse(fs.readFileSync(staleOutput, 'utf8'));
  if (status.publication_freshness?.public_horizon_end_date !== '2026-08-17') fail('August stale fixture public horizon differs');
  if (status.publication_freshness?.required_horizon_end_date !== '2026-09-06') fail('August required rolling horizon differs');
  if (status.publication_freshness?.publication_review_required !== true) fail('August stale fixture must require publication review');
}

const noPlanOutput = path.join(tempDir, 'no-plan.json');
const noPlanRun = spawnSync(process.execPath, [
  'scripts/timetable/write-calendar-daily-acquisition-status.mjs',
  '--generated-at=2026-07-19T15:31:00Z',
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
  `--output=${noPlanOutput}`,
], { cwd: root, encoding: 'utf8' });
if (noPlanRun.status !== 0) fail(`activation status failure writer failed: ${noPlanRun.stderr || noPlanRun.stdout}`);
else {
  const status = JSON.parse(fs.readFileSync(noPlanOutput, 'utf8'));
  if (status.hosted_jobs !== null || status.plan_id !== null) fail('failed planning status must preserve null plan outputs');
}

const badRun = spawnSync(process.execPath, [
  ...baseArgs.filter((entry) => !entry.startsWith('--execute-result=')),
  '--generated-at=2026-07-19T15:30:00Z',
  '--execute-result=unknown',
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
console.log('PUBLICATION_FRESHNESS_SIGNAL: verified');
console.log('REVIEW_ARTIFACT_DELIVERY: verified');
console.log('PR_CREATION_PERMISSION: not required');
console.log('PUBLICATION_SIDE_EFFECTS: disabled');
