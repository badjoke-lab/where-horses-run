import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {BARBADOS_RACECOURSE_ID,buildBarbadosMeetingRecord,parseBarbadosRacingCalendar} from './timetable/barbados-calendar-core.mjs';

const html='<html><body><h1>2026 RACING CALENDAR</h1><div>17TH RACEDAY SATURDAY OCTOBER 31, 2026</div><div>18TH RACEDAY SATURDAY NOVEMBER 14, 2026</div><div>16TH RACEDAY SATURDAY SEPTEMBER 5, 2026 (CANCELLED)</div><div>21ST RACEDAY SATURDAY 26TH DECEMBER, 2026</div></body></html>';
const rows=parseBarbadosRacingCalendar(html);
assert.deepEqual(rows.map(r=>r.date),['2026-09-05','2026-10-31','2026-11-14','2026-12-26']);
assert.equal(rows.find(r=>r.date==='2026-09-05').cancelled,true);
assert.equal(rows.find(r=>r.date==='2026-10-31').cancelled,false);
assert.ok(rows.every(r=>r.racecourse_id===BARBADOS_RACECOURSE_ID));
const rec=buildBarbadosMeetingRecord(rows.find(r=>r.date==='2026-10-31'),{checkedAt:'2026-10-06T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.barbados-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-barbados-official-window.mjs','--days=90','--output='+output],{encoding:'utf8',timeout:120000});
    const a=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('BARBADOS_LIVE: '+JSON.stringify({
      attempt:a.acquisition_attempt,discovery:a.discovery,diagnostics:a.diagnostics,
      records:(a.records??[]).map(r=>({date:r.date,racecourse_id:r.racecourse_id,rank:r.capability_rank}))
    }));
    assert.equal(a.acquisition_attempt?.status,'success');
    assert.equal(a.diagnostics?.source_errors?.length,0);
    assert.equal(a.diagnostics?.parse_failures?.length,0);
    assert.ok((a.records??[]).every(r=>r.racecourse_id===BARBADOS_RACECOURSE_ID));
    assert.ok((a.records??[]).length>0);
  }finally{
    fs.rmSync(output,{force:true});
  }
}
console.log('BARBADOS_ADAPTER: pass');
