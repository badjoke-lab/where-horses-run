import assert from 'node:assert/strict';
import {buildSloveniaMeetingRecord,parseSloveniaCalendarPage,resolveSloveniaVenue} from './timetable/slovenia-trotting-calendar-core.mjs';

const html='<html><body><h1>Koledar dirk 2026</h1><table><tr><th>Datum</th><th>Organizator</th><th>Dirke</th><th>Opombe</th></tr><tr><td>6.4.2026</td><td>KK LJUTOMER</td><td></td></tr><tr><td>19.4.2026</td><td>KK ŠENTJERNEJ</td></tr><tr><td>7.6.2026</td><td>KK POSAVJE KRŠKO</td></tr><tr><td>13.6.2026</td><td>KK KOMENDA</td></tr><tr><td>21.6.2026</td><td>KK LJUTOMER</td></tr><tr><td>4.7.2026</td><td>KD KRIM</td></tr><tr><td>12.7.2026</td><td>KD KRIŽEVCI</td></tr><tr><td>19.7.2026</td><td>KK STOŽICE</td></tr><tr><td>25.7.2026</td><td>KK KOMENDA</td></tr><tr><td>8.8.2026</td><td>KK LJUTOMER</td></tr><tr><td>22.8.2026</td><td>KK LJUTOMER</td></tr><tr><td>23.8.2026</td><td>KK ŠENTJERNEJ</td></tr><tr><td>6.9.2026</td><td>KK STOŽICE</td></tr><tr><td>13.9.2026</td><td>KD LENART</td></tr><tr><td>20.9.2026</td><td>KK LJUTOMER</td></tr><tr><td>26.9.2026</td><td>KK KOMENDA</td></tr><tr><td>4.10.2026</td><td>KK STOŽICE</td></tr><tr><td>18.10.2026</td><td>KK LJUTOMER</td></tr><tr><td>25.10.2026</td><td>KK ŠENTJERNEJ</td></tr><tr><td>14.11.2026</td><td>KK KOMENDA</td></tr><tr><td>5.12.2026</td><td>KK KOMENDA</td></tr></table></body></html>';
const rows=parseSloveniaCalendarPage(html);
assert.equal(rows.length,21);
assert.deepEqual(rows.slice(-4).map(r=>r.date),['2026-10-18','2026-10-25','2026-11-14','2026-12-05']);
assert.equal(resolveSloveniaVenue(rows[17]).racecourse_id,'slovenia--hipodrom-ljutomer');
assert.equal(resolveSloveniaVenue(rows[18]).racecourse_id,'slovenia--hipodrom-sentjernej');
assert.equal(resolveSloveniaVenue(rows[19]).racecourse_id,'slovenia--hipodrom-komenda');
assert.equal(resolveSloveniaVenue(rows[13]),null);
const rec=buildSloveniaMeetingRecord(rows[17],{checkedAt:'2026-10-08T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
console.log('SLOVENIA_TROTTING_ADAPTER: pass');
