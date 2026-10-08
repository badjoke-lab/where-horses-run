import assert from 'node:assert/strict';
import {TRINIDAD_RACECOURSE_ID,buildTrinidadMeetingRecord,parseArimaFixtureText} from './timetable/trinidad-arima-calendar-core.mjs';

const text='ARIMA RACE CLUB TRINIDAD & TOBAGO RACING FIXTURES LIST - 2026 - TO BE RUN AT SANTA ROSA PARK, ARIMA DATE RACE DAY SATURDAY JANUARY 24TH 1 SATURDAY FEBRUARY 21ST 2 SATURDAY MARCH 14TH 3 MONDAY APRIL 6TH 4 SATURDAY MAY 9TH 5 SATURDAY MAY 30TH 6 FRIDAY JUNE 19TH 7 SATURDAY JULY 11TH 8 SATURDAY AUGUST 1ST 9 MONDAY AUGUST 31ST 10 THURSDAY SEPTEMBER 24TH 11 SATURDAY OCTOBER 17TH 12 SATURDY NOVEMBER 14TH 13 SATURDAY DECEMBER 5TH 14 SATURDAY DECEMBER 26TH 15 ARIMA RACE CLUB';
const rows=parseArimaFixtureText(text);
assert.equal(rows.length,15);

const splitText='A RIMA R ACE C LUB T RINIDAD & T OBAGO R ACING F IXTURES L IST - 20 2 6 - T O B E R UN A T S ANTA R OSA P ARK , A RIMA DATE RACE DAY SATURDAY JANUARY 24 TH 1 SATURDAY FEBRUARY 21 ST 2 SATURDAY MARCH 14 TH 3 MONDAY APRIL 6 TH 4 SATURDAY MAY 9 TH 5 SATURDAY MAY 30 TH 6 FRIDAY JUNE 19 TH 7 SATURDAY JULY 11 TH 8 SATURDAY AUGUST 1 ST 9 MONDAY AUGUST 31 ST 10 THURSDAY SEPTEMBER 24 TH 1 1 SATURDAY OCTOBER 17 TH 1 2 SATURDY NOVEMBER 14 TH 13 SATURDAY DECEMBER 5 TH 14 SATURDAY DECEMBER 26 TH 1 5 ARIMA RACE CLUB';
const splitRows=parseArimaFixtureText(splitText);
assert.equal(splitRows.length,15);
assert.deepEqual(splitRows.slice(-4).map(r=>r.date),['2026-10-17','2026-11-14','2026-12-05','2026-12-26']);
assert.deepEqual(splitRows.slice(-4).map(r=>r.race_day),[12,13,14,15]);
assert.deepEqual(rows.slice(-4).map(r=>r.date),['2026-10-17','2026-11-14','2026-12-05','2026-12-26']);
assert.ok(rows.every(r=>r.racecourse_id===TRINIDAD_RACECOURSE_ID));
const rec=buildTrinidadMeetingRecord(rows[11],{checkedAt:'2026-10-06T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('TRINIDAD_ARIMA_ADAPTER: pass');
