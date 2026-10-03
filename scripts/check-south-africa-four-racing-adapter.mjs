import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildFourRacingMeetingRecord,discoverFourRacingFixturePdfUrl,discoverNationalFixtureVersion,parseFourRacingNationalFixturePages,resolveFourRacingVenue } from './timetable/south-africa-four-racing-core.mjs';

const indexHtml='<a href="/Programs/FX/Jan%20to%20Dec%202026%20Sep%201%20(V7).pdf">Jan to Dec 2026 Sep 1 (V7)</a><a href="/Programs/FX/Jan%20to%20Dec%202026%20Oct%201%20(V8).pdf">Jan to Dec 2026 Oct 1 (V8)</a>';
assert.equal(discoverFourRacingFixturePdfUrl(indexHtml),'https://www.sahorseracing.co.za/Programs/FX/Jan%20to%20Dec%202026%20Oct%201%20(V8).pdf');

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
if(process.env.GITHUB_ACTIONS==='true'){
 const output='.south-africa-four-racing-live-'+process.pid+'.json';
 try{
  execFileSync(process.execPath,['scripts/timetable/run-south-africa-four-racing-official-window.mjs','--as-of=2026-10-03','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
  const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
  console.log('SOUTH_AFRICA_FOUR_RACING_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>({date:r.date,racecourse_id:r.racecourse_id}))}));
  assert.equal(artifact.acquisition_attempt?.status,'success');
  assert.ok((artifact.discovery?.fixture_version?.version??0)>=8);
  assert.ok((artifact.discovery?.annual_4racing_rows??0)>0);
  assert.ok((artifact.records??[]).length>0);
  assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  assert.equal(artifact.diagnostics?.unknown_venues?.length,0);
  assert.match(String(artifact.discovery?.source_url??''),/sahorseracing\.co\.za\/Programs\/FX\//);
 }finally{fs.rmSync(output,{force:true});}
}
console.log('SOUTH_AFRICA_FOUR_RACING_ADAPTER: pass');
