import assert from 'node:assert/strict';
import {parseLaPlataApproved2026,buildLaPlataMeetingRecord,ARG_LP_VENUE_ID,ARG_LP_SYSTEM_ID} from './timetable/argentina-la-plata-2026-core.mjs';
const months=[
 ['ENERO',[6,8,11,13,17,20,22,27,29,31]],
 ['FEBRERO',[3,5,10,12,15,17,19,22,24,26]],
 ['MARZO',[3,5,11,13,15,17,19,24,26,31]],
 ['ABRIL',[2,7,9,12,14,16,21,23,25,28,30]],
 ['MAYO',[3,5,8,12,16,19,24,26,29]],
 ['JUNIO',[2,4,9,11,16,18,21,23,25,30]],
 ['JULIO',[2,5,7,9,14,16,21,23,26,28,31]],
 ['AGOSTO',[4,6,9,11,13,15,18,23,25,27]],
 ['SEPTIEMBRE',[1,3,8,10,13,15,19,22,24,29]],
 ['OCTUBRE',[4,6,8,13,15,20,22,24,25,27,30]],
 ['NOVIEMBRE',[3,5,8,10,12,17,19,24,26,29]],
 ['DICIEMBRE',[1,3,5,8,10,15,17,22,29]]
];
const weekday=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const fixture='Hipódromo de La Plata Comisión de Carreras CALENDARIO HIPICO 2026 Res.1024: La Plata '+
 months.map(([name,days],i)=>name+': '+days.map(d=>weekday[new Date(Date.UTC(2026,i,d)).getUTCDay()]+' '+d).join(', ')).join('; ')+' .'.repeat(500);
const result=parseLaPlataApproved2026(fixture);
assert.equal(result.rows.length,121);
assert.equal(Object.keys(result.monthly).length,12);
assert.equal(new Set(result.rows.map(x=>x.date)).size,121);
assert.equal(result.rows[0].date,'2026-01-06');
assert.equal(result.rows.at(-1).date,'2026-12-29');
assert.ok(result.rows.every(x=>x.racecourse_id===ARG_LP_VENUE_ID));
const visible=result.rows.filter(x=>x.date>='2026-10-13'&&x.date<'2026-11-12');
assert.deepEqual(visible.map(x=>x.date),['2026-10-13','2026-10-15','2026-10-20','2026-10-22','2026-10-24','2026-10-25','2026-10-27','2026-10-30','2026-11-03','2026-11-05','2026-11-08','2026-11-10']);
const rec=buildLaPlataMeetingRecord(visible[0],{checkedAt:'2026-10-13T00:00:00.000Z'});
assert.equal(rec.racing_system_id,ARG_LP_SYSTEM_ID);
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
assert.throws(()=>parseLaPlataApproved2026(fixture.replace('DICIEMBRE:', 'MISSING:')),/missing month/);
assert.throws(()=>parseLaPlataApproved2026(fixture.replace('ENERO: martes 6,','ENERO: martes 6, martes 6,')),/duplicate approved days/);
console.log('ARGENTINA_LA_PLATA_2026_ADAPTER: pass annual=121 window=12 rank=C');
