import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import { buildJcsaMeetingRecord, parseJcsaMeetingHtml, resolveSaudiRacecourse } from './timetable/saudi-jcsa-core.mjs';

const html='<!doctype html><html><body><div>Season 1447 · Meeting 13</div><h1>King Khalid Racecourse Championship Prep Race Meeting 13</h1><div>Friday, 4th September 2026</div><ul>'+
'<li>Results R1 Local Bred Handicap 0-65 04:30pm SAR 75,000 1200m Dirt</li>'+
'<li>Results R2 Local Bred Horses Who Won 0-1 05:00pm SAR 45,000 1400m Dirt</li>'+
'<li>Results R3 Handicap 0-70 05:30pm SAR 75,000 1400m Dirt</li></ul></body></html>';
const parsed=parseJcsaMeetingHtml(html,{expectedDate:'2026-09-04'});
assert.equal(parsed.status,'meeting');
assert.equal(parsed.meeting_number,13);
assert.equal(parsed.racecourse.id,'king-khalid-racecourse-taif');
assert.equal(parsed.timetable_rows.length,3);
assert.deepEqual(parsed.timetable_rows[0],{label:'Race 1',post_time_local:'16:30'});
assert.equal(resolveSaudiRacecourse('2026-10-16').id,'king-abdulaziz-racecourse-riyadh');
assert.equal(resolveSaudiRacecourse('2026-10-01'),null);
assert.deepEqual(parseJcsaMeetingHtml('<html><body>JCSA Races</body></html>'),{status:'no_meeting'});

const record=buildJcsaMeetingRecord({date:'2026-09-04',html,checkedAt:'2026-09-21T12:00:00Z'});
assert.equal(record.capability_rank,'A');
assert.equal(record.country_id,'saudi-arabia');
assert.equal(record.authority_id,'jockey-club-of-saudi-arabia');
assert.equal(record.racing_system_id,'saudi-arabia-jcsa-system');
assert.equal(record.first_race_time_local,'16:30');
assert.equal(record.last_race_time_local,'17:30');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:record.acquisition_attempt,evidence_support:record.evidence_support},record.meeting_id),[]);
console.log('SAUDI_JCSA_ADAPTER: pass');
