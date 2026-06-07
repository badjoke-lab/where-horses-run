import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const types = read('src/lib/timetable/canonicalTypes.ts');
const spec = read('docs/specs/timetable-canonical-data-model.md');
const notes = read('PR-241.md');

for (const token of [
  'export type CapabilityRank',
  "'not_listed'",
  "'D'",
  "'C'",
  "'B'",
  "'B+'",
  "'A'",
  "'A+'",
  'export type SourceTrace',
  'export type Freshness',
  'export type CanonicalMeeting',
  'export type CanonicalRaceTimetableRow',
  'export type CanonicalMeetingDetail',
  'export type MeetingSummaryRecord',
  'export type MeetingDetailRecord',
  'export type CanonicalTimetableDataset',
  'export type CanonicalMeetingDetailDataset'
]) {
  if (!types.includes(token)) fail(`canonicalTypes.ts missing ${token}`);
}

for (const token of [
  'source config',
  'fetch / snapshot',
  'normalize / canonical',
  'publication policy',
  'public view model / public JSON',
  'Pages must eventually read only public view data',
  'meeting_summary_record becomes `CanonicalMeeting`',
  'meeting_detail_record becomes `CanonicalMeetingDetail`',
  'The next roadmap item is PR-4: existing JSON to canonical conversion.'
]) {
  if (!spec.includes(token)) fail(`canonical model spec missing ${token}`);
}

for (const token of [
  'No existing JSON is converted.',
  'No public view is generated.',
  'No page input is changed.',
  'Next roadmap item is PR-4 existing JSON to canonical conversion.'
]) {
  if (!notes.includes(token)) fail(`PR note missing ${token}`);
}

if (errors.length) {
  console.error('Timetable canonical model check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Timetable canonical model check passed.');
