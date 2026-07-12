import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath}: file must exist`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
};
const requireIncludes = (content, marker, label) => {
  if (!content.includes(marker)) fail(`${label}: missing ${marker}`);
};

const englishPath = 'src/pages/calendar/index.astro';
const japanesePath = 'src/pages/ja/calendar/index.astro';
const listPath = 'src/components/TimetableMeetingList.astro';
const statusPath = 'src/components/CalendarDateStatus.astro';
const englishPage = read(englishPath);
const japanesePage = read(japanesePath);
const meetingList = read(listPath);
const dateStatus = read(statusPath);

for (const [label, page] of [[englishPath, englishPage], [japanesePath, japanesePage]]) {
  for (const marker of [
    'CalendarDateStatus',
    'TimetableMeetingList',
    'getCurrentCalendarWindowGroups',
    'getTimetableDataState',
    'getTimetableDateContext',
    'context.windowStart',
    'context.windowEndInclusive',
    'context.timeZone',
  ]) requireIncludes(page, marker, label);
}

for (const marker of [
  '30-day racing calendar',
  'groups={groups}',
  'canonicalPath="/calendar/"',
  'alternatePath="/ja/calendar/"',
  'No reviewed public meetings fall between',
]) requireIncludes(englishPage, marker, englishPath);

for (const marker of [
  '30日間の開催カレンダー',
  'groups={groupedCalendarRecords}',
  'lang="ja"',
  'canonicalPath="/ja/calendar/"',
  'alternatePath="/calendar/"',
  'この30日間に確認済み公開開催はありません',
]) requireIncludes(japanesePage, marker, japanesePath);

for (const marker of [
  'group.records.map((record) => (',
  '<li class="meeting-card">',
  "const shouldShowFirst = (record: TimetableMeetingRow) => record.capability_rank !== 'C';",
  "record.capability_rank === 'B+' || record.capability_rank === 'A' || record.capability_rank === 'A+'",
  'record.source_status',
  'record.last_checked_date',
  'record.detail_path',
  'record.official_source_url',
]) requireIncludes(meetingList, marker, listPath);

if ((meetingList.match(/group\.records\.map\(\(record\) => \(/g) ?? []).length !== 1) {
  fail(`${listPath}: each meeting row must be mapped exactly once`);
}
if (meetingList.includes('<table')) fail(`${listPath}: list pages must not render a full table`);
if (/record\.(?:races|race_rows|programme)\.map/.test(meetingList)) {
  fail(`${listPath}: Calendar must not expand race-by-race rows`);
}

for (const marker of [
  'data-calendar-data-status={dataState.status}',
  'context.today',
  'context.timeZone',
  'stale_generation_with_window_records',
  'no_public_records',
]) requireIncludes(dateStatus, marker, statusPath);

const combined = `${englishPage}\n${japanesePage}\n${meetingList}\n${dateStatus}`;
for (const fixedCopy of ['June 2026 Calendar', '2026年6月 開催カレンダー']) {
  if (combined.includes(fixedCopy)) fail(`Calendar retains fixed historical copy: ${fixedCopy}`);
}
for (const forbidden of [
  /record\.(?:racecard|card_body|entries?|horses?|jockeys?|trainers?|odds?|results?|payouts?|dividends?|predictions?|tips?|raw_html|stream_url)\b/i,
  /<iframe\b/i,
]) {
  if (forbidden.test(combined)) fail(`Calendar public surface contains forbidden pattern ${forbidden}`);
}

if (errors.length) {
  console.error('Calendar 30-day timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Calendar 30-day timetable UI check passed.');
console.log('ONE_MEETING_PER_LIST_ROW: pass');
console.log('DYNAMIC_CALENDAR_COPY: pass');
