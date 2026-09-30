import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildSerbiaMeetingRecord,parseBelgradeSeasonHtml} from './timetable/serbia-belgrade-calendar-core.mjs';

const html='<h1>Current season</h1><p>26.04.2026 1.Trkački dan 7 7 0 0 See more</p><p>18.10.2026 6.Trkački dan 0 0 0 0 See more</p>';
const rows=parseBelgradeSeasonHtml(html);
assert.deepEqual(rows.map(r=>r.date),['2026-04-26','2026-10-18']);
const rec=buildSerbiaMeetingRecord(rows[1],{checkedAt:'2026-09-30T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.racecourse_id,'serbia--belgrade-hippodrome');

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.serbia-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-serbia-belgrade-official-window.mjs','--as-of=2026-09-30','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('SERBIA_BELGRADE_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-18'));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('SERBIA_BELGRADE_ADAPTER: pass');
