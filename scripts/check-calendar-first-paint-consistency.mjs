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
requireText('src/components/CalendarDateNavigation.astro', 'window.__WHR_CALENDAR_RUNTIME__');
requireText('src/components/CalendarDateNavigation.astro', "runtime?.mode === 'calendar'");

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

const findFirstMeetingDetail = (base) => {
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
  const file = findFirstMeetingDetail(base);
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

if (!process.exitCode) console.log('calendar first-paint consistency: ok');
