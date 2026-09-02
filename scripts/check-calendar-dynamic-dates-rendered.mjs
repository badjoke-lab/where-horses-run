import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  createCalendarDateContext,
  evaluateCalendarDataState,
  filterRecordsForDate,
  filterRecordsForWindow,
} from '../src/lib/timetable/calendarDateContext.mjs';

const root = process.cwd();
const referenceDate = process.env.WHR_CALENDAR_REFERENCE_DATE;
const timeZone = process.env.WHR_CALENDAR_TIMEZONE ?? 'Asia/Tokyo';
const errors = [];
const fail = (message) => errors.push(message);

function readHtml(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing rendered page ${relativePath}`);
    return '';
  }
  const html = readFileSync(absolutePath, 'utf8');
  if (html.length < 500) fail(`${relativePath} is unexpectedly small.`);
  for (const marker of ['[object Object]', '>undefined<', '>NaN<', 'Internal Server Error']) {
    if (html.includes(marker)) fail(`${relativePath} contains render error marker ${marker}.`);
  }
  return html;
}

function countMeetingRows(html) {
  return (html.match(/class="meeting-row"/g) ?? []).length;
}

const pages = {
  calendarEn: readHtml('dist/calendar/index.html'),
  calendarJa: readHtml('dist/ja/calendar/index.html'),
  todayEn: readHtml('dist/today/index.html'),
  todayJa: readHtml('dist/ja/today/index.html'),
  tomorrowEn: readHtml('dist/tomorrow/index.html'),
  tomorrowJa: readHtml('dist/ja/tomorrow/index.html'),
};

const publicData = JSON.parse(readFileSync(path.join(root, 'data/generated/timetable/public/meeting-list.json'), 'utf8'));
const context = createCalendarDateContext({ referenceDate, timeZone });
const records = publicData.meetings ?? [];
const state = evaluateCalendarDataState({ records, generatedAt: publicData.generated_at, context });
const windowRecords = filterRecordsForWindow(records, context.windowStart, context.windowEndExclusive);
const todayRecords = filterRecordsForDate(records, context.today);
const tomorrowRecords = filterRecordsForDate(records, context.tomorrow);

for (const [name, html] of Object.entries(pages)) {
  if (!html.includes(timeZone)) fail(`${name} does not show reference timezone ${timeZone}.`);
  if (!html.includes(`data-calendar-data-status="${state.status}"`)) {
    fail(`${name} must report ${state.status}.`);
  }
  if (html.includes('June 2026 Calendar') || html.includes('2026年6月 開催カレンダー')) {
    fail(`${name} retains fixed June Calendar copy.`);
  }
}

if (!pages.calendarEn.includes('30-day racing calendar')) fail('English Calendar title is not dynamic.');
if (!pages.calendarJa.includes('30日間の開催カレンダー')) fail('Japanese Calendar title is not dynamic.');
if (!pages.calendarEn.includes(context.windowEndInclusive) || !pages.calendarJa.includes(context.windowEndInclusive)) {
  fail(`Calendar pages do not show dynamic window end ${context.windowEndInclusive}.`);
}
if (!pages.todayEn.includes(context.today) || !pages.todayJa.includes(context.today)) {
  fail(`Today pages do not resolve ${context.today}.`);
}
if (!pages.tomorrowEn.includes(context.tomorrow) || !pages.tomorrowJa.includes(context.tomorrow)) {
  fail(`Tomorrow pages do not resolve ${context.tomorrow}.`);
}

for (const [name, html, expected] of [
  ['calendarEn', pages.calendarEn, windowRecords.length],
  ['calendarJa', pages.calendarJa, windowRecords.length],
  ['todayEn', pages.todayEn, todayRecords.length],
  ['todayJa', pages.todayJa, todayRecords.length],
  ['tomorrowEn', pages.tomorrowEn, tomorrowRecords.length],
  ['tomorrowJa', pages.tomorrowJa, tomorrowRecords.length],
]) {
  const actual = countMeetingRows(html);
  if (actual !== expected) fail(`${name} compact meeting-row count differs: expected ${expected}, got ${actual}.`);
}

if (tomorrowRecords.length === 0) {
  if (!pages.tomorrowEn.includes('No reviewed public meetings are listed')) fail('English Tomorrow empty state is missing.');
  if (!pages.tomorrowJa.includes('確認済み公開開催')) fail('Japanese Tomorrow empty state is missing.');
}

if (errors.length) {
  console.error(`CALENDAR_DYNAMIC_DATES_RENDERED: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_DYNAMIC_DATES_RENDERED: pass reference_date=${context.today} timezone=${timeZone}`);
console.log(`DATA_STATUS: ${state.status}`);
console.log(`WINDOW_MEETINGS: ${windowRecords.length}`);
console.log(`TODAY_MEETINGS: ${todayRecords.length}`);
console.log(`TOMORROW_MEETINGS: ${tomorrowRecords.length}`);
console.log('BILINGUAL_CALENDAR_TODAY_TOMORROW: pass');
console.log('COMPACT_MEETING_ROWS: pass');
console.log('FIXED_JUNE_COPY: 0');
