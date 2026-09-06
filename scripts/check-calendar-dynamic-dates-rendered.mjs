import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  addCalendarDays,
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

function extractMeetingRows(html) {
  const tags = html.match(/<li\b[^>]*\bdata-calendar-meeting-row\b[^>]*>/g) ?? [];
  const attribute = (tag, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? '';
  return tags.map((tag) => ({
    meetingId: attribute(tag, 'data-meeting-id'),
    sourceDate: attribute(tag, 'data-source-date'),
  }));
}

function assertSameMeetingIds(leftName, leftHtml, rightName, rightHtml) {
  const left = extractMeetingRows(leftHtml).map((row) => row.meetingId).filter(Boolean).sort();
  const right = extractMeetingRows(rightHtml).map((row) => row.meetingId).filter(Boolean).sort();
  if (left.length !== right.length || left.some((meetingId, index) => meetingId !== right[index])) {
    fail(`${leftName} and ${rightName} render different meeting-ID candidate sets.`);
  }
}

const pages = {
  homeEn: readHtml('dist/index.html'),
  homeJa: readHtml('dist/ja/index.html'),
  calendarEn: readHtml('dist/calendar/index.html'),
  calendarJa: readHtml('dist/ja/calendar/index.html'),
  retiredTodayEn: readHtml('dist/today/index.html'),
  retiredTodayJa: readHtml('dist/ja/today/index.html'),
  retiredTomorrowEn: readHtml('dist/tomorrow/index.html'),
  retiredTomorrowJa: readHtml('dist/ja/tomorrow/index.html'),
};

const publicData = JSON.parse(readFileSync(path.join(root, 'data/generated/timetable/public/meeting-list.json'), 'utf8'));
const publicViewModelSource = readFileSync(path.join(root, 'src/lib/timetable/publicTimetableViewModel.ts'), 'utf8');
const reviewedExcludedBlock = /const reviewedPublicExcludedMeetingIds = new Set<string>\(\[([\s\S]*?)\]\);/.exec(publicViewModelSource)?.[1] ?? '';
const reviewedPublicExcludedMeetingIds = new Set(
  [...reviewedExcludedBlock.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]),
);
const context = createCalendarDateContext({ referenceDate, timeZone });
const records = publicData.meetings ?? [];
const state = evaluateCalendarDataState({ records, generatedAt: publicData.generated_at, context });
const windowRecords = filterRecordsForWindow(records, context.windowStart, context.windowEndExclusive);
const todayRecords = filterRecordsForDate(records, context.today);
const tomorrowRecords = filterRecordsForDate(records, context.tomorrow);
const calendarCandidateStart = addCalendarDays(context.windowStart, -2);
const calendarCandidateEndExclusive = addCalendarDays(context.windowEndExclusive, 2);
const homeCandidateStart = addCalendarDays(context.today, -2);
const homeCandidateEndExclusive = addCalendarDays(context.today, 10);
const calendarCandidates = filterRecordsForWindow(records, calendarCandidateStart, calendarCandidateEndExclusive);
const homeCandidates = filterRecordsForWindow(records, homeCandidateStart, homeCandidateEndExclusive);
const fixedCalendarHeadings = [
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+Calendar\b/i,
  /\b\d{4}年(?:1[0-2]|[1-9])月\s*開催カレンダー/,
];

const projectionPages = [
  ['homeEn', pages.homeEn],
  ['homeJa', pages.homeJa],
  ['calendarEn', pages.calendarEn],
  ['calendarJa', pages.calendarJa],
];
for (const [name, html] of projectionPages) {
  if (!html.includes(timeZone)) fail(`${name} does not show build-reference timezone ${timeZone}.`);
  for (const pattern of fixedCalendarHeadings) {
    if (pattern.test(html)) fail(`${name} retains fixed month/year Calendar copy.`);
  }
  for (const marker of ['data-display-timezone-root', 'data-display-timezone-select', 'data-source-date=', 'data-source-timezone=', 'data-timezone-scope-hidden=']) {
    if (!html.includes(marker)) fail(`${name} missing rendered timezone-projection marker ${marker}.`);
  }
}

for (const [name, html] of [['calendarEn', pages.calendarEn], ['calendarJa', pages.calendarJa]]) {
  if (!html.includes(`data-calendar-data-status="${state.status}"`)) fail(`${name} must report ${state.status}.`);
}
if (!pages.calendarEn.includes('<h1 id="page-title">Calendar</h1>')) fail('English Calendar does not render the Calendar heading.');
if (!pages.calendarJa.includes('<h1 id="page-title">カレンダー</h1>')) fail('Japanese Calendar does not render the Calendar heading.');
for (const [name, html] of [['calendarEn', pages.calendarEn], ['calendarJa', pages.calendarJa]]) {
  for (const marker of ['data-calendar-date-nav', 'data-filter-date', 'data-calendar-view-list', 'data-calendar-view-map', 'data-calendar-filters', 'data-calendar-list-view']) {
    if (!html.includes(marker)) fail(`${name} missing rendered Calendar marker ${marker}.`);
  }
}
if (!pages.calendarEn.includes(context.windowEndInclusive) || !pages.calendarJa.includes(context.windowEndInclusive)) {
  fail(`Calendar pages do not show build-reference window end ${context.windowEndInclusive}.`);
}

for (const [name, html] of [['homeEn', pages.homeEn], ['homeJa', pages.homeJa]]) {
  for (const marker of [
    'data-home-meeting-window',
    'data-meeting-range="today"',
    'data-meeting-range="tomorrow"',
    'data-meeting-range="next7"',
    'data-today-timezone',
    'data-today-map-sync',
    'data-today-practical-list',
    'data-projection-scope="all"',
  ]) {
    if (!html.includes(marker)) fail(`${name} missing unified Home marker ${marker}.`);
  }
}

for (const [name, html, canonicalCandidates, candidateStart, candidateEndExclusive] of [
  ['calendarEn', pages.calendarEn, calendarCandidates, calendarCandidateStart, calendarCandidateEndExclusive],
  ['calendarJa', pages.calendarJa, calendarCandidates, calendarCandidateStart, calendarCandidateEndExclusive],
  ['homeEn', pages.homeEn, homeCandidates, homeCandidateStart, homeCandidateEndExclusive],
  ['homeJa', pages.homeJa, homeCandidates, homeCandidateStart, homeCandidateEndExclusive],
]) {
  const renderedRows = extractMeetingRows(html);
  const renderedIds = new Set(renderedRows.map((row) => row.meetingId).filter(Boolean));
  if (renderedRows.length === 0) fail(`${name} renders no timezone candidate rows.`);
  if (renderedIds.size !== renderedRows.length) {
    fail(`${name} renders duplicate or missing meeting IDs: rows=${renderedRows.length}, unique_ids=${renderedIds.size}.`);
  }
  const malformedRows = renderedRows.filter((row) => !row.meetingId || !/^\d{4}-\d{2}-\d{2}$/.test(row.sourceDate));
  if (malformedRows.length) fail(`${name} has ${malformedRows.length} candidate rows without a valid meeting ID/source date.`);
  const outOfWindowRows = renderedRows.filter((row) => row.sourceDate < candidateStart || row.sourceDate >= candidateEndExclusive);
  if (outOfWindowRows.length) {
    fail(`${name} has ${outOfWindowRows.length} candidate rows outside ${candidateStart}..${candidateEndExclusive}.`);
  }
  const missingCanonical = canonicalCandidates.filter(
    (record) => !renderedIds.has(record.meeting_id) && !reviewedPublicExcludedMeetingIds.has(record.meeting_id),
  );
  if (missingCanonical.length) {
    fail(`${name} omits ${missingCanonical.length} non-excluded canonical candidate rows (${missingCanonical.slice(0, 5).map((record) => record.meeting_id).join(', ')}).`);
  }
}

assertSameMeetingIds('calendarEn', pages.calendarEn, 'calendarJa', pages.calendarJa);
assertSameMeetingIds('homeEn', pages.homeEn, 'homeJa', pages.homeJa);

for (const [name, html, scope] of [
  ['calendarEn', pages.calendarEn, 'rolling-30'],
  ['calendarJa', pages.calendarJa, 'rolling-30'],
  ['homeEn', pages.homeEn, 'all'],
  ['homeJa', pages.homeJa, 'all'],
]) {
  if (!html.includes(`data-projection-scope="${scope}"`)) fail(`${name} missing rendered projection scope ${scope}.`);
}

const retiredRoutes = [
  ['retiredTodayEn', pages.retiredTodayEn, 'https://whr.badjoke-lab.com/', '0;url=/'],
  ['retiredTodayJa', pages.retiredTodayJa, 'https://whr.badjoke-lab.com/ja/', '0;url=/ja/'],
  ['retiredTomorrowEn', pages.retiredTomorrowEn, 'https://whr.badjoke-lab.com/', '0;url=/?range=tomorrow'],
  ['retiredTomorrowJa', pages.retiredTomorrowJa, 'https://whr.badjoke-lab.com/ja/', '0;url=/ja/?range=tomorrow'],
];
for (const [name, html, canonical, refresh] of retiredRoutes) {
  if (!html.includes(`rel="canonical" href="${canonical}"`)) fail(`${name} does not canonicalize to Home.`);
  if (!html.includes(`content="${refresh}"`)) fail(`${name} does not redirect to the unified Home view.`);
  if (extractMeetingRows(html).length !== 0) fail(`${name} must not retain a second rendered meeting list.`);
}

const meetingListSource = readFileSync(path.join(root, 'src/components/TimetableMeetingList.astro'), 'utf8');
for (const marker of ["scope === 'today'", "scope === 'tomorrow'", "scope === 'rolling-30'", 'formatProjectedDate(firstInstant, timeZone)', 'row.dataset.timezoneScopeHidden', 'whr:timezonechange']) {
  if (!meetingListSource.includes(marker)) fail(`projection runtime missing ${marker}.`);
}
const todayFiltersSource = readFileSync(path.join(root, 'src/components/TodayFilters.astro'), 'utf8');
for (const marker of ["new Set(['today', 'tomorrow', 'next7'])", "activeRange === 'tomorrow'", "activeRange === 'next7'", "url.searchParams.set('range', activeRange)"]) {
  if (!todayFiltersSource.includes(marker)) fail(`unified Home range runtime missing ${marker}.`);
}

if (calendarCandidates.length < windowRecords.length) fail('Calendar candidate window must include the build-reference 30-day window.');
if (homeCandidates.length < todayRecords.length || homeCandidates.length < tomorrowRecords.length) fail('Home candidate window must include build-reference Today and Tomorrow records.');

if (errors.length) {
  console.error(`CALENDAR_DYNAMIC_DATES_RENDERED: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_DYNAMIC_DATES_RENDERED: pass reference_date=${context.today} timezone=${timeZone}`);
console.log(`DATA_STATUS: ${state.status}`);
console.log(`WINDOW_MEETINGS: ${windowRecords.length}`);
console.log(`CALENDAR_CANONICAL_CANDIDATES: ${calendarCandidates.length}`);
console.log(`TODAY_MEETINGS: ${todayRecords.length}`);
console.log(`TOMORROW_MEETINGS: ${tomorrowRecords.length}`);
console.log(`HOME_CANONICAL_CANDIDATES: ${homeCandidates.length}`);
console.log(`REVIEWED_PUBLIC_EXCLUSIONS: ${reviewedPublicExcludedMeetingIds.size}`);
console.log('BILINGUAL_HOME_CALENDAR: pass');
console.log('RETIRED_TODAY_TOMORROW_ROUTES: pass');
console.log('TIMEZONE_PROJECTION_CANDIDATES: pass');
console.log('UNIFIED_HOME_RENDERED_WINDOW: pass');
console.log('FIXED_MONTH_YEAR_COPY: 0');
