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

const englishPath = 'src/pages/today.astro';
const japanesePath = 'src/pages/ja/today.astro';
const listPath = 'src/components/TimetableMeetingList.astro';
const englishPage = read(englishPath);
const japanesePage = read(japanesePath);
const meetingList = read(listPath);

for (const [label, page] of [[englishPath, englishPage], [japanesePath, japanesePage]]) {
  for (const marker of [
    'CalendarDateStatus', 'TimetableMeetingList', 'getTimetableDataState', 'getTimetableDateContext',
    'getTimetableMeetingRowsForDate(context.today)', 'getTimetableProjectionCandidateRows(context.today, context.tomorrow)',
    'records={projectionCandidates}', 'date={context.today}', 'viewMode="today"',
  ]) requireIncludes(page, marker, label);
}
for (const marker of ["Today's timetable", 'canonicalPath="/today/"', 'alternatePath="/ja/today/"', 'selected timezone']) {
  requireIncludes(englishPage, marker, englishPath);
}
for (const marker of ['今日の開催時刻表', 'lang="ja"', 'canonicalPath="/ja/today/"', 'alternatePath="/today/"', '選択したタイムゾーン']) {
  requireIncludes(japanesePage, marker, japanesePath);
}
for (const marker of [
  '<li class="meeting-row">', 'data-meeting-projection', 'data-source-timezone={record.timezone}',
  'data-display-timezone-select', "viewMode === 'today'", 'formatProjectedDate(new Date(), timeZone)',
  'meeting-row__identity', 'meeting-row__meta', 'meeting-row__links', 'record.official_source_url',
]) requireIncludes(meetingList, marker, listPath);

if (meetingList.includes('<table')) fail(`${listPath}: Today must remain one meeting per list row`);
if (/record\.(?:races|race_rows|programme)\.map/.test(meetingList)) fail(`${listPath}: Today must not expand race-by-race rows`);
if (errors.length) {
  console.error('Today timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Today timetable UI check passed.');
console.log('TODAY_SELECTED_TIMEZONE_MEMBERSHIP: pass');
console.log('TODAY_ONE_MEETING_PER_LIST_ROW: pass');
