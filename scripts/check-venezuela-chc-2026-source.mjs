import assert from 'node:assert/strict';
import {parseChcVenezuela2026} from './timetable/venezuela-chc-2026-source-core.mjs';
const header=['CALENDARIO CLÁSICO 2026','CONFEDERACIÓN HÍPICA DEL CARIBE'];
const rows=[
 ['1','Ene.'],['15','Mar.'],['12','Abr.'],['17','May.'],['7','Jun.'],
 ['23','Ago.'],['20','Sep.'],['25','Oct.'],['15','Nov.'],['22','Nov.'],['13','Dic.']
];
const fixtures=[header,...rows.map(([day,month])=>['VEN','La Rinconada',day,month,'Race title omitted'])].flat();
const pages=[fixtures,[],[]];
const r=parseChcVenezuela2026(pages);
assert.equal(r.days.length,11);
assert.equal(r.source_classic_rows,11);
assert.ok(r.days.every(x=>x.venue_id==='venezuela--hipodromo-la-rinconada'));
assert.equal(r.days[0].date,'2026-01-01');
const dup=[...fixtures,'VEN','La Rinconada','15','Nov.'];
const d=parseChcVenezuela2026([dup,[],[]]);
assert.equal(d.source_classic_rows,12);
assert.equal(d.days.length,11);
assert.equal(d.days.find(x=>x.date==='2026-11-15')?.races_listed,2);
assert.throws(()=>parseChcVenezuela2026([[...header,'VEN','Wrong venue','15','Nov.'],[],[]]),/venue/);
assert.throws(()=>parseChcVenezuela2026([fixtures,[]]),/page count/);
assert.throws(()=>parseChcVenezuela2026([fixtures.map(x=>x.replace('2026','2027')),[],[]].map(p=>p)),/fingerprint/);
console.log('VEN_CHC_PARSER_PASS 2026 limited selected date/venue facts only');
