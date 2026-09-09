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
  /const state = row\.dataset\.meetingPresentationState[\s\S]*?state === 'today'\) return \{ key: 'today', label:/,
  'Calendar selected-card Map state must preserve today as its own key',
);
assert.doesNotMatch(
  calendarMap,
  /state === 'today'\) return \{ key: 'upcoming'/,
  'Calendar Map must not collapse today into upcoming',
);

assert.match(racecourseMap, /racecourse-map__legend-dot--today/, 'Map legend must expose a today marker');
assert.match(racecourseMap, />Today meeting</, 'English Map legend must label the day-only today state');
assert.match(racecourseMap, />本日開催</, 'Japanese Map legend must label the day-only today state');
assert.match(racecourseMap, /PUBLIC_STATUS_KEYS\.has\(presentationState\) \? presentationState : 'neutral'/,
  'Map status inference must preserve reviewed public presentation-state keys without reinterpreting lifecycle state');
assert.match(racecourseMap, /'today', '#fffcf4'/, 'Map today marker fill must be #fffcf4');
assert.match(racecourseMap, /'#7a5a00'/, 'Near-white Map today marker must have a dark warm outline');
assert.match(racecourseMap, /'upcoming', '#d18a00'/, 'Map precise upcoming marker must remain orange');

assert.match(
  racecourseMap,
  /clusterProperties:\s*\{[\s\S]*?running_count:[\s\S]*?meeting_status'\], 'running'[\s\S]*?upcoming_count:[\s\S]*?meeting_status'\], 'upcoming'/,
  'Map clusters must aggregate the already-resolved running and upcoming marker states',
);
assert.match(
  racecourseMap,
  /const clusterHasRunning = \['>', \['get', 'running_count'\], 0\];[\s\S]*?const clusterHasUpcoming = \['>', \['get', 'upcoming_count'\], 0\];/,
  'Map cluster priority must still derive only from resolved running and upcoming child counts',
);
assert.match(
  racecourseMap,
  /id: MAP_CLUSTER_STATUS_RING_LAYER[\s\S]*?clusterHasRunning, '#e53935',[\s\S]*?'#fb8c00'/,
  'Map cluster status emphasis must move to a Live/Upcoming outer ring rather than filling the core',
);
assert.match(
  racecourseMap,
  /clusterHasPriorityState, '#59636f'/,
  'Live and Upcoming clusters must share a neutral core so total count and status emphasis remain visually separated',
);
assert.match(
  racecourseMap,
  /'icon-image': MAP_CLUSTER_LIVE_BADGE_IMAGE[\s\S]*?'icon-text-fit': 'width'[\s\S]*?'LIVE '/,
  'Live cluster counts must render as a fitted pill badge',
);
assert.match(
  racecourseMap,
  /'icon-image': MAP_CLUSTER_UPCOMING_BADGE_IMAGE[\s\S]*?'icon-text-fit': 'width'[\s\S]*?'UPCOMING '/,
  'Upcoming cluster counts must render as a fitted pill badge',
);
assert.match(
  racecourseMap,
  /MAP_CLUSTER_LIVE_GLOW_LAYER[\s\S]*?clusterPulseTimer = window\.setInterval/,
  'Live clusters must retain a dedicated glow layer with motion-aware pulse treatment',
);
assert.match(
  racecourseMap,
  /'text-field': \['concat', 'LIVE ', \['to-string', \['get', 'running_count'\]\]\]/,
  'Map clusters containing running markers must expose a LIVE count badge',
);
assert.match(
  racecourseMap,
  /'text-field': \['concat', 'UPCOMING ', \['to-string', \['get', 'upcoming_count'\]\]\]/,
  'Map clusters containing upcoming markers must expose an UPCOMING count badge',
);
assert.match(
  racecourseMap,
  /clusterAllToday[\s\S]*?clusterAllEnded[\s\S]*?clusterAllFuture[\s\S]*?clusterAllNeutral/,
  'Other-only homogeneous clusters must retain the existing marker-state presentation instead of inventing a new lifecycle state',
);

for (const document of [spec, schedule]) {
  assert.ok(document.includes('#fff9e9'), 'Calendar authority must document precise upcoming color');
  assert.ok(document.includes('#fffcf4'), 'Calendar authority must document day-only today color');
  assert.ok(document.includes('Map'), 'Calendar authority must bind the color split to Map as well as List');
}

console.log('CALENDAR_PRESENTATION_COLOR_MAP: pass');
