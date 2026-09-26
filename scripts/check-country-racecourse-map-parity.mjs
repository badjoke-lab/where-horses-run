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
const italyCanonicalIds = [
  'italy--ippodromo-san-siro',
  'italy--ippodromo-di-maia',
  'italy--ippodromo-del-visarno',
  'italy--ippodromo-di-roma-capannelle',
  'italy--ippodromo-don-meloni',
  'italy--ippodromo-pinna',
  'italy--ippodromo-dei-sauri',
  'italy--ippodromo-dell-arcoveggio',
  'italy--ippodromo-di-agnano',
  'italy--ippodromo-euroitalia',
  'italy--ippodromo-la-favorita',
  'italy--ippodromo-la-ghirlandina',
  'italy--ippodromo-s-artemio',
  'italy--ippodromo-s-paolo',
  'italy--ippodromo-sesana',
  'italy--ippodromo-stupinigi',
  'italy--ippodromo-valentinia',
  'italy--ippodromo-del-mediterraneo',
];
const southAfricaCanonicalIds = [
  'south-africa--hollywoodbets-greyville',
  'south-africa--hollywoodbets-scottsville',
  'south-africa--hollywoodbets-durbanville',
  'south-africa--hollywoodbets-kenilworth',
  'south-africa--turffontein',
  'south-africa--vaal',
  'south-africa--fairview',
];
const panamaCanonicalIds = [
  'panama--hipodromo-presidente-remon',
];
const brazilCanonicalIds = [
  'brazil--hipodromo-da-gavea',
  'brazil--hipodromo-do-cristal',
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
assert.equal(italyCanonicalIds.length, 18, 'Italy current MASAF rolling scope must expose eighteen physical racecourses');
assert.equal(southAfricaCanonicalIds.length, 7, 'South Africa current routed scope must expose seven canonical physical racecourses');
assert.equal(panamaCanonicalIds.length, 1, 'Panama reviewed Calendar scope must expose Hipódromo Presidente Remón as the canonical active physical racecourse');
assert.equal(brazilCanonicalIds.length, 2, 'Brazil current production scope must expose Gávea and Cristal as canonical physical racecourses');
assert.equal(peruCanonicalIds.length, 1, 'Peru reviewed Calendar scope must expose Monterrico as the canonical active physical racecourse');
assert.equal(saudiCanonicalIds.length, 2, 'Saudi Arabia JCSA scope must expose Taif and Riyadh canonical active physical racecourses');

for (const id of [...chileCanonicalIds, ...franceCanonicalIds, ...koreaCanonicalIds, ...italyCanonicalIds, ...southAfricaCanonicalIds, ...panamaCanonicalIds, ...brazilCanonicalIds, ...peruCanonicalIds, ...saudiCanonicalIds]) {
  assert(publishableIds.has(id), `${id}: expected publishable map location`);
}

console.log('CHILE_PUBLIC_RACECOURSE_COUNT: 4');
console.log('CHILE_MAP_LOCATION_COUNT: 4');
console.log('FRANCE_PUBLIC_RACECOURSE_COUNT: 5');
console.log('FRANCE_MAP_LOCATION_COUNT: 5');
console.log('SOUTH_KOREA_PUBLIC_RACECOURSE_COUNT: 4');
console.log('SOUTH_KOREA_MAP_LOCATION_COUNT: 4');
console.log('ITALY_PUBLIC_RACECOURSE_COUNT: 18');
console.log('ITALY_MAP_LOCATION_COUNT: 18');
console.log('SOUTH_AFRICA_PUBLIC_RACECOURSE_COUNT: 7');
console.log('SOUTH_AFRICA_MAP_LOCATION_COUNT: 7');
console.log('PANAMA_PUBLIC_RACECOURSE_COUNT: 1');
console.log('PANAMA_MAP_LOCATION_COUNT: 1');
console.log('BRAZIL_PUBLIC_RACECOURSE_COUNT: 2');
console.log('BRAZIL_MAP_LOCATION_COUNT: 2');
console.log('PERU_PUBLIC_RACECOURSE_COUNT: 1');
console.log('PERU_MAP_LOCATION_COUNT: 1');
console.log('SAUDI_ARABIA_PUBLIC_RACECOURSE_COUNT: 2');
console.log('SAUDI_ARABIA_MAP_LOCATION_COUNT: 2');
console.log('COUNTRY_RACECOURSE_MAP_PARITY: pass');
