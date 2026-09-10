import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  classifyAcquisitionCompletion,
  maxSupportedObservationRank,
  routeImplementsTechnicalCapability,
} from './timetable/acquisition-completion.mjs';

function profile({ technical = 'A+', supported = ['C', 'B', 'B+', 'A', 'A+'] } = {}) {
  return {
    technical_capability_rank: technical,
    supported_observation_ranks: supported,
  };
}

function record(rank, status = undefined) {
  return {
    meeting_id: `fixture-${rank.replace('+', 'plus').toLowerCase()}`,
    capability_rank: rank,
    ...(status ? { detail_observation: { status } } : {}),
  };
}

assert.equal(classifyAcquisitionCompletion(record('C'), profile()).disposition, 'implementation_gap');
assert.equal(classifyAcquisitionCompletion(record('C', 'not_published'), profile()).disposition, 'pending_publication');
assert.equal(classifyAcquisitionCompletion(record('B', 'source_error'), profile()).disposition, 'retry_required');
assert.equal(classifyAcquisitionCompletion(record('B+', 'available'), profile()).disposition, 'complete_current_best_available');
assert.equal(classifyAcquisitionCompletion(record('A', 'available'), profile()).disposition, 'complete_current_best_available');
assert.equal(classifyAcquisitionCompletion(record('A+'), profile()).disposition, 'complete_current_best_available');
assert.equal(classifyAcquisitionCompletion(record('A', 'not_applicable'), profile()).disposition, 'not_applicable');

const limitedImplementation = profile({ technical: 'A+', supported: ['C', 'A'] });
assert.equal(routeImplementsTechnicalCapability(limitedImplementation), false);
assert.equal(maxSupportedObservationRank(limitedImplementation), 'A');
assert.equal(classifyAcquisitionCompletion(record('A', 'available'), limitedImplementation).disposition, 'implementation_gap');

const cOnlyImplementation = profile({ technical: 'A', supported: ['C'] });
assert.equal(classifyAcquisitionCompletion(record('C'), cOnlyImplementation).disposition, 'implementation_gap');

const lowerTechnicalCeiling = profile({ technical: 'B+', supported: ['C', 'B', 'B+'] });
assert.equal(classifyAcquisitionCompletion(record('B+'), lowerTechnicalCeiling).disposition, 'complete_current_best_available');

const registry = JSON.parse(fs.readFileSync('data/static/calendar-acquisition-registry.json', 'utf8'));
const obviousImplementationGaps = [];
for (const entry of registry.records ?? []) {
  if (!['active', 'provisional'].includes(entry.profile_status)) continue;
  if (routeImplementsTechnicalCapability(entry)) continue;
  obviousImplementationGaps.push({
    system_id: entry.system_id,
    technical_capability_rank: entry.technical_capability_rank,
    max_supported_observation_rank: maxSupportedObservationRank(entry),
    detail_source_id: entry.detail_source_id,
    detail_adapter_id: entry.detail_adapter_id,
  });
}

const expectedCurrentGaps = new Set([
  'sorec-racing-information-system',
  'chile-teletrak-racing-system',
  'ireland-hri-racing-system',
  'tjk-national-racing-system',
]);
assert.deepEqual(new Set(obviousImplementationGaps.map((row) => row.system_id)), expectedCurrentGaps);

function runApplyFixture({ id, countryId, authorityId, systemId, timezone, rank, detailStatus, expectedDisposition }) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-acquisition-completion-'));
  try {
    const artifactPath = path.join(temp, 'artifact.json');
    const canonicalPath = path.join(temp, 'canonical.json');
    const detailsPath = path.join(temp, 'details.json');
    const publicPath = path.join(temp, 'public.json');
    const publicDetailsPath = path.join(temp, 'public-details.json');
    const policiesPath = path.join(temp, 'policies.json');
    const firstRaceTime = ['B', 'B+', 'A', 'A+'].includes(rank) ? '12:00' : null;
    const lastRaceTime = ['B+', 'A', 'A+'].includes(rank) ? '13:00' : null;
    const timetableRows = ['A', 'A+'].includes(rank)
      ? [
          { label: 'Race 1', post_time_local: '12:00', ...(rank === 'A+' ? { race_name: 'One', distance_m: 1200, surface: 'turf', course_label: 'A' } : {}) },
          { label: 'Race 2', post_time_local: '13:00', ...(rank === 'A+' ? { race_name: 'Two', distance_m: 1400, surface: 'turf', course_label: 'A' } : {}) },
        ]
      : [];
    const meetingId = `${id}-2026-09-11`;
    const recordValue = {
      meeting_id: meetingId,
      country_id: countryId,
      authority_id: authorityId,
      racing_system_id: systemId,
      racecourse_id: `${id}-racecourse`,
      date: '2026-09-11',
      timezone,
      capability_rank: rank,
      first_race_time_local: firstRaceTime,
      last_race_time_local: lastRaceTime,
      timetable_rows: timetableRows,
      source: { source_id: `${id}-source`, official_url: `https://example.invalid/${id}` },
      ...(detailStatus ? { detail_observation: { status: detailStatus, race_count: timetableRows.length, conflicts: [] } } : {}),
    };
    fs.writeFileSync(artifactPath, JSON.stringify({ generated_at: '2026-09-11T00:00:00.000Z', records: [recordValue] }));
    fs.writeFileSync(canonicalPath, JSON.stringify({ generated_at: null, meetings: [] }));
    fs.writeFileSync(detailsPath, JSON.stringify({ generated_at: null, details: [] }));
    fs.writeFileSync(publicPath, JSON.stringify({ generated_at: null, meetings: [] }));
    fs.writeFileSync(publicDetailsPath, JSON.stringify({ generated_at: null, details: [] }));
    fs.writeFileSync(policiesPath, JSON.stringify({
      policies: [],
      default_policy: {
        id: 'test-default',
        max_public_rank: 'A+',
        a_plus_fields: { show_race_name: true, show_distance: true, show_surface: true, show_course: true },
      },
    }));

    const result = spawnSync(process.execPath, [
      'scripts/timetable/apply-official-rolling-observations.mjs',
      `--artifact=${artifactPath}`,
      `--canonical=${canonicalPath}`,
      `--canonical-details=${detailsPath}`,
      `--public=${publicPath}`,
      `--public-details=${publicDetailsPath}`,
      `--policies=${policiesPath}`,
      `--country-id=${countryId}`,
      `--authority-id=${authorityId}`,
      `--racing-system-id=${systemId}`,
      `--timezone=${timezone}`,
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
    assert.equal(canonical.meetings.length, 1);
    assert.equal(canonical.meetings[0].capability_rank, rank);
    assert.equal(canonical.meetings[0].acquisition_completion?.disposition, expectedDisposition);
    const summary = JSON.parse(result.stdout.trim());
    assert.equal(summary.completion_counts?.[expectedDisposition], 1);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

runApplyFixture({
  id: 'chile-contract',
  countryId: 'chile',
  authorityId: 'teletrak-chile',
  systemId: 'chile-teletrak-racing-system',
  timezone: 'America/Santiago',
  rank: 'C',
  expectedDisposition: 'implementation_gap',
});
runApplyFixture({
  id: 'uae-pending',
  countryId: 'united-arab-emirates',
  authorityId: 'emirates-racing-authority',
  systemId: 'uae-national-racing-system',
  timezone: 'Asia/Dubai',
  rank: 'C',
  detailStatus: 'not_published',
  expectedDisposition: 'pending_publication',
});
runApplyFixture({
  id: 'kra-retry',
  countryId: 'south-korea',
  authorityId: 'korea-racing-authority',
  systemId: 'kra-national-racing-system',
  timezone: 'Asia/Seoul',
  rank: 'C',
  detailStatus: 'source_error',
  expectedDisposition: 'retry_required',
});
runApplyFixture({
  id: 'uae-current-best',
  countryId: 'united-arab-emirates',
  authorityId: 'emirates-racing-authority',
  systemId: 'uae-national-racing-system',
  timezone: 'Asia/Dubai',
  rank: 'B',
  detailStatus: 'available',
  expectedDisposition: 'complete_current_best_available',
});

console.log(JSON.stringify({
  ok: true,
  classifier_fixture_cases: 10,
  apply_integration_cases: 4,
  implemented_profiles_checked: (registry.records ?? []).filter((row) => ['active', 'provisional'].includes(row.profile_status)).length,
  current_registry_level_implementation_gaps: obviousImplementationGaps,
}, null, 2));
