import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {buildCamareroMeetingRecord,parseCamareroEntriesPage} from './timetable/puerto-rico-camarero-calendar-core.mjs';

const html='<html><body><header>Hipódromo Camarero</header><h1>Inscripciones Oficiales</h1><p>Semana: 28 sept 2026 – 4 oct 2026</p><article>Inscripción domingo, 4 de octubre de 2026 Tamaño: 382.8 KB Descargar</article><article>Inscripción sábado, 3 de octubre de 2026 Tamaño: 385.7 KB Descargar</article><article>Inscripción viernes, 2 de octubre de 2026 Tamaño: 375.9 KB Descargar</article><article>Inscripción jueves, 1 de octubre de 2026 Tamaño: 335.3 KB Descargar</article></body></html>';
const rows=parseCamareroEntriesPage(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-01','2026-10-02','2026-10-03','2026-10-04']);
assert.ok(rows.every(r=>r.racecourse_id==='puerto-rico--hipodromo-camarero'));

const rec=buildCamareroMeetingRecord(rows[1],{checkedAt:'2026-10-02T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.last_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
assert.equal(rec.racecourse_id,'puerto-rico--hipodromo-camarero');

const future='<html><body><header>Hipódromo Camarero</header><h1>Inscripciones Oficiales</h1><p>Semana: 5 oct 2026 – 11 oct 2026</p><p>No hay inscripciones publicadas.</p></body></html>';
assert.deepEqual(parseCamareroEntriesPage(future,{allowEmpty:true}),[]);
assert.throws(()=>parseCamareroEntriesPage(future),/entry dates missing/);

if(process.env.GITHUB_ACTIONS==='true'){
  const output='.puerto-rico-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-puerto-rico-camarero-official-window.mjs','--as-of=2026-10-02','--days=30','--output='+output],{encoding:'utf8',timeout:180000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('PUERTO_RICO_CAMARERO_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>r.date)}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-02'));
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-03'));
    assert.ok((artifact.records??[]).some(r=>r.date==='2026-10-04'));
    assert.ok(!(artifact.records??[]).some(r=>r.date==='2026-10-01'));
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
    assert.equal(artifact.diagnostics?.unknown_venues?.length,0);
    assert.ok((artifact.records??[]).every(r=>r.first_race_time_local===null&&r.timetable_rows?.length===0&&r.capability_rank==='C'));
  }finally{fs.rmSync(output,{force:true});}
}
console.log('PUERTO_RICO_CAMARERO_ADAPTER: pass');
