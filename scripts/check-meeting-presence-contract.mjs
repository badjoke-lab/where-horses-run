import assert from 'node:assert/strict';
import { confirmedNonRunningMeetingIds, meetingPresenceState, validateMeetingPresenceRegistry } from './timetable/meeting-presence-core.mjs';

const base = {
  schema_version: 'calendar-meeting-presence-v1',
  records: [{
    meeting_id: 'm1', country_id: 'x', authority_id: 'a', racecourse_id: 'r', date: '2026-09-21',
    state: 'confirmed_non_running', scope: 'whole_meeting', evidence_type: 'official_explicit_non_running',
    official_source_url: 'https://authority.example/cancelled', reviewed_at: '2026-09-21'
  }]
};
validateMeetingPresenceRegistry(base);
assert.deepEqual(confirmedNonRunningMeetingIds(base), ['m1']);
assert.equal(meetingPresenceState(base, 'm1'), 'confirmed_non_running');
assert.equal(meetingPresenceState(base, 'unknown'), 'absent_unconfirmed');

assert.throws(() => validateMeetingPresenceRegistry({...base, records:[{...base.records[0], scope:'race'}]}), /whole_meeting/);
assert.throws(() => validateMeetingPresenceRegistry({...base, records:[{...base.records[0], evidence_type:'source_absence'}]}), /explicit official evidence/);
assert.throws(() => validateMeetingPresenceRegistry({...base, records:[{...base.records[0], official_source_url:null}]}), /official_source_url/);

console.log('MEETING_PRESENCE_CONTRACT: pass');
