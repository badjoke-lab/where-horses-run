import assert from 'node:assert/strict';
import fs from 'node:fs';
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

console.log(JSON.stringify({
  ok: true,
  fixture_cases: 10,
  implemented_profiles_checked: (registry.records ?? []).filter((row) => ['active', 'provisional'].includes(row.profile_status)).length,
  current_registry_level_implementation_gaps: obviousImplementationGaps,
}, null, 2));
