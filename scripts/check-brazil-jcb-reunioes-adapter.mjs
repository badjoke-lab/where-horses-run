import assert from 'node:assert/strict';
import { buildBrazilJcbMeetingRecord,parseJcbReunioes } from './timetable/brazil-jcb-reunioes-core.mjs';
const html=`<html><body><h1>REUNIÕES</h1><table><tr><th>Data</th><th>Dia da Semana</th><th>Reunião</th><th>Hipódromo</th><th>Programa oficial</th></tr>
<tr><td>26/09/2026</td><td>Sábado</td><td>1233</td><td>Cristal RS</td><td>Baixar</td></tr>
<tr><td>27/09/2026</td><td>Domingo</td><td>1286</td><td>Gavea</td><td>Baixar</td></tr>
<tr><td>28/09/2026</td><td>Segunda-feira</td><td>1301</td><td>Gavea</td><td>Baixar</td></tr></table></body></html>`;
const rows=parseJcbReunioes(html);
assert.equal(rows.length,3);
assert.deepEqual(rows.map(r=>[r.date,r.racecourse_id]),[
 ['2026-09-26','brazil--hipodromo-do-cristal'],
 ['2026-09-27','brazil--hipodromo-da-gavea'],
 ['2026-09-28','brazil--hipodromo-da-gavea'],
]);
for(const row of rows){
 const rec=buildBrazilJcbMeetingRecord(row,{checkedAt:'2026-09-26T00:00:00Z'});
 assert.equal(rec.country_id,'brazil');
 assert.equal(rec.capability_rank,'C');
 assert.equal(rec.first_race_time_local,null);
 assert.equal(rec.last_race_time_local,null);
 assert.deepEqual(rec.timetable_rows,[]);
 assert.equal(rec.acquisition_completion.disposition,'not_applicable');
}
assert.equal(rows[0].authority_id,'jockey-club-do-rio-grande-do-sul');
assert.equal(rows[1].authority_id,'jockey-club-brasileiro');
console.log('BRAZIL_JCB_REUNIOES_ADAPTER: pass');
