import assert from 'node:assert/strict';import {buildCzechMeetingRecord,extractCzechEventLinks,parseCzechEventDetail} from './timetable/czech-dostihy-calendar-core.mjs';
const list='<a href="/kalendar-akci/test-praha-2026">Více</a><a href="https://www.dostihy.cz/kalendar-akci/test-most-2026">Více</a>';
assert.deepEqual(extractCzechEventLinks(list),['https://www.dostihy.cz/kalendar-akci/test-praha-2026','https://www.dostihy.cz/kalendar-akci/test-most-2026']);
const p=parseCzechEventDetail('<p>Štítky: Praha</p><p>Datum konání: 4. 10. 2026</p>',{sourceUrl:'https://www.dostihy.cz/kalendar-akci/test-praha-2026'});
assert.equal(p.date,'2026-10-04');assert.equal(p.venue.racecourse_id,'czech-republic--chuchle-arena-praha');
const r=buildCzechMeetingRecord({date:p.date,racecourse_id:p.venue.racecourse_id,source_url:p.source_url},{checkedAt:'2026-09-28T00:00:00Z'});
assert.equal(r.capability_rank,'C');assert.equal(r.first_race_time_local,null);assert.equal(r.last_race_time_local,null);assert.deepEqual(r.timetable_rows,[]);console.log('CZECH_DOSTIHY_ADAPTER: pass');
