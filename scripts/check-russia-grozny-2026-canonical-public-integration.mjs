// PR only: verify Russia one-venue C acquisition to canonical/public without any production push.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const a=JSON.parse(fs.readFileSync('/tmp/russia-grozny.json','utf8'));
assert.equal(a.acquisition_attempt.status,'success',JSON.stringify(a.diagnostics));
assert.deepEqual(a.records.map(x=>x.date),['2026-10-30']);
const c='data/generated/timetable/canonical/meetings.json';
const p='data/generated/timetable/public/meeting-list.json';
const beforeC=JSON.parse(fs.readFileSync(c,'utf8')),beforeP=JSON.parse(fs.readFileSync(p,'utf8'));
const apply=(file)=>execFileSync(process.execPath,['scripts/timetable/apply-official-rolling-observations.mjs',
 '--artifact='+file,'--country-id=russia','--authority-id=grozny-hippodrome-operator',
 '--racing-system-id=russia-grozny-thoroughbred-system','--timezone=Europe/Moscow'
],{encoding:'utf8',timeout:45000});
console.log('RUSSIA_GROZNY_APPLY '+apply('/tmp/russia-grozny.json').trim());
const afterC=JSON.parse(fs.readFileSync(c,'utf8')),afterP=JSON.parse(fs.readFileSync(p,'utf8'));
const id=a.records[0].meeting_id;
const canonical=afterC.meetings.filter(x=>x.meeting_id===id);
const publicRows=afterP.meetings.filter(x=>x.meeting_id===id);
assert.equal(canonical.length,1,'one Grozny canonical meeting');
assert.equal(publicRows.length,1,'one Grozny public meeting');
assert.equal(canonical[0].capability_rank,'C');
assert.equal(publicRows[0].racecourse_id,'russia--grozny-hippodrome');
assert.equal(publicRows[0].first_race_time_local,null);
assert.equal(publicRows[0].show_live_label,false);
assert.deepEqual(afterC.meetings.filter(x=>x.meeting_id!==id),beforeC.meetings.filter(x=>x.meeting_id!==id),'other canonical meetings changed');
assert.deepEqual(afterP.meetings.filter(x=>x.meeting_id!==id),beforeP.meetings.filter(x=>x.meeting_id!==id),'other public meetings changed');
const failure={...a,records:[],acquisition_attempt:{...a.acquisition_attempt,status:'network_error',error_code:'test_403'},discovery:{...a.discovery,source_visible_rows:0,window_visible_rows:0}};
fs.writeFileSync('/tmp/russia-grozny-source-failure.json',JSON.stringify(failure));
console.log('RUSSIA_GROZNY_FAILURE_APPLY '+apply('/tmp/russia-grozny-source-failure.json').trim());
assert.deepEqual(JSON.parse(fs.readFileSync(c,'utf8')).meetings.filter(x=>x.meeting_id===id),canonical,'failure must retain Grozny canonical');
assert.deepEqual(JSON.parse(fs.readFileSync(p,'utf8')).meetings.filter(x=>x.meeting_id===id),publicRows,'failure must retain Grozny public');
console.log('RUSSIA_GROZNY_E2E_PASS canonical=1 public=1 others unchanged source failure retained');
