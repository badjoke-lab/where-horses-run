import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) { fail(`${relativePath}: file must exist`); return ''; }
  return readFileSync(absolutePath, 'utf8');
};
const requireIncludes = (content, marker, label) => {
  if (!content.includes(marker)) fail(`${label}: missing ${marker}`);
};

const englishPath = 'src/pages/tomorrow.astro';
const japanesePath = 'src/pages/ja/tomorrow.astro';
const listPath = 'src/components/TimetableMeetingList.astro';
const englishPage = read(englishPath);
const japanesePage = read(japanesePath);
const meetingList = read(listPath);

for (const [label, page] of [[englishPath, englishPage], [japanesePath, japanesePage]]) {
  for (const marker of [
    'CalendarDateStatus', 'TimetableMeetingList', 'getTimetableDataState', 'getTimetableDateContext',
    'getTimetableMeetingRowsForDate(context.tomorrow)', 'getTimetableProjectionCandidateRows(',
    'records={projectionCandidates}', 'date={context.tomorrow}', 'viewMode="tomorrow"',
  ]) requireIncludes(page, marker, label);
}
for (const marker of ["Tomorrow's timetable", 'canonicalPath="/tomorrow/"', 'alternatePath="/ja/tomorrow/"', 'selected timezone']) {
  requireIncludes(englishPage, marker, englishPath);
}
for (const marker of ['明日の開催時刻表', 'lang="ja"', 'canonicalPath="/ja/tomorrow/"', 'alternatePath="/tomorrow/"', '選択したタイムゾーン']) {
  requireIncludes(japanesePage, marker, japanesePath);
}
for (const marker of [
  '<li class="meeting-row">', 'data-meeting-projection', 'data-source-timezone={record.timezone}',
  'data-display-timezone-select', "viewMode === 'tomorrow'", 'addDateDays(today, 1)',
  'meeting-row__identity', 'meeting-row__meta', 'meeting-row__links', 'record.official_source_url',
]) requireIncludes(meetingList, marker, listPath);

if (meetingList.includes('<table')) fail(`${listPath}: Tomorrow must remain one meeting per list row`);
if (/record\.(?:races|race_rows|programme)\.map/.test(meetingList)) fail(`${listPath}: Tomorrow must not expand race-by-race rows`);
if (errors.length) {
  console.error('Tomorrow timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Tomorrow timetable UI check passed.');
console.log('TOMORROW_SELECTED_TIMEZONE_MEMBERSHIP: pass');
console.log('TOMORROW_ONE_MEETING_PER_LIST_ROW: pass');
