// PR-only Venezuela CHC integration: canonical/public copies are ephemeral, not production pushes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const file='/tmp/venezuela-chc.json',a=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(a.acquisition_attempt?.status,'success',JSON.stringify(a.diagnostics));
const dates=['2026-11-15','2026-11-22','2026-12-13'];
assert.deepEqual(a.records.map(r=>r.date),dates);
const canon='data/generated/timetable/canonical/meetings.json';
const pub='data/generated/timetable/public/meeting-list.json';
const beforeCanonical=JSON.parse(fs.readFileSync(canon,'utf8'));
const beforePublic=JSON.parse(fs.readFileSync(pub,'utf8'));
const apply=(input)=>execFileSync(process.execPath,[
 'scripts/timetable/apply-official-rolling-observations.mjs',
 '--artifact='+input,'--country-id=venezuela',
 '--authority-id=confederacion-hipica-del-caribe',
 '--racing-system-id=venezuela-chc-2026-selected-classic-fixtures-system',
 '--timezone=America/Caracas'
],{encoding:'utf8',timeout:45000});
console.log('VEN_CHC_APPLY '+apply(file).trim());
const after=JSON.parse(fs.readFileSync(canon,'utf8')),afterPublic=JSON.parse(fs.readFileSync(pub,'utf8'));
const mine=a.records.map(x=>x.meeting_id);
const selected=after.meetings.filter(x=>mine.includes(x.meeting_id));
const selectedPublic=afterPublic.meetings.filter(x=>mine.includes(x.meeting_id));
assert.equal(selected.length,3,'three CHC dates must persist in canonical');
assert.equal(selectedPublic.length,3,'three CHC dates must persist in public');
assert.ok(selected.every(x=>x.capability_rank==='C'&&x.racecourse_id==='venezuela--hipodromo-la-rinconada'));
assert.ok(selectedPublic.every(x=>x.racecourse_id==='venezuela--hipodromo-la-rinconada'&&!x.timetable_rows?.length));
assert.deepEqual(after.meetings.filter(x=>!mine.includes(x.meeting_id)),beforeCanonical.meetings.filter(x=>!mine.includes(x.meeting_id)),'unrelated canonical rows changed');
assert.deepEqual(afterPublic.meetings.filter(x=>!mine.includes(x.meeting_id)),beforePublic.meetings.filter(x=>!mine.includes(x.meeting_id)),'unrelated public rows changed');
const failure={...a,records:[],acquisition_attempt:{...a.acquisition_attempt,status:'network_error',error_code:'test_timeout'},discovery:{...a.discovery,source_visible_rows:0,window_visible_rows:0}};
const failPath='/tmp/venezuela-chc-failure.json';fs.writeFileSync(failPath,JSON.stringify(failure));
console.log('VEN_CHC_FAILED_SOURCE '+apply(failPath).trim());
const afterFailure=JSON.parse(fs.readFileSync(canon,'utf8')),pubFailure=JSON.parse(fs.readFileSync(pub,'utf8'));
assert.deepEqual(afterFailure.meetings.filter(x=>mine.includes(x.meeting_id)),selected,'network error must retain canonical');
assert.deepEqual(pubFailure.meetings.filter(x=>mine.includes(x.meeting_id)),selectedPublic,'network error must retain public');
console.log('VEN_CHC_E2E_PASS canonical=3 public=3 other countries unaffected, source failure preserves both');
