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

const adapter = read('src/data/timetableMeetingRows.ts');
const component = read('src/components/TimetableMeetingList.astro');
const astroConfig = read('astro.config.mjs');
const notes = read('PR-250.md');

const pages = [
  'src/pages/calendar/index.astro',
  'src/pages/today.astro',
  'src/pages/tomorrow.astro',
  'src/pages/major-countries/current-timetable.astro',
  'src/pages/ja/calendar/index.astro',
  'src/pages/ja/today.astro',
  'src/pages/ja/tomorrow.astro',
];

for (const token of [
  'getPublicTimetableMeetingRows',
  "from '../lib/timetable/publicTimetableViewModel'",
  'effective_public_rank',
  'record.detail_path !== null',
]) {
  requireText(adapter, token, 'timetableMeetingRows adapter');
}

for (const token of [
  'june-2026-calendar.json',
  'manual-june-2026-',
  'hkjc-normalized-timetable.sample.json',
  'normalizedTimetableCalendarPreview',
  'normalizedTimetableMeetingDetails',
]) {
  rejectText(adapter, token, 'timetableMeetingRows adapter');
}

for (const pagePath of pages) {
  const page = read(pagePath);
  rejectText(page, 'siteData.generated.timetables', pagePath);
  rejectText(page, 'data/generated/', pagePath);
  rejectText(page, 'normalizedTimetable', pagePath);
}

for (const pagePath of [
  'src/pages/calendar/index.astro',
  'src/pages/major-countries/current-timetable.astro',
  'src/pages/ja/calendar/index.astro',
]) {
  const page = read(pagePath);
  requireText(page, 'getGroupedTimetableMeetingRows', pagePath);
  requireText(page, 'TimetableMeetingList', pagePath);
}

for (const pagePath of [
  'src/pages/today.astro',
  'src/pages/tomorrow.astro',
  'src/pages/ja/today.astro',
  'src/pages/ja/tomorrow.astro',
]) {
  const page = read(pagePath);
  requireText(page, 'getTimetableMeetingRowsForDate', pagePath);
  requireText(page, 'TimetableMeetingList', pagePath);
}

for (const token of [
  "lang?: 'en' | 'ja'",
  'record.detail_path &&',
  'record.can_view_race_timetable',
  'Official source',
  '公式ソース',
]) {
  requireText(component, token, 'TimetableMeetingList');
}

for (const token of [
  "runTimetableBuilder('scripts/timetable/build-canonical-timetable.mjs')",
  "runTimetableBuilder('scripts/timetable/build-public-timetable-view.mjs')",
]) {
  requireText(astroConfig, token, 'astro.config.mjs');
}

for (const token of [
  'English and Japanese calendar, today, and tomorrow pages now use the same public timetable adapter.',
  'The current timetable page also reads the public timetable adapter.',
  'No page imports legacy timetable JSON directly.',
  'Next roadmap item is PR-8 country and racecourse pages to public list.',
]) {
  requireText(notes, token, 'PR note');
}

if (errors.length > 0) {
  console.error('Public timetable list page migration check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Public timetable list page migration check passed.');
