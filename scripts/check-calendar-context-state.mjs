import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const todayFilters = read('src/components/TodayFilters.astro');
const calendarFilters = read('src/components/CalendarFilters.astro');
const meetingStatePolicy = read('src/components/MeetingStatePolicy.astro');
const todayMap = read('src/components/TodayMeetingMap.astro');
const calendarMap = read('src/components/CalendarMeetingMap.astro');
const sharedMap = read('src/components/RacecourseMap.astro');
const todayRangeMapAccessibility = read('src/components/TodayRangeMapAccessibility.astro');
const todayCss = read('src/styles/today-practical.css');
const presentationHelper = read('src/lib/timetable/meetingPresentationState.mjs');

for (const forbidden of ['Upcoming / racing today', '開催前・本日開催']) {
  assert.ok(!todayFilters.includes(forbidden), `Today UI must not contain combined state heading: ${forbidden}`);
}

assert.match(todayFilters, /data-today-summary-state="running"/);
assert.match(todayFilters, /data-today-summary-state="upcoming"/);
assert.match(todayFilters, /data-today-summary-state="today"/);
assert.match(todayFilters, /data-today-summary-state="ended"/);
assert.match(todayFilters, /data-today-summary-state="future"/);
assert.match(todayFilters, /Today meeting/);
assert.match(todayFilters, /本日開催/);
assert.match(todayFilters, /Scheduled/);
assert.match(todayFilters, /開催予定/);
assert.match(todayFilters, /row\.dataset\.meetingPresentationState/,
  'Today grouping must consume the shared presentation state');
assert.ok(!/const meetingState = row\.dataset\.meetingState/.test(todayFilters),
  'Today grouping must not independently re-bucket lifecycle state');
assert.match(todayFilters, /activeRange === 'today'[\s\S]*new Set\(\['running', 'upcoming', 'today', 'ended'\]\)/,
  'Today range summary must exclude future/Scheduled');
assert.match(todayFilters, /activeRange === 'tomorrow'[\s\S]*new Set\(\['future'\]\)/,
  'Tomorrow range must expose only Scheduled/future summary state');
assert.match(todayFilters, /PRESENTATION_STATES\.forEach/,
  'List dividers must use the shared presentation-state list');

assert.match(calendarFilters, /<option value="future">\{isJa \? '開催予定' : 'Scheduled'\}<\/option>/,
  'Calendar meeting-state filter must expose future/Scheduled explicitly');

assert.match(presentationHelper, /calendarDayState === 'future'\) return 'future'/,
  'future Calendar days must derive future/Scheduled presentation state');
assert.match(presentationHelper, /DAY_ONLY_RANKS\.has\(rank\)\) return 'today'/,
  'B/C current-day state must remain Today meeting');

assert.match(meetingStatePolicy, /data-meeting-future-badge/,
  'row state policy must expose a future/Scheduled badge');
assert.match(meetingStatePolicy, /presentationState !== 'future'/);
assert.match(meetingStatePolicy, /#fff9e9/,
  'precise current-day Upcoming must retain #fff9e9');
assert.match(meetingStatePolicy, /#fffcf4/,
  'day-only Today meeting must use #fffcf4');
assert.match(meetingStatePolicy, /data-meeting-presentation-state='future'[\s\S]*background: #fff/,
  'future Scheduled rows must remain neutral white');
assert.match(meetingStatePolicy, /map-selected-card__status\[data-status='today'\]::before[\s\S]*background: #fffcf4/,
  'selected Map card must preserve the Today meeting pale warm state');
assert.match(meetingStatePolicy, /map-selected-card__status\[data-status='today'\]::before[\s\S]*border-color: #7a5a00/,
  'selected Map card Today meeting state must keep a dark warm outline');

assert.match(todayCss, /today-state-summary__item--today[\s\S]*#fffcf4/,
  'Today meeting summary/list divider marker must use the pale warm state');
assert.match(todayCss, /today-state-divider--future[\s\S]*#111/,
  'future Scheduled divider marker must remain neutral black');

for (const source of [todayMap, calendarMap]) {
  assert.match(source, /row\.dataset\.meetingPresentationState/,
    'Map selected-card status must consume shared presentation state');
  assert.match(source, /state === 'today'/,
    'Map selected-card must preserve Today meeting state');
  assert.match(source, /state === 'future'/,
    'Map selected-card must preserve future/Scheduled state');
  assert.ok(!/const meetingState = row\.dataset\.meetingState/.test(source),
    'Map selected-card must not independently reinterpret lifecycle state');
}

assert.match(sharedMap, /data-map-legend-state="running"/);
assert.match(sharedMap, /data-map-legend-state="upcoming"/);
assert.match(sharedMap, /data-map-legend-state="today"/);
assert.match(sharedMap, /data-map-legend-state="future"/);
assert.match(sharedMap, /data-map-legend-state="ended"/);
assert.match(sharedMap, /PUBLIC_STATUS_KEYS\.has\(presentationState\) \? presentationState : 'neutral'/,
  'shared Map must not infer a status from lifecycle/day fallback');
assert.ok(!sharedMap.includes("meetingState === 'upcoming' && dayState === 'today'"),
  'shared Map must not collapse incomplete current-day state into upcoming');
assert.match(sharedMap, /inferred\[feature\?\.properties\?\.racecourse_id\] \|\| 'neutral'/,
  'missing Map presentation state must remain neutral, not Scheduled');
assert.match(sharedMap, /meeting_status: 'neutral'/,
  'Map initial status must be neutral until shared presentation state is available');
assert.match(sharedMap, /syncLegend\(inferred\)/,
  'Map legend must be synchronized from actual visible presentation states');
assert.match(sharedMap, /item\.hidden = !active\.has/,
  'invalid/zero-context Map legend states must be hidden');
assert.match(sharedMap, /'upcoming', '#d18a00'/);
assert.match(sharedMap, /'today', '#fffcf4'/);
assert.match(sharedMap, /'future', '#111111'/);

assert.match(todayRangeMapAccessibility, /meetings tomorrow/,
  'Tomorrow range must expose a Tomorrow-specific Map aria-label');
assert.match(todayRangeMapAccessibility, /meetings over the next 7 days/,
  '7-day range must expose a 7-day-specific Map aria-label');
assert.match(todayRangeMapAccessibility, /明日の確認済み開催競馬場マップ/,
  'JA Tomorrow Map aria-label must be localized');
assert.match(todayRangeMapAccessibility, /今後7日間の確認済み開催競馬場マップ/,
  'JA 7-day Map aria-label must be localized');
assert.match(todayRangeMapAccessibility, /whr:todayfilterchange/,
  'Map accessibility label must follow the active Today range state');

console.log('CALENDAR_CONTEXT_STATE: pass');
console.log('TODAY_GROUPS_SPLIT: pass');
console.log('TODAY_CURRENT_DAY_SCHEDULED_FALLBACK: prohibited');
console.log('TODAY_TOMORROW_7DAY_CONTEXT: pass');
console.log('LIST_MAP_PRESENTATION_STATE_PARITY: pass');
console.log('MAP_CONTEXT_LEGEND: pass');
console.log('MAP_SELECTED_TODAY_STATE: pass');
console.log('TODAY_MAP_RANGE_ACCESSIBILITY: pass');
console.log('UPCOMING_COLOR: #fff9e9');
console.log('TODAY_MEETING_COLOR: #fffcf4');
