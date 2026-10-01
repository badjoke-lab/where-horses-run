import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildGalopSuisseRecord,parseGalopSuisseHomepage,parseIenaGallopHomepage} from './timetable/switzerland-galop-suisse-calendar-core.mjs';

const gs='<h1>Galop Suisse</h1><p>04.10.2026 | Dimanche | Maienfeld</p><p>11.10.2026 | Dimanche | Maienfeld</p><p>18.10.2026 | Dimanche | Zürich-Dielsdorf</p>';
const iena='<h1>Institut Équestre National d’Avenches IENA</h1><p>30-10-26 Courses GALOP – 30 octobre 2026</p>';
const rows=[...parseGalopSuisseHomepage(gs),...parseIenaGallopHomepage(iena)].sort((a,b)=>a.date.localeCompare(b.date));
assert.deepEqual(rows.map(r=>r.date),['2026-10-04','2026-10-11','2026-10-18','2026-10-30']);
assert.equal(rows[2].racecourse_id,'switzerland--zurich-dielsdorf');
assert.equal(rows[3].racecourse_id,'switzerland--iena-avenches');
const rec=buildGalopSuisseRecord(rows[0],{checkedAt:'2026-10-01T00:00:00Z'});
assert.equal(rec.capability_rank,'C');assert.equal(rec.first_race_time_local,null);

if(process.env.GITHUB_EVENT_NAME==='pull_request'){
  const output='.swiss-galop-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-switzerland-galop-suisse-official-window.mjs','--as-of=2026-10-01','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('SWITZERLAND_GALOP_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>[r.date,r.racecourse_id])}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    for(const date of ['2026-10-04','2026-10-11','2026-10-18','2026-10-30']) assert.ok((artifact.records??[]).some(r=>r.date===date),'missing '+date);
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('SWITZERLAND_GALOP_ADAPTER: pass');
