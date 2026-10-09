import assert from 'node:assert/strict';
import {LITHUANIA_RACECOURSE_ID,buildLithuaniaMeetingRecord,parseLithuaniaEventsApi} from './timetable/lithuania-trotting-calendar-core.mjs';

const payload={events:[
  {id:4347,title:'Ristūnų žirgų lenktynės 10-10',start_date:'2026-10-10 12:00:00',end_date:'2026-10-10 16:00:00',url:'https://ristunusportas.lt/renginiai/ristunu-zirgu-lenktynes-10-10/',description:'<p>ORGANIZAVIMO SĄLYGOS</p><ul><li>Vieta: Širvintų hipodromas</li><li>Data: 2026 m. spalio 10 d.</li></ul>'},
  {id:9999,title:'Ristūnų žirgų lenktynės 11-14',start_date:'2026-11-14 12:00:00',end_date:'2026-11-14 16:00:00',url:'https://example.invalid/unknown',description:'<p>Vieta: Naujas hipodromas</p>'}
]};
const parsed=parseLithuaniaEventsApi(payload);
assert.equal(parsed.rows.length,1);
assert.equal(parsed.unknown_venues.length,1);
assert.equal(parsed.rows[0].date,'2026-10-10');
assert.equal(parsed.rows[0].racecourse_id,LITHUANIA_RACECOURSE_ID);
const rec=buildLithuaniaMeetingRecord(parsed.rows[0],{checkedAt:'2026-10-09T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('LITHUANIA_TROTTING_ADAPTER: pass');
