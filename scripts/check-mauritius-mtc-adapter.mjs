import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildMauritiusMeetingRecord,parseMtcFixturesHtml} from './timetable/mauritius-mtc-calendar-core.mjs';
const html='<h1>2026 Race Season</h1><p>Champ de Mars</p><h2>Next Race</h2><p>150th Anniversary Cup G3 - 990m 04 October 2026 View Race Card</p><h2>Upcoming Meetings</h2><p>04 October 2026</p><p>18 October 2026</p><h2>Major Races Season 2026</h2><p>Race Day: Sunday, 6 December 2026</p>';
const rows=parseMtcFixturesHtml(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-04','2026-10-18']);
const rec=buildMauritiusMeetingRecord(rows[0],{checkedAt:'2026-10-01T00:00:00Z'});
assert.equal(rec.capability_rank,'C');assert.equal(rec.first_race_time_local,null);assert.equal(rec.racecourse_id,'mauritius--champ-de-mars');
if(process.env.GITHUB_ACTIONS==='true'){
  const output='.mauritius-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-mauritius-mtc-official-window.mjs','--as-of=2026-10-01','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('MAURITIUS_MTC_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-04'));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('MAURITIUS_MTC_ADAPTER: pass');
