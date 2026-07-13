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
const countryPage = readText('src/pages/countries/[slug].astro');
const jaCountryPage = readText('src/pages/ja/countries/[slug].astro');
const countryComponent = readText('src/components/CountryDetailPage.astro');
const publicViewModel = readText('src/lib/timetable/publicTimetableViewModel.ts');

const hongKongSource = sources.find((source) => source.id === 'hong-kong-hkjc-home');
if (!hongKongSource) {
  fail('sources: hong-kong-hkjc-home is missing');
} else {
  requireIncludes(hongKongSource.notes ?? '', 'Link-first and dry-run only', 'hong-kong source notes');
  requireIncludes(hongKongSource.notes ?? '', 'Do not republish racecards', 'hong-kong source notes');
  if (hongKongSource.m3_status !== 'alpha_link_first') fail('hong-kong source m3_status: expected alpha_link_first');
}

const hongKongFetchStatus = (fetchStatus.sources ?? []).find((status) => status.source_id === 'hong-kong-hkjc-home');
if (!hongKongFetchStatus) {
  fail('fetch-status: hong-kong-hkjc-home is missing');
} else {
  if (hongKongFetchStatus.status !== 'skipped') fail('fetch-status: hong-kong-hkjc-home should remain skipped');
  requireIncludes(hongKongFetchStatus.message ?? '', 'Live fetching is not enabled', 'hong-kong FetchStatus message');
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
  "'hong-kong-hkjc-home': { en: 'HKJC official site', ja: 'HKJC公式サイト' }",
  "pick('Upcoming meetings', '近日開催')",
  "pick('Official sources', '公式ソース')",
  'This section shows currently available verified meeting records.',
  'この欄は、現在利用できる確認済み開催レコードを表示しています。',
  'No verified meeting records are currently linked to this country page.',
  'これは、この国で開催がないことを意味しません。',
  'racecards, entries, odds, results, and payouts are not reproduced here',
  '出走表、馬名、騎手、オッズ、結果、払戻は掲載しません',
]) requireIncludes(countryComponent, phrase, 'Public v1 country component');

for (const phrase of [
  'effective_public_rank',
  'detail_path',
  'official_source_url',
]) requireIncludes(publicViewModel, phrase, 'Public Timetable view model');

for (const retiredPhrase of [
  'Alpha timetable coverage',
  'FetchStatus coverage',
]) {
  if (countryPage.includes(retiredPhrase) || jaCountryPage.includes(retiredPhrase) || countryComponent.includes(retiredPhrase)) {
    fail(`retired M3 country-page phrase remains: ${retiredPhrase}`);
  }
}

if (errors.length) {
  console.error('M3 Hong Kong / Public v1 country UI verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('M3 Hong Kong source boundary and Public v1 country UI verification passed.');
console.log('LEGACY_LINK_FIRST_SOURCE: retained');
console.log('COUNTRY_PAGE_SURFACE: Public v1 verified meeting records');
console.log('BILINGUAL_SAFETY_COPY: pass');
