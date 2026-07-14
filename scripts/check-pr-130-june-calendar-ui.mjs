import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const expectedGroups = [
  ['japan', 'jra'], ['japan', 'nar'], ['japan', 'banei'], ['hong-kong', 'hkjc'],
  ['united-arab-emirates', 'era'], ['united-kingdom', 'bha'], ['united-kingdom', 'point-to-point'],
  ['united-kingdom', 'purebred-arabian'], ['ireland', 'hri'], ['france', 'france-galop'],
  ['france', 'letrot'], ['australia', 'racing-australia-thoroughbred'], ['australia', 'harness-australia'],
  ['new-zealand', 'loveracing-thoroughbred'], ['new-zealand', 'hrnz-harness'], ['canada', 'woodbine-thoroughbred'],
  ['canada', 'standardbred-canada'], ['south-africa', 'nhra'], ['south-africa', '4racing'],
  ['south-africa', 'gold-circle'], ['south-korea', 'kra'], ['singapore', 'singapore-turf-club'],
  ['united-states', 'equibase-thoroughbred'], ['united-states', 'usta-harness'], ['united-states', 'aqha-quarter-horse']
];

const terminalCoverageStatuses = new Set(['no_june_meetings', 'legacy_no_active_racing']);
const allowedRouteStatuses = new Set(['manual_route_confirmed', 'route_identified_partial_extraction', 'route_not_yet_extractable']);

function fail(message) {
  console.error(`[pr-130-june-calendar-ui] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function groupKey(item) {
  return `${item.country_id}::${item.group_id}`;
}

function explicitRecords(data) {
  return (data.record_sets ?? []).flatMap((set) => set.meetings.map(([meeting_date, racecourse]) => ({
    country_id: set.country_id,
    group_id: set.group_id,
    meeting_date,
    racecourse,
    data_level: set.data_level,
    data_origin: 'real_source',
    source_trace: set.source_trace
  })));
}

const data = readJson('data/generated/timetable/june-2026-calendar.json');
const routes = readJson('data/generated/timetable/june-2026-source-routes.json');
const currentPage = read('src/pages/major-countries/current-timetable.astro');
const calendarPage = read('src/pages/calendar/index.astro');
const meetingList = read('src/components/TimetableMeetingList.astro');
const rowAdapter = read('src/data/timetableMeetingRows.ts');
const publicList = readJson('data/generated/timetable/public/meeting-list.json');
const records = explicitRecords(data);
const coverageStatus = data.coverage_status ?? [];

if (data.schema_version !== 'june-2026-calendar-v0') fail('Unexpected historical June schema.');
if (data.month !== '2026-06') fail('Unexpected historical month.');
if (routes.schema_version !== 'june-2026-source-routes-v0') fail('Unexpected source routes schema.');
if (routes.month !== '2026-06') fail('Unexpected source routes month.');

const routeByGroup = new Map();
for (const route of routes.routes ?? []) {
  if (!allowedRouteStatuses.has(route.status)) fail(`${groupKey(route)}: unsupported route status ${route.status}.`);
  if (!route.source_url?.startsWith('https://')) fail(`${groupKey(route)}: route source_url missing.`);
  if (!route.parser) fail(`${groupKey(route)}: route parser missing.`);
  if (!route.reusable_next_step) fail(`${groupKey(route)}: route reusable_next_step missing.`);
  routeByGroup.set(groupKey(route), route);
}

const satisfiedGroupKeys = new Set(records.map(groupKey));
for (const statusRecord of coverageStatus) {
  if (!terminalCoverageStatuses.has(statusRecord.status)) fail(`${groupKey(statusRecord)}: unsupported coverage status ${statusRecord.status}.`);
  if (!statusRecord.source_trace?.source_url?.startsWith('https://')) fail(`${groupKey(statusRecord)}: source URL missing.`);
  if (!statusRecord.source_trace?.parser) fail(`${groupKey(statusRecord)}: parser missing.`);
  if (!statusRecord.source_trace?.last_checked) fail(`${groupKey(statusRecord)}: last_checked missing.`);
  satisfiedGroupKeys.add(groupKey(statusRecord));
}

const incompleteHistoricalGroups = [];
for (const [countryId, groupId] of expectedGroups) {
  const key = `${countryId}::${groupId}`;
  const route = routeByGroup.get(key);
  if (!route) fail(`Missing reusable historical source route for ${countryId}/${groupId}.`);
  if (!satisfiedGroupKeys.has(key) || route.status === 'route_not_yet_extractable') {
    incompleteHistoricalGroups.push({ key, route_status: route.status });
  }
}

for (const record of records) {
  if (record.data_origin !== 'real_source') fail(`${groupKey(record)}: data_origin must be real_source.`);
  if (!['A', 'B', 'C'].includes(record.data_level)) fail(`${groupKey(record)}: data_level must be A/B/C.`);
  if (!record.meeting_date?.startsWith('2026-06-')) fail(`${groupKey(record)}: meeting_date must be in June 2026.`);
  if (!record.racecourse) fail(`${groupKey(record)}: racecourse missing.`);
  if (!record.source_trace?.source_url?.startsWith('https://')) fail(`${groupKey(record)}: source URL missing.`);
  if (!record.source_trace?.parser) fail(`${groupKey(record)}: parser missing.`);
  if (!record.source_trace?.last_checked) fail(`${groupKey(record)}: last_checked missing.`);
}

for (const [label, content] of [
  ['src/pages/calendar/index.astro', calendarPage],
  ['src/pages/major-countries/current-timetable.astro', currentPage],
]) {
  if (!content.includes('TimetableMeetingList')) fail(`${label}: must render the Public v1 meeting list.`);
  if (content.includes('normalizedTimetableCalendarPreviewRecords')) fail(`${label}: must not restore the retired June preview runtime.`);
  if (content.includes('june-2026-calendar.json')) fail(`${label}: must not import historical June data directly.`);
}
if (!calendarPage.includes('getCurrentCalendarWindowGroups')) fail('Calendar page must use the dynamic Public v1 30-day window.');
if (!currentPage.includes('getGroupedTimetableMeetingRows')) fail('Current timetable page must use Public v1 grouped rows.');
for (const marker of [
  'group.records.map((record) => (',
  '<li class="meeting-card">',
  'record.official_source_url',
  'record.detail_path',
]) {
  if (!meetingList.includes(marker)) fail(`TimetableMeetingList must include ${marker}.`);
}
if (meetingList.includes('<table')) fail('Public timetable surfaces must remain one meeting per list row.');
if (/record\.(?:races|race_rows|timetable_rows|programme)\.map/.test(meetingList)) {
  fail('Public list surfaces must not expand race-by-race rows.');
}
if (!rowAdapter.includes('getPublicTimetableMeetingRows')) fail('Timetable row adapter must use Public v1 meeting rows.');
if (publicList.schema_version !== 'public-timetable-meeting-list-v0') fail('Unexpected Public v1 meeting-list schema.');
if (!Array.isArray(publicList.meetings) || publicList.meetings.length === 0) fail('Public v1 meeting list must not be empty.');

console.log(`[pr-130-june-calendar-ui] PASS ${records.length} historical records / ${satisfiedGroupKeys.size} covered groups / ${routeByGroup.size} routes / ${incompleteHistoricalGroups.length} retained historical gaps; Public v1 runtime active`);
