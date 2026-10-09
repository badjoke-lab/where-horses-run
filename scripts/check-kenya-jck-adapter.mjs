import assert from 'node:assert/strict';
import {KENYA_RACECOURSE_ID,buildKenyaMeetingRecord,parseJckRaceDatesPage} from './timetable/kenya-jck-calendar-core.mjs';

const html='<html><body><h1>Upcoming Race Dates</h1><div>2026 - 2027 SEASON</div><div>september 2026 6TH - Spencer TRYON CUP 20th - Griffin Trophy october 2026 11th - KenyattA CUP DAY 25TH - 3 YR OLD FREE HANDICAP RACE MEETING november 2026 8TH - MZEE WA PWANI 22ND - conference cup race day DECEMBER 2026 13TH - UHURU CUP DAY j anuary 2027 10TH - air force cup / 1st 2 yr old race 24TH - Kenya GUINEAS / gold CUP FEBRUARY 2027 21ST - fillies GUINEAS March 2027 7th - Arkle Trophy 21st - civil service gold cup / soprani cup april 2027 18th- Kenya derby / Breeding Futurity may 2027 9th - Kenya oaks 30th - Champagne Stakes / Delamare gold vase june 2027 20TH 2027 - St. leger / Thomas Dewar / nakuru challenge / police cup july 2027 11th - Stewards Cup 25th- Champions day / jck stakes / sir ali bin n.b.......</div><div>©2024 by Jockey Club of Kenya.</div></body></html>';
const rows=parseJckRaceDatesPage(html);
assert.equal(rows.length,18);
assert.deepEqual(rows.slice(2,7).map(r=>r.date),['2026-10-11','2026-10-25','2026-11-08','2026-11-22','2026-12-13']);
assert.ok(rows.every(r=>r.racecourse_id===KENYA_RACECOURSE_ID));
const rec=buildKenyaMeetingRecord(rows[2],{checkedAt:'2026-10-09T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('KENYA_JCK_ADAPTER: pass');
