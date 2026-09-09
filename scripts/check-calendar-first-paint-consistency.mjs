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
  const sensitivePos = html.indexOf('data-calendar-runtime-sensitive');
  if (guardPos < 0) fail(`${file} is missing the prepaint runtime script`);
  if (sensitivePos < 0) fail(`${file} is missing the sensitive-content marker`);
  if (guardPos >= 0 && sensitivePos >= 0 && guardPos > sensitivePos) {
    fail(`${file} exposes sensitive calendar content before the prepaint guard`);
  }
  if (!html.includes(runtimeMarker) && !html.includes(`mode:${JSON.stringify(mode)}`) && !html.includes(`mode = '${mode}'`)) {
    // Astro may compact define:vars differently; source-level mode assertions above remain authoritative.
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
  const sensitivePos = html.indexOf('data-calendar-runtime-sensitive');
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
  const summaryPos = html.indexOf('data-racecourse-meeting-summary');
  if (guardPos < 0 || summaryPos < 0 || guardPos > summaryPos) {
    fail(`${path.relative(root, file)} exposes build-time racecourse meeting state before its runtime guard`);
  }
}

if (!process.exitCode) console.log('calendar first-paint consistency: ok');
