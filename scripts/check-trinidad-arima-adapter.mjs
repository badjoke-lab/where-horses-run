import assert from 'node:assert/strict';
import {TRINIDAD_RACECOURSE_ID,buildTrinidadMeetingRecord,parseArimaFixtureText} from './timetable/trinidad-arima-calendar-core.mjs';

const text='ARIMA RACE CLUB TRINIDAD & TOBAGO RACING FIXTURES LIST - 2026 - TO BE RUN AT SANTA ROSA PARK, ARIMA DATE RACE DAY SATURDAY JANUARY 24TH 1 SATURDAY FEBRUARY 21ST 2 SATURDAY MARCH 14TH 3 MONDAY APRIL 6TH 4 SATURDAY MAY 9TH 5 SATURDAY MAY 30TH 6 FRIDAY JUNE 19TH 7 SATURDAY JULY 11TH 8 SATURDAY AUGUST 1ST 9 MONDAY AUGUST 31ST 10 THURSDAY SEPTEMBER 24TH 11 SATURDAY OCTOBER 17TH 12 SATURDY NOVEMBER 14TH 13 SATURDAY DECEMBER 5TH 14 SATURDAY DECEMBER 26TH 15 ARIMA RACE CLUB';
const rows=parseArimaFixtureText(text);
assert.equal(rows.length,15);
assert.deepEqual(rows.slice(-4).map(r=>r.date),['2026-10-17','2026-11-14','2026-12-05','2026-12-26']);
assert.ok(rows.every(r=>r.racecourse_id===TRINIDAD_RACECOURSE_ID));
const rec=buildTrinidadMeetingRecord(rows[11],{checkedAt:'2026-10-06T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('TRINIDAD_ARIMA_ADAPTER: pass');
