import assert from 'node:assert/strict';import {buildDenmarkMeetingRecord,parseKlampenborgCalendar} from './timetable/denmark-klampenborg-calendar-core.mjs';
const html='<h1>Løbskalender 2026</h1><div>10. oktober 2026 - 12:45</div><div>17. oktober 2026 - 12:45</div><div>31. oktober 2026 - 12:45</div>';
const rows=parseKlampenborgCalendar(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-10','2026-10-17','2026-10-31']);
const r=buildDenmarkMeetingRecord(rows[0],{checkedAt:'2026-09-28T00:00:00Z'});
assert.equal(r.racecourse_id,'denmark--klampenborg-galopbane');assert.equal(r.capability_rank,'C');assert.equal(r.first_race_time_local,null);assert.equal(r.last_race_time_local,null);assert.deepEqual(r.timetable_rows,[]);
// Official /loebskalender is now redirected to a 2027 ticket calendar.
// Accept source-listed 2027 events but not general ticket-expiry dates.
const rolledOver='<h1>Løbskalender</h1><h2>Vi ses i 2027</h2>'
  +'<p>Klampenborg Galopbanes løbskalender for 2027 udgøres af 19 løbsdage.</p>'
  +'<div>Åbningsdagen 2027 17. april 2027 12.45</div>'
  +'<div>Friday Racing 28. maj 2027 17.30</div>'
  +'<footer>Gælder t.o.m den 31. december 2027 23.59</footer>';
const next=parseKlampenborgCalendar(rolledOver,{sourceUrl:'https://billet.galopbane.dk/p/loebskalender'});
assert.deepEqual(next.map(row=>row.date),['2027-04-17','2027-05-28']);
assert.deepEqual(next.map(row=>row.source_event_time),['12:45','17:30']);
assert.ok(next.every(row=>row.source_url==='https://billet.galopbane.dk/p/loebskalender'));
assert.equal(buildDenmarkMeetingRecord(next[0],{checkedAt:'2026-11-15T00:00:00Z'}).first_race_time_local,null);
assert.deepEqual(
  parseKlampenborgCalendar('<h1>Løbskalender 2027</h1><p>31. februar 2027 - 12:45</p><p>17. april 2027 - 12:45</p>')
    .map(row=>row.date),
  ['2027-04-17'],'invalid calendar dates cannot enter the mother set');
assert.throws(()=>parseKlampenborgCalendar('<h1>Løbskalender 2027</h1><p>17. april 2027</p>'),/source-visible race dates missing/,
  'undated or time-less marketing prose must not fabricate meetings');
assert.throws(()=>parseKlampenborgCalendar('<h1>Ticket discount</h1><p>17. april 2027 12.45</p>'),/season fingerprint missing/);

console.log('DENMARK_KLAMPENBORG_ADAPTER: pass');
