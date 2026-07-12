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

const englishPath = 'src/pages/today.astro';
const japanesePath = 'src/pages/ja/today.astro';
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
    'getTimetableDataState',
    'getTimetableDateContext',
    'getTimetableMeetingRowsForDate',
    'getTimetableMeetingRowsForDate(context.today)',
    'records={todayRecords}',
    'date={context.today}',
    'context.timeZone',
  ]) requireIncludes(page, marker, label);
}

for (const marker of [
  "Today's timetable",
  'canonicalPath="/today/"',
  'alternatePath="/ja/today/"',
  'No reviewed public meetings are listed for',
  'Official sources remain the final confirmation point.',
]) requireIncludes(englishPage, marker, englishPath);

for (const marker of [
  '今日の開催時刻表',
  'lang="ja"',
  'canonicalPath="/ja/today/"',
  'alternatePath="/today/"',
  '確認済み公開開催はありません',
  '最終確認は公式ソースで行ってください',
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
  'Use the official source for final confirmation.',
  '最終確認は公式ソースで行ってください。',
]) requireIncludes(meetingList, marker, listPath);

for (const marker of [
  'data-calendar-data-status={dataState.status}',
  'context.today',
  'context.timeZone',
  'no_public_records',
  'stale_generation_with_window_records',
]) requireIncludes(dateStatus, marker, statusPath);

if (meetingList.includes('<table')) fail(`${listPath}: Today must remain one meeting per list row`);
if (/record\.(?:races|race_rows|programme)\.map/.test(meetingList)) {
  fail(`${listPath}: Today must not expand race-by-race rows`);
}

const combined = `${englishPage}\n${japanesePage}\n${meetingList}\n${dateStatus}`;
for (const forbidden of [
  /record\.(?:racecard|card_body|entries?|horses?|jockeys?|trainers?|odds?|results?|payouts?|dividends?|predictions?|tips?|raw_html|stream_url)\b/i,
  /<iframe\b/i,
]) {
  if (forbidden.test(combined)) fail(`Today public surface contains forbidden pattern ${forbidden}`);
}

if (errors.length) {
  console.error('Today timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Today timetable UI check passed.');
console.log('TODAY_REFERENCE_DATE_CONTEXT: pass');
console.log('TODAY_ONE_MEETING_PER_LIST_ROW: pass');
