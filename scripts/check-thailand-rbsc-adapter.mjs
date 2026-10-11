import assert from 'node:assert/strict';
import {THAILAND_RACECOURSE_ID,buildThailandMeetingRecord,parseRbscRacingCalendarPage} from './timetable/thailand-rbsc-calendar-core.mjs';

const html='<html><body><h2>RACING CALENDAR 2026</h2><p>(Every other Sunday. Moved to Sunday in the event of a religious holiday)</p><p>04 JANUARY - NEW YEAR MEETING (Saturday) 17 JANUARY 1 & 15 FEBRUARY 1, 15 & 29 MARCH 12 APRIL 26 APRIL - MAGIC MILLIONS MEETING 10 MAY & (Saturday) 23 MAY 7 JUNE 5 & 19 JULY 2, 16 & 30 AUGUST 13 & 27 SEPTEMBER (Saturday) 10 & 25 OCTOBER 8 & 22 NOVEMBER 6 DECEMBER - KING’S CUP MEETING 20 DECEMBER - END OF YEAR MEETING</p><h2>ENTRANCE FEE</h2></body></html>';
const rows=parseRbscRacingCalendarPage(html);
assert.equal(rows.length,25);
assert.deepEqual(rows.slice(-5).map(r=>r.date),['2026-10-25','2026-11-08','2026-11-22','2026-12-06','2026-12-20']);
assert.ok(rows.every(r=>r.racecourse_id===THAILAND_RACECOURSE_ID));
const rec=buildThailandMeetingRecord(rows.at(-5),{checkedAt:'2026-10-11T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('THAILAND_RBSC_ADAPTER: pass');
