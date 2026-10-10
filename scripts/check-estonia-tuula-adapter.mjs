import assert from 'node:assert/strict';
import {ESTONIA_RACECOURSE_ID,buildEstoniaMeetingRecord,parseEstonia2026CalendarApi} from './timetable/estonia-tuula-calendar-core.mjs';

const payload=[{
  title:{rendered:'2026. aasta ürituste kalender'},
  modified:'2026-10-06T10:15:34',
  content:{rendered:[
    '<h4>Vastlapäev Hipodroomil -hooaja avavõistlus<br><br>14.02.2026</h4>',
    '<h4>Avatud talude päev / Derby 2026 poolfinaal<br><br>25.07.2026</h4>',
    '<h4>Avatud talude päev / traavivõistluseid ei toimu<br><br>26.07.2026</h4>',
    '<h4>Baby Race 2026 finaal<br><br>17.10.2026</h4>',
    ...['14.03.2026','11.04.2026','09.05.2026','23.05.2026','06.06.2026','20.06.2026','11.07.2026','08.08.2026','22.08.2026','05.09.2026','19.09.2026','03.10.2026'].map((d,i)=>'<h4>Traavivõistlused '+i+'<br><br>'+d+'</h4>')
  ].join('')}
}];
const parsed=parseEstonia2026CalendarApi(payload);
assert.equal(parsed.rows.length,15);
assert.deepEqual(parsed.explicit_no_racing_rows.map(r=>r.date),['2026-07-26']);
assert.ok(parsed.rows.every(r=>r.racecourse_id===ESTONIA_RACECOURSE_ID));
assert.ok(parsed.rows.some(r=>r.date==='2026-10-17'));
const rec=buildEstoniaMeetingRecord(parsed.rows.find(r=>r.date==='2026-10-17'),{checkedAt:'2026-10-10T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('ESTONIA_TUULA_ADAPTER: pass');
