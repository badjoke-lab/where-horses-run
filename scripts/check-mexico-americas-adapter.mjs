import assert from 'node:assert/strict';
import { buildMexicoMeetingRecord,parseMexicoProgramasPage } from './timetable/mexico-americas-programas-core.mjs';

const html=`<html><body><h1>Programas</h1>
<a>Programa de la Función del Domingo 27 de Septiembre 2026</a>
<a>Programa de la Función del Sabado 26 de Septiembre 2026</a>
<a>Programa de la Función del Viernes 25 de Septiembre 2026</a>
<a>Programa de la Función del Domingo 26 de Abril del 2026</a>
</body></html>`;

const rows=parseMexicoProgramasPage(html);
assert.deepEqual(rows.map(r=>r.date),['2026-04-26','2026-09-25','2026-09-26','2026-09-27']);
for(const row of rows){
  const record=buildMexicoMeetingRecord(row,{checkedAt:'2026-09-27T00:00:00Z'});
  assert.equal(record.country_id,'mexico');
  assert.equal(record.authority_id,'hipodromo-de-las-americas');
  assert.equal(record.racing_system_id,'mexico-hipodromo-las-americas-system');
  assert.equal(record.racecourse_id,'mexico--hipodromo-de-las-americas');
  assert.equal(record.capability_rank,'C');
  assert.equal(record.first_race_time_local,null);
  assert.equal(record.last_race_time_local,null);
  assert.deepEqual(record.timetable_rows,[]);
  assert.equal(record.acquisition_completion.disposition,'not_applicable');
}
console.log('MEXICO_AMERICAS_ADAPTER: pass');
