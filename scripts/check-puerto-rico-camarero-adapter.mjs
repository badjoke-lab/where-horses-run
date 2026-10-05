import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {PUERTO_RICO_RACECOURSE_ID,buildPuertoRicoMeetingRecord,parseCamareroInscripcionesPage} from './timetable/puerto-rico-camarero-calendar-core.mjs';

const html='<html><body><h1>Inscripciones Oficiales</h1><div>Semana: 28 sept 2026 – 4 oct 2026</div>Inscripción domingo, 4 de octubre de 2026 Tamaño: 382.8 KB Descargar Inscripción sábado, 3 de octubre de 2026 Tamaño: 385.7 KB Descargar Inscripción viernes, 2 de octubre de 2026 Tamaño: 375.9 KB Descargar Inscripción jueves, 1 de octubre de 2026 Tamaño: 335.3 KB Descargar</body></html>';
const rows=parseCamareroInscripcionesPage(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-01','2026-10-02','2026-10-03','2026-10-04']);
assert.ok(rows.every(r=>r.racecourse_id===PUERTO_RICO_RACECOURSE_ID));
const rec=buildPuertoRicoMeetingRecord(rows[0],{checkedAt:'2026-10-04T00:00:00Z'});
assert.equal(rec.capability_rank,'C');assert.equal(rec.first_race_time_local,null);assert.deepEqual(rec.timetable_rows,[]);
assert.deepEqual(parseCamareroInscripcionesPage('<h1>Inscripciones Oficiales</h1><div>Semana: 5 oct 2026 – 11 oct 2026</div>'),[]);

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.puerto-rico-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-puerto-rico-camarero-official-window.mjs','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const a=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('PUERTO_RICO_LIVE: '+JSON.stringify({attempt:a.acquisition_attempt,discovery:a.discovery,diagnostics:a.diagnostics,records:(a.records??[]).map(r=>({date:r.date,racecourse_id:r.racecourse_id}))}));
    assert.equal(a.acquisition_attempt?.status,'success');
    assert.equal(a.diagnostics?.source_errors?.length,0);
    assert.equal(a.diagnostics?.parse_failures?.length,0);
    assert.ok((a.records??[]).every(r=>r.racecourse_id===PUERTO_RICO_RACECOURSE_ID));
  }finally{fs.rmSync(output,{force:true});}
}
console.log('PUERTO_RICO_CAMARERO_ADAPTER: pass');
