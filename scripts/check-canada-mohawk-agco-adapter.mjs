import assert from 'node:assert/strict';
import {CANADA_RACECOURSE_ID,buildCanadaMohawkMeetingRecord,parseAgcoMohawkCalendarItems} from './timetable/canada-mohawk-agco-calendar-core.mjs';

const months=[
  ['January',1,[2,3,4,5,9,10,11,12,16,17,18,19,23,24,25,26,30,31]],
  ['February',2,[1,2,6,7,8,9,13,14,15,16,20,21,22,23,27,28]],
  ['March',3,[1,2,6,7,8,9,13,14,15,16,20,21,22,23,27,28,29]],
  ['April',4,[3,4,5,6,10,11,12,13,17,18,19,20,24,25,26,27]],
  ['May',5,[1,2,3,4,8,9,10,11,15,16,17,18,22,23,24,25,29,30,31]],
  ['June',6,[1,5,6,7,8,12,13,14,15,19,20,21,22,25,26,27,28,29]],
  ['July',7,[2,3,4,5,6,9,10,11,12,13,16,17,18,19,20,23,24,25,26,27,30,31]],
  ['August',8,[1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28,29,30,31]],
  ['September',9,[3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28]],
  ['October',10,[1,2,3,4,5,8,9,10,11,12,16,17,18,19,23,24,25,26,30,31]],
  ['November',11,[1,2,6,7,8,9,13,14,15,16,20,21,22,23,26,27,28,30]],
  ['December',12,[4,5,6,7,11,12,13,14,18,19,20,21,26,27,28]],
];
const boxes=[
  {x:230,y:626,dayY:580},{x:357,y:626,dayY:580},{x:490,y:626,dayY:580},
  {x:240,y:485,dayY:420},{x:369,y:485,dayY:420},{x:494,y:485,dayY:420},
  {x:242,y:344,dayY:280},{x:361,y:344,dayY:280},{x:480,y:344,dayY:280},
  {x:233,y:200,dayY:135},{x:354,y:200,dayY:135},{x:481,y:200,dayY:135},
];
const items=[
  {text:'Approved 2026 Race',x:417,y:758},{text:'Date Calendar',x:467,y:740},
  {text:'Mohawk Park',x:255,y:674},{text:'Standardbred',x:260,y:652},
  {text:'Total 2026 Race Dates',x:63,y:490},{text:'222',x:103,y:477}
];
for(let i=0;i<months.length;i++){
  const [name,_m,days]=months[i], b=boxes[i];
  items.push({text:name,x:b.x,y:b.y});
  const col=i%3;
  const x0=[195,322,449][col];
  for(let j=0;j<days.length;j++){
    items.push({text:String(days[j]),x:x0+(j%7)*13,y:b.dayY-Math.floor(j/7)*13});
  }
}
const rows=parseAgcoMohawkCalendarItems(items);
assert.equal(rows.length,222);
assert.equal(rows[0].date,'2026-01-02');
assert.equal(rows.at(-1).date,'2026-12-28');
assert.ok(rows.every(r=>r.racecourse_id===CANADA_RACECOURSE_ID));
assert.deepEqual(rows.filter(r=>r.date>='2026-10-11').slice(0,6).map(r=>r.date),['2026-10-11','2026-10-12','2026-10-16','2026-10-17','2026-10-18','2026-10-19']);
const rec=buildCanadaMohawkMeetingRecord(rows.find(r=>r.date==='2026-10-11'),{checkedAt:'2026-10-11T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('CANADA_MOHAWK_AGCO_ADAPTER: pass');
