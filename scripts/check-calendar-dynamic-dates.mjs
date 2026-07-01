import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  addCalendarDays,
  createCalendarDateContext,
  evaluateCalendarDataState,
  filterRecordsForDate,
  filterRecordsForWindow,
  resolveCalendarReference,
} from '../src/lib/timetable/calendarDateContext.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');

function expectThrow(label, action, marker) {
  try {
    action();
    fail(`${label} did not throw.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(marker)) fail(`${label} threw unexpected error: ${message}`);
  }
}

const override = createCalendarDateContext({
  referenceDate: '2026-06-07',
  timeZone: 'Asia/Tokyo',
});
if (override.today !== '2026-06-07') fail('reference-date override did not set today.');
if (override.tomorrow !== '2026-06-08') fail('tomorrow is not the next calendar date.');
if (override.windowStart !== '2026-06-07') fail('window start must equal today.');
if (override.windowEndInclusive !== '2026-07-06') fail('30-day inclusive end is incorrect.');
if (override.windowEndExclusive !== '2026-07-07') fail('30-day exclusive end is incorrect.');
if (override.referenceSource !== 'reference_date_override') fail('override source marker is incorrect.');

const instant = new Date('2026-07-01T00:30:00.000Z');
const tokyo = resolveCalendarReference({ now: instant, timeZone: 'Asia/Tokyo' });
const losAngeles = resolveCalendarReference({ now: instant, timeZone: 'America/Los_Angeles' });
if (tokyo.date !== '2026-07-01') fail('Tokyo timezone date resolution is incorrect.');
if (losAngeles.date !== '2026-06-30') fail('Los Angeles timezone date resolution is incorrect.');

const epochSeconds = String(Date.parse('2026-06-30T23:30:00.000Z') / 1000);
const epochContext = resolveCalendarReference({
  sourceDateEpoch: epochSeconds,
  timeZone: 'Asia/Tokyo',
});
if (epochContext.date !== '2026-07-01') fail('SOURCE_DATE_EPOCH timezone resolution is incorrect.');
if (epochContext.source !== 'source_date_epoch') fail('SOURCE_DATE_EPOCH source marker is incorrect.');

if (addCalendarDays('2026-02-28', 1) !== '2026-03-01') fail('non-leap month rollover failed.');
if (addCalendarDays('2028-02-28', 1) !== '2028-02-29') fail('leap-day rollover failed.');
if (addCalendarDays('2026-12-31', 1) !== '2027-01-01') fail('year rollover failed.');

expectThrow('invalid reference date', () => createCalendarDateContext({ referenceDate: '2026-02-30' }), 'real calendar date');
expectThrow('invalid timezone', () => createCalendarDateContext({ referenceDate: '2026-06-07', timeZone: 'Mars/Olympus' }), 'Unsupported Calendar timezone');
expectThrow('invalid epoch', () => resolveCalendarReference({ sourceDateEpoch: '12.5' }), 'whole epoch seconds');
expectThrow('invalid window size', () => createCalendarDateContext({ referenceDate: '2026-06-07', windowDays: 0 }), 'windowDays');

const records = [
  { meeting_id: 'before', date: '2026-06-06' },
  { meeting_id: 'start', date: '2026-06-07' },
  { meeting_id: 'inside', date: '2026-07-06' },
  { meeting_id: 'end', date: '2026-07-07' },
];
const dateRecords = filterRecordsForDate(records, '2026-06-07');
if (dateRecords.length !== 1 || dateRecords[0].meeting_id !== 'start') fail('date filter is incorrect.');
const windowRecords = filterRecordsForWindow(records, '2026-06-07', '2026-07-07');
if (windowRecords.map((record) => record.meeting_id).join(',') !== 'start,inside') {
  fail('window filter must be start-inclusive and end-exclusive.');
}

const oldState = evaluateCalendarDataState({
  records: [
    { meeting_id: 'old-1', date: '2026-06-06' },
    { meeting_id: 'old-2', date: '2026-06-10' },
  ],
  generatedAt: '2026-06-09T15:02:29.605Z',
  context: createCalendarDateContext({ referenceDate: '2026-07-01', timeZone: 'UTC' }),
});
if (oldState.status !== 'records_before_window') fail('old public data must report records_before_window.');
if (oldState.windowRecordCount !== 0 || oldState.latestRecordDate !== '2026-06-10') fail('old-data state counts are incorrect.');

const currentState = evaluateCalendarDataState({
  records: [
    { meeting_id: 'current', date: '2026-06-07' },
  ],
  generatedAt: '2026-06-07T00:00:00.000Z',
  context: createCalendarDateContext({ referenceDate: '2026-06-07', timeZone: 'UTC' }),
});
if (currentState.status !== 'current_window_available') fail('current window state is incorrect.');

const futureState = evaluateCalendarDataState({
  records: [{ meeting_id: 'future', date: '2026-08-01' }],
  generatedAt: '2026-07-01T00:00:00.000Z',
  context: createCalendarDateContext({ referenceDate: '2026-06-01', timeZone: 'UTC' }),
});
if (futureState.status !== 'records_after_window') fail('future-only state is incorrect.');

const noRecordsState = evaluateCalendarDataState({
  records: [],
  generatedAt: '2026-07-01T00:00:00.000Z',
  context: createCalendarDateContext({ referenceDate: '2026-07-01', timeZone: 'UTC' }),
});
if (noRecordsState.status !== 'no_public_records') fail('empty public state is incorrect.');

const timetableHelper = read('src/data/timetableMeetingRows.ts');
for (const forbidden of [
  "buildDate.startsWith('2026-06-')",
  "'2026-06-07'",
  'getPublicTimetableGeneratedAt().slice(0, 10)',
]) {
  if (timetableHelper.includes(forbidden)) fail(`timetable helper contains fixed-date marker: ${forbidden}`);
}
for (const required of [
  'createCalendarDateContext',
  'getCurrentCalendarWindowGroups',
  'getTimetableDataState',
  'filterRecordsForWindow',
]) {
  if (!timetableHelper.includes(required)) fail(`timetable helper missing Dynamic Dates marker: ${required}`);
}

const pageChecks = [
  ['src/pages/today.astro', ['CalendarDateStatus', 'getTimetableDateContext', 'context.today']],
  ['src/pages/tomorrow.astro', ['CalendarDateStatus', 'getTimetableDateContext', 'context.tomorrow']],
  ['src/pages/calendar/index.astro', ['30-day racing calendar', 'getCurrentCalendarWindowGroups', 'windowEndInclusive']],
  ['src/pages/ja/today.astro', ['CalendarDateStatus', 'getTimetableDateContext', 'context.today']],
  ['src/pages/ja/tomorrow.astro', ['CalendarDateStatus', 'getTimetableDateContext', 'context.tomorrow']],
  ['src/pages/ja/calendar/index.astro', ['30日間の開催カレンダー', 'getCurrentCalendarWindowGroups', 'windowEndInclusive']],
];
for (const [file, markers] of pageChecks) {
  const content = read(file);
  for (const marker of markers) if (!content.includes(marker)) fail(`${file} missing ${marker}.`);
  if (content.includes('2026年6月') || content.includes('June 2026 Calendar')) fail(`${file} retains fixed June copy.`);
}

const countryPage = read('src/components/CountryDetailPage.astro');
if (!countryPage.includes('createCalendarDateContext') || !countryPage.includes('filterRecordsForWindow')) {
  fail('country page must use the shared Dynamic Dates window.');
}
if (countryPage.includes('getPublicTimetableGeneratedAt')) fail('country page must not use projection generation date as the display window start.');

const statusComponent = read('src/components/CalendarDateStatus.astro');
for (const marker of ['data-calendar-data-status', 'Reference date', '基準日', 'records_before_window']) {
  if (!statusComponent.includes(marker)) fail(`CalendarDateStatus missing ${marker}.`);
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
console.log('ROLLING_WINDOW_DAYS: 30');
console.log('FIXED_JUNE_FALLBACKS: 0');
