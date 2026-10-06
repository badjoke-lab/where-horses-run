import assert from 'node:assert/strict';
import {TRINIDAD_RACECOURSE_ID,buildTrinidadMeetingRecord,parseArimaFixtureText} from './timetable/trinidad-arima-calendar-core.mjs';

const text='ARIMA RACE CLUB TRINIDAD & TOBAGO RACING FIXTURES LIST - 2026 - TO BE RUN AT SANTA ROSA PARK, ARIMA DATE SATURDAY JANUARY 24TH RACE DAY 1 DATE SATURDAY FEBRUARY 21ST RACE DAY 2 DATE SATURDAY MARCH 14TH RACE DAY 3 DATE MONDAY APRIL 6TH RACE DAY 4 DATE SATURDAY MAY 9TH RACE DAY 5 DATE SATURDAY MAY 30TH RACE DAY 6 DATE FRIDAY JUNE 19TH RACE DAY 7 DATE SATURDAY JULY 11TH RACE DAY 8 DATE SATURDAY AUGUST 1ST RACE DAY 9 DATE MONDAY AUGUST 31ST RACE DAY 10 DATE THURSDAY SEPTEMBER 24TH RACE DAY 11 DATE SATURDAY OCTOBER 17TH RACE DAY 12 DATE SATURDAY NOVEMBER 14TH RACE DAY 13 DATE SATURDAY DECEMBER 5TH RACE DAY 14 DATE SATURDAY DECEMBER 26TH RACE DAY 15';
const rows=parseArimaFixtureText(text);
assert.equal(rows.length,15);
assert.deepEqual(rows.slice(-4).map(r=>r.date),['2026-10-17','2026-11-14','2026-12-05','2026-12-26']);
assert.ok(rows.every(r=>r.racecourse_id===TRINIDAD_RACECOURSE_ID));
const rec=buildTrinidadMeetingRecord(rows[11],{checkedAt:'2026-10-06T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('TRINIDAD_ARIMA_ADAPTER: pass');
