import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  errors.push(message);
}

function requireIncludes(content, needle, label) {
  if (!content.includes(needle)) fail(`${label}: missing ${needle}`);
}

const englishRoutePath = 'src/pages/countries/[slug].astro';
const japaneseRoutePath = 'src/pages/ja/countries/[slug].astro';
const componentPath = 'src/components/CountryDetailPage.astro';
const viewModelPath = 'src/lib/timetable/publicTimetableViewModel.ts';
const dataPath = 'data/generated/timetable/public/meeting-list.json';

const englishRoute = read(englishRoutePath);
const japaneseRoute = read(japaneseRoutePath);
const component = read(componentPath);
const viewModel = read(viewModelPath);
const publicMeetings = JSON.parse(read(dataPath));

for (const [label, route, locale] of [
  [englishRoutePath, englishRoute, 'en'],
  [japaneseRoutePath, japaneseRoute, 'ja'],
]) {
  requireIncludes(route, 'CountryDetailPage', label);
  requireIncludes(route, `locale="${locale}"`, label);
}

for (const marker of [
  'getPublicTimetableMeetingRowsByCountry',
  'createCalendarDateContext',
  'filterRecordsForWindow',
  'activeWindowRecords',
  'upcomingMeetings',
  'primaryMeetings',
  'remainingMeetings',
  'showMeetingDetails',
  'record.official_source_url',
  'record.detail_path',
  'One row represents one meeting',
  '1行につき1開催',
  'does not mean there is no racing',
  '開催がないことを意味しません',
]) requireIncludes(component, marker, componentPath);

for (const marker of [
  'meeting-list.json',
  'meeting-details.json',
  'getPublicTimetableMeetingRowsByCountry',
  'effective_public_rank',
  'official_source_url',
]) requireIncludes(viewModel, marker, viewModelPath);

if (publicMeetings.schema_version !== 'public-timetable-meeting-list-v0') {
  fail(`${dataPath}: schema must be public-timetable-meeting-list-v0`);
}
if (!Array.isArray(publicMeetings.meetings) || publicMeetings.meetings.length === 0) {
  fail(`${dataPath}: must contain reviewed public meetings`);
}

if (!component.includes('<table class="country-table">')) {
  fail(`${componentPath}: must render the one-meeting-per-row country timetable table`);
}
if (!component.includes('primaryMeetings.map((record) => (') || !component.includes('remainingMeetings.map((record) => (')) {
  fail(`${componentPath}: must render each meeting record independently`);
}
if (/record\.(?:races|race_rows|timetable_rows|programme)\.map/.test(component)) {
  fail(`${componentPath}: country listing must not expand race-by-race programme rows`);
}

const combined = `${englishRoute}\n${japaneseRoute}\n${component}\n${viewModel}`;
for (const forbidden of [
  /record\.(?:racecard|card_body|entries?|horses?|jockeys?|trainers?|odds?|results?|payouts?|dividends?|predictions?|tips?|raw_html|stream_url)\b/i,
  /<iframe\b/i,
]) {
  if (forbidden.test(combined)) fail(`Country Public v1 timetable surface contains forbidden pattern ${forbidden}`);
}

if (errors.length) {
  console.error('Country Public v1 timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Country Public v1 timetable UI check passed.');
console.log(`PUBLIC_MEETINGS: ${publicMeetings.meetings.length}`);
console.log('COUNTRY_ONE_MEETING_PER_ROW: pass');
