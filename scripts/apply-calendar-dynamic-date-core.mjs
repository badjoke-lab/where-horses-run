import { readFileSync, writeFileSync } from 'node:fs';

function update(file, transform) {
  const before = readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No Dynamic Dates change applied to ${file}`);
  writeFileSync(file, after);
}

update('src/data/timetableMeetingRows.ts', (source) => {
  let text = source.replace(
    /import \{\n  getPublicTimetableMeetingRows,\n  type PublicTimetableMeetingRow,\n\} from '\.\.\/lib\/timetable\/publicTimetableViewModel';/,
    `import {
  getPublicTimetableGeneratedAt,
  getPublicTimetableMeetingRows,
  type PublicTimetableMeetingRow,
} from '../lib/timetable/publicTimetableViewModel';
import {
  createCalendarDateContext,
  evaluateCalendarDataState,
  filterRecordsForDate,
  filterRecordsForWindow,
} from '../lib/timetable/calendarDateContext.mjs';`
  );

  text = text.replace(
    /export function getTimetableMeetingRowsForDate\(date: string\): TimetableMeetingRow\[] \{[\s\S]*?\n\}\n\nexport function getGroupedTimetableMeetingRows/,
    `export function getTimetableMeetingRowsForDate(date: string): TimetableMeetingRow[] {
  return filterRecordsForDate(getTimetableMeetingRows(), date) as TimetableMeetingRow[];
}

export function getTimetableMeetingRowsForWindow(startDate: string, endDateExclusive: string): TimetableMeetingRow[] {
  return filterRecordsForWindow(getTimetableMeetingRows(), startDate, endDateExclusive) as TimetableMeetingRow[];
}

export function getTimetableDateContext() {
  return createCalendarDateContext();
}

export function getCurrentCalendarWindowMeetingRows(context = getTimetableDateContext()) {
  return getTimetableMeetingRowsForWindow(context.windowStart, context.windowEndExclusive);
}

export function getGroupedTimetableMeetingRows`
  );

  text = text.replace(
    /export function getCurrentTimetableDate\(\) \{[\s\S]*$/,
    `export function getCurrentCalendarWindowGroups(context = getTimetableDateContext()) {
  return getGroupedTimetableMeetingRows(getCurrentCalendarWindowMeetingRows(context));
}

export function getTimetableDataState(context = getTimetableDateContext()) {
  return evaluateCalendarDataState({
    records: getTimetableMeetingRows(),
    generatedAt: getPublicTimetableGeneratedAt(),
    context,
  });
}

export function getCurrentTimetableDate() {
  return getTimetableDateContext().today;
}

export function getTomorrowTimetableDate() {
  return getTimetableDateContext().tomorrow;
}
`
  );

  if (text.includes("return buildDate.startsWith('2026-06-')")) throw new Error('Fixed June fallback remains.');
  return text;
});

update('src/components/CountryDetailPage.astro', (source) => {
  let text = source.replace(
    /import \{\n  getPublicTimetableGeneratedAt,\n  getPublicTimetableMeetingRowsByCountry\n\} from '\.\.\/lib\/timetable\/publicTimetableViewModel';/,
    `import { getPublicTimetableMeetingRowsByCountry } from '../lib/timetable/publicTimetableViewModel';
import { createCalendarDateContext, filterRecordsForWindow } from '../lib/timetable/calendarDateContext.mjs';`
  );

  text = text.replace(
    /const generatedDate = getPublicTimetableGeneratedAt\(\)\.slice\(0, 10\);[\s\S]*?const activeWindowRecords = windowStart && windowEnd\n  \? timetableRecords\.filter\(\(record\) => \{[\s\S]*?\n  : \[];/,
    `const calendarContext = createCalendarDateContext();
const activeWindowRecords = filterRecordsForWindow(
  timetableRecords,
  calendarContext.windowStart,
  calendarContext.windowEndExclusive
);`
  );

  return text;
});

update('src/pages/ja/tomorrow.astro', (source) => {
  let text = source.replace(
    "import TimetableMeetingList from '../../components/TimetableMeetingList.astro';",
    "import CalendarDateStatus from '../../components/CalendarDateStatus.astro';\nimport TimetableMeetingList from '../../components/TimetableMeetingList.astro';"
  );
  text = text.replace(
    /import \{ getTimetableMeetingRowsForDate, getTomorrowTimetableDate \} from '\.\.\/\.\.\/data\/timetableMeetingRows';/,
    `import { getTimetableDataState, getTimetableDateContext, getTimetableMeetingRowsForDate } from '../../data/timetableMeetingRows';`
  );
  text = text.replace(
    /const tomorrowTimetableDate = getTomorrowTimetableDate\(\);\nconst tomorrowRecords = getTimetableMeetingRowsForDate\(tomorrowTimetableDate\);/,
    `const context = getTimetableDateContext();
const dataState = getTimetableDataState(context);
const tomorrowRecords = getTimetableMeetingRowsForDate(context.tomorrow);`
  );
  text = text.replaceAll('tomorrowTimetableDate', 'context.tomorrow');
  text = text.replace(
    '  <section aria-label="明日の開催一覧">',
    '  <CalendarDateStatus context={context} dataState={dataState} lang="ja" />\n\n  <section aria-label="明日の開催一覧">'
  );
  return text;
});

update('src/pages/ja/calendar/index.astro', (source) => {
  let text = source.replace(
    "import TimetableMeetingList from '../../../components/TimetableMeetingList.astro';",
    "import CalendarDateStatus from '../../../components/CalendarDateStatus.astro';\nimport TimetableMeetingList from '../../../components/TimetableMeetingList.astro';"
  );
  text = text.replace(
    /import \{ getGroupedTimetableMeetingRows \} from '\.\.\/\.\.\/\.\.\/data\/timetableMeetingRows';/,
    `import { getCurrentCalendarWindowGroups, getTimetableDataState, getTimetableDateContext } from '../../../data/timetableMeetingRows';`
  );
  text = text.replace(
    'const groupedCalendarRecords = getGroupedTimetableMeetingRows();',
    `const context = getTimetableDateContext();
const dataState = getTimetableDataState(context);
const groupedCalendarRecords = getCurrentCalendarWindowGroups(context);`
  );
  text = text.replace('title="2026年6月 開催カレンダー | 競馬どこ？"', 'title="30日間の開催カレンダー | 競馬どこ？"');
  text = text.replace('description="2026年6月の開催情報を日付別に1開催1行で表示し、詳細情報と公式ソースへのリンクを案内します。"', 'description="基準日から30日間の確認済み公開開催情報を日付別に案内します。"');
  text = text.replace('<h1 id="page-title">2026年6月 開催カレンダー</h1>', '<h1 id="page-title">30日間の開催カレンダー</h1>');
  text = text.replace('開催情報を日付別に表示します。表示ランクに応じて時刻情報を出し分け、最終確認先として公式ソースを案内します。', '{context.windowStart}から{context.windowEndInclusive}までの確認済み開催を表示します。基準タイムゾーンは{context.timeZone}です。');
  text = text.replace('  <section aria-label="2026年6月の開催一覧">', '  <CalendarDateStatus context={context} dataState={dataState} lang="ja" />\n\n  <section aria-label="30日間の開催一覧">');
  text = text.replace('emptyLabel="2026年6月の開催情報はまだありません。最終確認には公式ソースを使用してください。"', 'emptyLabel="この30日間に確認済み公開開催はありません。最新情報は公式ソースで確認してください。"');
  return text;
});

console.log('CALENDAR_DYNAMIC_DATE_CORE_APPLIED');
