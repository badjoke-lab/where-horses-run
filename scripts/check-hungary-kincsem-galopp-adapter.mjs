import assert from 'node:assert/strict';import {buildHungaryGaloppMeetingRecord,parseGaloppCalendarPdfText,resolveLatestGaloppCalendar} from './timetable/hungary-kincsem-galopp-calendar-core.mjs';
const idx='<a href="/a.pdf">Galopp Versenynaptár 2026/11.szám</a><a href="/b.pdf">Galopp Versenynaptár 2026/12.szám</a>';
assert.equal(resolveLatestGaloppCalendar(idx).href,'https://kincsempark.hu/b.pdf');
const rows=parseGaloppCalendarPdfText('GALOPP - VERSENYNAPTÁR Tizenkilencedik nap, 202 6 . október 11 . Vasárnap Huszadik nap, 2026. november 15 . Vasárnap',{sourceUrl:'https://kincsempark.hu/b.pdf'});
assert.deepEqual(rows.map(r=>r.date),['2026-10-11','2026-11-15']);
const r=buildHungaryGaloppMeetingRecord(rows[0],{checkedAt:'2026-09-28T00:00:00Z'});
assert.equal(r.country_id,'hungary');assert.equal(r.racing_system_id,'hungary-kincsem-galopp-calendar-system');assert.equal(r.racecourse_id,'hungary--kincsem-park');assert.equal(r.racing_type,'thoroughbred-flat');assert.equal(r.capability_rank,'C');assert.equal(r.first_race_time_local,null);assert.deepEqual(r.timetable_rows,[]);
console.log('HUNGARY_KINCSEM_GALOPP_ADAPTER: pass');
