// PR-only end-to-end integration. Mutates checkout data, not GitHub main.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const a=JSON.parse(fs.readFileSync('/tmp/indonesia-porprov-c.json','utf8'));
assert.equal(a.acquisition_attempt.status,'success',JSON.stringify(a.diagnostics));
assert.deepEqual(a.records.map(r=>r.date),['2026-11-07','2026-11-08']);
const c='data/generated/timetable/canonical/meetings.json';
const p='data/generated/timetable/public/meeting-list.json';
const beforeC=JSON.parse(fs.readFileSync(c,'utf8')),beforeP=JSON.parse(fs.readFileSync(p,'utf8'));
const ids=new Set(a.records.map(x=>x.meeting_id));
const without=(s)=>s.meetings.filter(x=>!ids.has(x.meeting_id));
const originalCanonical=without(beforeC),originalPublic=without(beforeP);
function apply(path) {
 return execFileSync(process.execPath,['scripts/timetable/apply-official-rolling-observations.mjs',
 '--artifact='+path,'--country-id=indonesia',
 '--authority-id=porprov-xv-jabar-organizer',
 '--racing-system-id=indonesia-porprov-xv-jabar-2026-pacuan-system',
 '--timezone=Asia/Jakarta'],{encoding:'utf8',timeout:75000});
}
console.log('INDONESIA_C_APPLY '+apply('/tmp/indonesia-porprov-c.json').trim());
const afterC=JSON.parse(fs.readFileSync(c,'utf8')),afterP=JSON.parse(fs.readFileSync(p,'utf8'));
const gotC=afterC.meetings.filter(x=>ids.has(x.meeting_id)),gotP=afterP.meetings.filter(x=>ids.has(x.meeting_id));
assert.equal(gotC.length,2,'exactly two PORPROV canonical rows');
assert.equal(gotP.length,2,'exactly two PORPROV public rows');
for(const x of gotP){
 assert.equal(x.country_id,'indonesia');
 assert.equal(x.racecourse_id,'indonesia--legokjawa-racecourse');
 assert.equal(x.effective_public_rank,'C');
 assert.equal(x.first_race_time_local,null);
 assert.equal(x.last_race_time_local,null);
 assert.equal(x.show_live_label,false);
 assert.equal(x.show_replay_label,false);
}
assert.deepEqual(without(afterC),originalCanonical,'unrelated canonical countries changed');
assert.deepEqual(without(afterP),originalPublic,'unrelated public countries changed');
const failed={...a,records:[],acquisition_attempt:{...a.acquisition_attempt,status:'network_error',error_code:'test_403'},discovery:{...a.discovery,source_visible_rows:0,window_visible_rows:0}};
fs.writeFileSync('/tmp/indonesia-porprov-fail.json',JSON.stringify(failed));
console.log('INDONESIA_C_FAILURE_APPLY '+apply('/tmp/indonesia-porprov-fail.json').trim());
assert.deepEqual(JSON.parse(fs.readFileSync(c,'utf8')).meetings.filter(x=>ids.has(x.meeting_id)),gotC,'source failure wiped canonical');
assert.deepEqual(JSON.parse(fs.readFileSync(p,'utf8')).meetings.filter(x=>ids.has(x.meeting_id)),gotP,'source failure wiped public');
console.log('INDONESIA_PORPROV_E2E_PASS canonical=2 public=2 unrelated unchanged failure keeps last verified');
