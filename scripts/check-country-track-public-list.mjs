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
  if (source.includes(token)) errors.push(`${label} still contains forbidden text: ${token}`);
}

const data = read('src/lib/data.ts');
const adapter = read('src/data/timetableMeetingRows.ts');
const table = read('src/components/ContextTimetableTable.astro');
const enCountry = read('src/pages/countries/[slug].astro');
const jaCountry = read('src/pages/ja/countries/[slug].astro');
const enTrack = read('src/pages/tracks/[slug].astro');
const jaTrack = read('src/pages/ja/tracks/[slug].astro');
const notes = read('PR-252.md');

for (const token of [
  "import publicTimetableMeetingList from '../../data/generated/timetable/public/meeting-list.json'",
  'timetables: publicTimetables',
  'getPublicMeetingsByRacecourseId',
  'upcoming_meetings: publicMeetings.map',
]) requireText(data, token, 'src/lib/data.ts');

for (const token of [
  'getTimetableMeetingRowsByCountry',
  'getTimetableMeetingRowsByRacecourse',
]) requireText(adapter, token, 'timetableMeetingRows adapter');

for (const token of [
  'record.detail_path &&',
  'record.official_source_url',
  'one meeting',
  '公式ソース',
]) requireText(table, token, 'ContextTimetableTable');

for (const [label, page] of [
  ['English country', enCountry],
  ['Japanese country', jaCountry],
  ['English track', enTrack],
  ['Japanese track', jaTrack],
]) {
  requireText(page, 'ContextTimetableTable', label);
  rejectText(page, 'siteData.generated.timetables', label);
  rejectText(page, 'record.source_url', label);
  rejectText(page, 'record.start_time_local', label);
}

for (const token of [
  'Country and racecourse timetable sections now read from public meeting-list.',
  'English and Japanese country pages use ContextTimetableTable.',
  'English and Japanese track pages use ContextTimetableTable.',
  'No meeting detail page is migrated in this PR.',
  'Next roadmap item is PR-9 meeting detail page to public detail.',
]) requireText(notes, token, 'PR note');

if (errors.length > 0) {
  console.error('Country / track public list check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Country / track public list check passed.');
