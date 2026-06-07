import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const errors = [];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  errors.push(message);
}

for (const script of [
  'scripts/timetable/build-canonical-timetable.mjs',
  'scripts/timetable/build-public-timetable-view.mjs',
]) {
  try {
    execFileSync(process.execPath, [script], { cwd: root, stdio: 'inherit' });
  } catch (error) {
    fail(`${script} failed: ${error.message}`);
  }
}

const canonicalMeetings = readJson(
  'data/generated/timetable/canonical/meetings.json',
);
const publicList = readJson(
  'data/generated/timetable/public/meeting-list.json',
);
const publicDetails = readJson(
  'data/generated/timetable/public/meeting-details.json',
);
const viewModel = read('src/lib/timetable/publicTimetableViewModel.ts');
const notes = read('PR-244.md');

if (publicList.schema_version !== 'public-timetable-meeting-list-v0') {
  fail('Unexpected public meeting-list schema version.');
}
if (publicDetails.schema_version !== 'public-timetable-meeting-details-v0') {
  fail('Unexpected public meeting-details schema version.');
}
if ((canonicalMeetings.meetings ?? []).length < 34) {
  fail('Canonical builder must produce at least 34 meetings before public view generation.');
}
if ((publicList.meetings ?? []).length < 34) {
  fail('Public meeting list must include at least 34 listed meetings after generation.');
}
if ((publicDetails.details ?? []).length !== 2) {
  fail('Public meeting details must contain exactly 2 current detail records.');
}

for (const meeting of publicList.meetings ?? []) {
  if ('timetable_rows' in meeting) {
    fail(`${meeting.meeting_id}: list rows must not contain timetable_rows.`);
  }
  if (meeting.effective_public_rank === 'D' || meeting.effective_public_rank === 'not_listed') {
    fail(`${meeting.meeting_id}: D/not_listed must not appear in public list.`);
  }
  if (meeting.effective_public_rank === 'C') {
    if (meeting.first_race_time_local !== null || meeting.last_race_time_local !== null) {
      fail(`${meeting.meeting_id}: C row must hide first/last race time.`);
    }
  }
  if (meeting.effective_public_rank === 'B' && meeting.last_race_time_local !== null) {
    fail(`${meeting.meeting_id}: B row must hide last race time.`);
  }
}

const hkjc = publicDetails.details.find(
  (detail) => detail.meeting_id === 'hkjc-sha-tin-racecourse-2026-06-07',
);
if (!hkjc) {
  fail('Missing HKJC public detail.');
} else {
  if (hkjc.effective_public_rank !== 'A+') fail('HKJC detail must publish as A+.');
  if (!hkjc.show_race_name || !hkjc.show_distance || !hkjc.show_surface || !hkjc.show_course) {
    fail('HKJC A+ detail flags must be enabled.');
  }
  const detailedRow = hkjc.timetable_rows.find((row) => row.race_name && row.distance_m);
  if (!detailedRow) fail('HKJC A+ rows must retain programme-summary fields.');
}

const jra = publicDetails.details.find(
  (detail) => detail.meeting_id === 'jra-tokyo-racecourse-2026-06-07',
);
if (!jra) {
  fail('Missing JRA public detail.');
} else {
  if (jra.effective_public_rank !== 'A') fail('JRA detail must remain A.');
  for (const row of jra.timetable_rows) {
    for (const forbiddenField of ['race_name', 'distance_m', 'surface', 'course_label']) {
      if (forbiddenField in row) {
        fail(`JRA A row must not expose ${forbiddenField}.`);
      }
    }
  }
}

for (const token of [
  'getPublicTimetableMeetingRows',
  'getPublicTimetableMeetingRowsByCountry',
  'getPublicTimetableMeetingRowsByRacecourse',
  'getPublicTimetableMeetingDetail',
  'getPublicTimetableMeetingDetails',
]) {
  if (!viewModel.includes(token)) fail(`View model missing ${token}.`);
}

for (const token of [
  'No page input is migrated in this PR.',
  'A+ programme-summary fields are retained only when effective public rank is A+.',
  'Next roadmap item is PR-7 list pages to public view.',
]) {
  if (!notes.includes(token)) fail(`PR note missing: ${token}`);
}

if (errors.length > 0) {
  console.error('Public timetable view check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Public timetable view check passed.');
