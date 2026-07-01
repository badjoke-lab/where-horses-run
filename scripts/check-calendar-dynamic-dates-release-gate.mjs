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
  if (manifest.next_work_id !== 'WHR-CAL-OPS-V1') fail('next_work_id must be WHR-CAL-OPS-V1.');
  if (manifest.following_work_id !== 'WHR-CAL-JAPAN-JRA') fail('following_work_id must be WHR-CAL-JAPAN-JRA.');
  if (manifest.date_contract?.default_timezone !== 'UTC') fail('default timezone must be UTC.');
  if (manifest.date_contract?.window_days !== 30) fail('window_days must be 30.');
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
    if (manifest.boundaries?.[key] !== false) fail(`boundaries.${key} must be false.`);
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

for (const [file, text, markers] of [
  ['START-HERE.md', startHere, ['Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`', 'WHR-CAL-JAPAN-NAR', 'WHR-CAL-JAPAN-BANEI']],
  ['docs/project-roadmap.md', roadmap, ['Completed Work ID: `WHR-CAL-OPS-V1`', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']],
  ['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Dynamic Dates status: complete', 'Operations v1 status: complete', 'Current Work ID: `WHR-CAL-JAPAN-NAR`', 'Next Work ID: `WHR-CAL-JAPAN-BANEI`']]
]) {
  for (const marker of markers) if (!text.includes(marker)) fail(`${file} must include ${marker}.`);
}

if (errors.length) {
  console.error(`CALENDAR_DYNAMIC_DATES_RELEASE_GATE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DYNAMIC_DATES_RELEASE_GATE: pass');
console.log('COMPLETED_WORK_ID: WHR-CAL-DYNAMIC-DATES');
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI');
console.log('SCHEDULED_REFRESH_ACTIVE: false');
