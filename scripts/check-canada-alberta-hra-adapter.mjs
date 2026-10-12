import assert from 'node:assert/strict';
import {parseHraCenturyMileMonth,buildHraCenturyMileRecord,HRA_RACECOURSE_ID,HRA_SYSTEM_ID} from './timetable/canada-alberta-hra-2026-core.mjs';
function day(n,source){
 const link='/racetracks/race-calendar/eventsbyday/2026/10/'+n+'/-';
 const event=source==='cm'?'<a href="/racetracks/race-calendar/eventdetail/8334/-/cm-standardbred-2026">CM Standardbred</a>'
 :source==='cd'?'<a href="/racetracks/race-calendar/eventdetail/8250/-/cd-thoroughbred-quarter-horse-2026">CD T/QH</a>':'';
 return '<td class="cal_days'+(source?'hasevents':'noevents')+'"><a class="cal_daylink" href="'+link+'">October '+n+'</a><div>'+event+'</div></td>';
}
const html='<h1>Horse Racing Alberta</h1><a href="/racetracks/race-calendar">calendar</a><table>'+
 Array.from({length:31},(_,i)=>day(i+1,i+1===14?'cm':i+1===16?'cd':i+1===17?'cm':'')).join('')+'</table>'+' '.repeat(11000);
const result=parseHraCenturyMileMonth(html,{year:2026,month:10,sourceUrl:'https://www.thehorses.com/racetracks/race-calendar'});
assert.equal(result.calendarDays,31);
assert.deepEqual(result.rows.map(x=>x.date),['2026-10-14','2026-10-17']);
assert.ok(result.rows.every(x=>x.racecourse_id===HRA_RACECOURSE_ID));
const record=buildHraCenturyMileRecord(result.rows[0],{checkedAt:'2026-10-13T00:00:00.000Z'});
assert.equal(record.capability_rank,'C');
assert.equal(record.racing_system_id,HRA_SYSTEM_ID);
assert.equal(record.first_race_time_local,null);
assert.equal(record.last_race_time_local,null);
assert.deepEqual(record.timetable_rows,[]);
assert.throws(()=>parseHraCenturyMileMonth('<h1>Horse Racing Alberta</h1>race-calendar'+day(14,'cm')+' '.repeat(11000),{year:2026,month:10}),/incomplete/);
assert.throws(()=>parseHraCenturyMileMonth(html,{year:2027,month:10}),/2026 only/);
console.log('CANADA_ALBERTA_HRA_ADAPTER: pass');
