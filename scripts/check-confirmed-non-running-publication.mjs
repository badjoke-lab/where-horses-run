import assert from 'node:assert/strict';
import fs from 'node:fs';

const cancelledId = 'jra-nakayama-racecourse-2026-09-21';
const replacementDateId = 'jra-nakayama-racecourse-2026-09-22';
const canonical = JSON.parse(fs.readFileSync('data/generated/timetable/canonical/meetings.json','utf8'));
const publicList = JSON.parse(fs.readFileSync('data/generated/timetable/public/meeting-list.json','utf8'));
const canonicalIds = new Set((canonical.meetings ?? []).map((row) => row.meeting_id));
const publicIds = new Set((publicList.meetings ?? []).map((row) => row.meeting_id));

assert(canonicalIds.has(cancelledId), 'confirmed non-running Nakayama meeting must remain canonical');
assert(!publicIds.has(cancelledId), 'confirmed non-running Nakayama meeting must not remain in active public Calendar');
assert(canonicalIds.has(replacementDateId), '2026-09-22 Nakayama meeting must have its own canonical identity');
assert(publicIds.has(replacementDateId), '2026-09-22 Nakayama meeting must publish independently');

for (const file of ['src/components/CalendarMeetingMap.astro','src/components/TodayMeetingMap.astro','src/components/HomeRacingMap.astro']) {
  const source = fs.readFileSync(file,'utf8');
  assert.match(source, /records/, `${file} must derive map meetings from public meeting rows`);
  assert.doesNotMatch(source, /canonical\/meetings\.json/, `${file} must not bypass public disposition using canonical meetings`);
}

console.log('CONFIRMED_NON_RUNNING_PUBLICATION: pass');
