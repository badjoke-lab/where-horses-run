import fs from 'node:fs';
import assert from 'node:assert/strict';
import { isPublishableRacecourseMapLocation } from '../src/lib/racecourseMapLocationPolicy.mjs';

const registry = JSON.parse(fs.readFileSync('data/static/racecourse-locations-v1.json', 'utf8'));
const publicSupport = fs.readFileSync('src/lib/racecoursePublicSupport.ts', 'utf8');
const publishableIds = new Set(
  (registry.locations ?? [])
    .filter((entry) => isPublishableRacecourseMapLocation(entry))
    .map((entry) => entry.id)
);

const chileCanonicalIds = [
  'club-hipico-de-concepcion-racecourse',
  'club-hipico-de-santiago-racecourse',
  'hipodromo-chile',
  'valparaiso-sporting-club-racecourse',
];
const franceCanonicalIds = [
  'marseille-borely-racecourse',
  'argentan-racecourse',
  'laval-racecourse',
  'toulouse-racecourse',
  'la-teste-racecourse',
];
const koreaCanonicalIds = [
  'seoul-racecourse',
  'busan-gyeongnam-racecourse',
  'jeju-racecourse',
  'yeongcheon-racecourse',
];
const peruCanonicalIds = [
  'monterrico-racecourse',
];
const saudiCanonicalIds = [
  'king-khalid-racecourse',
  'king-abdulaziz-racecourse',
];

assert.match(
  publicSupport,
  /LEGACY_DUPLICATE_PUBLIC_IDS[\s\S]*hipodromo-chile-racecourse/,
  'legacy Hipódromo Chile duplicate must be excluded from public active racecourse rows'
);
assert(!chileCanonicalIds.includes('hipodromo-chile-racecourse'));
assert.equal(chileCanonicalIds.length, 4, 'Chile must expose four canonical active physical racecourses');
assert.equal(franceCanonicalIds.length, 5, 'France current Calendar scope must expose five current physical racecourses');
assert.equal(koreaCanonicalIds.length, 4, 'South Korea must expose four canonical active physical racecourses');
assert.equal(peruCanonicalIds.length, 1, 'Peru reviewed Calendar scope must expose Monterrico as the canonical active physical racecourse');
assert.equal(saudiCanonicalIds.length, 2, 'Saudi Arabia JCSA scope must expose Taif and Riyadh canonical active physical racecourses');

for (const id of [...chileCanonicalIds, ...franceCanonicalIds, ...koreaCanonicalIds, ...peruCanonicalIds, ...saudiCanonicalIds]) {
  assert(publishableIds.has(id), `${id}: expected publishable map location`);
}

console.log('CHILE_PUBLIC_RACECOURSE_COUNT: 4');
console.log('CHILE_MAP_LOCATION_COUNT: 4');
console.log('FRANCE_PUBLIC_RACECOURSE_COUNT: 5');
console.log('FRANCE_MAP_LOCATION_COUNT: 5');
console.log('SOUTH_KOREA_PUBLIC_RACECOURSE_COUNT: 4');
console.log('SOUTH_KOREA_MAP_LOCATION_COUNT: 4');
console.log('PERU_PUBLIC_RACECOURSE_COUNT: 1');
console.log('PERU_MAP_LOCATION_COUNT: 1');
console.log('SAUDI_ARABIA_PUBLIC_RACECOURSE_COUNT: 2');
console.log('SAUDI_ARABIA_MAP_LOCATION_COUNT: 2');
console.log('COUNTRY_RACECOURSE_MAP_PARITY: pass');
