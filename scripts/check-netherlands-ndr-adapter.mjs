import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildNetherlandsMeetingRecord,parseNdrUpcomingHtml} from './timetable/netherlands-ndr-calendar-core.mjs';

const html='<h2>Komende dagen</h2><ul><li>02-10-26</li><li>Zandvoort</li><li>10-10-26</li><li>Wolvega</li><li>11-10-26</li><li>Alkmaar</li><li>12-10-26</li><li>t Zand</li></ul><h2>Koersprogramma’s</h2>';
const parsed=parseNdrUpcomingHtml(html);
assert.deepEqual(parsed.rows.map(r=>r.date),['2026-10-02','2026-10-10','2026-10-11','2026-10-12']);
assert.equal(parsed.unknown_venues.length,0);
assert.equal(parsed.rows[0].racecourse_id,'netherlands--kortebaan-zandvoort');
assert.equal(parsed.rows[3].racecourse_id,'netherlands--kortebaan-t-zand');
const rec=buildNetherlandsMeetingRecord(parsed.rows[1],{checkedAt:'2026-10-01T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.racecourse_id,'netherlands--victoria-park-wolvega');

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.netherlands-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-netherlands-ndr-official-window.mjs','--as-of=2026-10-01','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('NETHERLANDS_NDR_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>({date:r.date,racecourse_id:r.racecourse_id}))}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-02'&&r.racecourse_id==='netherlands--kortebaan-zandvoort'));
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-10'&&r.racecourse_id==='netherlands--victoria-park-wolvega'));
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-11'&&r.racecourse_id==='netherlands--drafcentrum-alkmaar'));
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-12'&&r.racecourse_id==='netherlands--kortebaan-t-zand'));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
    assert.equal(artifact.diagnostics?.unknown_venues?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('NETHERLANDS_NDR_ADAPTER: pass');
