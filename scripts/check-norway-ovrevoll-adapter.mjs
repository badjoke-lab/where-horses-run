import assert from 'node:assert/strict';
import {buildOvrevollMeetingRecord,parseOvrevollFixturesHtml} from './timetable/norway-ovrevoll-core.mjs';
const html=`<html><body><h1>Terminliste (fixtures) Øvrevoll Galoppbane 2026</h1><p>Terminliste Øvrevoll 2026 Med forbehold om endringer Dato Ukedag ca kl Kommentar
1 23.04.2026 Torsdag 17.30
2 30.04.2026 Torsdag 17.30
3 07.05.2026 Torsdag 17.30
4 17.05.2026 Søndag 17.00 Nasjonaldagsfeiring.
5 28.05.2026 Torsdag 17.30
6 04.06.2026 Torsdag 17.30
7 11.06.2026 Torsdag 17.30
8 18.06.2026 Torsdag 17.30
9 25.06.2026 Torsdag 17.30
10 02.07.2026 Torsdag 17.30
11 09.07.2026 Torsdag 17.30
12 16.07.2026 Torsdag 17.30
13 23.07.2026 Torsdag 17.30
14 30.07.2026 Torsdag 17.30
15 06.08.2026 Torsdag 17.30
16 13.08.2026 Torsdag 17.30
17 19.08.2026 Onsdag 12.00
18 23.08.2026 Søndag 12.30 Norsk Derby
19 02.09.2026 Onsdag 12.00
20 10.09.2026 Torsdag 17.30
21 16.09.2026 Onsdag 12.00
22 27.09.2026 Søndag 11.30 Norsk Breeders
23 01.10.2026 Torsdag 17.30
24 11.10.2026 Søndag 11.30 Norsk Oaks
25 15.10.2026 Torsdag 17.30
26 22.10.2026 Torsdag 17.30
27 01.11.2026 Søndag 12.00
28 05.11.2026 Torsdag 17.30
29 12.11.2026 Torsdag 17.30</p></body></html>`;
const rows=parseOvrevollFixturesHtml(html);
assert.equal(rows.length,29);
assert.deepEqual(rows.slice(22,26).map(r=>[r.date,r.published_meeting_time_local]),[['2026-10-01','17:30'],['2026-10-11','11:30'],['2026-10-15','17:30'],['2026-10-22','17:30']]);
const rec=buildOvrevollMeetingRecord(rows[22],{checkedAt:'2026-09-28T00:00:00Z'});
assert.equal(rec.country_id,'norway');assert.equal(rec.authority_id,'ovrevoll');assert.equal(rec.racing_system_id,'norway-ovrevoll-gallop-system');assert.equal(rec.racecourse_id,'norway--ovrevoll');assert.equal(rec.capability_rank,'C');assert.equal(rec.first_race_time_local,null);assert.equal(rec.detail_observation.published_meeting_time_local,'17:30');assert.equal(rec.acquisition_completion.disposition,'not_applicable');
console.log('NORWAY_OVREVOLL_ADAPTER: pass');
