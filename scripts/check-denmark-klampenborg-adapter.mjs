import assert from 'node:assert/strict';import {buildDenmarkMeetingRecord,parseKlampenborgCalendar} from './timetable/denmark-klampenborg-calendar-core.mjs';
const html='<h1>Løbskalender 2026</h1><div>10. oktober 2026 - 12:45</div><div>17. oktober 2026 - 12:45</div><div>31. oktober 2026 - 12:45</div>';
const rows=parseKlampenborgCalendar(html);
assert.deepEqual(rows.map(r=>r.date),['2026-10-10','2026-10-17','2026-10-31']);
const r=buildDenmarkMeetingRecord(rows[0],{checkedAt:'2026-09-28T00:00:00Z'});
assert.equal(r.racecourse_id,'denmark--klampenborg-galopbane');assert.equal(r.capability_rank,'C');assert.equal(r.first_race_time_local,null);assert.equal(r.last_race_time_local,null);assert.deepEqual(r.timetable_rows,[]);
console.log('DENMARK_KLAMPENBORG_ADAPTER: pass');
