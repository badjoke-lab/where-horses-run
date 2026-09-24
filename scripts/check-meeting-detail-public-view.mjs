import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function requireText(source, token, label) {
  if (!source.includes(token)) errors.push(`${label} missing: ${token}`);
}

function rejectText(source, token, label) {
  if (source.includes(token)) errors.push(`${label} contains forbidden text: ${token}`);
}

const page = read('src/pages/timetable/meetings/[meeting_id].astro');
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');
const notes = read('PR-266.md');

for (const token of [
  'getPublicTimetableMeetingDetail',
  'getPublicTimetableMeetingRows',
  'PublicTimetableMeetingDetail',
  'PublicTimetableMeetingRow',
  'detail.show_race_name',
  'detail.show_distance',
  'detail.show_surface',
  'detail.show_course',
  'detail.timetable_rows.map',
  '<h1 id="page-title"><a href={trackPath}>{racecourseName}</a></h1>',
  'Today’s races',
  'source-strip',
  'Open official source',
  'About this data',
  '@media (max-width: 720px)',
  'race-cell--name',
]) requireText(page, token, 'meeting detail page');

for (const forbidden of [
  'normalizedTimetableMeetingDetails',
  'normalizedTimetableCalendarPreview',
  'getNormalizedTimetableMeetingDetail',
  'createNormalizedTimetableMeetingDetailPath',
  'entries',
  'runners',
  'odds',
  'payouts',
  'predictions',
  'tips',
  'Capability rank:',
  'Public rank:',
  'Publication policy:',
  'Source status:',
  'Publication boundary',
]) rejectText(page, forbidden, 'meeting detail page');

const details = publicDetails.details ?? [];
if (details.length === 0) errors.push('Public meeting detail inventory is empty.');

for (const token of [
  'Meeting detail pages now read from public meeting-details.',
  'A detail rows show race label and post time only.',
  'A+ detail rows show only policy-approved programme summary fields.',
  'No country page is changed.',
  'No racecourse page is changed.',
  'Next roadmap item is PR-11 legacy display input isolation.',
]) requireText(notes, token, 'PR note');

if (errors.length > 0) {
  console.error('Meeting detail public view check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Meeting detail public view check passed.');
