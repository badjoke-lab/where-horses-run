import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveMeetingStreamState } from '../src/lib/timetable/meetingStreamState.mjs';

assert.equal(deriveMeetingStreamState({ hasOfficialDestination: false, detectorStatus: 'live', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'unknown');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'live', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'live');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'live', eventDate: '2026-09-08', sourceDate: '2026-09-09' }), 'known');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'offline', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'known');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'upcoming', eventDate: '', sourceDate: '2026-09-09' }), 'known');
assert.equal(deriveMeetingStreamState({ hasOfficialDestination: true, detectorStatus: 'ended', eventDate: '2026-09-09', sourceDate: '2026-09-09' }), 'known');

const filterSource = readFileSync(new URL('../src/components/CalendarFilters.astro', import.meta.url), 'utf8');
const listSource = readFileSync(new URL('../src/components/TimetableMeetingList.astro', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('../src/components/MeetingLiveStatusRuntime.astro', import.meta.url), 'utf8');
const escapeRegex = (value) => value.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');

for (const marker of [
  'deriveMeetingStreamState',
  "querySelectorAll('[data-stream-media]')",
  'streamNode.dataset.streamDetectorId',
  'link.dataset.liveDefaultLabel',
  'link.dataset.liveActiveLabel',
  'row.dataset.streamState = rowLive',
]) {
  assert.match(filterSource, new RegExp(escapeRegex(marker)), 'CalendarFilters missing ' + marker);
}

for (const marker of [
  "querySelectorAll('[data-stream-media]')",
  'stream.dataset.streamDetectorId',
  'link.dataset.liveDefaultLabel',
  'link.dataset.liveActiveLabel',
  'row.dataset.streamState = rowLive',
]) {
  assert.match(runtimeSource, new RegExp(escapeRegex(marker)), 'MeetingLiveStatusRuntime missing ' + marker);
}

assert.match(listSource, /data-stream-media/, 'Calendar rows must render provider-level stream nodes');
assert.match(listSource, /data-live-default-label=/, 'Calendar stream links must preserve their provider default label');
assert.match(listSource, /data-live-active-label=/, 'Calendar stream links must preserve their provider live label');
assert.match(listSource, /meeting-row__streams/, 'Calendar rows must support multiple stream providers');
assert.match(listSource, /Official site ↗/, 'official-site action must remain separate from stream actions');
assert.match(listSource, /公式サイト ↗/, 'Japanese official-site action must remain separate from stream actions');

assert.doesNotMatch(filterSource, /canUseEventSpecificStreamUrl/, 'Calendar must not construct event-specific direct stream URLs');
assert.doesNotMatch(filterSource, /youtube\.com\/watch\?v=/, 'Calendar must keep reviewed official landing/source links instead of direct watch URLs');
assert.doesNotMatch(runtimeSource, /youtube\.com\/watch\?v=/, 'runtime must never synthesize direct YouTube watch URLs');

console.log('MEETING_STREAM_STATE: pass');
console.log('EXACT_EVENT_DATE_REQUIRED_FOR_LIVE: pass');
console.log('MULTI_PROVIDER_STREAM_STATE: pass');
console.log('OFFICIAL_STREAM_AND_SITE_ACTIONS_REMAIN_SEPARATE: pass');
console.log('OFFICIAL_STREAM_LINKS_REMAIN_REVIEWED_DESTINATIONS: pass');
