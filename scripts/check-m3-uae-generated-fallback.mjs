import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readText = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const requireIncludes = (text, needle, label) => {
  if (!text.includes(needle)) fail(`${label}: missing '${needle}'`);
};

const sources = readJson('data/static/sources.json');
const fetchStatus = readJson('data/generated/fetch-status.json');
const publicMeetings = readJson('data/generated/timetable/public/meeting-list.json');
const countryPage = readText('src/pages/countries/[slug].astro');
const jaCountryPage = readText('src/pages/ja/countries/[slug].astro');
const countryComponent = readText('src/components/CountryDetailPage.astro');
const publicViewModel = readText('src/lib/timetable/publicTimetableViewModel.ts');

const uaeSource = sources.find((source) => source.id === 'uae-era-home');
if (!uaeSource) {
  fail('sources: uae-era-home is missing');
} else if (uaeSource.m3_status !== 'alpha_link_first') {
  fail('sources: uae-era-home should retain the historical alpha_link_first marker');
}

const uaeFetchStatus = (fetchStatus.sources ?? []).find((status) => status.source_id === 'uae-era-home');
if (!uaeFetchStatus) {
  fail('fetch-status: uae-era-home is missing');
} else if (uaeFetchStatus.status !== 'skipped') {
  fail('fetch-status: legacy uae-era-home should remain skipped');
}

for (const [label, text, locale] of [
  ['English country route', countryPage, 'en'],
  ['Japanese country route', jaCountryPage, 'ja'],
]) {
  requireIncludes(text, 'CountryDetailPage', label);
  requireIncludes(text, `locale="${locale}"`, label);
}

for (const phrase of [
  'getPublicTimetableMeetingRowsByCountry',
  'createCalendarDateContext',
  'filterRecordsForWindow',
  "pick('Upcoming meetings', '近日開催')",
  "pick('Official sources', '公式ソース')",
  'This section shows currently available verified meeting records.',
  'この欄は、現在利用できる確認済み開催レコードを表示しています。',
  'No verified meeting records are currently linked to this country page.',
  'これは、この国で開催がないことを意味しません。',
  'racecards, entries, odds, results, and payouts are not reproduced here',
  '出走表、馬名、騎手、オッズ、結果、払戻は掲載しません',
]) requireIncludes(countryComponent, phrase, 'Public v1 country component');

for (const phrase of ['effective_public_rank', 'detail_path', 'official_source_url']) {
  requireIncludes(publicViewModel, phrase, 'Public Timetable view model');
}

const uaeMeetings = (publicMeetings.meetings ?? []).filter((meeting) => meeting.country_id === 'united-arab-emirates');
if (uaeMeetings.length === 0) fail('Public v1 UAE meeting projection is empty');
for (const meeting of uaeMeetings) {
  if (!['C', 'B', 'B+', 'A', 'A+'].includes(meeting.effective_public_rank)) fail(`${meeting.meeting_id}: invalid effective public rank`);
  if (meeting.timezone !== 'Asia/Dubai') fail(`${meeting.meeting_id}: UAE public timezone differs`);
  if (typeof meeting.official_source_url !== 'string' || !meeting.official_source_url.startsWith('https://')) fail(`${meeting.meeting_id}: official source URL missing`);
}

for (const retiredPhrase of [
  'hasAlphaCoverage',
  'Generated coverage fallback',
  'No live timetable',
  'live timetableを取得',
]) {
  if (countryPage.includes(retiredPhrase) || jaCountryPage.includes(retiredPhrase) || countryComponent.includes(retiredPhrase)) {
    fail(`retired M3 UAE country-page phrase remains: ${retiredPhrase}`);
  }
}

if (errors.length) {
  console.error('M3 UAE source boundary and Public v1 country UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('M3 UAE source boundary and Public v1 country UI check passed.');
console.log('LEGACY_ALPHA_SOURCE: retained_as_historical_marker');
console.log(`PUBLIC_V1_UAE_MEETINGS: ${uaeMeetings.length}`);
console.log('BILINGUAL_SAFETY_COPY: pass');
