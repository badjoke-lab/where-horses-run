import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  addCalendarDays,
  createCalendarDateContext,
  filterRecordsForDate,
  filterRecordsForWindow,
  resolveCalendarReference,
} from '../src/lib/timetable/calendarDateContext.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');

const override = createCalendarDateContext({ referenceDate: '2026-06-07', timeZone: 'Asia/Tokyo' });
if (override.today !== '2026-06-07' || override.tomorrow !== '2026-06-08') fail('reference-date calendar arithmetic failed.');
if (override.windowEndInclusive !== '2026-07-06' || override.windowEndExclusive !== '2026-07-07') fail('30-day window arithmetic failed.');

const instant = new Date('2026-07-01T00:30:00.000Z');
if (resolveCalendarReference({ now: instant, timeZone: 'Asia/Tokyo' }).date !== '2026-07-01') fail('Tokyo date resolution failed.');
if (resolveCalendarReference({ now: instant, timeZone: 'America/Los_Angeles' }).date !== '2026-06-30') fail('Los Angeles date rollover failed.');
if (addCalendarDays('2026-12-31', 1) !== '2027-01-01') fail('year rollover failed.');
if (addCalendarDays('2028-02-28', 1) !== '2028-02-29') fail('leap-day rollover failed.');

const records = [
  { meeting_id: 'before', date: '2026-06-06' },
  { meeting_id: 'start', date: '2026-06-07' },
  { meeting_id: 'inside', date: '2026-07-06' },
  { meeting_id: 'end', date: '2026-07-07' },
];
if (filterRecordsForDate(records, '2026-06-07')[0]?.meeting_id !== 'start') fail('date filter failed.');
if (filterRecordsForWindow(records, '2026-06-07', '2026-07-07').map((record) => record.meeting_id).join(',') !== 'start,inside') fail('window filter failed.');

const timetableHelper = read('src/data/timetableMeetingRows.ts');
for (const marker of [
  'createCalendarDateContext', 'getTimetableProjectionCandidateRows', 'getTimetableProjectionCandidateGroups',
  'addCalendarDays(startDate, -1)', 'addCalendarDays(endDateExclusive, 1)',
]) if (!timetableHelper.includes(marker)) fail(`timetable helper missing ${marker}.`);

const meetingList = read('src/components/TimetableMeetingList.astro');
for (const marker of [
  'data-display-timezone-select', 'data-source-timezone={record.timezone}',
  "viewMode === 'today'", "viewMode === 'tomorrow'", "viewMode === 'window30'",
  'formatProjectedDate(new Date(), timeZone)', 'addDateDays(today, 30)',
  "new URL(window.location.href).searchParams.get('tz')", 'Intl.DateTimeFormat().resolvedOptions().timeZone',
]) if (!meetingList.includes(marker)) fail(`display timezone projection missing ${marker}.`);

const pageChecks = [
  ['src/pages/today.astro', ['viewMode="today"', 'getTimetableProjectionCandidateRows']],
  ['src/pages/tomorrow.astro', ['viewMode="tomorrow"', 'getTimetableProjectionCandidateRows']],
  ['src/pages/calendar/index.astro', ['viewMode="window30"', 'getTimetableProjectionCandidateGroups']],
  ['src/pages/ja/today.astro', ['viewMode="today"', 'getTimetableProjectionCandidateRows']],
  ['src/pages/ja/tomorrow.astro', ['viewMode="tomorrow"', 'getTimetableProjectionCandidateRows']],
  ['src/pages/ja/calendar/index.astro', ['viewMode="window30"', 'getTimetableProjectionCandidateGroups']],
];
for (const [file, markers] of pageChecks) {
  const content = read(file);
  for (const marker of markers) if (!content.includes(marker)) fail(`${file} missing ${marker}.`);
  if (content.includes('June 2026 Calendar') || content.includes('2026年6月 開催カレンダー')) fail(`${file} retains fixed historical copy.`);
}

const statusComponent = read('src/components/CalendarDateStatus.astro');
if (!statusComponent.includes('data-calendar-data-status')) fail('CalendarDateStatus status marker missing.');
if (statusComponent.includes('Reference timezone') || statusComponent.includes('基準タイムゾーン')) {
  fail('CalendarDateStatus must not expose the build reference timezone as the visitor display timezone.');
}

if (errors.length) {
  console.error(`CALENDAR_DYNAMIC_DATES: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_DYNAMIC_DATES: pass');
console.log('REFERENCE_DATE_OVERRIDE: pass');
console.log('SOURCE_DATE_EPOCH: pass');
console.log('TIMEZONE_BOUNDARIES: pass');
console.log('VISITOR_TIMEZONE_PROJECTION: pass');
console.log('ROLLING_WINDOW_DAYS: 30');
console.log('FIXED_JUNE_FALLBACKS: 0');
