import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-121-current-timetable-dimensions] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

const page = read('src/pages/major-countries/current-timetable.astro');
const list = read('src/components/TimetableMeetingList.astro');
const rowAdapter = read('src/data/timetableMeetingRows.ts');
const historicalDimensions = read('src/components/CurrentTimetableDimensions.astro');

for (const marker of [
  'TimetableMeetingList',
  'getGroupedTimetableMeetingRows',
  'groups={groupedTimetableRecords}',
  'Current timetable',
]) {
  if (!page.includes(marker)) fail(`Current timetable page must include ${marker}.`);
}

if (page.includes('CurrentTimetableDimensions')) {
  fail('Current timetable page must not restore the retired aggregate dimensions panel.');
}
if (page.includes('current-integrated.json')) {
  fail('Current timetable page must not read the retired integrated dataset directly.');
}

for (const marker of [
  'getPublicTimetableMeetingRows',
  'getGroupedTimetableMeetingRows',
  'effective_public_rank',
]) {
  if (!rowAdapter.includes(marker)) fail(`Timetable row adapter must include ${marker}.`);
}

for (const marker of [
  'group.records.map((record) => (',
  '<li class="meeting-card">',
  'record.official_source_url',
  'record.detail_path',
]) {
  if (!list.includes(marker)) fail(`TimetableMeetingList must include ${marker}.`);
}
if (list.includes('<table')) fail('Current timetable must remain one meeting per list row.');
if (/record\.(?:races|race_rows|timetable_rows|programme)\.map/.test(list)) {
  fail('Current timetable list must not expand race-by-race rows.');
}

// PR-121's dimension component is retained only as historical implementation
// evidence. It must remain self-contained and must not be wired back into the
// current Public v1 list surface.
for (const marker of ['By country', 'By system', 'By date', 'By racecourse', 'dimension-grid']) {
  if (!historicalDimensions.includes(marker)) fail(`Historical dimensions component must retain ${marker}.`);
}

console.log('[pr-121-current-timetable-dimensions] PASS: retired dimensions remain detached from Public v1 list UI');
