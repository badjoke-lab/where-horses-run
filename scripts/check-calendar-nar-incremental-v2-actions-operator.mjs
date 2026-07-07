import fs from 'node:fs';
import path from 'node:path';
import { buildActionsCollectionPlan } from './timetable/nar-incremental-v2-actions-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

function expectPass(label, env, expected) {
  try {
    const plan = buildActionsCollectionPlan(env);
    if (JSON.stringify(plan.args) !== JSON.stringify(expected.args)) fail(`${label} args differ.`);
    if (plan.batchId !== expected.batchId || plan.mode !== expected.mode) fail(`${label} identity differs.`);
    const paths = Object.values(plan.artifactPaths);
    if (paths.length !== 4 || paths.some((item) => !item.includes(expected.batchId))) fail(`${label} artifact paths differ.`);
    if (paths.some((item) => item.includes('/canonical/') || item.includes('/public/'))) fail(`${label} artifact paths cross publication boundary.`);
  } catch (error) {
    fail(`${label} unexpectedly failed: ${error.message}`);
  }
}

function expectFail(label, env) {
  try {
    buildActionsCollectionPlan(env);
    fail(`${label} unexpectedly passed.`);
  } catch {
    // expected
  }
}

expectPass('date-window', {
  WHR_BATCH_ID: 'nar-august-window-001',
  WHR_MODE: 'date_window',
  WHR_START_DATE: '2026-08-01',
  WHR_END_DATE_EXCLUSIVE: '2026-09-01',
  WHR_MEETING_IDS: '',
  WHR_CHECKED_AT: '2026-07-08T00:00:00Z',
}, {
  batchId: 'nar-august-window-001',
  mode: 'date_window',
  args: [
    '--batch-id=nar-august-window-001',
    '--start-date=2026-08-01',
    '--end-date-exclusive=2026-09-01',
    '--checked-at=2026-07-08T00:00:00Z',
  ],
});

expectPass('selected-meetings', {
  WHR_BATCH_ID: 'nar-selected-retry-001',
  WHR_MODE: 'selected_meetings',
  WHR_START_DATE: '',
  WHR_END_DATE_EXCLUSIVE: '',
  WHR_MEETING_IDS: 'nar-oi-racecourse-2026-08-22, nar-monbetsu-racecourse-2026-08-21\nnar-oi-racecourse-2026-08-22',
  WHR_CHECKED_AT: '',
}, {
  batchId: 'nar-selected-retry-001',
  mode: 'selected_meetings',
  args: [
    '--batch-id=nar-selected-retry-001',
    '--meeting-ids=nar-monbetsu-racecourse-2026-08-21,nar-oi-racecourse-2026-08-22',
  ],
});

expectFail('invalid-batch-id', {
  WHR_BATCH_ID: 'Bad Batch',
  WHR_MODE: 'date_window',
  WHR_START_DATE: '2026-08-01',
  WHR_END_DATE_EXCLUSIVE: '2026-09-01',
});
expectFail('unknown-mode', {
  WHR_BATCH_ID: 'valid-batch-001',
  WHR_MODE: 'monthly',
});
expectFail('date-window-missing-end', {
  WHR_BATCH_ID: 'valid-batch-002',
  WHR_MODE: 'date_window',
  WHR_START_DATE: '2026-08-01',
});
expectFail('date-window-mixed-with-meetings', {
  WHR_BATCH_ID: 'valid-batch-003',
  WHR_MODE: 'date_window',
  WHR_START_DATE: '2026-08-01',
  WHR_END_DATE_EXCLUSIVE: '2026-09-01',
  WHR_MEETING_IDS: 'nar-oi-racecourse-2026-08-22',
});
expectFail('selected-missing-meetings', {
  WHR_BATCH_ID: 'valid-batch-004',
  WHR_MODE: 'selected_meetings',
});
expectFail('selected-mixed-with-dates', {
  WHR_BATCH_ID: 'valid-batch-005',
  WHR_MODE: 'selected_meetings',
  WHR_START_DATE: '2026-08-01',
  WHR_MEETING_IDS: 'nar-oi-racecourse-2026-08-22',
});
expectFail('invalid-checked-at', {
  WHR_BATCH_ID: 'valid-batch-006',
  WHR_MODE: 'date_window',
  WHR_START_DATE: '2026-08-01',
  WHR_END_DATE_EXCLUSIVE: '2026-09-01',
  WHR_CHECKED_AT: 'not-a-time',
});

const workflowPath = '.github/workflows/calendar-nar-incremental-v2-operator.yml';
const workflow = fs.existsSync(path.join(root, workflowPath))
  ? fs.readFileSync(path.join(root, workflowPath), 'utf8')
  : '';

for (const marker of [
  'workflow_dispatch:',
  'batch_id:',
  'date_window',
  'selected_meetings',
  'contents: read',
  'WHR_BATCH_ID:',
  'run-nar-incremental-v2-actions.mjs',
  'check-calendar-nar-incremental-v2.mjs',
  'check-calendar-coverage-observation-schema.mjs',
  'check-calendar-validation-responsibilities.mjs',
  'check-project-governance-docs.mjs',
  'check-calendar-runtime-import-boundary.mjs',
  'actions/upload-artifact@v4',
]) {
  if (!workflow.includes(marker)) fail(`operator workflow missing ${marker}.`);
}

for (const forbidden of [
  'contents: write',
  'pull-requests: write',
  'git push',
  'promote-approved-candidate-v1.mjs',
  'build-public-timetable-view.mjs',
  'wrangler',
  'cloudflare',
  'cron:',
  'schedule:',
]) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`operator workflow contains forbidden marker ${forbidden}.`);
}

const launcher = fs.readFileSync(path.join(root, 'scripts/timetable/run-nar-incremental-v2-actions.mjs'), 'utf8');
for (const marker of ['buildActionsCollectionPlan', 'collect-nar-incremental-v2.mjs', 'spawnSync']) {
  if (!launcher.includes(marker)) fail(`Actions launcher missing ${marker}.`);
}
for (const forbidden of ['canonical/', 'public/', 'promote-approved', 'writeFileSync']) {
  if (launcher.includes(forbidden)) fail(`Actions launcher crosses boundary with ${forbidden}.`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_INCREMENTAL_V2_ACTIONS_OPERATOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_INCREMENTAL_V2_ACTIONS_OPERATOR: pass');
console.log('DATE_WINDOW_INPUT_PLAN: pass');
console.log('SELECTED_MEETING_INPUT_PLAN: pass');
console.log('RUNNER: github_actions');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
console.log('UNATTENDED_PUBLICATION: disabled');
