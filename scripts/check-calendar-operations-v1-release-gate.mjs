import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => {
  try { return JSON.parse(read(file)); }
  catch (error) { fail(`${file} must parse: ${error.message}`); return null; }
};

const manifest = parse('data/audits/calendar-operations-v1-release-gate.json');
const control = parse('data/static/calendar-operations-control.json');
const seasonal = parse('data/static/calendar-operations-seasonal-policy.json');
const status = parse('data/generated/timetable/operations-status.json');
const reviewPackage = parse('data/generated/timetable/operations-review-package.json');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
const manualWorkflow = read('.github/workflows/calendar-operations-review.yml');
const startHere = read('START-HERE.md');
const roadmap = read('docs/project-roadmap.md');
const implementationRoadmap = read('docs/calendar/implementation-roadmap.md');

if (manifest) {
  if (manifest.schema_version !== 'calendar-operations-v1-release-gate-v1') fail('unexpected Operations v1 release schema.');
  if (manifest.work_id !== 'WHR-CAL-OPS-V1' || manifest.status !== 'complete') fail('Operations v1 manifest must be complete.');
  if (manifest.next_work_id !== 'WHR-CAL-JAPAN-JRA') fail('historical next Work ID must be JRA.');
  if (manifest.following_work_id !== 'WHR-CAL-JAPAN-NAR') fail('historical following Work ID must be NAR.');
  if (!Array.isArray(manifest.completed_layers) || manifest.completed_layers.length !== 7) fail('seven completed Operations layers are required.');
  for (const file of [...(manifest.canonical_files ?? []), ...(manifest.runbooks ?? []), ...(manifest.required_validators ?? [])]) {
    if (!existsSync(path.join(root, file))) fail(`missing Operations v1 file: ${file}`);
  }
  for (const key of ['scheduled_refresh_active','live_fetch_allowed','automatic_candidate_approval_allowed','automatic_canonical_write_allowed','automatic_public_write_allowed','pull_request_created_by_review_package','unattended_publication_allowed']) {
    if (manifest.boundaries?.[key] !== false) fail(`manifest boundary ${key} must be false.`);
  }
  if (!Array.isArray(manifest.pilot_entry_requirements) || manifest.pilot_entry_requirements.length < 7) fail('pilot entry requirements are incomplete.');
  if (!Array.isArray(manifest.not_completed_by_operations_v1) || manifest.not_completed_by_operations_v1.length < 7) fail('pilot work exclusion list is incomplete.');

  for (const validator of manifest.required_validators ?? []) {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8', maxBuffer: 25 * 1024 * 1024 });
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (result.status !== 0) fail(`required validator failed: ${validator}`);
  }
}

if (control?.schema_version !== 'calendar-operations-control-v1' || control.mode !== 'paused_review_only') fail('Operations control mode is invalid.');
for (const key of ['scheduled_refresh_active','live_fetch_allowed','automatic_candidate_approval_allowed','automatic_canonical_write_allowed','automatic_public_write_allowed','unattended_publication_allowed']) {
  if (control?.[key] !== false) fail(`control.${key} must be false.`);
}
if (!Array.isArray(control?.activation_prerequisites) || control.activation_prerequisites.length < 5) fail('control activation prerequisites are incomplete.');

if (seasonal?.schema_version !== 'calendar-operations-seasonal-policy-v1' || seasonal.mode !== 'review_only') fail('seasonal policy schema or mode is invalid.');
if (seasonal?.seasonal_review?.maximum_age_days !== 190) fail('seasonal maximum age must be 190 days.');
if (seasonal?.seasonal_review?.preseason_review_lead_days !== 45) fail('preseason lead must be 45 days.');
if (seasonal?.seasonal_review?.automatic_approval_allowed !== false || seasonal?.seasonal_review?.automatic_publication_allowed !== false) fail('seasonal policy must not auto-approve or publish.');
if (!Array.isArray(seasonal?.rollover_states) || seasonal.rollover_states.length !== 4) fail('four rollover states are required.');
if (!Array.isArray(seasonal?.source_breakage_levels) || seasonal.source_breakage_levels.length !== 3) fail('three source-breakage levels are required.');
if (!Array.isArray(seasonal?.forbidden_recovery_methods) || seasonal.forbidden_recovery_methods.length < 6) fail('forbidden recovery methods are incomplete.');

if (status?.mode !== 'review_only_no_network') fail('status mode changed.');
if (reviewPackage?.mode !== 'paused_review_only') fail('review package mode changed.');
if (reviewPackage?.proposed_review?.changed_files?.length !== 0 || reviewPackage?.proposed_review?.public_release_expected !== false) fail('review package must not propose changes or release.');

if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain paused.');
if (!manualWorkflow.includes('contents: read')) fail('manual workflow must remain read-only.');
for (const forbidden of ['contents: write', 'pull-requests: write', 'create-pull-request']) {
  if (manualWorkflow.includes(forbidden)) fail(`manual workflow contains forbidden marker ${forbidden}.`);
}

for (const [file, text, markers] of [
  ['START-HERE.md', startHere, ['WHR-CAL-JAPAN-A-PLUS-RECONCILE', 'WHR-CAL-JAPAN-JRA-A-PLUS', 'docs/calendar/japan-a-plus-reconciliation-plan.md']],
  ['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`', 'Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`']],
  ['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`', 'Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`']]
]) {
  for (const marker of markers) if (!text.includes(marker)) fail(`${file} must include ${marker}.`);
}

if (errors.length) {
  console.error(`CALENDAR_OPERATIONS_V1_RELEASE_GATE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_OPERATIONS_V1_RELEASE_GATE: pass');
console.log('COMPLETED_WORK_ID: WHR-CAL-OPS-V1');
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-A-PLUS-RECONCILE');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-JRA-A-PLUS');
console.log('SCHEDULED_REFRESH_ACTIVE: false');
console.log('UNATTENDED_PUBLICATION_ALLOWED: false');
