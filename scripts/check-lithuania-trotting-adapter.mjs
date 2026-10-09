import assert from 'node:assert/strict';
import {LITHUANIA_RACECOURSE_ID,buildLithuaniaMeetingRecord,parseLithuaniaEventDetail,racecourseIdForVenueName} from './timetable/lithuania-trotting-calendar-core.mjs';

const html='<html><body><h1>Ristūnų žirgų lenktynės 10-10</h1><div>ORGANIZAVIMO SĄLYGOS Vieta: Širvintų hipodromas Data: 2026 m. spalio 10 d. (šeštadienis) Lenktynių pradžia – 12:00 val.</div><script type="application/ld+json">{"@type":"Event","eventStatus":"https://schema.org/EventScheduled","startDate":"2026-10-10T12:00:00+03:00"}</script></body></html>';
const p=parseLithuaniaEventDetail(html,{sourceUrl:'https://ristunusportas.lt/renginiai/ristunu-zirgu-lenktynes-10-10/'});
assert.equal(p.venue_name,'Širvintų hipodromas');
assert.equal(p.event_scheduled,true);
assert.equal(p.cancelled,false);
assert.equal(racecourseIdForVenueName(p.venue_name),LITHUANIA_RACECOURSE_ID);
const row={date:'2026-10-10',racecourse_id:LITHUANIA_RACECOURSE_ID,venue_name:p.venue_name,source_url:p.source_url};
const rec=buildLithuaniaMeetingRecord(row,{checkedAt:'2026-10-09T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('LITHUANIA_TROTTING_ADAPTER: pass');
