import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {QATAR_RACECOURSES,buildQatarMeetingRecord,normalizeQrecPostTime,resolveQrecRacecourse} from './timetable/qatar-qrec-calendar-core.mjs';

assert.equal(resolveQrecRacecourse('1st Al Rayyan Race Meeting - Al Ghariyah Cup').id,QATAR_RACECOURSES['al-rayyan'].id);
assert.equal(resolveQrecRacecourse('Al Uqda Race Meeting - Test Cup').id,QATAR_RACECOURSES['al-uqda'].id);
assert.equal(resolveQrecRacecourse('Unknown Race Meeting'),null);
assert.equal(normalizeQrecPostTime('00:00'),null);
assert.equal(normalizeQrecPostTime('16:30'),'16:30');

const c=buildQatarMeetingRecord({
  date:'2026-10-14',meetid:12045,meetingName:'1st Al Rayyan Race Meeting - Al Ghariyah Cup',
  races:[{raceid:1,name:'Race One',distance:1200,postTime:'00:00'},{raceid:2,name:'Race Two',distance:1700,postTime:'00:00'}]
},{checkedAt:'2026-10-06T00:00:00Z'});
assert.equal(c.capability_rank,'C');
assert.equal(c.racecourse_id,QATAR_RACECOURSES['al-rayyan'].id);
assert.equal(c.first_race_time_local,null);

const a=buildQatarMeetingRecord({
  date:'2026-10-14',meetid:12045,meetingName:'1st Al Rayyan Race Meeting - Al Ghariyah Cup',
  races:[{raceid:1,name:'Race One',distance:1200,postTime:'16:00'},{raceid:2,name:'Race Two',distance:1700,postTime:'16:35'}]
},{checkedAt:'2026-10-06T00:00:00Z'});
assert.equal(a.capability_rank,'A');
assert.equal(a.timetable_rows[0].race_name,'Race One');
assert.equal(a.timetable_rows[1].distance_m,1700);

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.qatar-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-qatar-qrec-official-window.mjs','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const x=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('QATAR_LIVE: '+JSON.stringify({
      attempt:x.acquisition_attempt,
      discovery:x.discovery,
      diagnostics:x.diagnostics,
      records:(x.records??[]).map(r=>({date:r.date,racecourse_id:r.racecourse_id,rank:r.capability_rank,first:r.first_race_time_local,last:r.last_race_time_local}))
    }));
    assert.equal(x.acquisition_attempt?.status,'success');
    assert.equal(x.diagnostics?.source_errors?.length,0);
    assert.equal(x.diagnostics?.parse_failures?.length,0);
    assert.equal(x.diagnostics?.unknown_venues?.length,0);
    assert.ok((x.records??[]).length>0);
  }finally{
    fs.rmSync(output,{force:true});
  }
}
console.log('QATAR_QREC_ADAPTER: pass');
