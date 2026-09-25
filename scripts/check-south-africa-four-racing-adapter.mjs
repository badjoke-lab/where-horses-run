import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import { buildFourRacingMeetingRecord,discoverNationalFixtureVersion,parseFourRacingNationalFixturePages,resolveFourRacingVenue } from './timetable/south-africa-four-racing-core.mjs';

const page={page_number:11,items:[
 {str:'October 2026',x:40,y:760},{str:'Version 7 (11 August 2026)',x:500,y:760},
 {str:'Date',x:40,y:735},{str:'Day',x:75,y:735},{str:'HIGHVELD',x:330,y:735},{str:'EASTERN CAPE',x:520,y:735},
 {str:'1',x:40,y:710},{str:'VAAL',x:330,y:710},
 {str:'2',x:40,y:690},{str:'FAIR(T)',x:520,y:690},
 {str:'3',x:40,y:670},{str:'TURF(I)',x:330,y:670},
 {str:'9',x:40,y:650},{str:'FAIR(T)',x:520,y:650},{str:'(Prev 7-Oct)',x:575,y:650},
 {str:'16',x:40,y:630},{str:'FAIR(P)',x:520,y:630},{str:'(Prev 21-Oct)',x:575,y:630},
 {str:'18',x:40,y:610},{str:'FAIR(T)',x:520,y:610},{str:'(Added)',x:575,y:610},
 {str:'20',x:40,y:590},{str:'Prev',x:300,y:590},{str:'TURF(I)',x:330,y:590},
 {str:'21',x:40,y:570},{str:'VAAL',x:330,y:570},{str:'Cancelled',x:390,y:570},
]};
const parsed=parseFourRacingNationalFixturePages([page],{year:2026,sourceUrl:'https://example.test/fixtures.pdf'});
assert.equal(parsed.parse_failures.length,0);assert.equal(parsed.unknown_venues.length,0);
assert.deepEqual(parsed.records.map(x=>[x.date,x.racecourse_id]),[
 ['2026-10-01','south-africa--vaal'],['2026-10-02','south-africa--fairview'],['2026-10-03','south-africa--turffontein'],['2026-10-09','south-africa--fairview'],['2026-10-16','south-africa--fairview'],['2026-10-18','south-africa--fairview']
]);
assert.equal(resolveFourRacingVenue('VAAL(CL)').course_context,'classic');
assert.deepEqual(discoverNationalFixtureVersion([page]),{version:7,label:'11 August 2026',page_number:11});
const record=buildFourRacingMeetingRecord(parsed.records[0],{checkedAt:'2026-09-26T00:00:00Z'});
assert.equal(record.country_id,'south-africa');assert.equal(record.authority_id,'four-racing');assert.equal(record.racing_system_id,'south-africa-4racing-system');assert.equal(record.capability_rank,'C');assert.equal(record.first_race_time_local,null);
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:record.acquisition_attempt,acquisition_completion:record.acquisition_completion,evidence_support:record.evidence_support}),[]);
console.log('SOUTH_AFRICA_FOUR_RACING_ADAPTER: pass');
