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
const dateNavPath = 'src/components/CalendarDateNavigation.astro';
const filtersPath = 'src/components/CalendarFilters.astro';
const mapPath = 'src/components/CalendarMeetingMap.astro';
const viewControlsPath = 'src/components/CalendarViewControls.astro';
const streamStatePath = 'src/lib/timetable/meetingStreamState.mjs';
const englishPage = read(englishPath);
const japanesePage = read(japanesePath);
const meetingList = read(listPath);
const dateStatus = read(statusPath);
const dateNav = read(dateNavPath);
const filters = read(filtersPath);
const calendarMap = read(mapPath);
const viewControls = read(viewControlsPath);
const streamState = read(streamStatePath);

for (const marker of [
  'CalendarDateNavigation',
  'CalendarMeetingMap',
  'CalendarFilters',
  'CalendarViewControls',
  'CalendarDateStatus',
  'TimetableMeetingList',
  'getTimetableMeetingRowsForWindow',
  'getTimetableDataState',
  'getTimetableDateContext',
  'addCalendarDays',
  'context.windowStart',
  'context.windowEndInclusive',
  'scope="rolling-30"',
  'data-calendar-list-view',
]) requireIncludes(englishPage, marker, englishPath);

for (const marker of [
  'CalendarDateNavigation',
  'CalendarMeetingMap',
  'CalendarFilters',
  'CalendarViewControls',
  'CalendarDateStatus',
  'TimetableMeetingList',
  'getTimetableMeetingRowsForWindow',
  'getTimetableDataState',
  'getTimetableDateContext',
  'addCalendarDays',
  'context.windowStart',
  'context.windowEndInclusive',
  'scope="rolling-30"',
  'data-calendar-list-view',
]) requireIncludes(japanesePage, marker, japanesePath);

for (const [label, page] of [[englishPath, englishPage], [japanesePath, japanesePage]]) {
  if (page.includes('CalendarDateFocus')) fail(`${label}: legacy CalendarDateFocus must not remain`);
  if (page.includes('CalendarPresentationState')) fail(`${label}: duplicate CalendarPresentationState must not remain`);
  if (page.includes('CalendarLivePlayers')) fail(`${label}: Calendar must not render embedded live-player UI`);
}

for (const marker of [
  'title="Racing calendar | Where Horses Run"',
  'groups={groups}',
  'canonicalPath="/calendar/"',
  'alternatePath="/ja/calendar/"',
  'Selected-day meeting list',
  'data-timezone-window-start',
  'data-timezone-window-end',
]) requireIncludes(englishPage, marker, englishPath);

for (const marker of [
  'title="開催カレンダー | 競馬どこ？"',
  'groups={groupedCalendarRecords}',
  'lang="ja"',
  'canonicalPath="/ja/calendar/"',
  'alternatePath="/calendar/"',
  '選択日の開催一覧',
  '一覧は1日ずつ',
  'data-timezone-window-start',
  'data-timezone-window-end',
]) requireIncludes(japanesePage, marker, japanesePath);

for (const marker of [
  'data-calendar-date-nav',
  'data-filter-date',
  'data-calendar-date-prev',
  'data-calendar-date-next',
  'data-calendar-date-today',
  'fallbackDate',
  "url.searchParams.set('date', selected)",
  'whr:calendardatechange',
  'whr:timezonechange',
]) requireIncludes(dateNav, marker, dateNavPath);
if (dateNav.includes('All 30 days') || dateNav.includes('30日すべて')) {
  fail(`${dateNavPath}: List must not restore the all-30-days option`);
}

for (const marker of [
  'data-calendar-filters',
  'HTMLDetailsElement',
  'root.open = false',
  "(!date.value || row.dataset.date === date.value)",
  'data-filter-country',
  'data-filter-authority',
  'data-filter-rank',
  'deriveMeetingStreamState',
  'whr:calendardatechange',
]) requireIncludes(filters, marker, filtersPath);

for (const marker of [
  'data-calendar-view-list',
  'data-calendar-view-map',
  'data-calendar-map-panel',
  'data-calendar-row-map-focus',
  'data-calendar-map-show-list',
  'selectedDate()',
]) requireIncludes(calendarMap, marker, mapPath);

for (const marker of [
  'data-calendar-view-control="list"',
  'data-calendar-view-control="month"',
  'data-calendar-view-control="map"',
  'data-calendar-month-view',
  'data-calendar-month-date',
  "url.searchParams.set('view', view)",
  'popstate',
  'internalList.click()',
  'internalMap.click()',
  "activate('list')",
]) requireIncludes(viewControls, marker, viewControlsPath);

for (const marker of [
  'deriveMeetingStreamState',
  'matchingEvent',
  'MEETING_STREAM_STATES.LIVE',
  'MEETING_STREAM_STATES.KNOWN',
]) requireIncludes(streamState, marker, streamStatePath);

for (const marker of [
  'groups.map((group) => (',
  'group.records.map((record) => {',
  'class="meeting-row"',
  'data-calendar-meeting-row',
  'data-projection-scope',
  'data-timezone-scope-hidden',
  'meeting-row__identity',
  'meeting-row__system',
  'meeting-row__time',
  'meeting-row__rank',
  'meeting-row__links',
  'raceTime(record)',
  'record.capability_rank',
  'record.detail_path',
  'record.official_source_url',
  'record.live_media',
  "scope === 'rolling-30'",
]) requireIncludes(meetingList, marker, listPath);

if ((meetingList.match(/group\.records\.map\(\(record\) => \{/g) ?? []).length !== 1) {
  fail(`${listPath}: each meeting row must be mapped exactly once`);
}
if (meetingList.includes('<table')) fail(`${listPath}: list pages must not render a full table`);
if (/record\.(?:races|race_rows|programme)\.map/.test(meetingList)) {
  fail(`${listPath}: Calendar must not expand race-by-race rows`);
}

for (const marker of [
  'data-calendar-data-status={dataState.status}',
  'data-timezone-window-start',
  'data-timezone-window-end',
  'data-timezone-label',
  'stale_generation_with_window_records',
  'no_public_records',
]) requireIncludes(dateStatus, marker, statusPath);

const combined = `${englishPage}\n${japanesePage}\n${meetingList}\n${dateStatus}\n${dateNav}\n${filters}\n${calendarMap}\n${viewControls}`;
const fixedCalendarHeadings = [
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+Calendar\b/i,
  /\b\d{4}年(?:1[0-2]|[1-9])月\s*開催カレンダー/,
];
for (const pattern of fixedCalendarHeadings) {
  if (pattern.test(combined)) fail(`Calendar retains fixed month/year copy: ${pattern}`);
}
for (const forbidden of [
  /record\.(?:racecard|card_body|entries?|horses?|jockeys?|trainers?|odds?|results?|payouts?|dividends?|predictions?|tips?|raw_html|stream_url)\b/i,
  /<iframe\b/i,
]) {
  if (forbidden.test(combined)) fail(`Calendar public surface contains forbidden pattern ${forbidden}`);
}

if (errors.length) {
  console.error('Calendar rolling 30-day timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Calendar rolling 30-day timetable UI check passed.');
console.log('ROLLING_30_DAY_BROWSING_SCOPE: pass');
console.log('ONE_DAY_LIST_FOCUS: pass');
console.log('LIST_MONTH_MAP_SHARED_ROWS: pass');
console.log('FILTERS_COLLAPSED_BY_DEFAULT: pass');
console.log('URL_DATE_VIEW_STATE: pass');
console.log('FAIL_CLOSED_STREAM_STATE: pass');
console.log('ONE_MEETING_PER_LIST_ROW: pass');
console.log('TIMEZONE_PROJECTED_WINDOW: pass');
console.log('CURRENT_MEETING_ROW_CONTRACT: pass');