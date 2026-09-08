import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  deriveMeetingLifecycleState,
  localDateTimeToInstant,
} from '../src/lib/timetable/meetingLifecycleState.mjs';
import { deriveMeetingPresentationState } from '../src/lib/timetable/meetingPresentationState.mjs';

const instant = (date, time, timeZone = 'Asia/Tokyo') => {
  const value = localDateTimeToInstant(date, time, timeZone);
  assert.ok(value, `expected valid local instant for ${date} ${time} ${timeZone}`);
  return value.getTime();
};

const base = {
  displayTimeZone: 'Asia/Tokyo',
  sourceTimeZone: 'Asia/Tokyo',
  firstTime: '11:45',
  lastTime: '18:15',
};

for (const rank of ['B+', 'A', 'A+']) {
  const result = deriveMeetingLifecycleState({
    ...base,
    displayedDate: '2026-09-08',
    sourceDate: '2026-09-08',
    nowMs: instant('2026-09-07', '12:00'),
  });
  assert.equal(result.calendarDayState, 'future', `${rank}: tomorrow must remain a future calendar day`);
  assert.equal(result.state, 'upcoming', `${rank}: source-local lifecycle before start must be upcoming`);
}

const beforeStart = deriveMeetingLifecycleState({
  ...base,
  displayedDate: '2026-09-07',
  sourceDate: '2026-09-07',
  nowMs: instant('2026-09-07', '10:00'),
});
assert.equal(beforeStart.calendarDayState, 'today');
assert.equal(beforeStart.state, 'upcoming');
assert.equal(deriveMeetingPresentationState({ rank: 'B+', calendarDayState: 'today', lifecycleState: beforeStart.state }), 'upcoming');

const running = deriveMeetingLifecycleState({
  ...base,
  displayedDate: '2026-09-07',
  sourceDate: '2026-09-07',
  nowMs: instant('2026-09-07', '12:00'),
});
assert.equal(running.calendarDayState, 'today');
assert.equal(running.state, 'running');
assert.equal(deriveMeetingPresentationState({ rank: 'A+', calendarDayState: 'today', lifecycleState: running.state }), 'running');

const finishedToday = deriveMeetingLifecycleState({
  ...base,
  displayedDate: '2026-09-07',
  sourceDate: '2026-09-07',
  nowMs: instant('2026-09-07', '19:00'),
});
assert.equal(finishedToday.calendarDayState, 'today');
assert.equal(finishedToday.state, 'ended');
assert.equal(deriveMeetingPresentationState({ rank: 'A', calendarDayState: 'today', lifecycleState: finishedToday.state }), 'ended');

// B/C do not have sufficient reviewed end-time evidence for a precise
// intraday lifecycle. Current-day public presentation is day-level only.
for (const rank of ['B', 'C']) {
  assert.equal(
    deriveMeetingPresentationState({ rank, calendarDayState: 'today', lifecycleState: rank === 'B' ? 'upcoming' : 'unknown' }),
    'today',
    `${rank}: current-day presentation must be Today meeting rather than a guessed precise lifecycle`,
  );
  assert.equal(
    deriveMeetingPresentationState({ rank, calendarDayState: 'future', lifecycleState: 'upcoming' }),
    'unknown',
    `${rank}: non-current dates must not fabricate a precise intraday lifecycle`,
  );
}

const projected = deriveMeetingLifecycleState({
  displayTimeZone: 'UTC',
  sourceTimeZone: 'Asia/Tokyo',
  displayedDate: '2026-09-07',
  sourceDate: '2026-09-08',
  firstTime: '01:00',
  lastTime: '03:00',
  nowMs: Date.parse('2026-09-07T19:00:00Z'),
});
assert.equal(projected.calendarDayState, 'today');
assert.equal(projected.state, 'ended');

const untimedFuture = deriveMeetingLifecycleState({
  displayTimeZone: 'Asia/Tokyo',
  sourceTimeZone: 'Asia/Tokyo',
  displayedDate: '2026-09-08',
  sourceDate: '2026-09-08',
  nowMs: instant('2026-09-07', '12:00'),
});
assert.equal(untimedFuture.calendarDayState, 'future');
assert.equal(untimedFuture.state, 'unknown');

const crossMidnight = deriveMeetingLifecycleState({
  displayTimeZone: 'Europe/Istanbul',
  sourceTimeZone: 'Europe/Istanbul',
  displayedDate: '2026-09-09',
  sourceDate: '2026-09-09',
  firstTime: '23:45',
  lastTime: '03:30',
  nowMs: instant('2026-09-09', '23:55', 'Europe/Istanbul'),
});
assert.equal(crossMidnight.policy, 'cross-midnight-ambiguous');
assert.equal(crossMidnight.state, 'unknown');

const statePolicySource = readFileSync(new URL('../src/components/MeetingStatePolicy.astro', import.meta.url), 'utf8');
const meetingListSource = readFileSync(new URL('../src/components/TimetableMeetingList.astro', import.meta.url), 'utf8');
for (const marker of [
  'deriveMeetingLifecycleState',
  'deriveMeetingPresentationState',
  'row.dataset.meetingCalendarDayState = result.calendarDayState',
  'row.dataset.meetingState = result.state',
  'row.dataset.meetingPresentationState',
  ".meeting-row[data-meeting-presentation-state='today'][data-meeting-day-state='today']",
]) {
  assert.match(statePolicySource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `MeetingStatePolicy missing ${marker}`);
}
assert.match(meetingListSource, /data-meeting-today-badge/, 'B/C current-day rows need a Today meeting / 本日開催 badge');
assert.match(meetingListSource, /Today meeting/, 'English B/C current-day label must be present');
assert.match(meetingListSource, /本日開催/, 'Japanese B/C current-day label must be present');
assert.match(statePolicySource, /data-stream-state='known'/, 'non-live official stream destinations must render neutrally');
assert.match(meetingListSource, /window\.dispatchEvent\(new CustomEvent\('whr:meetingstatechange'\)\)/, 'timezone projection must trigger authoritative lifecycle recomputation');

console.log('MEETING_LIFECYCLE_STATE: pass');
console.log('SOURCE_LOCAL_LIFECYCLE: pass');
console.log('B_PLUS_PRESENTATION_BOUNDARY: pass');
console.log('B_C_TODAY_MEETING_PRESENTATION: pass');
console.log('DISPLAY_TIMEZONE_IS_PRESENTATION_ONLY: pass');
console.log('CROSS_MIDNIGHT_AMBIGUITY_FAILS_CLOSED: pass');