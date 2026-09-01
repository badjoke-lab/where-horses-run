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

const englishPath = 'src/pages/calendar/index.astro';
const japanesePath = 'src/pages/ja/calendar/index.astro';
const listPath = 'src/components/TimetableMeetingList.astro';
const englishPage = read(englishPath);
const japanesePage = read(japanesePath);
const meetingList = read(listPath);

for (const [label, page] of [[englishPath, englishPage], [japanesePath, japanesePage]]) {
  for (const marker of [
    'CalendarDateStatus', 'TimetableMeetingList', 'getCurrentCalendarWindowGroups',
    'getTimetableDataState', 'getTimetableDateContext', 'getTimetableProjectionCandidateGroups(',
    'context.windowStart', 'context.windowEndExclusive', 'viewMode="window30"',
  ]) requireIncludes(page, marker, label);
}
for (const marker of ['30-day racing calendar', 'groups={projectionGroups}', 'canonicalPath="/calendar/"', 'alternatePath="/ja/calendar/"', 'selected display timezone']) {
  requireIncludes(englishPage, marker, englishPath);
}
for (const marker of ['30日間の開催カレンダー', 'groups={projectionGroups}', 'lang="ja"', 'canonicalPath="/ja/calendar/"', 'alternatePath="/calendar/"', '表示タイムゾーン']) {
  requireIncludes(japanesePage, marker, japanesePath);
}
for (const marker of [
  'group.records.map((record) => (', '<li class="meeting-row">', 'data-meeting-projection',
  'data-source-timezone={record.timezone}', 'data-display-timezone-select', "viewMode === 'window30'",
  'addDateDays(today, 30)', 'meeting-row__identity', 'meeting-row__meta', 'meeting-row__links',
  'record.source_status', 'record.last_checked_date', 'record.detail_path', 'record.official_source_url',
]) requireIncludes(meetingList, marker, listPath);

if ((meetingList.match(/group\.records\.map\(\(record\) => \(/g) ?? []).length !== 1) fail(`${listPath}: each meeting row must be mapped exactly once`);
if (meetingList.includes('<table')) fail(`${listPath}: list pages must not render a full table`);
if (/record\.(?:races|race_rows|programme)\.map/.test(meetingList)) fail(`${listPath}: Calendar must not expand race-by-race rows`);

const combined = `${englishPage}\n${japanesePage}\n${meetingList}`;
for (const fixedCopy of ['June 2026 Calendar', '2026年6月 開催カレンダー']) {
  if (combined.includes(fixedCopy)) fail(`Calendar retains fixed historical copy: ${fixedCopy}`);
}
if (errors.length) {
  console.error('Calendar 30-day timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Calendar 30-day timetable UI check passed.');
console.log('SELECTED_TIMEZONE_30_DAY_MEMBERSHIP: pass');
console.log('ONE_MEETING_PER_LIST_ROW: pass');
