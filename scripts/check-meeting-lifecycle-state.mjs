import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  deriveMeetingLifecycleState,
  localDateTimeToInstant,
} from '../src/lib/timetable/meetingLifecycleState.mjs';

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

// Calendar-day relation and meeting lifecycle are separate. A future display
// day can contain a source-local meeting whose lifecycle is simply "upcoming".
for (const rank of ['B+', 'A', 'A+']) {
  const result = deriveMeetingLifecycleState({
    ...base,
    rank,
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

const running = deriveMeetingLifecycleState({
  ...base,
  displayedDate: '2026-09-07',
  sourceDate: '2026-09-07',
  nowMs: instant('2026-09-07', '12:00'),
});
assert.equal(running.calendarDayState, 'today');
assert.equal(running.state, 'running');

const finishedToday = deriveMeetingLifecycleState({
  ...base,
  displayedDate: '2026-09-07',
  sourceDate: '2026-09-07',
  nowMs: instant('2026-09-07', '19:00'),
});
assert.equal(finishedToday.calendarDayState, 'today');
assert.equal(finishedToday.state, 'ended');

// Display timezone movement must not rewrite lifecycle truth. A source-local
// meeting that already finished remains ended even if projection groups it on
// another calendar date.
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

// A time-only cross-midnight shape is ambiguous without an explicit end date.
// Do not manufacture a +1-day meeting lifecycle fact.
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
  'row.dataset.meetingCalendarDayState = result.calendarDayState',
  'row.dataset.meetingState = result.state',
  ".meeting-row[data-meeting-state='upcoming'][data-meeting-day-state='today']",
]) {
  assert.match(statePolicySource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `MeetingStatePolicy missing ${marker}`);
}
assert.match(statePolicySource, /data-stream-state='known'/, 'non-live official stream destinations must render neutrally');
assert.match(meetingListSource, /window\.dispatchEvent\(new CustomEvent\('whr:meetingstatechange'\)\)/, 'timezone projection must trigger authoritative lifecycle recomputation');

console.log('MEETING_LIFECYCLE_STATE: pass');
console.log('SOURCE_LOCAL_LIFECYCLE: pass');
console.log('DISPLAY_TIMEZONE_IS_PRESENTATION_ONLY: pass');
console.log('CROSS_MIDNIGHT_AMBIGUITY_FAILS_CLOSED: pass');