import fs from 'node:fs';
import assert from 'node:assert/strict';

const component = fs.readFileSync('src/components/CountryHubPage.astro', 'utf8');
const registry = JSON.parse(fs.readFileSync('data/static/racecourse-locations-v1.json', 'utf8'));
const reviewedIds = new Set(
  (registry.locations ?? [])
    .filter((entry) => entry?.location?.verification_state === 'reviewed')
    .map((entry) => entry.id)
);

assert.match(component, /import locationRegistry from ['"]\.\.\/\.\.\/data\/static\/racecourse-locations-v1\.json['"];/);
assert.match(component, /\.\.\.racecourses\.map\(\(racecourse\) => racecourse\.id\)/);
assert.match(component, /\.\.\.meetings\.map\(\(meeting\) => meeting\.racecourse_id\)/);
assert.match(component, /filter\(\(id\) => reviewedRacecourseIds\.has\(id\)\)/);
assert.match(component, /racecourseIds=\{countryMapRacecourseIds\}/);
assert.match(component, /visibleRacecourseIds=\{countryMapRacecourseIds\}/);
assert.doesNotMatch(
  component,
  /<RacecourseMap racecourseIds=\{racecourses\.map\(/,
  'Country pages must not pass every active racecourse directly to the strict map component.'
);

for (const id of [
  'hipodromo-chile',
  'ireland--laytown',
  'meknes-racecourse',
  'seoul-racecourse',
  'busan-gyeongnam-racecourse',
  'jeju-racecourse',
]) {
  assert(reviewedIds.has(id), `${id}: expected reviewed country-map location`);
}

console.log('COUNTRY_PAGE_MAP_SCOPE: pass');
console.log('PARTIAL_LOCATION_COVERAGE_DOES_NOT_KILL_COUNTRY_MAP: pass');
