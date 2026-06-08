import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireText(source, token, label) {
  if (!source.includes(token)) errors.push(`${label} missing: ${token}`);
}

function rejectText(source, token, label) {
  if (source.includes(token)) errors.push(`${label} contains forbidden text: ${token}`);
}

const page = read('src/pages/timetable/meetings/[meeting_id].astro');
const notes = read('PR-265.md');

for (const token of [
  'getPublicTimetableMeetingDetail',
  'getPublicTimetableMeetingDetails',
  'meetingDetail?.effective_public_rank',
  'meetingDetail?.policy_id',
  'meetingDetail?.show_race_name',
  'meetingDetail?.show_distance',
  'meetingDetail?.show_surface',
  'meetingDetail?.show_course',
  'Entries, runners, horses, jockeys, trainers, odds, results, payouts, predictions, tips, and raw source pages are not republished here.',
]) requireText(page, token, 'meeting detail page');

for (const forbidden of [
  'normalizedTimetableMeetingDetails',
  'normalizedTimetableCalendarPreview',
  'getNormalizedTimetableMeetingDetail',
  'createNormalizedTimetableMeetingDetailPath',
  'summary_note',
]) rejectText(page, forbidden, 'meeting detail page');

for (const token of [
  'Meeting detail pages now read public meeting-details.json through publicTimetableViewModel.',
  'A detail rows show race label and post time only.',
  'A+ detail rows may show policy-approved race name, distance, surface, and course fields.',
  'No country page is changed.',
  'No racecourse page is changed.',
  'Next roadmap item is PR-11 legacy timetable input isolation.',
]) requireText(notes, token, 'PR note');

if (errors.length > 0) {
  console.error('Meeting detail public view check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Meeting detail public view check passed.');
