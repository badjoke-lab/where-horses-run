import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
// Exercise the real runner without network access. Both sources are mandatory:
// a successful calendar alone must never emit public candidates without the
// regulator context, and vice versa.
const scenarios = [
  ['both-success', 'success', [], [], true],
  ['gra-timeout', 'network_error', ['gra_context_fetch'], [], false],
  ['calendar-timeout', 'network_error', ['supertote_calendar_fetch'], [], false],
  ['both-timeout', 'network_error', ['gra_context_fetch','supertote_calendar_fetch'], [], false],
  ['gra-invalid', 'parse_error', [], ['gra_context'], false],
  ['calendar-invalid', 'parse_error', [], ['supertote_calendar'], false],
];
for (const [fixture, expectedStatus, expectedSourceStages, expectedParseStages, shouldEmit] of scenarios) {
  const output = path.join(os.tmpdir(), 'whr-mauritius-' + process.pid + '-' + fixture + '.json');
  try {
    execFileSync(process.execPath, [
      '--import', './scripts/timetable/fixtures/mock-mauritius-two-sources.mjs',
      'scripts/timetable/run-mauritius-supertote-official-window.mjs',
      '--as-of=2026-10-28', '--days=90', '--output=' + output,
    ], {
      cwd: process.cwd(), timeout: 12000, encoding: 'utf8',
      env: {...process.env, MAURITIUS_FIXTURE_CASE: fixture}
    });
    const result = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.equal(result.acquisition_attempt.status, expectedStatus, fixture);
    assert.deepEqual(result.diagnostics.source_errors.map(e => e.stage), expectedSourceStages, fixture);
    assert.deepEqual(result.diagnostics.parse_failures.map(e => e.stage), expectedParseStages, fixture);
    for (const sourceError of result.diagnostics.source_errors) {
      assert.equal(sourceError.source_url,
        sourceError.stage === 'gra_context_fetch' ? 'https://gra.govmu.org/gra/' : 'https://supertote.mu/calendar', fixture);
    }
    assert.equal(result.window.coverage_claim,
      expectedStatus === 'success' ? 'licensed_operator_2026_calendar_window' : 'acquisition_failed_preserve_verified_state', fixture);
    assert.equal(result.records.length > 0, shouldEmit, fixture);
    if (shouldEmit) assert.ok(result.records.every(row => row.capability_rank === 'C' && row.first_race_time_local === null));
  } finally {
    fs.rmSync(output, {force: true});
  }
}
console.log('MAURITIUS_SOURCE_ERROR_ATTRIBUTION: pass');
console.log('MAURITIUS_SUPERTOTE_ADAPTER: pass');
