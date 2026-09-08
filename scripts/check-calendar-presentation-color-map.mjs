import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { deriveMeetingPresentationState } from '../src/lib/timetable/meetingPresentationState.mjs';

const read = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

assert.equal(deriveMeetingPresentationState({
  rank: 'B',
  calendarDayState: 'today',
  lifecycleState: 'unknown',
}), 'today', 'B current-day presentation must remain day-only today');
assert.equal(deriveMeetingPresentationState({
  rank: 'C',
  calendarDayState: 'today',
  lifecycleState: 'unknown',
}), 'today', 'C current-day presentation must remain day-only today');
assert.equal(deriveMeetingPresentationState({
  rank: 'B+',
  calendarDayState: 'today',
  lifecycleState: 'upcoming',
}), 'upcoming', 'B+ current-day precise lifecycle may be upcoming');
assert.equal(deriveMeetingPresentationState({
  rank: 'A+',
  calendarDayState: 'future',
  lifecycleState: 'upcoming',
}), 'future', 'future Calendar-day context must present as Scheduled rather than current-day Upcoming');

const [policy, calendarMap, racecourseMap, spec, schedule] = await Promise.all([
  read('src/components/MeetingStatePolicy.astro'),
  read('src/components/CalendarMeetingMap.astro'),
  read('src/components/RacecourseMap.astro'),
  read('docs/specs/calendar-row-rank-live-localization-2026-09-08.md'),
  read('docs/calendar/calendar-presentation-state-001-display-correction-schedule.md'),
]);

assert.match(
  policy,
  /data-meeting-presentation-state='upcoming'\]\[data-meeting-day-state='today'\][\s\S]*?background: #fff9e9 !important;/,
  'precise current-day upcoming rows must retain #fff9e9',
);
assert.match(
  policy,
  /data-meeting-presentation-state='today'\]\[data-meeting-day-state='today'\][\s\S]*?background: #fffcf4 !important;/,
  'day-only current-day rows must use #fffcf4',
);
assert.doesNotMatch(
  policy,
  /data-meeting-presentation-state='upcoming'[^\{]*data-meeting-presentation-state='today'[^\{]*\{[\s\S]*?background:/,
  'upcoming and today List selectors must not be merged into one color rule',
);

assert.match(
  calendarMap,
  /presentationState === 'today'\) return \{ key: 'today', label:/,
  'Calendar selected-card Map state must preserve today as its own key',
);
assert.doesNotMatch(
  calendarMap,
  /presentationState === 'today'\) return \{ key: 'upcoming'/,
  'Calendar Map must not collapse today into upcoming',
);

assert.match(racecourseMap, /racecourse-map__legend-dot--today/, 'Map legend must expose a today marker');
assert.match(racecourseMap, />Today meeting</, 'English Map legend must label the day-only today state');
assert.match(racecourseMap, />本日開催</, 'Japanese Map legend must label the day-only today state');
assert.match(racecourseMap, /presentationState === 'today'\) return 'today';/, 'Map status inference must preserve presentation today');
assert.match(racecourseMap, /'today', '#fffcf4'/, 'Map today marker fill must be #fffcf4');
assert.match(racecourseMap, /'#7a5a00'/, 'Near-white Map today marker must have a dark warm outline');
assert.match(racecourseMap, /'upcoming', '#d18a00'/, 'Map precise upcoming marker must remain orange');

for (const document of [spec, schedule]) {
  assert.ok(document.includes('#fff9e9'), 'Calendar authority must document precise upcoming color');
  assert.ok(document.includes('#fffcf4'), 'Calendar authority must document day-only today color');
  assert.ok(document.includes('Map'), 'Calendar authority must bind the color split to Map as well as List');
}

console.log('CALENDAR_PRESENTATION_COLOR_MAP: pass');
