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
  calendarEn: readHtml('dist/calendar/index.html'),
  calendarJa: readHtml('dist/ja/calendar/index.html'),
  todayEn: readHtml('dist/today/index.html'),
  todayJa: readHtml('dist/ja/today/index.html'),
  tomorrowEn: readHtml('dist/tomorrow/index.html'),
  tomorrowJa: readHtml('dist/ja/tomorrow/index.html'),
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
const dayCandidateStart = addCalendarDays(context.today, -2);
const dayCandidateEndExclusive = addCalendarDays(context.today, 4);
const calendarCandidates = filterRecordsForWindow(
  records,
  calendarCandidateStart,
  calendarCandidateEndExclusive,
);
const dayCandidates = filterRecordsForWindow(
  records,
  dayCandidateStart,
  dayCandidateEndExclusive,
);
const fixedCalendarHeadings = [
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+Calendar\b/i,
  /\b\d{4}年(?:1[0-2]|[1-9])月\s*開催カレンダー/,
];

for (const [name, html] of Object.entries(pages)) {
  if (!html.includes(timeZone)) fail(`${name} does not show build-reference timezone ${timeZone}.`);
  if (!html.includes(`data-calendar-data-status="${state.status}"`)) {
    fail(`${name} must report ${state.status}.`);
  }
  for (const pattern of fixedCalendarHeadings) {
    if (pattern.test(html)) fail(`${name} retains fixed month/year Calendar copy.`);
  }
  for (const marker of ['data-display-timezone-root', 'data-display-timezone-select', 'data-source-date=', 'data-source-timezone=', 'data-timezone-scope-hidden=']) {
    if (!html.includes(marker)) fail(`${name} missing rendered timezone-projection marker ${marker}.`);
  }
}

if (!pages.calendarEn.includes('30-day racing calendar')) fail('English Calendar title is not dynamic.');
if (!pages.calendarJa.includes('30日間の開催カレンダー')) fail('Japanese Calendar title is not dynamic.');
if (!pages.calendarEn.includes(context.windowEndInclusive) || !pages.calendarJa.includes(context.windowEndInclusive)) {
  fail(`Calendar pages do not show build-reference window end ${context.windowEndInclusive}.`);
}
if (!pages.todayEn.includes(context.today) || !pages.todayJa.includes(context.today)) {
  fail(`Today pages do not show build-reference date ${context.today}.`);
}
if (!pages.tomorrowEn.includes(context.tomorrow) || !pages.tomorrowJa.includes(context.tomorrow)) {
  fail(`Tomorrow pages do not show build-reference date ${context.tomorrow}.`);
}

for (const [name, html, canonicalCandidates, candidateStart, candidateEndExclusive] of [
  ['calendarEn', pages.calendarEn, calendarCandidates, calendarCandidateStart, calendarCandidateEndExclusive],
  ['calendarJa', pages.calendarJa, calendarCandidates, calendarCandidateStart, calendarCandidateEndExclusive],
  ['todayEn', pages.todayEn, dayCandidates, dayCandidateStart, dayCandidateEndExclusive],
  ['todayJa', pages.todayJa, dayCandidates, dayCandidateStart, dayCandidateEndExclusive],
  ['tomorrowEn', pages.tomorrowEn, dayCandidates, dayCandidateStart, dayCandidateEndExclusive],
  ['tomorrowJa', pages.tomorrowJa, dayCandidates, dayCandidateStart, dayCandidateEndExclusive],
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
assertSameMeetingIds('todayEn', pages.todayEn, 'todayJa', pages.todayJa);
assertSameMeetingIds('tomorrowEn', pages.tomorrowEn, 'tomorrowJa', pages.tomorrowJa);

for (const [name, html, scope] of [
  ['calendarEn', pages.calendarEn, 'rolling-30'],
  ['calendarJa', pages.calendarJa, 'rolling-30'],
  ['todayEn', pages.todayEn, 'today'],
  ['todayJa', pages.todayJa, 'today'],
  ['tomorrowEn', pages.tomorrowEn, 'tomorrow'],
  ['tomorrowJa', pages.tomorrowJa, 'tomorrow'],
]) {
  if (!html.includes(`data-projection-scope="${scope}"`)) fail(`${name} missing rendered projection scope ${scope}.`);
}

const meetingListSource = readFileSync(path.join(root, 'src/components/TimetableMeetingList.astro'), 'utf8');
for (const marker of ["scope === 'today'", "scope === 'tomorrow'", "scope === 'rolling-30'", 'formatProjectedDate(firstInstant, timeZone)', 'row.dataset.timezoneScopeHidden', 'whr:timezonechange']) {
  if (!meetingListSource.includes(marker)) fail(`projection runtime missing ${marker}.`);
}

if (calendarCandidates.length < windowRecords.length) fail('Calendar candidate window must include the build-reference 30-day window.');
if (dayCandidates.length < todayRecords.length || dayCandidates.length < tomorrowRecords.length) fail('Day candidate window must include build-reference Today and Tomorrow records.');

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
console.log(`DAY_CANONICAL_CANDIDATES: ${dayCandidates.length}`);
console.log(`REVIEWED_PUBLIC_EXCLUSIONS: ${reviewedPublicExcludedMeetingIds.size}`);
console.log('BILINGUAL_CALENDAR_TODAY_TOMORROW: pass');
console.log('TIMEZONE_PROJECTION_CANDIDATES: pass');
console.log('FIXED_MONTH_YEAR_COPY: 0');
