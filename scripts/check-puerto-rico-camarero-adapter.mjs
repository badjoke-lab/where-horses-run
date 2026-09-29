import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {buildCamareroMeetingRecord,parseCamareroInscripcionesHtml} from './timetable/puerto-rico-camarero-core.mjs';
const html='<h1>Inscripciones Oficiales</h1><div>jueves, 1 de octubre de 2026</div><div>viernes, 2 de octubre de 2026</div><div>sábado, 3 de octubre de 2026</div><div>domingo, 4 de octubre de 2026</div>';
const rows=parseCamareroInscripcionesHtml(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-01','2026-10-02','2026-10-03','2026-10-04']);
const rec=buildCamareroMeetingRecord(rows[0],{checkedAt:'2026-09-30T00:00:00Z'});
assert.equal(rec.capability_rank,'C');assert.equal(rec.first_race_time_local,null);assert.equal(rec.racecourse_id,'puerto-rico--hipodromo-camarero');
if(process.env.GITHUB_ACTIONS==='true'){
 const output='.puerto-rico-live-'+process.pid+'.json';
 try{
  execFileSync(process.execPath,['scripts/timetable/run-puerto-rico-camarero-official-window.mjs','--as-of=2026-09-30','--days=7','--output='+output],{encoding:'utf8',timeout:120000});
  const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
  console.log('PUERTO_RICO_CAMARERO_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
  assert.equal(artifact.acquisition_attempt?.status,'success');
  for(const date of ['2026-10-01','2026-10-02','2026-10-03','2026-10-04']) assert.ok((artifact.records??[]).some(r=>r.date===date));
  assert.equal(artifact.diagnostics?.source_errors?.length,0);assert.equal(artifact.diagnostics?.parse_failures?.length,0);
 }finally{fs.rmSync(output,{force:true});}
}
console.log('PUERTO_RICO_CAMARERO_ADAPTER: pass');
