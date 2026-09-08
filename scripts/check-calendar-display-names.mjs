import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('../data/static/racecourse-display-names-v1.json', import.meta.url), 'utf8'));
assert.equal(registry.schema_version, '1.0.0');
assert.ok(Array.isArray(registry.entries), 'display registry entries must be an array');

const allowedStatuses = new Set(['established', 'reviewed_transliteration', 'none']);
const seen = new Set();
const byId = new Map();
for (const entry of registry.entries) {
  assert.equal(typeof entry.racecourse_id, 'string');
  assert.ok(entry.racecourse_id.length > 0, 'racecourse_id must be non-empty');
  assert.ok(!seen.has(entry.racecourse_id), `duplicate racecourse display entry ${entry.racecourse_id}`);
  seen.add(entry.racecourse_id);
  byId.set(entry.racecourse_id, entry);
  assert.equal(typeof entry.name_en, 'string', `${entry.racecourse_id}: name_en required`);
  assert.ok(entry.name_en.length > 0, `${entry.racecourse_id}: name_en must be non-empty`);
  assert.ok(allowedStatuses.has(entry.name_ja_status), `${entry.racecourse_id}: unsupported name_ja_status ${entry.name_ja_status}`);
  assert.ok(Array.isArray(entry.search_aliases), `${entry.racecourse_id}: search_aliases must be an array`);
  assert.ok(entry.search_aliases.includes(entry.name_en), `${entry.racecourse_id}: search aliases must include English name`);
  if (entry.name_ja_status === 'none') {
    assert.ok(entry.name_ja === null || entry.name_ja === '', `${entry.racecourse_id}: status none must not publish a Japanese name`);
  } else {
    assert.equal(typeof entry.name_ja, 'string', `${entry.racecourse_id}: reviewed Japanese status requires name_ja`);
    assert.ok(entry.name_ja.length > 0, `${entry.racecourse_id}: reviewed Japanese name must be non-empty`);
    assert.ok(entry.search_aliases.includes(entry.name_ja), `${entry.racecourse_id}: aliases must include reviewed Japanese name`);
  }
}

for (const [id, expectedJa] of [
  ['mizusawa-racecourse', '水沢競馬場'],
  ['kawasaki-racecourse', '川崎競馬場'],
  ['sonoda-racecourse', '園田競馬場'],
  ['monbetsu-racecourse', '門別競馬場'],
  ['sha-tin-racecourse', '沙田競馬場'],
  ['meydan-racecourse', 'メイダン競馬場'],
]) {
  assert.equal(byId.get(id)?.name_ja, expectedJa, `${id}: reviewed Japanese display name changed unexpectedly`);
}

assert.equal(byId.has('kocaeli-racecourse'), false, 'Kocaeli must remain English/Latin fallback until a Japanese name is explicitly reviewed');

const resolverSource = readFileSync(new URL('../src/lib/calendarDisplayNames.ts', import.meta.url), 'utf8');
const listSource = readFileSync(new URL('../src/components/TimetableMeetingList.astro', import.meta.url), 'utf8');
const filtersSource = readFileSync(new URL('../src/components/CalendarFilters.astro', import.meta.url), 'utf8');
const mapSource = readFileSync(new URL('../src/components/CalendarMeetingMap.astro', import.meta.url), 'utf8');
const jaPageSource = readFileSync(new URL('../src/pages/ja/calendar/index.astro', import.meta.url), 'utf8');
const directoryDataSource = readFileSync(new URL('../src/lib/racecourse-filter-data.ts', import.meta.url), 'utf8');
const directoryPageSource = readFileSync(new URL('../src/components/RacecourseDirectoryPage.astro', import.meta.url), 'utf8');

for (const marker of [
  'racecourse-display-names-v1.json',
  "nameJaStatus === 'established' || nameJaStatus === 'reviewed_transliteration'",
  'names.nameJa ?? names.nameEn',
]) {
  assert.match(resolverSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `display resolver missing ${marker}`);
}
assert.doesNotMatch(resolverSource, /toKana|kuroshiro|wanakana/i, 'runtime transliteration must not be introduced');
assert.doesNotMatch(listSource, /jaRacecourseLabelById/, 'Calendar List must not retain an ad hoc Japanese racecourse dictionary');
for (const marker of [
  'getCalendarRacecourseDisplayName',
  'getCalendarRacecourseSearchAliases',
  'getCalendarCountryDisplayName',
  'getCalendarAuthorityDisplayName',
  'data-racecourse-search',
]) {
  assert.match(listSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Calendar List missing shared display marker ${marker}`);
}
for (const marker of ['getCalendarCountryDisplayName', 'getCalendarAuthorityDisplayName']) {
  assert.match(filtersSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Calendar Filters missing ${marker}`);
}
assert.match(mapSource, /row\.dataset\.meetingPresentationState/, 'Calendar Map must use rank-aware presentation state');

for (const marker of [
  "{isJapanese ? '一覧' : 'List'}",
  "{isJapanese ? '地図' : 'Map'}",
  "{isJapanese ? '一覧で見る' : 'Show in List'}",
]) {
  assert.match(mapSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Calendar Map missing locale-aware control ${marker}`);
}

const combinedCalendarSource = `${listSource}\n${filtersSource}\n${mapSource}\n${jaPageSource}`;
for (const obsoletePattern of [
  /'今日これから'/,
  /'公式配信元 ↗'/,
  /'● 現在配信中 ↗'/,
  /data-stream-live-badge/,
]) {
  assert.doesNotMatch(combinedCalendarSource, obsoletePattern, `Calendar retains obsolete presentation pattern ${obsoletePattern}`);
}

for (const marker of [
  'getCalendarRacecourseDisplayName',
  'getCalendarRacecourseDisplayNames',
  'getCalendarCountryDisplayName',
  'getCalendarAuthorityDisplayName',
  'getCurrentCalendarWindowMeetingRows',
  'reviewedNames.aliases',
]) {
  assert.match(directoryDataSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Racecourses directory data missing shared reviewed marker ${marker}`);
}
assert.doesNotMatch(directoryDataSource, /const name = isJapanese \? racecourse\.name_ja/, 'Racecourses directory must not bypass the reviewed JA display resolver');
assert.doesNotMatch(directoryDataSource, /toKana|kuroshiro|wanakana/i, 'Racecourses directory must not add runtime transliteration');

for (const marker of [
  'data-racecourse-filter-query',
  'data-racecourse-filter-country',
  'data-racecourse-filter-authority',
  'data-racecourse-filter-racing-type',
  'data-racecourse-filter-toggle',
  'data-racecourse-authorities',
  'data-racecourse-search-text',
  'record.calendarMeeting',
  "isJapanese ? '競馬場を見る' : 'View racecourse'",
]) {
  assert.match(directoryPageSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Racecourses directory page missing UI-006 marker ${marker}`);
}
assert.doesNotMatch(directoryPageSource, /record\.alternateName/, 'Racecourses compact results must expose one primary display name rather than visible alias clutter');
assert.doesNotMatch(directoryPageSource, /record\.localName/, 'Racecourses compact results must keep local/search aliases out of the primary result row');

console.log('CALENDAR_DISPLAY_NAMES: pass');
console.log('REVIEWED_JAPANESE_NAME_STATUS: pass');
console.log('NO_RUNTIME_KATAKANA_TRANSLITERATION: pass');
console.log('LATIN_FALLBACK_FOR_UNREVIEWED_FOREIGN_RACECOURSE: pass');
console.log('CALENDAR_SHARED_DISPLAY_RESOLVER: pass');
console.log('RACECOURSE_DIRECTORY_SHARED_DISPLAY_RESOLVER: pass');
console.log('UI_006_DENSE_DISCOVERY_MARKERS: pass');
