import assert from 'node:assert/strict';
import { buildSorocabaMeetingRecord,parseSorocabaCalendarText } from './timetable/brazil-sorocaba-core.mjs';

const sample='CALENDÁRIO 2026 SETEMBRO 12 SÁBADO GP SÃO PAULO FINAL 26 SÁBADO GP BRASIL CLASS OUTUBRO 10 SÁBADO GP BRASIL FINAL 24 SÁBADO TAÇA DE OURO FINAL NOVEMBRO 7 SÁBADO PROVA FINAL';
const rows=parseSorocabaCalendarText(sample,{year:2026});
assert.deepEqual(rows.map(r=>r.date),['2026-09-12','2026-09-26','2026-10-10','2026-10-24','2026-11-07']);
const rec=buildSorocabaMeetingRecord(rows[1],{checkedAt:'2026-09-26T00:00:00Z'});
assert.equal(rec.country_id,'brazil');
assert.equal(rec.authority_id,'jockey-club-de-sorocaba');
assert.equal(rec.racing_system_id,'brazil-sorocaba-system');
assert.equal(rec.racecourse_id,'brazil--jockey-club-de-sorocaba');
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.last_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
assert.equal(rec.acquisition_completion.disposition,'not_applicable');
console.log('BRAZIL_SOROCABA_ADAPTER: pass');
