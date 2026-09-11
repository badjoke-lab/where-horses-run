import fs from 'node:fs';
import assert from 'node:assert/strict';
import { isPublishableRacecourseMapLocation } from '../src/lib/racecourseMapLocationPolicy.mjs';

const component = fs.readFileSync('src/components/CountryHubPage.astro', 'utf8');
const registry = JSON.parse(fs.readFileSync('data/static/racecourse-locations-v1.json', 'utf8'));
const publishableIds = new Set(
  (registry.locations ?? [])
    .filter((entry) => isPublishableRacecourseMapLocation(entry))
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

const expectedCountryMapIds = [
  // Chile (4)
  'club-hipico-de-concepcion-racecourse',
  'club-hipico-de-santiago-racecourse',
  'hipodromo-chile',
  'valparaiso-sporting-club-racecourse',
  // Ireland (26)
  'ireland--ballinrobe',
  'ireland--bellewstown',
  'ireland--clonmel',
  'ireland--cork-mallow',
  'ireland--curragh',
  'ireland--downpatrick',
  'ireland--down-royal',
  'ireland--dundalk',
  'ireland--fairyhouse',
  'ireland--galway',
  'ireland--gowran-park',
  'ireland--kilbeggan',
  'ireland--killarney',
  'ireland--laytown',
  'ireland--leopardstown',
  'ireland--limerick',
  'ireland--listowel',
  'ireland--naas',
  'ireland--navan',
  'ireland--punchestown',
  'ireland--roscommon',
  'ireland--sligo',
  'ireland--thurles',
  'ireland--tipperary',
  'ireland--tramore',
  'ireland--wexford',
  // South Korea (4)
  'seoul-racecourse',
  'busan-gyeongnam-racecourse',
  'yeongcheon-racecourse',
  'jeju-racecourse',
  // Morocco (7)
  'casablanca-anfa-racecourse',
  'meknes-racecourse',
  'marrakech-racecourse',
  'rabat-racecourse',
  'settat-racecourse',
  'el-jadida-racecourse',
  'khemisset-racecourse',
];

assert.equal(expectedCountryMapIds.length, 41, 'expected 41 regression racecourses');
for (const id of expectedCountryMapIds) {
  assert(publishableIds.has(id), `${id}: expected publishable country-map location`);
}

console.log('COUNTRY_PAGE_MAP_SCOPE: pass');
console.log('ACTIVE_COUNTRY_MAP_41_LOCATIONS: pass');
console.log('PARTIAL_LOCATION_COVERAGE_DOES_NOT_KILL_COUNTRY_MAP: pass');
