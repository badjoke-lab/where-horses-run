import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildSwedenMeetingRecord,
  parseSwedenCalendarText,
  resolveSwedenRacecourseId,
} from './timetable/sweden-svensk-galopp-core.mjs';

const sourceUrl = 'https://www.svenskgalopp.se/documents/3491/T%C3%A4vlingskalender_2026.pdf';
const text = `Tävlingsdagar 2026
Datum/dag Tid Plats Evenemang
SEPTEMBER
20 Söndag 13.30 Bro Park Stockholm Cup International (Gr3)
23 Onsdag 12.00 Jägersro Lunchgalopp
26 Lördag TBA Bro Park Lördagsgalopp
OKTOBER
3 Lördag 12.00 Göteborg Lördagsgalopp med
Svenskt St Leger
4 Söndag 11.30 Jägersro Jubileumsdagen med SFK
7 Onsdag 12.00 Bro Park Lunchgalopp
14 Onsdag 12.00 Jägersro Lunchgalopp
18 Söndag 11.30 Bro Park Autumn Turf Finale
`;

const parsed = parseSwedenCalendarText(text, { sourceUrl });
assert.equal(parsed.parse_failures.length, 0);
assert.equal(parsed.records.length, 8);
assert.deepEqual(parsed.records.slice(2, 6).map((row) => [row.date, row.racecourse_id, row.published_event_time_local]), [
  ['2026-09-26', 'bro-park-racecourse', null],
  ['2026-10-03', 'goteborg-galopp-racecourse', '12:00'],
  ['2026-10-04', 'jagersro-galopp-racecourse', '11:30'],
  ['2026-10-07', 'bro-park-racecourse', '12:00'],
]);
assert.equal(resolveSwedenRacecourseId('Bro Park'), 'bro-park-racecourse');
assert.equal(resolveSwedenRacecourseId('Göteborg'), 'goteborg-galopp-racecourse');
assert.equal(resolveSwedenRacecourseId('Jägersro'), 'jagersro-galopp-racecourse');

const checkedAt = '2026-09-24T00:00:00Z';
const record = buildSwedenMeetingRecord(parsed.records[2], { checkedAt });
assert.equal(record.country_id, 'sweden');
assert.equal(record.authority_id, 'svensk-galopp');
assert.equal(record.racing_system_id, 'sweden-svensk-galopp-system');
assert.equal(record.capability_rank, 'C');
assert.equal(record.first_race_time_local, null);
assert.equal(record.detail_observation.published_event_time_local, null);
assert.equal(record.acquisition_completion.observed_rank, 'C');
assert.equal(record.acquisition_completion.technical_capability_rank, 'C');
assert.equal(record.acquisition_completion.disposition, 'not_applicable');
assert.equal(record.acquisition_completion.higher_rank_open, false);
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt: record.acquisition_attempt,
  acquisition_completion: record.acquisition_completion,
  evidence_support: record.evidence_support,
}), []);

console.log('SWEDEN_SVENSK_GALOPP_ADAPTER: pass');
