// Ephemeral PR-only integration test: no push, no production mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const source='/tmp/btc-winter-candidate.json';
const artifact=JSON.parse(fs.readFileSync(source,'utf8'));
if(artifact.acquisition_attempt?.status!=='success'){
 assert.ok(['network_error'].includes(artifact.acquisition_attempt.status),'parser drift must fail CI');
 assert.deepEqual(artifact.records,[]);
 console.log('BTC_E2E_INCONCLUSIVE official source transport unavailable; no publication performed');
 process.exit(0);
}
const ids=new Set(artifact.records.map(r=>r.meeting_id));
assert.equal(artifact.discovery.source_visible_rows,24);
assert.equal(ids.size,15);
const applyFile='scripts/timetable/apply-official-rolling-observations.mjs';
const args=(file)=>[applyFile,'--artifact='+file,'--country-id=india','--authority-id=bangalore-turf-club',
 '--racing-system-id=india-bangalore-turf-club-thoroughbred-system','--timezone=Asia/Kolkata'];
const run=(file)=>execFileSync(process.execPath,args(file),{encoding:'utf8',timeout:45000});
const canonPath='data/generated/timetable/canonical/meetings.json';
const pubPath='data/generated/timetable/public/meeting-list.json';
const sourceState=fs.readFileSync(canonPath,'utf8');
const sourcePublic=fs.readFileSync(pubPath,'utf8');
console.log('BTC_E2E_APPLY '+run(source).trim());
const canon=JSON.parse(fs.readFileSync(canonPath,'utf8'));
const pub=JSON.parse(fs.readFileSync(pubPath,'utf8'));
const myCanon=canon.meetings.filter(r=>r.country_id==='india'&&r.authority_id==='bangalore-turf-club');
const myPub=pub.meetings.filter(r=>r.country_id==='india'&&r.authority_id==='bangalore-turf-club');
assert.equal(myCanon.length,15,'15 winter-date facts must enter isolated canonical snapshot');
assert.equal(myPub.length,15,'15 winter-date facts must enter isolated public snapshot');
assert.ok(myCanon.every(x=>ids.has(x.meeting_id)&&x.racecourse_id==='india--bangalore-racecourse'&&x.capability_rank==='C'));
assert.ok(myPub.every(x=>ids.has(x.meeting_id)&&x.racecourse_id==='india--bangalore-racecourse'));
assert.ok(myPub.every(x=>!x.timetable_rows?.length),'C fixture must never publish racecard details');
const originalOtherCanon=JSON.parse(sourceState).meetings.filter(x=>x.country_id!=='india');
const originalOtherPub=JSON.parse(sourcePublic).meetings.filter(x=>x.country_id!=='india');
assert.deepEqual(canon.meetings.filter(x=>x.country_id!=='india'),originalOtherCanon,'unrelated canonical rows changed');
assert.deepEqual(pub.meetings.filter(x=>x.country_id!=='india'),originalOtherPub,'unrelated public rows changed');
// An HTTP/robots/parser outage is not non-running evidence: applying an error
// observation with zero records cannot remove or downgrade published facts.
const failure={...artifact,records:[],acquisition_attempt:{...artifact.acquisition_attempt,status:'network_error',error_code:'test_transient_network_error'},
 discovery:{...artifact.discovery,source_visible_rows:0,window_visible_rows:0}};
const file='/tmp/btc-failure-candidate.json';
fs.writeFileSync(file,JSON.stringify(failure));
console.log('BTC_E2E_FAILURE_APPLY '+run(file).trim());
const canonAfter=JSON.parse(fs.readFileSync(canonPath,'utf8'));
const pubAfter=JSON.parse(fs.readFileSync(pubPath,'utf8'));
assert.deepEqual(canonAfter.meetings.filter(x=>x.country_id==='india'),myCanon,
 'failed acquisition removed or changed verified Bangalore canonical meetings');
assert.deepEqual(pubAfter.meetings.filter(x=>x.country_id==='india'),myPub,
 'failed acquisition removed or changed verified Bangalore public meetings');
console.log('BTC_E2E_PASS canonical='+myCanon.length+' public='+myPub.length+' other countries retained; source failure retained verified facts');
