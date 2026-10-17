import assert from 'node:assert/strict';
import {THAILAND_RACECOURSE_ID,buildThailandMeetingRecord,parseRbscRacingCalendarPage} from './timetable/thailand-rbsc-calendar-core.mjs';

const html='<html><body><h2>RACING CALENDAR 2026</h2><p>(Every other Sunday. Moved to Sunday in the event of a religious holiday)</p><p>04 JANUARY - NEW YEAR MEETING (Saturday) 17 JANUARY 1 & 15 FEBRUARY 1, 15 & 29 MARCH 12 APRIL 26 APRIL - MAGIC MILLIONS MEETING 10 MAY & (Saturday) 23 MAY 7 JUNE 5 & 19 JULY 2, 16 & 30 AUGUST 13 & 27 SEPTEMBER (Saturday) 10 & 25 OCTOBER 8 & 22 NOVEMBER 6 DECEMBER - KING’S CUP MEETING 20 DECEMBER - END OF YEAR MEETING</p><h2>ENTRANCE FEE</h2></body></html>';
const rows=parseRbscRacingCalendarPage(html);
assert.equal(rows.length,25);
assert.deepEqual(rows.slice(-5).map(r=>r.date),['2026-10-25','2026-11-08','2026-11-22','2026-12-06','2026-12-20']);
assert.ok(rows.every(r=>r.racecourse_id===THAILAND_RACECOURSE_ID));
// Regression fixture: RBSC's current first-party page now shows a rolling,
// multi-year UPCOMING RACE DAYS section rather than a 25-date annual list.
// The feature-race section is not another fixture source.
const upcomingHtml='<html><body><h1>RACING</h1><h2>UPCOMING RACE DAYS</h2>'+
  '<p>October 2026 - Sunday 25</p><p>November 2026 - Sunday 8 &amp; 22</p>'+
  '<p>December 2026 - Sunday 6 &amp; 20</p><p>January 2027 - Sunday 17 &amp; 31</p>'+
  '<p>February 2027 - Saturday 13 &amp; Sunday 28</p>'+
  '<h2>FEATURE RACES 2027</h2><p>Sunday, 17 January 2027 - King Cup</p>'+
  '<h2>CONTACT</h2><p>First Race: Approximately 12:10 p.m.</p>'+
  '<h2>RACE CARD</h2><p>10 October 2026</p></body></html>';
const upcoming=parseRbscRacingCalendarPage(upcomingHtml);
assert.deepEqual(upcoming.map(row=>row.date),[
  '2026-10-25','2026-11-08','2026-11-22','2026-12-06','2026-12-20',
  '2027-01-17','2027-01-31','2027-02-13','2027-02-28',
]);
assert.ok(upcoming.every(row=>row.racecourse_id===THAILAND_RACECOURSE_ID));
assert.equal(buildThailandMeetingRecord(upcoming[0],{checkedAt:'2026-10-17T00:00:00Z'}).first_race_time_local,null);
assert.throws(()=>parseRbscRacingCalendarPage('<h2>UPCOMING RACE DAYS</h2><p>25 October 2026</p>'),/boundary missing/);
assert.throws(()=>parseRbscRacingCalendarPage('<h2>UPCOMING RACE DAYS</h2><p>no dates</p><h2>FEATURE RACES</h2>'),/month\/year sections missing/);

const rec=buildThailandMeetingRecord(rows.at(-5),{checkedAt:'2026-10-11T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('THAILAND_RBSC_ADAPTER: pass');
