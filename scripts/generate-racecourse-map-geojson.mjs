import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_RACECOURSE_LOCATION_STATES,
  isPublishableRacecourseMapLocation,
} from '../src/lib/racecourseMapLocationPolicy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceRelativePath = 'data/static/racecourse-locations-v1.json';
const outputRelativePath = 'public/data/racecourse-locations-v1.geojson';
const sourcePath = path.join(root, sourceRelativePath);
const outputPath = path.join(root, outputRelativePath);
const checkOnly = process.argv.includes('--check');
const calendarMapRegressionIds = [
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
  // France Calendar current venues (5)
  'marseille-borely-racecourse',
  'argentan-racecourse',
  'laval-racecourse',
  'toulouse-racecourse',
  'la-teste-racecourse',
  // United Kingdom rolling venues (5)
  'cheltenham-racecourse',
  'doncaster-racecourse',
  'newbury-racecourse',
  'aintree-racecourse',
  'wincanton-racecourse',
  // Slovakia (1)
  'bratislava-racecourse',
  // France Calendar rolling venues (7)
  'abbeville-racecourse',
  'le-pertre-racecourse',
  'lyon-parilly-racecourse',
  'nimes-racecourse',
  'bordeaux-racecourse',
  'cazaubon-barbotan-racecourse',
  'le-croise-laroche-racecourse',
  // South Korea (4)
  'seoul-racecourse',
  'busan-gyeongnam-racecourse',
  'yeongcheon-racecourse',
  'jeju-racecourse',
  // Italy MASAF rolling venues (18)
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
  'italy--ippodromo-breda',
  // South Africa Race Coast (4)
  'south-africa--hollywoodbets-greyville',
  'south-africa--hollywoodbets-scottsville',
  'south-africa--hollywoodbets-durbanville',
  'south-africa--hollywoodbets-kenilworth',
  'south-africa--turffontein',
  'south-africa--vaal',
  'south-africa--fairview',
  // Panama (1)
  'panama--hipodromo-presidente-remon',
  // Brazil current production scope (3)
  'brazil--hipodromo-da-gavea',
  'brazil--hipodromo-do-cristal',
  'brazil--hipodromo-de-cidade-jardim',
  // Morocco (7)
  'casablanca-anfa-racecourse',
  'meknes-racecourse',
  'marrakech-racecourse',
  'rabat-racecourse',
  'settat-racecourse',
  'el-jadida-racecourse',
  'khemisset-racecourse',
];

const registry = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

if (registry?.schema_version !== 'racecourse-locations-v1') {
  throw new Error(`${sourceRelativePath}: expected schema_version racecourse-locations-v1`);
}
if (!Array.isArray(registry?.locations)) {
  throw new Error(`${sourceRelativePath}: locations must be an array`);
}

const seen = new Set();
const published = new Set();
const features = registry.locations.flatMap((entry) => {
  if (typeof entry?.id !== 'string' || entry.id.trim() === '') {
    throw new Error(`${sourceRelativePath}: location entry is missing id`);
  }
  if (seen.has(entry.id)) {
    throw new Error(`${sourceRelativePath}: duplicate location id ${entry.id}`);
  }
  seen.add(entry.id);

  const location = entry.location;
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    throw new Error(`${entry.id}: location must be an object`);
  }

  if (location.publication_state === 'hold') return [];
  if (!PUBLIC_RACECOURSE_LOCATION_STATES.has(location.verification_state)) return [];

  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) {
    throw new Error(`${entry.id}: invalid latitude`);
  }
  if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) {
    throw new Error(`${entry.id}: invalid longitude`);
  }
  if (typeof location.precision !== 'string' || location.precision.trim() === '') {
    throw new Error(`${entry.id}: precision is required`);
  }
  if (typeof location.location_last_checked !== 'string' || location.location_last_checked.trim() === '') {
    throw new Error(`${entry.id}: location_last_checked is required`);
  }
  if (!isPublishableRacecourseMapLocation(entry)) {
    throw new Error(`${entry.id}: publishable location failed map publication policy`);
  }

  published.add(entry.id);
  const properties = {
    racecourse_id: entry.id,
    precision: location.precision,
    verification_state: location.verification_state,
    location_last_checked: location.location_last_checked,
  };
  if (typeof location.address === 'string' && location.address.trim() !== '') {
    properties.address = location.address;
  }

  return [{
    type: 'Feature',
    id: entry.id,
    geometry: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    },
    properties,
  }];
}).sort((a, b) => a.id.localeCompare(b.id, 'en'));

for (const id of calendarMapRegressionIds) {
  if (!published.has(id)) {
    throw new Error(`${sourceRelativePath}: Calendar map regression location missing or not publishable ${id}`);
  }
}

const projection = {
  type: 'FeatureCollection',
  whr_schema_version: 'racecourse-map-geojson-v1',
  source_schema_version: registry.schema_version,
  source_reviewed_at: registry.reviewed_at ?? null,
  features,
};

const serialized = `${JSON.stringify(projection, null, 2)}\n`;

if (!checkOnly) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, 'utf8');
  console.log(`Generated ${outputRelativePath}: ${features.length} publishable racecourse points.`);
} else {
  JSON.parse(serialized);
  console.log(`Racecourse map projection OK: ${features.length} publishable racecourse points generated from ${sourceRelativePath}.`);
  console.log(`Calendar map regression locations OK: ${calendarMapRegressionIds.join(', ')}.`);
}
