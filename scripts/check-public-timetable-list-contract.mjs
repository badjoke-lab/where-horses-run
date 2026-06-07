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
const scopedList = read('src/components/PublicTimetableScopedList.astro');
const spec = read('docs/specs/public-timetable-list-contract.md');
const notes = read('PR-260.md');

for (const token of [
  'getPublicTimetableRowsForDate',
  'getPublicTimetableRowsByCountry',
  'getPublicTimetableRowsByRacecourse',
  'getPublicTimetableRowsByScope',
  'groupPublicTimetableRowsByDate',
  "type: 'country'",
  "type: 'racecourse'",
]) requireText(filters, token, 'publicTimetableFilters');

for (const token of [
  'PublicTimetableScopedList',
  'getPublicTimetableRowsByScope',
  'groupPublicTimetableRowsByDate',
  'record.detail_path',
  'record.official_source_url',
  'effective_public_rank',
]) requireText(scopedList, token, 'PublicTimetableScopedList');

for (const forbidden of [
  'race_name',
  'distance_m',
  'surface',
  'course_label',
  'timetable_rows',
  'odds',
  'payouts',
  'prediction',
  'tips',
]) rejectText(scopedList, forbidden, 'PublicTimetableScopedList');

for (const token of [
  'getPublicTimetableRowsForDate(date)',
  'getPublicTimetableRowsByCountry(country_id)',
  'getPublicTimetableRowsByRacecourse(racecourse_id)',
  'List surfaces are meeting-level only.',
  'insert the component into country pages',
  'insert the component into racecourse pages',
]) requireText(spec, token, 'public timetable list contract spec');

for (const page of [
  'src/pages/countries/[slug].astro',
  'src/pages/ja/countries/[slug].astro',
  'src/pages/tracks/[slug].astro',
  'src/pages/ja/tracks/[slug].astro',
]) {
  const source = read(page);
  rejectText(source, 'PublicTimetableScopedList', page);
  rejectText(source, 'getPublicTimetableRowsByCountry', page);
  rejectText(source, 'getPublicTimetableRowsByRacecourse', page);
}

for (const token of [
  'Filter API and scoped list component are now available for later insertion.',
  'Country and racecourse pages are intentionally not changed.',
  'No meeting detail page is migrated in this PR.',
  'Next roadmap item is PR-10 meeting detail page to public detail.',
]) requireText(notes, token, 'PR note');

if (errors.length > 0) {
  console.error('Public timetable list contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Public timetable list contract check passed.');
