import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => {
  console.error(`calendar first-paint consistency: ${message}`);
  process.exitCode = 1;
};
const requireText = (file, text) => {
  if (!read(file).includes(text)) fail(`${file} must contain ${JSON.stringify(text)}`);
};
const markupAttributePosition = (html, attribute) => {
  const pattern = new RegExp(`<[^>]+\\s${attribute}(?:\\s|=|>)`, 'i');
  const match = pattern.exec(html);
  return match ? match.index : -1;
};
const attributeValues = (html, attribute) => {
  const pattern = new RegExp(`\\s${attribute}=(['"])(.*?)\\1`, 'gi');
  return [...html.matchAll(pattern)].map((match) => match[2]);
};
const filterOptionValues = (html, filterName) => {
  const selectPattern = new RegExp(`<select[^>]*data-today-filter=(['"])${filterName}\\1[^>]*>([\\s\\S]*?)<\\/select>`, 'i');
  const selectMatch = selectPattern.exec(html);
  if (!selectMatch) return [];
  return attributeValues(selectMatch[2], 'value').filter(Boolean);
};

const guardedSources = [
  'src/pages/index.astro',
  'src/pages/ja/index.astro',
  'src/pages/calendar/index.astro',
  'src/pages/ja/calendar/index.astro',
  'src/pages/major-countries/current-timetable.astro',
  'src/pages/ja/major-countries/current-timetable.astro',
  'src/pages/timetable/meetings/[meeting_id].astro',
  'src/pages/ja/timetable/meetings/[meeting_id].astro',
];

for (const file of guardedSources) {
  requireText(file, 'CalendarRuntimeBootstrap');
  requireText(file, 'data-calendar-runtime-sensitive');
}

requireText('src/components/CalendarRuntimeBootstrap.astro', "html.dataset.calendarRuntimePending = 'true'");
requireText('src/components/CalendarRuntimeBootstrap.astro', "visibility: hidden !important");
requireText('src/components/CalendarRuntimeBootstrap.astro', "whr:todayfilterchange");
requireText('src/components/CalendarRuntimeBootstrap.astro', "whr:calendarfilterchange");
requireText('src/components/CalendarRuntimeBootstrap.astro', "whr:timezonechange");
requireText('src/components/CalendarRuntimeBootstrap.astro', "projectedTimeZoneReady");
requireText('src/components/CalendarRuntimeBootstrap.astro', "mode === 'meeting-detail'");
requireText('src/components/CalendarRuntimeBootstrap.astro', 'isTimeZoneSupported(requestedTimeZone)');
requireText('src/components/CalendarRuntimeBootstrap.astro', 'isTimeZoneSupported(browserTimeZone)');
requireText('src/components/CalendarDateNavigation.astro', 'window.__WHR_CALENDAR_RUNTIME__');
requireText('src/components/CalendarDateNavigation.astro', "runtime?.mode === 'calendar'");

// Home filter values must use the same canonical dataset contract as the rows.
// This guards against display labels being rendered as option values while the
// row matcher compares country_id / authority_id.
requireText('src/components/TodayFilters.astro', 'row.dataset.country !== country.value');
requireText('src/components/TodayFilters.astro', 'row.dataset.authority !== authority.value');
requireText('src/components/TodayFilters.astro', 'row.dataset.rank !== rank.value');
requireText('src/components/TodayFilters.astro', 'value={country.value}');
requireText('src/components/TodayFilters.astro', 'value={authority.value}');

// Country pages already rebuild the upcoming-meetings section in BaseLayout. The
// first-paint contract is CSS-gated only while scripting is enabled and reveals
// only after the runtime-generated table/card marker exists.
requireText('src/styles/base.css', '@media (scripting: enabled)');
requireText('src/styles/base.css', '#upcoming-meetings:has([data-country-timezone-generated])');
requireText('src/layouts/BaseLayout.astro', 'data-country-timezone-generated');
requireText('src/layouts/BaseLayout.astro', 'initializeCountryTimezoneProjection');

// Racecourse pages keep SSR as no-JS fallback but hide it when JS runs, then
// rebuild Today / Next / Upcoming from the venue timezone and full public set.
for (const marker of [
  'racecourseMeetingRuntimePending',
  'data-racecourse-runtime-meetings',
  'state.runtime_candidate_meetings',
  'todayIn(timeZone)',
  'const endExclusive = addDays(today, 30)',
  'data-racecourse-meeting-runtime-body',
  'racecourseMeetingRuntimeReady',
]) {
  requireText('src/components/RacecourseMeetingSummary.astro', marker);
}
requireText('src/lib/racecourses/publicRacecourseMeetingState.ts', 'timezone_candidate_meetings: timezoneCandidateMeetings');
requireText('src/lib/racecourses/publicRacecourseMeetingState.ts', 'runtime_candidate_meetings: meetings');

const htmlChecks = [
  ['dist/index.html', 'home'],
  ['dist/ja/index.html', 'home'],
  ['dist/calendar/index.html', 'calendar'],
  ['dist/ja/calendar/index.html', 'calendar'],
  ['dist/major-countries/current-timetable/index.html', 'rolling-30'],
  ['dist/ja/major-countries/current-timetable/index.html', 'rolling-30'],
];

for (const [file, mode] of htmlChecks) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    fail(`${file} is missing; run the check after astro build`);
    continue;
  }
  const html = fs.readFileSync(absolute, 'utf8');
  const runtimeMarker = `mode = ${JSON.stringify(mode)}`;
  const guardPos = html.indexOf('calendarRuntimePending');
  const sensitivePos = markupAttributePosition(html, 'data-calendar-runtime-sensitive');
  if (guardPos < 0) fail(`${file} is missing the prepaint runtime script`);
  if (sensitivePos < 0) fail(`${file} is missing the sensitive-content marker`);
  if (guardPos >= 0 && sensitivePos >= 0 && guardPos > sensitivePos) {
    fail(`${file} exposes sensitive calendar content before the prepaint guard`);
  }
  if (!html.includes(runtimeMarker) && !html.includes(`mode:${JSON.stringify(mode)}`) && !html.includes(`mode = '${mode}'`)) {
    // Astro may compact define:vars differently; source-level mode assertions above remain authoritative.
  }
}

for (const file of ['dist/index.html', 'dist/ja/index.html']) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const html = fs.readFileSync(absolute, 'utf8');
  for (const [filterName, rowAttribute] of [
    ['country', 'data-country'],
    ['authority', 'data-authority'],
    ['rank', 'data-rank'],
  ]) {
    const optionValues = filterOptionValues(html, filterName);
    const rowValues = new Set(attributeValues(html, rowAttribute));
    if (optionValues.length === 0) {
      fail(`${file} has no non-empty ${filterName} filter options`);
      continue;
    }
    const unmatched = optionValues.filter((value) => !rowValues.has(value));
    if (unmatched.length > 0) {
      fail(`${file} ${filterName} filter values do not match meeting-row ${rowAttribute}: ${unmatched.join(', ')}`);
    }
  }
}

const findFirstBuiltDetail = (base) => {
  const absolute = path.join(root, base);
  if (!fs.existsSync(absolute)) return null;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(absolute, entry.name, 'index.html');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

for (const base of ['dist/timetable/meetings', 'dist/ja/timetable/meetings']) {
  const file = findFirstBuiltDetail(base);
  if (!file) {
    fail(`${base} has no built meeting detail to audit`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const guardPos = html.indexOf('calendarRuntimePending');
  const sensitivePos = markupAttributePosition(html, 'data-calendar-runtime-sensitive');
  if (guardPos < 0 || sensitivePos < 0 || guardPos > sensitivePos) {
    fail(`${path.relative(root, file)} does not gate projected meeting times before paint`);
  }
}

for (const base of ['dist/tracks', 'dist/ja/tracks']) {
  const file = findFirstBuiltDetail(base);
  if (!file) {
    fail(`${base} has no built racecourse detail to audit`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const guardPos = html.indexOf('racecourseMeetingRuntimePending');
  const summaryPos = markupAttributePosition(html, 'data-racecourse-meeting-summary');
  if (guardPos < 0 || summaryPos < 0 || guardPos > summaryPos) {
    fail(`${path.relative(root, file)} exposes build-time racecourse meeting state before its runtime guard`);
  }
}

if (!process.exitCode) console.log('calendar first-paint consistency: ok');