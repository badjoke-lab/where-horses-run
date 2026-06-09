import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-120-current-timetable-ui] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const page = read('src/pages/major-countries/current-timetable.astro');
const component = read('src/components/TimetableMeetingList.astro');
const rowAdapter = read('src/data/timetableMeetingRows.ts');
const publicViewModel = read('src/lib/timetable/publicTimetableViewModel.ts');
const publicList = readJson('data/generated/timetable/public/meeting-list.json');

if (!page.includes('TimetableMeetingList')) fail('Page must render TimetableMeetingList.');
if (!page.includes('getGroupedTimetableMeetingRows')) fail('Page must read grouped rows through timetableMeetingRows.');
if (!page.includes('Current timetable')) fail('Page current timetable heading is missing.');
if (page.includes('current-integrated.json')) fail('Page must not directly import legacy current-integrated.json.');

if (!rowAdapter.includes('getPublicTimetableMeetingRows')) {
  fail('timetableMeetingRows must read through getPublicTimetableMeetingRows.');
}
if (!rowAdapter.includes('getGroupedTimetableMeetingRows')) {
  fail('timetableMeetingRows must expose grouped timetable rows.');
}
if (!publicViewModel.includes('data/generated/timetable/public/meeting-list.json')) {
  fail('Public timetable view model must import public meeting-list.json.');
}
if (!publicViewModel.includes('data/generated/timetable/public/meeting-details.json')) {
  fail('Public timetable view model must import public meeting-details.json.');
}

for (const field of [
  'country_label',
  'racecourse_name',
  'capability_rank',
  'first_race_time_local',
  'last_race_time_local',
  'official_source_url',
  'detail_path',
  'source_status',
  'last_checked_date',
]) {
  if (!component.includes(field)) fail(`TimetableMeetingList must reference ${field}.`);
}

if (publicList.schema_version !== 'public-timetable-meeting-list-v0') {
  fail('Unexpected public meeting-list schema.');
}
if (!Array.isArray(publicList.meetings) || publicList.meetings.length < 9) {
  fail('Expected at least nine public timetable meeting rows.');
}

for (const meeting of publicList.meetings) {
  if (!meeting.meeting_id) fail('Public meeting row missing meeting_id.');
  if (!meeting.country_id) fail(`${meeting.meeting_id}: country_id missing.`);
  if (!meeting.authority_id) fail(`${meeting.meeting_id}: authority_id missing.`);
  if (!meeting.racecourse_id) fail(`${meeting.meeting_id}: racecourse_id missing.`);
  if (!meeting.date) fail(`${meeting.meeting_id}: date missing.`);
  if (!meeting.effective_public_rank) fail(`${meeting.meeting_id}: effective_public_rank missing.`);
  if (!meeting.official_source_url) fail(`${meeting.meeting_id}: official_source_url missing.`);
  if (!meeting.source_status) fail(`${meeting.meeting_id}: source_status missing.`);
  if (!meeting.last_checked_date) fail(`${meeting.meeting_id}: last_checked_date missing.`);
}

console.log(`[pr-120-current-timetable-ui] PASS: ${publicList.meetings.length} public timetable rows available through the canonical/public UI path.`);
