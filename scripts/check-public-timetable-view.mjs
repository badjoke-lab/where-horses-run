import fs from 'node:fs';
import path from 'node:path';

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

const publicList = readJson('data/generated/timetable/public/meeting-list.json');
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');
const viewModel = read('src/lib/timetable/publicTimetableViewModel.ts');

if (publicList.schema_version !== 'public-timetable-meeting-list-v0') {
  fail('Unexpected public meeting-list schema version.');
}
if (publicDetails.schema_version !== 'public-timetable-meeting-details-v0') {
  fail('Unexpected public meeting-details schema version.');
}
if (!publicList.publication_snapshot || !publicDetails.publication_snapshot) {
  fail('Public list/detail must both carry publication_snapshot.');
} else if (publicList.publication_snapshot.snapshot_id !== publicDetails.publication_snapshot.snapshot_id) {
  fail('Public list/detail snapshot IDs must match.');
}

const listById = new Map((publicList.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
for (const meeting of publicList.meetings ?? []) {
  if ('timetable_rows' in meeting) fail(`${meeting.meeting_id}: list rows must not contain timetable_rows.`);
  if (['D', 'not_listed'].includes(meeting.effective_public_rank)) {
    fail(`${meeting.meeting_id}: D/not_listed must not appear in public list.`);
  }
  if (meeting.effective_public_rank === 'C'
    && (meeting.first_race_time_local !== null || meeting.last_race_time_local !== null)) {
    fail(`${meeting.meeting_id}: C row must hide first/last race time.`);
  }
  if (meeting.effective_public_rank === 'B' && meeting.last_race_time_local !== null) {
    fail(`${meeting.meeting_id}: B row must hide last race time.`);
  }
}

for (const detail of publicDetails.details ?? []) {
  const meeting = listById.get(detail.meeting_id);
  if (!meeting) {
    fail(`${detail.meeting_id}: public detail has no public meeting-list row.`);
    continue;
  }
  if (!['A', 'A+'].includes(detail.effective_public_rank)) {
    fail(`${detail.meeting_id}: public detail must be effective rank A or A+.`);
  }
  if (meeting.detail_path !== `/timetable/meetings/${detail.meeting_id}/`) {
    fail(`${detail.meeting_id}: meeting detail_path must point at the published detail page.`);
  }
  for (const row of detail.timetable_rows ?? []) {
    if (!detail.show_race_name && 'race_name' in row) fail(`${detail.meeting_id}: race_name leaked despite false flag.`);
    if (!detail.show_distance && 'distance_m' in row) fail(`${detail.meeting_id}: distance leaked despite false flag.`);
    if (!detail.show_surface && 'surface' in row) fail(`${detail.meeting_id}: surface leaked despite false flag.`);
    if (!detail.show_course && 'course_label' in row) fail(`${detail.meeting_id}: course leaked despite false flag.`);
  }
}

const detailIds = new Set((publicDetails.details ?? []).map((detail) => detail.meeting_id));
for (const meeting of publicList.meetings ?? []) {
  const hasDetail = detailIds.has(meeting.meeting_id);
  if (Boolean(meeting.detail_path) !== hasDetail) {
    fail(`${meeting.meeting_id}: detail_path presence must match final public detail presence.`);
  }
}

for (const token of [
  'getPublicTimetableGeneratedAt',
  'getPublicTimetableSnapshotId',
  'getPublicTimetableMeetingRows',
  'getPublicTimetableMeetingRowsByCountry',
  'getPublicTimetableMeetingRowsByRacecourse',
  'getPublicTimetableMeetingDetail',
  'getPublicTimetableMeetingDetails',
]) {
  if (!viewModel.includes(token)) fail(`View model missing ${token}.`);
}

for (const forbidden of [
  'japan-a-plus-overrides.json',
  'tjkPublicSupplement',
  'baneiReviewedSupplement',
  'reviewedPublicCorrections',
  'reviewedPublicDetailCorrections',
  'reviewedPublicSupplements',
  'mergePublicMeetingRowsMonotonic',
  'mergePublicMeetingDetailsMonotonic',
]) {
  if (viewModel.includes(forbidden)) fail(`Runtime view model still contains truth-changing overlay: ${forbidden}`);
}

for (const required of [
  'meetingListDataset.meetings',
  'meetingDetailsDataset.details',
  'publication_snapshot.snapshot_id',
]) {
  if (!viewModel.includes(required)) fail(`Runtime view model missing final-public consumer marker: ${required}`);
}

if (errors.length > 0) {
  console.error('Public timetable view check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PUBLIC_TIMETABLE_VIEW: pass');
console.log(`PUBLIC_MEETINGS: ${(publicList.meetings ?? []).length}`);
console.log(`PUBLIC_DETAILS: ${(publicDetails.details ?? []).length}`);
console.log(`PUBLIC_SNAPSHOT: ${publicList.publication_snapshot?.snapshot_id ?? 'missing'}`);
console.log('RUNTIME_TRUTH_CHANGING_OVERLAYS: 0');
