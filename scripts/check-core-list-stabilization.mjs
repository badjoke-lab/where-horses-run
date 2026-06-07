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

const component = read('src/components/TimetableMeetingList.astro');
const notes = read('PR-255.md');
const pages = [
  'src/pages/calendar/index.astro',
  'src/pages/today.astro',
  'src/pages/tomorrow.astro',
  'src/pages/ja/calendar/index.astro',
  'src/pages/ja/today.astro',
  'src/pages/ja/tomorrow.astro',
  'src/pages/major-countries/current-timetable.astro',
];

for (const token of [
  'meeting-card',
  'meeting-card__meta',
  'record.detail_path &&',
  'record.official_source_url',
  'shouldShowFirst',
  'shouldShowLast',
  'Use the official source for final confirmation.',
  '最終確認は公式ソースで行ってください。',
  '@media (max-width: 420px)',
]) requireText(component, token, 'TimetableMeetingList');

for (const forbidden of [
  'race_name',
  'distance_m',
  'surface',
  'course_label',
  'timetable_rows',
]) rejectText(component, forbidden, 'TimetableMeetingList');

for (const pagePath of pages) {
  const page = read(pagePath);
  requireText(page, 'TimetableMeetingList', pagePath);
  rejectText(page, 'siteData.generated.timetables', pagePath);
  rejectText(page, 'data/generated/', pagePath);
  rejectText(page, 'normalizedTimetable', pagePath);
}

for (const untouched of [
  'src/pages/countries/[slug].astro',
  'src/pages/ja/countries/[slug].astro',
  'src/pages/tracks/[slug].astro',
  'src/pages/ja/tracks/[slug].astro',
]) {
  const page = read(untouched);
  rejectText(page, 'ContextTimetableTable', untouched);
}

for (const token of [
  'Core calendar, today, tomorrow, and current timetable pages keep using public view rows.',
  'Country and racecourse pages are intentionally not changed in this PR.',
  'Next roadmap item is PR-9 shared list API and scoped component contracts.',
]) requireText(notes, token, 'PR note');

if (errors.length > 0) {
  console.error('Core list stabilization check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Core list stabilization check passed.');
