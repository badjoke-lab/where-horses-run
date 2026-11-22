#!/usr/bin/env node
/**
 * Kazakhstan Baige source crosscheck (fixture only; never collects or publishes).
 * Run: node scripts/check-calendar-kazakhstan-baige-crosscheck.mjs --self-test
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fixtureUrl = new URL('../docs/timetable-source-tests/77-kazakhstan/official-calendar-crosscheck-20261123.json', import.meta.url);
const expectedStages = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

function dateUTC(value) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, 'Use an explicit ISO calendar date');
  const parsed = new Date(value + 'T00:00:00Z');
  assert.equal(parsed.toISOString().slice(0, 10), value, 'Impossible calendar date');
  return parsed;
}

export function validateBaigeCrosscheck(doc) {
  assert.equal(doc.schema_version, 'calendar-kazakhstan-baige-official-calendar-crosscheck-v1');
  assert.equal(doc.country_id, 'kazakhstan');
  assert.equal(doc.racing_system_id, 'baige-national-championship');
  assert.match(doc.first_party_source_url, /^https:\/\/www\.baigefederation\.kz\/horse-racing$/);
  assert.equal(doc.status, 'review_only_no_production_route');
  assert.equal(doc.production_routing, false);
  assert.equal(doc.publication_eligible, false);
  assert.deepEqual(doc.reviewed_current_or_future_meetings, []);
  assert.equal(doc.source_access_and_publication_review, 'not_completed_for_automated_acquisition_or_public_meeting_fields');
  assert.deepEqual(doc.stages.map(row => row.stage_id), expectedStages);
  const asOf = dateUTC(doc.reviewed_at);
  const conflicts = [];
  let pastStageCount = 0;
  for (const row of doc.stages) {
    assert.equal(row.physical_racecourse_id, null, 'A city must not be promoted to a physical racecourse');
    assert.ok(typeof row.city_label_en === 'string' && row.city_label_en.trim(), 'Missing city');
    const calendarDate = dateUTC(row.calendar_stage_date);
    const cityDate = dateUTC(row.city_card_date);
    assert.equal(calendarDate.getUTCFullYear(), 2026);
    assert.equal(cityDate.getUTCFullYear(), 2026);
    assert.ok(calendarDate < asOf && cityDate < asOf, 'Unexpected current/future date needs new independent review');
    pastStageCount += 1;
    if (row.calendar_stage_date !== row.city_card_date) {
      conflicts.push(row.stage_id);
    }
  }
  assert.deepEqual(conflicts, doc.expected_conflicting_stage_ids, 'Source discrepancies changed; re-review the official source');
  assert.deepEqual(conflicts, ['II', 'VI'], 'Do not silently reconcile the 2026 source discrepancies');
  assert.equal(doc.independent_confirmation.date, '2026-10-10');
  assert.match(doc.independent_confirmation.url, /^https:\/\/www\.gov\.kz\//);
  return {
    work_id: doc.work_id,
    status: 'SOURCE_CROSSCHECK_ONLY',
    stages_checked: pastStageCount,
    date_agreements: pastStageCount - conflicts.length,
    date_conflicts: conflicts,
    reviewed_future_meetings: 0,
    physical_racecourse_ids: 0,
    production_routing: false,
    publication_eligible: false
  };
}

function main() {
  const doc = JSON.parse(readFileSync(fixtureUrl, 'utf8'));
  const result = validateBaigeCrosscheck(doc);
  if (process.argv.includes('--self-test')) {
    const unexpectedCorrection = structuredClone(doc);
    unexpectedCorrection.stages[1].city_card_date = '2026-05-16';
    assert.throws(() => validateBaigeCrosscheck(unexpectedCorrection), /Source discrepancies changed/);
    const nextYearGuess = structuredClone(doc);
    nextYearGuess.stages[7].city_card_date = '2027-10-10';
    assert.throws(() => validateBaigeCrosscheck(nextYearGuess), /2026|current\/future/);
    const inventedVenue = structuredClone(doc);
    inventedVenue.stages[0].physical_racecourse_id = 'invented-venue';
    assert.throws(() => validateBaigeCrosscheck(inventedVenue), /physical racecourse/);
    const productionLeak = structuredClone(doc);
    productionLeak.publication_eligible = true;
    assert.throws(() => validateBaigeCrosscheck(productionLeak));
    console.log('KAZAKHSTAN_BAIGE_SOURCE_CROSSCHECK_SELF_TEST_PASS');
  }
  console.log(JSON.stringify(result, null, 2));
}
main();
