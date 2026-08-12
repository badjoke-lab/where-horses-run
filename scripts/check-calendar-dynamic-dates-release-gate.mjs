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

const manifest = parse('data/audits/calendar-dynamic-dates-release-gate.json');
const publicList = parse('data/generated/timetable/public/meeting-list.json');
const publicDetails = parse('data/generated/timetable/public/meeting-details.json');
const scheduledWorkflow = read('.github/workflows/timetable-scheduled-refresh.yml');
const startHere = read('START-HERE.md');
const roadmap = read('docs/project-roadmap.md');
const implementationRoadmap = read('docs/calendar/implementation-roadmap.md');

if (manifest) {
  if (manifest.schema_version !== 'calendar-dynamic-dates-release-gate-v1') fail('unexpected Dynamic Dates release schema.');
  if (manifest.work_id !== 'WHR-CAL-DYNAMIC-DATES' || manifest.status !== 'complete') fail('Dynamic Dates manifest must be complete.');
  if (manifest.next_work_id !== 'WHR-CAL-OPS-V1') fail('next_work_id must remain the historical WHR-CAL-OPS-V1 handoff.');
  if (manifest.following_work_id !== 'WHR-CAL-JAPAN-JRA') fail('following_work_id must remain the historical WHR-CAL-JAPAN-JRA handoff.');
  if (manifest.date_contract?.default_timezone !== 'Asia/Tokyo') fail('default timezone must be Asia/Tokyo.');
  if (manifest.date_contract?.window_days !== 30) fail('window_days must be 30.');
  if (manifest.date_contract?.projection_freshness_grace_days !== 1) fail('projection freshness grace must be one calendar day.');
  if (manifest.date_contract?.fixed_historical_fallback !== false) fail('fixed historical fallback must remain disabled.');
  if (manifest.date_contract?.window_start_inclusive !== true || manifest.date_contract?.window_end_exclusive !== true) {
    fail('window boundary semantics are incorrect.');
  }
  const expectedSources = ['WHR_CALENDAR_REFERENCE_DATE', 'SOURCE_DATE_EPOCH', 'build_clock'];
  if (JSON.stringify(manifest.date_contract?.reference_precedence) !== JSON.stringify(expectedSources)) {
    fail('reference-date precedence is incorrect.');
  }
  const expectedStates = [
    'current_window_available',
    'no_public_records',
    'records_before_window',
    'records_after_window',
    'stale_generation_with_window_records'
  ];
  if (JSON.stringify(manifest.data_states) !== JSON.stringify(expectedStates)) fail('Dynamic Dates data-state list is incorrect.');
  for (const key of ['canonical_data_changed','public_projection_changed','publication_rank_changed','scheduled_refresh_active','unattended_publication_active']) {
    if (manifest.boundaries?.[key] !== false) fail(`historical boundaries.${key} must remain false.`);
  }
  for (const key of ['one_meeting_per_list_row','meeting_details_outside_window_retained']) {
    if (manifest.boundaries?.[key] !== true) fail(`boundaries.${key} must be true.`);
  }
  if (!Array.isArray(manifest.rendered_fixtures) || manifest.rendered_fixtures.length !== 2) fail('two rendered fixtures are required.');
  if (!Array.isArray(manifest.not_completed_by_dynamic_dates) || manifest.not_completed_by_dynamic_dates.length < 8) {
    fail('remaining operations and pilot work must be explicit.');
  }

  for (const validator of manifest.required_validators ?? []) {
    if (!existsSync(path.join(root, validator))) {
      fail(`missing required validator: ${validator}`);
      continue;
    }
    const result = spawnSync(process.execPath, [validator], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    });
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (result.status !== 0) fail(`required validator failed: ${validator}`);
  }
}

if (publicList?.schema_version !== 'public-timetable-meeting-list-v0') fail('public meeting-list schema changed.');
if (publicDetails?.schema_version !== 'public-timetable-meeting-details-v0') fail('public meeting-details schema changed.');
if (publicList?.generated_at !== publicDetails?.generated_at) fail('public projection timestamps differ.');

if (/^\s*schedule:/m.test(scheduledWorkflow) || scheduledWorkflow.includes('cron:')) fail('scheduled refresh must remain paused.');
if (!scheduledWorkflow.includes('workflow_dispatch:') || !scheduledWorkflow.includes('default: "false"')) {
  fail('manual refresh review must default live_fetch to false.');
}

// Dynamic Dates is a completed foundation. Later reviewed maintenance is expected to
// advance the repository's current Work ID, so closure must validate durable completion
// markers instead of requiring the whole repository to remain frozen at a historical
// "Current Work ID" value.
for (const [file, text, markers] of [
  ['START-HERE.md', startHere, [
    'docs/calendar/incremental-coverage-contract.md',
    'docs/calendar/dynamic-dates-release-gate.md',
    'docs/calendar/operations-v1-release-gate.md',
    'docs/calendar/public-v1-release-decision.md',
    'unattended publication remains disabled'
  ]],
  ['docs/project-roadmap.md', roadmap, [
    'Completed Calendar foundations:',
    '`WHR-CAL-DYNAMIC-DATES`',
    '`WHR-CAL-OPS-V1`',
    'Completed Work ID: `WHR-CAL-PUBLIC-V1`',
    'Incremental maintenance is normal.',
    'unattended publication remains disabled'
  ]],
  ['docs/calendar/implementation-roadmap.md', implementationRoadmap, [
    'Dynamic Dates status: complete',
    'Operations v1 status: complete',
    'Completed Work ID: `WHR-CAL-PUBLIC-V1`',
    'Coverage Observation',
    'Scheduled and unattended publication remain disabled'
  ]]
]) {
  for (const marker of markers) if (!text.includes(marker)) fail(`${file} must include durable completion marker: ${marker}.`);
}

if (errors.length) {
  console.error(`CALENDAR_DYNAMIC_DATES_RELEASE_GATE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DYNAMIC_DATES_RELEASE_GATE: pass');
console.log('COMPLETED_WORK_ID: WHR-CAL-DYNAMIC-DATES');
console.log('DEFAULT_TIMEZONE: Asia/Tokyo');
console.log('PROJECTION_FRESHNESS_GRACE_DAYS: 1');
console.log('HISTORICAL_NEXT_WORK_ID: WHR-CAL-OPS-V1');
console.log('CURRENT_REPOSITORY_WORK_ID: allowed_to_advance');
console.log('SCHEDULED_REFRESH_ACTIVE: false');
