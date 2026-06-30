import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/data/timetableMeetingRows.ts';
let text = readFileSync(file, 'utf8');

text = text.replace(
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

export function getTimetableMeetingRowsForWindow(
  startDate: string,
  endDateExclusive: string,
): TimetableMeetingRow[] {
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

if (!text.includes('getPublicTimetableGeneratedAt') || !text.includes('getCurrentCalendarWindowGroups')) {
  throw new Error('Dynamic Dates timetable helper migration did not apply.');
}
if (text.includes("return buildDate.startsWith('2026-06-')")) {
  throw new Error('Fixed June fallback remains.');
}

writeFileSync(file, text);
console.log('CALENDAR_DYNAMIC_DATE_CORE_APPLIED');
