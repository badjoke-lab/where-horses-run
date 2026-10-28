import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildAustriaKrieauMeetingRecord,parseKrieauCalendarHtml} from './timetable/austria-krieau-calendar-core.mjs';
const html='<h3>Renntermine 2026</h3><h3>» Oktober «</h3><p>04 OKT. Sonntag ab 13:00 Uhr TEST</p><p>25 OKT. Sonntag ab 15:30 Uhr TEST</p>';
const rows=parseKrieauCalendarHtml(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-04','2026-10-25']);
assert.deepEqual(rows.map(r=>r.event_start_local),['13:00','15:30']);
const rec=buildAustriaKrieauMeetingRecord(rows[0],{checkedAt:'2026-09-30T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.racecourse_id,'austria--trabrennpark-krieau');
function liveWindowStart(){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return parts.year+'-'+parts.month+'-'+parts.day;
}
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};

if(process.env.GITHUB_ACTIONS==='true'){
  const windowStart=liveWindowStart(),windowEnd=addDays(windowStart,30);
  const output='.austria-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-austria-krieau-official-window.mjs','--as-of='+windowStart,'--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('AUSTRIA_KRIEAU_LIVE: '+JSON.stringify({window_start:windowStart,window_end_exclusive:windowEnd,attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    // The live Krieau page prunes completed meetings, so do not pin assertions to past dates.
    // The live authority list drops past meetings. A successful source check
    // must not fail merely because a hardcoded 2026 test month expired.
    assert.ok(artifact.discovery?.source_visible_rows>0,'Official source list must be non-empty');
    assert.ok((artifact.records??[]).length>=1,'Expected current-season meetings in the actual rolling 30-day window');
    assert.ok((artifact.records??[]).every(r=>r.date>=windowStart&&r.date<windowEnd));
    assert.ok((artifact.records??[]).every(r=>r.racecourse_id==='austria--trabrennpark-krieau'));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('AUSTRIA_KRIEAU_ADAPTER: pass');
