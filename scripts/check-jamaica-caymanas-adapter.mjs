import assert from 'node:assert/strict';
import { buildJamaicaMeetingRecord,parseCaymanasEntries,parseCaymanasEntriesApi } from './timetable/jamaica-caymanas-core.mjs';

const html=`<html><body>
<h6>September 2026 Overnight Programmes</h6><h2>Entries</h2>
<h6>Saturday</h6><h3>05</h3>
<h6>Saturday</h6><h3>12</h3>
<h6>Saturday</h6><h3>19</h3>
<h6>Sunday</h6><h3>20</h3>
<h6>Saturday</h6><h3>26</h3>
<h6>Sunday</h6><h3>27</h3>
<h5>Racing Navigation</h5><p>Wednesday 23</p>
</body></html>`;
const rows=parseCaymanasEntries(html,{sourceUrl:'https://www.caymanasracing.com/racing-information/entries'});
assert.deepEqual(rows.map(r=>r.date),[
  '2026-09-05','2026-09-12','2026-09-19','2026-09-20','2026-09-26','2026-09-27'
]);
const rec=buildJamaicaMeetingRecord(rows.at(-1),{checkedAt:'2026-09-27T00:00:00Z'});
assert.equal(rec.country_id,'jamaica');
assert.equal(rec.authority_id,'caymanas-park-svrel');
assert.equal(rec.racing_system_id,'jamaica-reviewed-system');
assert.equal(rec.racecourse_id,'jamaica--caymanas-park');
assert.equal(rec.capability_rank,'C');
assert.equal(rec.first_race_time_local,null);
assert.equal(rec.last_race_time_local,null);
assert.deepEqual(rec.timetable_rows,[]);
assert.equal(rec.acquisition_completion.disposition,'not_applicable');
console.log('JAMAICA_CAYMANAS_ADAPTER: pass');

const apiRows=parseCaymanasEntriesApi({currentEntries:[{id:1,date:'2026-09-27T00:00:00.000000Z',day:'Sunday',slug:'entry-2026-09-27'}],nextMonthEntries:{2:{id:2,date:'2026-10-03 00:00:00',day:'Saturday',slug:'entry-2026-10-03'}}});
assert.deepEqual(apiRows.map(r=>r.date),['2026-09-27','2026-10-03']);
