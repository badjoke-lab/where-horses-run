import assert from 'node:assert/strict';
import {parseAtc2026_27FixtureTokens,buildAtcCMeeting,AU_NSW_SYSTEM} from './timetable/australia-nsw-atc-2026-27-core.mjs';
const months=[['2026-08',9],['2026-09',9],['2026-10',10],['2026-11',7],['2026-12',10],['2027-01',11],['2027-02',11],['2027-03',10],['2027-04',8],['2027-05',6],['2027-06',9],['2027-07',9]];
const monthNames=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],dow=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const places=['Royal Randwick','Rosehill Gardens','Canterbury Park','Warwick Farm','Kensington'];
const page=[];
for(const [ym,total] of months){
 const [y,m]=ym.split('-').map(Number);page.push(monthNames[m-1]+' '+y);
 for(let n=1;n<=total;n++){
  const date=new Date(Date.UTC(y,m-1,n)),d=dow[date.getUTCDay()]+' '+n;
  const place=(ym==='2027-02'&&n===1)?'Hawkesbury':(ym==='2027-03'&&n===1)?'Wyong':places[n%places.length];
  page.push(d,'Race fixture '+n,place);
 }
}
page.push('FIXTURE CARD 2026-27','* Kensington located at Royal Randwick.');
const s=parseAtc2026_27FixtureTokens([page,[]]);
assert.equal(s.allSourceDates,109);
assert.equal(s.rows.length,107);
assert.equal(s.physicalVenueIds.length,4);
assert.equal(s.byMonth['2026-10'],10);assert.equal(s.byMonth['2026-11'],7);
assert.ok(s.rows.some(x=>x.venue_label==='Kensington'&&x.racecourse_id==='australia--royal-randwick-racecourse'));
assert.ok(!s.rows.some(x=>/Hawkesbury|Wyong/.test(x.venue_label)));
const rec=buildAtcCMeeting(s.rows[0],{checkedAt:'2026-10-17T00:00:00Z'});
assert.equal(rec.capability_rank,'C');assert.equal(rec.racing_system_id,AU_NSW_SYSTEM);assert.equal(rec.first_race_time_local,null);assert.deepEqual(rec.timetable_rows,[]);
assert.throws(()=>parseAtc2026_27FixtureTokens([page.filter(x=>x!=='* Kensington located at Royal Randwick.'),[]]),/identity|Kensington/);
assert.throws(()=>parseAtc2026_27FixtureTokens([page.map(x=>x==='Hawkesbury'?'InventedVenue':x),[]]),/missing physical racecourse/);
const bad=[...page],ix=bad.findIndex(x=>/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d+$/.test(x));bad[ix]='Mon 1';
assert.throws(()=>parseAtc2026_27FixtureTokens([bad,[]]),/weekday/);
console.log('AU_NSW_ATC_2026_27_ADAPTER_PASS: 109 source dates, 107 ATC, 4 physical venues, Kensington normalization, zero inferred times');
