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

// Future meetings with published times are future, never "upcoming/today".
for (const rank of ['B+', 'A', 'A+']) {
  const result = deriveMeetingLifecycleState({
    ...base,
    rank,
    displayedDate: '2026-09-08',
    sourceDate: '2026-09-08',
    nowMs: instant('2026-09-07', '12:00'),
  });
  assert.equal(result.calendarDayState, 'future', `${rank}: tomorrow must remain a future calendar day`);
  assert.equal(result.state, 'future', `${rank}: published future times must not produce upcoming`);
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

const past = deriveMeetingLifecycleState({
  ...base,
  displayedDate: '2026-09-06',
  sourceDate: '2026-09-06',
  nowMs: instant('2026-09-07', '12:00'),
});
assert.equal(past.calendarDayState, 'past');
assert.equal(past.state, 'ended');

const untimedFuture = deriveMeetingLifecycleState({
  displayTimeZone: 'Asia/Tokyo',
  sourceTimeZone: 'Asia/Tokyo',
  displayedDate: '2026-09-08',
  sourceDate: '2026-09-08',
  nowMs: instant('2026-09-07', '12:00'),
});
assert.equal(untimedFuture.calendarDayState, 'future');
assert.equal(untimedFuture.state, 'future');

// Projection can move a source-date meeting onto "today" in another display timezone.
// 2026-09-08 01:00 JST is 2026-09-07 16:00 UTC.
const projectedToday = deriveMeetingLifecycleState({
  displayTimeZone: 'UTC',
  sourceTimeZone: 'Asia/Tokyo',
  displayedDate: '2026-09-07',
  sourceDate: '2026-09-08',
  firstTime: '01:00',
  lastTime: '03:00',
  nowMs: Date.parse('2026-09-07T15:00:00Z'),
});
assert.equal(projectedToday.calendarDayState, 'today');
assert.equal(projectedToday.state, 'upcoming');

const statePolicySource = readFileSync(new URL('../src/components/MeetingStatePolicy.astro', import.meta.url), 'utf8');
const meetingListSource = readFileSync(new URL('../src/components/TimetableMeetingList.astro', import.meta.url), 'utf8');
for (const marker of [
  'deriveMeetingLifecycleState',
  'row.dataset.meetingDayState = result.calendarDayState',
  "state !== 'upcoming'",
  ".meeting-row[data-meeting-state='upcoming'][data-meeting-day-state='today']",
  ".meeting-row[data-meeting-state='future']",
]) {
  assert.match(statePolicySource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `MeetingStatePolicy missing ${marker}`);
}
assert.doesNotMatch(statePolicySource, /removeYellowLifecyclePresentation/, 'today-upcoming presentation must not be globally suppressed');
assert.match(meetingListSource, /window\.dispatchEvent\(new CustomEvent\('whr:meetingstatechange'\)\)/, 'timezone projection must trigger authoritative lifecycle recomputation');

console.log('MEETING_LIFECYCLE_STATE: pass');
console.log('FUTURE_TIMED_ROWS_STAY_FUTURE: pass');
console.log('TODAY_UPCOMING_RUNNING_ENDED: pass');
console.log('DISPLAY_TIMEZONE_DAY_BOUNDARY: pass');
