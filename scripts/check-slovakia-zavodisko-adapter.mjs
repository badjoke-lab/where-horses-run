import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildSlovakiaMeetingRecord,
  parseSlovakiaCalendarPage,
  resolveSlovakiaRacecourseId,
} from './timetable/slovakia-zavodisko-core.mjs';

const sourceUrl='https://zavodisko.sk/terminy-dostihov-2026/';
const html=`<html><body>
<h1>Termíny dostihov 2026</h1>
<div>13. dostihový deň</div>
<div>33. Slovenský St. Leger</div>
<div>Nedeľa 20.9.2026</div>
<div>Miesto: Bratislava</div>
<div>Čas: 13:00</div>
<div>14. dostihový deň</div>
<div>41. Karpatská cena</div>
<div>Nedeľa 4.10.2026</div>
<div>Miesto: Bratislava</div>
<div>Čas: 13:00</div>
<div>9. dostihový deň</div>
<div>Memoriál</div>
<div>NOVÝ TERMÍN - štvrtok 2.7.2026</div>
<div>Miesto: Topoľčianky</div>
<div>Čas: 14:30</div>
</body></html>`;

const rows=parseSlovakiaCalendarPage(html,{sourceUrl});
assert.equal(rows.length,3);
assert.deepEqual(rows.map(row=>[row.date,row.racecourse_id,row.first_race_time_local]),[
  ['2026-07-02','topolcianky-racecourse','14:30'],
  ['2026-09-20','bratislava-racecourse','13:00'],
  ['2026-10-04','bratislava-racecourse','13:00'],
]);
assert.equal(resolveSlovakiaRacecourseId('Šurany'),'surany-racecourse');
assert.equal(resolveSlovakiaRacecourseId('Topoľčianky'),'topolcianky-racecourse');
assert.equal(resolveSlovakiaRacecourseId('Senica'),'senica-racecourse');

const checkedAt='2026-09-24T00:00:00Z';
const record=buildSlovakiaMeetingRecord(rows[2],{checkedAt});
assert.equal(record.country_id,'slovakia');
assert.equal(record.authority_id,'zavodisko');
assert.equal(record.racing_system_id,'slovakia-zavodisko-system');
assert.equal(record.capability_rank,'B');
assert.equal(record.first_race_time_local,'13:00');
assert.equal(record.last_race_time_local,null);
assert.equal(record.acquisition_completion.disposition,'complete_current_best_available');
assert.equal(record.acquisition_completion.observed_rank,'B');
assert.equal(record.acquisition_completion.technical_capability_rank,'B');
assert.equal(record.acquisition_completion.evaluated_capability_rank,'B');
assert.equal(record.acquisition_completion.higher_rank_open,false);
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt:record.acquisition_attempt,
  acquisition_completion:record.acquisition_completion,
  evidence_support:record.evidence_support,
}),[]);

console.log('SLOVAKIA_ZAVODISKO_ADAPTER: pass');
