import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {buildCyprusMeetingRecord,parseNrcSchedulePage,parseNrcSchedulePdfText} from './timetable/cyprus-nrc-calendar-core.mjs';

const html='<h1>Race Meetings Schedule</h1><a href="#" onClick="MM_openBrWindow(\'html_pages/schedule_oct.pdf\',\'\',\'toolbar=no\')">October</a><a href="#" onClick="MM_openBrWindow(\'html_pages/schedule_nov.pdf\',\'\',\'toolbar=no\')">November</a>';
const links=parseNrcSchedulePage(html);
assert.deepEqual(links.map(x=>x.month),[10,11]);
assert.equal(links[0].url,'https://www.nicosiaraceclub.com.cy/html_pages/schedule_oct.pdf');

const text='Performance Date Day Start Time 74 01/10/26 Thursday 15:30 75 04/10/26 Sunday 15:30 76 07/10/26 Wednesday 15:30';
const rows=parseNrcSchedulePdfText(text,{sourceUrl:links[0].url});
assert.deepEqual(rows.map(r=>r.date),['2026-10-01','2026-10-04','2026-10-07']);
const rec=buildCyprusMeetingRecord(rows[1],{checkedAt:'2026-10-02T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.last_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
assert.equal(rec.racecourse_id,'cyprus--nicosia-racecourse');

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.cyprus-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-cyprus-nrc-official-window.mjs','--as-of=2026-10-02','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('CYPRUS_NRC_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-04'));
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-31'));
    assert.ok(!(artifact.records??[]).some(r=>r.date==='2026-10-01'));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
    assert.equal(artifact.diagnostics?.unknown_venues?.length,0);
    assert.ok((artifact.records??[]).every(r=>r.first_race_time_local===null&&r.timetable_rows?.length===0));
  }finally{fs.rmSync(output,{force:true});}
}
console.log('CYPRUS_NRC_ADAPTER: pass');
