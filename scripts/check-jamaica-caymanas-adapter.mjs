import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildJamaicaMeetingRecord,parseCaymanasEntries,parseCaymanasEntriesApi,summarizeCaymanasSourceHorizon } from './timetable/jamaica-caymanas-core.mjs';

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

const pastOnly=summarizeCaymanasSourceHorizon(rows,'2026-10-28','2026-11-27');
assert.equal(pastOnly.horizon_status,'past_only','Successful parsing of stale monthly rows is not future coverage');
assert.equal(pastOnly.source_last_date,'2026-09-27');
assert.equal(pastOnly.window_distinct_dates,0);
assert.equal(pastOnly.forward_window_complete,false);
const partial=summarizeCaymanasSourceHorizon(apiRows,'2026-09-27','2026-10-27');
assert.equal(partial.horizon_status,'bounded_source_dates_visible');
assert.equal(partial.window_distinct_dates,2);
assert.equal(partial.forward_window_complete,false);
assert.equal(parseCaymanasEntriesApi({currentEntries:[{date:'2026-02-31'}],nextMonthEntries:[{date:'2026-11-07'}]}).length,1,'Impossible API dates must not create fabricated meetings');

// Offline regression of the *real runner* and fallback order: the API yields
// HTTP 200 text/html; page bootstrap holds valid dated entries. The collector
// must recover through exactly the existing official page fetch, no Chrome.
const output='.jamaica-bootstrap-fixture-'+process.pid+'.json';
try {
  execFileSync(process.execPath,[
    '--import','./scripts/timetable/fixtures/mock-jamaica-api-nonjson.mjs',
    'scripts/timetable/run-jamaica-caymanas-official-window.mjs',
    '--as-of=2026-10-28','--days=7','--output='+output
  ],{encoding:'utf8',timeout:12000});
  const fixture=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(fixture.acquisition_attempt.status,'success');
  assert.equal(fixture.discovery.method,'caymanas_entries_bootstrap_html');
  assert.equal(fixture.discovery.source_visible_rows,3);
  assert.equal(fixture.discovery.source_horizon.horizon_status,'bounded_source_dates_visible');
  assert.deepEqual(fixture.records.map(row=>row.date),['2026-10-31']);
  assert.equal(fixture.records[0].capability_rank,'C');
  assert.equal(fixture.records[0].first_race_time_local,null);
  assert.equal(fixture.records[0].last_race_time_local,null);
  assert.equal(fixture.diagnostics.source_errors.length,0);
  assert.ok(fixture.diagnostics.source_warnings.some(w=>w.code==='caymanas_api_unavailable_bootstrap_html_recovered'));
}finally{
  fs.rmSync(output,{force:true});
}
console.log('JAMAICA_CAYMANAS_BOOTSTRAP_AND_HORIZON: pass');
