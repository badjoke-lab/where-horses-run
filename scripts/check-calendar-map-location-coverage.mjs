import fs from 'node:fs';
import assert from 'node:assert/strict';
import { resolveChileTeletrakRacecourseId } from './timetable/chile-teletrak-weekly-core.mjs';
import { resolveIrelandHriRacecourseId } from './timetable/ireland-hri-fixtures-core.mjs';
import { resolveSorecRacecourseId } from './timetable/sorec-programme-reunion-core.mjs';

const registry = JSON.parse(fs.readFileSync('data/static/racecourse-locations-v1.json', 'utf8'));
const reviewedIds = new Set(
  (registry.locations ?? [])
    .filter((entry) => entry?.location?.verification_state === 'reviewed')
    .map((entry) => entry.id)
);

const targets = [
  ['Chile / Hipódromo Chile', resolveChileTeletrakRacecourseId('Hipódromo Chile'), 'hipodromo-chile'],
  ['Ireland / Laytown', resolveIrelandHriRacecourseId('Laytown'), 'ireland--laytown'],
  ['Morocco / Meknès', resolveSorecRacecourseId('Meknès'), 'meknes-racecourse'],
];

for (const [label, resolvedId, expectedId] of targets) {
  assert.equal(resolvedId, expectedId, `${label}: adapter must emit the canonical map identity`);
  assert(reviewedIds.has(resolvedId), `${label}: canonical identity must have a reviewed map location`);
}

console.log('CALENDAR_MAP_LOCATION_COVERAGE: pass');
console.log(`TARGETS_MAPPED: ${targets.length}`);
