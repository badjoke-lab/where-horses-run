import assert from 'node:assert/strict';
import {MARTINIQUE_RACECOURSE_ID,buildMartiniqueMeetingRecord,parseCarrereCalendarPage} from './timetable/martinique-carrere-calendar-core.mjs';

const html='<html><body><h1>Calendrier</h1><h2>2026</h2><div>Date Hippodrome Horaire Courses À noter Terrain Premium</div><div>11/01/2026 LA MARTINIQUE 14h00 Plat : 6 Prix : STE COURSES</div><div>08/02/2026 LA MARTINIQUE 14h00 Plat : 6 Prix : LOUP GAROU</div><div>07/03/2026 LA MARTINIQUE 20h00 Plat : 6 Prix : PARISLONGCHAMP Premium</div><div>12/04/2026 LA MARTINIQUE 14h00 Plat : 6 Prix : GRAND PRIX 2026</div><div>16/05/2026 LA MARTINIQUE 20h00 Plat : 6</div><div>07/06/2026 LA MARTINIQUE 14h00 Plat : 6</div><div>28/06/2026 LA MARTINIQUE 14h00 Plat : 6</div><div>09/08/2026 LA MARTINIQUE 14h00 Plat : 6</div><div>19/09/2026 LA MARTINIQUE 20h00 Plat : 6</div><div>18/10/2026 LA MARTINIQUE 14h00 Plat : 6</div><div>08/11/2026 LA MARTINIQUE 14h00 Plat : 6</div><div>06/12/2026 LA MARTINIQUE 13h00 Plat : 6</div><h2>2025</h2><div>Date Hippodrome Horaire Courses</div><div>12/01/2025 LA MARTINIQUE 14h00 Plat : 6</div></body></html>';
const rows=parseCarrereCalendarPage(html);
assert.equal(rows.length,12);
assert.deepEqual(rows.slice(-3).map(r=>r.date),['2026-10-18','2026-11-08','2026-12-06']);
assert.ok(rows.every(r=>r.racecourse_id===MARTINIQUE_RACECOURSE_ID));
assert.equal(rows[9].published_meeting_time,'14:00');
const rec=buildMartiniqueMeetingRecord(rows[9],{checkedAt:'2026-10-08T00:00:00Z'});
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
console.log('MARTINIQUE_CARRERE_ADAPTER: pass');
