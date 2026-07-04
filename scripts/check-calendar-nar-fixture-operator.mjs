import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));

const matrix = json('data/static/nar-flat-racecourse-compatibility-v1.json');
const launcher = read('collect-nar-fixtures-manual');
const manual = read('scripts/timetable/manual-collect-nar-fixtures.mjs');
const collector = read('scripts/timetable/collect-nar-complete-fixtures-v2.mjs');
const fixtureCheck = read('scripts/check-calendar-nar-complete-fixture-set.mjs');
const runbook = read('docs/calendar/manual-nar-fixture-collection.md');
const scheduled = read('.github/workflows/timetable-scheduled-refresh.yml');

if (matrix.records?.length !== 14) fail('matrix must contain fourteen racecourses.');
for (const record of matrix.records ?? []) {
  if (record.official_race_list_date >= matrix.checked_at) {
    fail(`${record.racecourse_id} fixture source date must be completed before ${matrix.checked_at}.`);
  }
}

for (const marker of [
  '--filter=blob:none',
  '--no-checkout',
  'sparse-checkout init --no-cone',
  '!/docs/',
  'trap cleanup',
  'manual-collect-nar-fixtures.mjs',
]) {
  if (!launcher.includes(marker)) fail(`launcher missing ${marker}.`);
}

for (const marker of [
  'collect-nar-complete-fixtures-v2.mjs',
  "'--all'",
  'check-calendar-nar-complete-fixture-set.mjs',
  'check-calendar-runtime-import-boundary.mjs',
  "'install', '--package-lock=false', '--no-audit', '--no-fund'",
  "'run', 'build'",
  "'push', '--force-with-lease'",
  "'pr', 'create'",
  'automation/nar-complete-fixtures-14',
  'Expected 14 changed fixture files',
]) {
  if (!manual.includes(marker)) fail(`manual operator script missing ${marker}.`);
}

for (const marker of [
  'discoverRaceNumbers',
  'continuousFromOne',
  'parseListRows',
  'parseDetail',
  'safeRaceListFallback',
  'race_list_and_racecourse_matrix',
  "expected_race_numbers: expected",
  "promotion_eligible: false",
  "review: {",
  "storage_policy: 'public_safe_extracted_fields_only_no_raw_html'",
  "report.complete_meetings !== results.length",
]) {
  if (!collector.includes(marker)) fail(`strict collector missing ${marker}.`);
}
for (const forbidden of [
  'canonical/meetings.json',
  'canonical/meeting-details.json',
  'public/meeting-list.json',
  'public/meeting-details.json',
  'build-public-timetable-view.mjs',
  'promote-timetable',
]) {
  if (collector.includes(forbidden)) fail(`collector must not reference ${forbidden}.`);
}

for (const marker of [
  '--allow-empty',
  'expected 14 complete-meeting fixtures',
  'missing complete fixture for',
  'promotion_eligible',
  'detail_http_status',
  'course_metadata_source',
  'single-surface dirt racecourses',
  'unexpected key',
]) {
  if (!fixtureCheck.includes(marker)) fail(`fixture-set validator missing ${marker}.`);
}

for (const marker of [
  'sh ./collect-nar-fixtures-manual',
  'all fourteen flat-racing racecourses',
  'independently discovers the complete race-number set',
  'requires exactly fourteen complete fixtures',
  'candidate, canonical, or public data',
  'promotion_eligible: false',
]) {
  if (!runbook.includes(marker)) fail(`runbook missing ${marker}.`);
}

if (/^\s*schedule:/m.test(scheduled) || scheduled.includes('cron:')) fail('scheduled refresh must remain disabled.');

if (errors.length) {
  console.error(`CALENDAR_NAR_FIXTURE_OPERATOR: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_FIXTURE_OPERATOR: pass');
console.log('RACECOURSES: 14');
console.log('SOURCE_DATES_COMPLETED: true');
console.log('CANONICAL_WRITE: disabled');
console.log('PUBLIC_WRITE: disabled');
console.log('SCHEDULED_FETCH: disabled');
