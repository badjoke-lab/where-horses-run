import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  parseNztrRpgLandingPage,parseNztrRpgProgrammeText,parseLoveracingIndex,parseLoveracingMeetingPage,
  parseHrnzIndex,parseHrnzMonthPage,parseHrnzProgrammePage,resolveNewZealandRacecourseId,
  buildNztrFixtureRecord,buildLoveracingDetailedRecord,buildHrnzRecord,
} from './timetable/new-zealand-official-core.mjs';

const rpgLanding=`<html><body><h1>Racing Programme Guide</h1><div>Latest Issue (Full Programmes)</div><a href="/sites/nztrindustry/files/2026-08/Programming%20A4%2025%20Aug.pdf">CLICK HERE</a></body></html>`;
const landing=parseNztrRpgLandingPage(rpgLanding,{sourceUrl:'https://nztr.co.nz/racing-programme-guide'});
assert.equal(landing.programme_url,'https://nztr.co.nz/sites/nztrindustry/files/2026-08/Programming%20A4%2025%20Aug.pdf');

const rpgText=`
SOUTH CANTERBURY RACING CLUB INDUSTRY MEETING
TO BE HELD AT PHAR LAP RACEWAY,
ON WEDNESDAY 23 SEPTEMBER 2026
WAIKATO THOROUGHBRED RACING FEATURE MEETING TO BE HELD AT TE RAPA, ON FRIDAY 25 SEPTEMBER 2026
WAVERLEY RACING CLUB INDUSTRY MEETING TO BE HELD AT WAVERLEY, ON SUNDAY 27 SEPTEMBER 2026
`;
const schedule=parseNztrRpgProgrammeText(rpgText);
assert.deepEqual(schedule.map(x=>[x.date,x.racecourse_id]),[
  ['2026-09-23','phar-lap-raceway'],
  ['2026-09-25','te-rapa-racecourse'],
  ['2026-09-27','waverley-racecourse'],
]);
assert.equal(resolveNewZealandRacecourseId('Cambridge Synthetic'),'cambridge-synthetic-racecourse');
assert.equal(resolveNewZealandRacecourseId('Addington Raceway'),'addington-raceway');

const loveracingIndex=`<html><body><h1>RaceInfo</h1><a href="/RaceInfo/55949/Meeting-Overview.aspx">South Canterbury RC</a><a href="/RaceInfo/55950/Meeting-Overview.aspx">Waikato Thoroughbred Racing</a></body></html>`;
assert.deepEqual(parseLoveracingIndex(loveracingIndex,{sourceUrl:'https://loveracing.nz/RaceInfo.aspx'}),[
  'https://loveracing.nz/RaceInfo/55949/Meeting-Overview.aspx',
  'https://loveracing.nz/RaceInfo/55950/Meeting-Overview.aspx',
]);

const loveracingDetail=`<html><head><title>Race Meeting for SOUTH CANTERBURY RC at PHAR LAP RACEWAY on 23 SEP 2026 | LOVERACING.NZ</title></head><body>
<div>Race 1:</div><div>11:45 am</div><div>Race 2:</div><div>12:18 pm</div><div>Race 3:</div><div>12:50 pm</div>
</body></html>`;
const detail=parseLoveracingMeetingPage(loveracingDetail,{sourceUrl:'https://loveracing.nz/RaceInfo/55949/Meeting-Overview.aspx'});
assert.equal(detail.date,'2026-09-23');
assert.equal(detail.racecourse_id,'phar-lap-raceway');
assert.deepEqual(detail.timetable_rows,[
  {label:'Race 1',post_time_local:'11:45'},
  {label:'Race 2',post_time_local:'12:18'},
  {label:'Race 3',post_time_local:'12:50'},
]);

const hrnzIndex=`<html><body><h1>2027 Racing Dates</h1><a href="2027/dates_september2027.htm">September 2026</a><a href="/datahrs/calendar/raceday/2027/dates_october2027.htm">October 2026</a></body></html>`;
assert.deepEqual(parseHrnzIndex(hrnzIndex,{sourceUrl:'https://infohorse.hrnz.co.nz/datahrs/calendar/raceday/dates_index.htm'}),[
  'https://infohorse.hrnz.co.nz/datahrs/calendar/raceday/2027/dates_september2027.htm',
  'https://infohorse.hrnz.co.nz/datahrs/calendar/raceday/2027/dates_october2027.htm',
]);

const hrnzMonth=`<html><body><h1>September 2026</h1><table><tr><td>23</td><td>+</td><td>Wednesday</td><td><a href="../../../programmes/2026092332pg-01.htm">NZ Metropolitan Trotting Club Inc</a></td></tr><tr><td>24</td><td>*</td><td>Thursday</td><td><a href="../../../programmes/2026092402pg-01.htm">Auckland Trotting Club Inc</a></td></tr></table></body></html>`;
const hrnzRows=parseHrnzMonthPage(hrnzMonth,{sourceUrl:'https://infohorse.hrnz.co.nz/datahrs/calendar/raceday/2027/dates_september2027.htm'});
assert.equal(hrnzRows.length,2);
assert.equal(hrnzRows[0].date,'2026-09-23');
assert.equal(hrnzRows[0].programme_url,'https://infohorse.hrnz.co.nz/datahrs/programmes/2026092332pg-01.htm');

const hrnzProgramme=`<html><body><h1>NZ Metropolitan Trotting Club Inc</h1><div>Wednesday, 23 September</div><h5>Meeting: TWILIGHT TROTS AT ADDINGTON at Addington Raceway</h5><div>Last updated 16/09/2026 at 15:30 pm</div><h5>First Race Starts 4:30 pm</h5></body></html>`;
const harnessDetail=parseHrnzProgrammePage(hrnzProgramme,{date:'2026-09-23',clubLabel:'NZ Metropolitan Trotting Club Inc',sourceUrl:hrnzRows[0].programme_url});
assert.equal(harnessDetail.racecourse_id,'addington-raceway');
assert.equal(harnessDetail.first_race_time_local,'16:30');

const checkedAt='2026-09-23T00:00:00Z';
const fixture=buildNztrFixtureRecord(schedule[0],{checkedAt,programmeUrl:landing.programme_url});
assert.equal(fixture.capability_rank,'C');
assert.equal(fixture.acquisition_completion.disposition,'pending_publication');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:fixture.acquisition_attempt,acquisition_completion:fixture.acquisition_completion,evidence_support:fixture.evidence_support}),[]);

const detailed=buildLoveracingDetailedRecord(schedule[0],detail,{checkedAt,programmeUrl:landing.programme_url});
assert.equal(detailed.capability_rank,'A');
assert.equal(detailed.first_race_time_local,'11:45');
assert.equal(detailed.last_race_time_local,'12:50');
assert.equal(detailed.acquisition_completion.disposition,'complete_current_best_available');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:detailed.acquisition_attempt,acquisition_completion:detailed.acquisition_completion,evidence_support:detailed.evidence_support}),[]);

const harness=buildHrnzRecord(harnessDetail,{checkedAt,calendarUrl:hrnzRows[0].source_url});
assert.equal(harness.capability_rank,'B');
assert.equal(harness.first_race_time_local,'16:30');
assert.equal(harness.acquisition_completion.disposition,'complete_current_best_available');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:harness.acquisition_attempt,acquisition_completion:harness.acquisition_completion,evidence_support:harness.evidence_support}),[]);

console.log('NEW_ZEALAND_OFFICIAL_ADAPTER: pass');
