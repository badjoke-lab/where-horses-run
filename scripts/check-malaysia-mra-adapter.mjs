import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildMalaysiaMeetingRecord,decodeMraFixtureLayout} from './timetable/malaysia-mra-calendar-core.mjs';

const fakeItems=[
 {str:'JANUARY',x:44,y:538.44,w:29},
 {str:'1',x:238.08,y:538.44,w:3.48},
 {str:'2',x:254.28,y:538.44,w:3.48},
 {str:'3',x:270.48,y:538.44,w:3.48},
 ...['FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'].map((m,i)=>({str:m,x:44,y:505.56-(i*32.88),w:30}))
];
const rec=buildMalaysiaMeetingRecord({date:'2026-10-04',club:'selangor',racecourse_id:'malaysia--selangor-turf-club',venue_name:'Selangor Turf Club',source_url:'https://malayanracing.com/pdf/MRA-Racing-Fixture-2026.pdf'},{checkedAt:'2026-10-01T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.racecourse_id,'malaysia--selangor-turf-club');

if(process.env.GITHUB_EVENT_NAME==='pull_request'){
  const output='.malaysia-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-malaysia-mra-official-window.mjs','--as-of=2026-10-01','--days=30','--output='+output],{encoding:'utf8',timeout:180000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('MALAYSIA_MRA_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>[r.date,r.racecourse_id])}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.deepEqual(artifact.discovery?.fixture_totals,{selangor:61,perak:29,total:90});
    const expected=[
      ['2026-10-03','malaysia--perak-turf-club'],
      ['2026-10-04','malaysia--selangor-turf-club'],
      ['2026-10-11','malaysia--selangor-turf-club'],
      ['2026-10-17','malaysia--selangor-turf-club'],
      ['2026-10-18','malaysia--perak-turf-club'],
      ['2026-10-24','malaysia--selangor-turf-club'],
      ['2026-10-25','malaysia--selangor-turf-club']
    ];
    for(const [date,id] of expected) assert.ok((artifact.records??[]).some(r=>r.date===date&&r.racecourse_id===id),'missing '+date+' '+id);
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('MALAYSIA_MRA_ADAPTER: pass');
