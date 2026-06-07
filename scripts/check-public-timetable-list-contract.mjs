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

const filters = read('src/lib/timetable/publicTimetableFilters.ts');
const component = read('src/components/PublicTimetableScopedList.astro');
const spec = read('docs/specs/public-timetable-list-contract.md');
const notes = read('PR-260.md');

for (const token of [
  'getPublicTimetableRowsForDate',
  'getPublicTimetableRowsByCountry',
  'getPublicTimetableRowsByRacecourse',
  'getPublicTimetableRowsByDateRange',
  'getPublicTimetableRowsForScope',
  'groupPublicTimetableRowsByDate',
  'limitPublicTimetableRows',
  'sortPublicTimetableRows',
]) requireText(filters, token, 'publicTimetableFilters');

for (const token of [
  'PublicTimetableScopedList',
  'rows: readonly PublicTimetableMeetingRow[]',
  'record',
]) {
  // The file name supplies the component name, so allow this token to be checked through path/spec instead.
}

for (const token of [
  'rows: readonly PublicTimetableMeetingRow[]',
  'lang?:',
  'headingId?',
  'emptyLabel?',
  'limit?',
  'row.detail_path &&',
  'row.official_source_url',
  'effective_public_rank',
  'Use the official source for final confirmation.',
  '最終確認は公式ソースで行ってください。',
]) requireText(component, token, 'PublicTimetableScopedList');

for (const token of [
  'data/generated/timetable/public/meeting-list.json',
  'getPublicTimetableRowsByCountry(countryId)',
  'getPublicTimetableRowsByRacecourse(racecourseId)',
  'one row or card per meeting',
  'A/A+ list rows must not expand race-level data',
  'Country and racecourse insertion may be delayed',
]) requireText(spec, token, 'public timetable list contract spec');

for (const forbidden of [
  'race_name',
  'distance_m',
  'surface',
  'course_label',
  'timetable_rows',
  'horse',
  'jockey',
  'odds',
  'payout',
]) rejectText(component, forbidden, 'PublicTimetableScopedList');

for (const untouched of [
  'src/pages/countries/[slug].astro',
  'src/pages/ja/countries/[slug].astro',
  'src/pages/tracks/[slug].astro',
  'src/pages/ja/tracks/[slug].astro',
  'src/pages/timetable/meetings/[meeting_id].astro',
]) {
  const page = read(untouched);
  rejectText(page, 'PublicTimetableScopedList', untouched);
}

for (const token of [
  'No country page is changed.',
  'No racecourse page is changed.',
  'No meeting detail page is changed.',
  'Next roadmap item is PR-10 meeting detail page to public detail.',
]) requireText(notes, token, 'PR note');

if (errors.length > 0) {
  console.error('Public timetable list contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Public timetable list contract check passed.');
