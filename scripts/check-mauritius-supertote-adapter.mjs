import assert from 'node:assert/strict';
import {MAURITIUS_RACECOURSE_ID,buildMauritiusMeetingRecord,parseSupertoteCalendarHtml,validateGraContext} from './timetable/mauritius-supertote-calendar-core.mjs';

const gra='<html><body><h1>Gambling Regulatory Authority</h1><a>Horseracing</a></body></html>';
assert.equal(validateGraContext(gra),true);
const html='<html><body><h1>Racing Calendar</h1><div>The Mauritius racing season runs from March to December. Below is a list of upcoming and past racing fixtures at the Champ de Mars, Port Louis.</div><div>2026 2025 2024 2023 April SAT 25 May SAT 02 SAT 16 SAT 23 SAT 30 June SAT 13 SAT 20 SAT 27 July SAT 11 SAT 18 SAT 25 August SAT 08 SUN 23 SAT 29 September SUN 06 SAT 19 October SUN 04 SAT 10 SAT 17 SAT 31 November SAT 07 SAT 14 SAT 28 December SAT 05 SUN 06 Where to?</div></body></html>';
const rows=parseSupertoteCalendarHtml(html);
assert.equal(rows.length,25);
assert.deepEqual(rows.slice(-8).map(r=>r.date),['2026-10-10','2026-10-17','2026-10-31','2026-11-07','2026-11-14','2026-11-28','2026-12-05','2026-12-06']);
assert.ok(rows.every(r=>r.racecourse_id===MAURITIUS_RACECOURSE_ID));
const rec=buildMauritiusMeetingRecord(rows[17],{checkedAt:'2026-10-08T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('MAURITIUS_SUPERTOTE_ADAPTER: pass');
