import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  canUseEventSpecificStreamUrl,
  deriveMeetingStreamState,
} from '../src/lib/timetable/meetingStreamState.mjs';

assert.equal(deriveMeetingStreamState({ hasOfficialDestination: false, detectorStatus: 'live', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'unknown');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'live', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'live');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'live', eventDate: '2026-09-08', sourceDate: '2026-09-09' }), 'known');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'offline', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'known');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'upcoming', eventDate: '', sourceDate: '2026-09-09' }), 'known');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'ended', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'known');

assert.equal(canUseEventSpecificStreamUrl({ detectorStatus: 'live', eventDate: '2026-09-09', sourceDate: '2026-09-09', videoId: 'abcdefghijk' }), true);
assert.equal(canUseEventSpecificStreamUrl({ detectorStatus: 'upcoming', eventDate: '2026-09-09', sourceDate: '2026-09-09', videoId: 'abcdefghijk' }), true);
assert.equal(canUseEventSpecificStreamUrl({ detectorStatus: 'offline', eventDate: '2026-09-09', sourceDate: '2026-09-09', videoId: 'abcdefghijk' }), false);
assert.equal(canUseEventSpecificStreamUrl({ detectorStatus: 'live', eventDate: '2026-09-08', sourceDate: '2026-09-09', videoId: 'abcdefghijk' }), false);
assert.equal(canUseEventSpecificStreamUrl({ detectorStatus: 'live', eventDate: '2026-09-09', sourceDate: '2026-09-09', videoId: '' }), false);

const filterSource = readFileSync(new URL('../src/components/CalendarFilters.astro', import.meta.url), 'utf8');
for (const marker of [
  'deriveMeetingStreamState',
  'canUseEventSpecificStreamUrl',
  "link.textContent = state === 'live'",
  "'Official stream ↗'",
]) {
  assert.match(filterSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `CalendarFilters missing ${marker}`);
}
assert.doesNotMatch(filterSource, /const eventSpecific = rawState === 'live' \|\| rawState === 'upcoming' \|\| rawState === 'ended'/, 'old detector leakage logic must be removed');

console.log('MEETING_STREAM_STATE: pass');
console.log('EXACT_EVENT_DATE_REQUIRED_FOR_LIVE: pass');
console.log('OFFLINE_NEVER_COLORS_MEETING_LIVE: pass');
console.log('OFFICIAL_STREAM_DESTINATION_REMAINS_NEUTRAL: pass');