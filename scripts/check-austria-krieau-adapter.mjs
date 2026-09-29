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
if(process.env.GITHUB_ACTIONS==='true'){
  const output='.austria-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-austria-krieau-official-window.mjs','--as-of=2026-09-30','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('AUSTRIA_KRIEAU_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).length>=2);
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-04'));
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-25'));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('AUSTRIA_KRIEAU_ADAPTER: pass');
