import assert from 'node:assert/strict';
import { buildUruguayMeetingRecord,parseUruguayMonthlyCalendarItems } from './timetable/uruguay-hru-calendar-core.mjs';

const items=[
  {str:'SEPTIEMBRE 2026',x:100,y:1000},
  {str:'1',x:266.93,y:934.8},{str:'2',x:333.19,y:934.8},{str:'3',x:395.35,y:934.8},{str:'4',x:458.14,y:934.8},{str:'5',x:523.78,y:934.8},
  {str:'Las Piedras',x:425.14,y:924.96},{str:'Maroñas',x:488.5,y:856.78},
  {str:'20',x:135.14,y:519.43},{str:'21',x:196.94,y:519.43},{str:'22',x:261.89,y:519.43},{str:'23',x:328.15,y:519.43},{str:'24',x:390.31,y:519.43},{str:'25',x:453.1,y:519.43},{str:'26',x:518.74,y:519.43},
  {str:'Las Piedras',x:425.14,y:509.23},{str:'Maroñas',x:488.5,y:441.05},
  {str:'27',x:135.14,y:385.73},{str:'28',x:196.94,y:385.73},{str:'29',x:261.89,y:385.73},{str:'30',x:328.15,y:385.73},
  {str:'Maroñas',x:105.72,y:341.57},
  {str:'Gulfstream Park',x:333,y:900},{str:'Monterrico',x:200,y:700},{str:'Gavea',x:500,y:650},
];
const parsed=parseUruguayMonthlyCalendarItems(items,{year:2026,month:9,sourceUrl:'https://www.maronas.com.uy/test.pdf'});
assert.deepEqual(parsed.records.map(r=>[r.date,r.racecourse_id]),[
  ['2026-09-03','uruguay--hipodromo-las-piedras'],
  ['2026-09-04','uruguay--hipodromo-nacional-de-maronas'],
  ['2026-09-25','uruguay--hipodromo-las-piedras'],
  ['2026-09-26','uruguay--hipodromo-nacional-de-maronas'],
  ['2026-09-27','uruguay--hipodromo-nacional-de-maronas'],
]);
assert.equal(parsed.parse_failures.length,0);
const rec=buildUruguayMeetingRecord(parsed.records.at(-1),{checkedAt:'2026-09-27T00:00:00Z'});
assert.equal(rec.country_id,'uruguay');
assert.equal(rec.authority_id,'hru');
assert.equal(rec.racing_system_id,'uruguay-hru-system');
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.last_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
assert.equal(rec.acquisition_completion.disposition,'not_applicable');
assert(!parsed.records.some(r=>/Gulfstream|Monterrico|Gavea/i.test(r.venue_name)));
console.log('URUGUAY_HRU_ADAPTER: pass');
