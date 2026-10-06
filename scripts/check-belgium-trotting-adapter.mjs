import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {buildBelgiumMeetingRecord,parseBelgiumTrottingPage} from './timetable/belgium-trotting-calendar-core.mjs';

const html='<html><body><h1>Trotting BE</h1>03-10-2026 Programma Mons Toestand Tijd Naam Prijzengeld Datum van het einde van de aangifte Datum sluiting jockey Video 18:44 n° 1 29-09-26 11:00 06-10-2026 Programma Waregem Toestand Tijd Naam Prijzengeld Datum van het einde van de aangifte Datum sluiting jockey Video 18:07 n° 1 01-10-26 11:00 11-10-2026 Programma Tongeren Toestand Tijd Naam Prijzengeld Datum van het einde van de aangifte Datum sluiting jockey Video 13:30 n° 1</body></html>';
const rows=parseBelgiumTrottingPage(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-03','2026-10-06','2026-10-11']);
assert.deepEqual(rows.map(r=>r.racecourse_id),['belgium--hippodrome-de-wallonie','belgium--gaverbeekhippodroom','belgium--jeker-hippodroom']);
const rec=buildBelgiumMeetingRecord(rows[0],{checkedAt:'2026-10-02T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.last_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);

assert.throws(()=>parseBelgiumTrottingPage('<h1>Trotting BE</h1>03-10-2026 Programma Unknown Toestand Tijd Naam Prijzengeld Datum van het einde van de aangifte'),/Unknown Belgian trotting venue labels/);

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.belgium-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-belgium-trotting-official-window.mjs','--as-of=2026-10-02','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('BELGIUM_TROTTING_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>({date:r.date,racecourse_id:r.racecourse_id}))}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    // The live federation page prunes completed meetings, so validate the rolling contract rather than expired fixtures.
    assert.ok((artifact.records??[]).length>=1);
    assert.ok((artifact.records??[]).every(r=>r.date>='2026-10-02'&&r.date<'2026-11-01'));
    assert.ok((artifact.records??[]).every(r=>[
      'belgium--hippodrome-de-wallonie',
      'belgium--gaverbeekhippodroom',
      'belgium--jeker-hippodroom',
    ].includes(r.racecourse_id)));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
    assert.ok((artifact.records??[]).every(r=>r.first_race_time_local===null&&r.timetable_rows?.length===0));
  }finally{fs.rmSync(output,{force:true});}
}
console.log('BELGIUM_TROTTING_ADAPTER: pass');
