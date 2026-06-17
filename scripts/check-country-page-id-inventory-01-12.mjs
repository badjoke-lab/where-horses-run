import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inventoryPath = path.join(root, 'data/static/country-page-id-inventory-01-12.json');
const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const countriesPath = path.join(root, 'data/static/countries.json');
const profilesPath = path.join(root, 'data/static/country-profiles-v2.json');
const sourcePaths = [
  path.join(root, 'data/static/sources.json'),
  path.join(root, 'data/static/country-page-sources-01-04.json')
];
const racecoursePaths = [
  path.join(root, 'data/static/racecourses.json'),
  path.join(root, 'data/static/racecourses-extensions.json'),
  path.join(root, 'data/static/country-page-racecourses-01-04.json')
];

const errors = [];
const fail = (message) => errors.push(message);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const expectedDeliveries = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));

const parseTracker = () => {
  const lines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
};

const indexUnique = (records, label) => {
  const map = new Map();
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      fail(`${label} contains a non-object record`);
      continue;
    }
    if (!idPattern.test(record.id ?? '')) {
      fail(`${label} contains invalid id: ${record.id}`);
      continue;
    }
    if (map.has(record.id)) fail(`${label} contains duplicate id: ${record.id}`);
    map.set(record.id, record);
  }
  return map;
};

const indexSplitRegistry = (records, label) => {
  const map = new Map();
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      fail(`${label} contains a non-object record`);
      continue;
    }
    if (!idPattern.test(record.id ?? '')) {
      fail(`${label} contains invalid id: ${record.id}`);
      continue;
    }
    const existing = map.get(record.id);
    if (existing) {
      if (existing.country_id !== record.country_id) {
        fail(`${label} contains conflicting country references for id: ${record.id}`);
      }
      continue;
    }
    map.set(record.id, record);
  }
  return map;
};

const inventory = readJson(inventoryPath);
const tracker = parseTracker();
const countries = readJson(countriesPath);
const profiles = readJson(profilesPath);
const profileIds = new Set(profiles.map((profile) => profile.country_id));
const sources = sourcePaths.filter(fs.existsSync).flatMap(readJson);
const racecourses = racecoursePaths.filter(fs.existsSync).flatMap(readJson);

if (inventory.schema_version !== '1.0.0') fail('inventory schema_version must be 1.0.0');
if (JSON.stringify(inventory.delivery_range) !== JSON.stringify(['01', '12'])) {
  fail('inventory delivery_range must be 01 through 12');
}
for (const key of ['countries', 'sources', 'racecourses']) {
  if (!Array.isArray(inventory[key])) fail(`inventory.${key} must be an array`);
}

const inventoryCountries = Array.isArray(inventory.countries) ? inventory.countries : [];
const inventorySources = Array.isArray(inventory.sources) ? inventory.sources : [];
const inventoryRacecourses = Array.isArray(inventory.racecourses) ? inventory.racecourses : [];

const deliveryNos = inventoryCountries.map((entry) => entry.delivery_no);
if (JSON.stringify(deliveryNos) !== JSON.stringify(expectedDeliveries)) {
  fail(`country delivery order must be exactly ${expectedDeliveries.join(', ')}`);
}

const countryIds = new Set();
const slugs = new Set();
const inventoryCountryById = new Map();
for (const entry of inventoryCountries) {
  if (!idPattern.test(entry.country_id ?? '')) fail(`invalid country_id: ${entry.country_id}`);
  if (!idPattern.test(entry.slug ?? '')) fail(`invalid country slug: ${entry.slug}`);
  if (entry.country_id !== entry.slug) fail(`country_id and slug must match for ${entry.delivery_no}`);
  if (countryIds.has(entry.country_id)) fail(`duplicate country_id: ${entry.country_id}`);
  if (slugs.has(entry.slug)) fail(`duplicate country slug: ${entry.slug}`);
  countryIds.add(entry.country_id);
  slugs.add(entry.slug);
  inventoryCountryById.set(entry.country_id, entry);

  const trackerRow = tracker.find((row) => row.delivery_no === entry.delivery_no);
  if (!trackerRow) {
    fail(`missing tracker row for delivery ${entry.delivery_no}`);
  } else {
    if (trackerRow.slug !== entry.slug) fail(`tracker slug mismatch for delivery ${entry.delivery_no}`);
    if (trackerRow.page_kind !== 'country') fail(`delivery ${entry.delivery_no} must remain page_kind country`);
    if (trackerRow.note_ref !== entry.note_ref) fail(`tracker note_ref mismatch for ${entry.slug}`);
    const hasProfile = profileIds.has(entry.country_id);
    const expectedProgrammeStatus = hasProfile ? 'profile_ready' : 'note_reviewed';
    const expectedProfileStatus = hasProfile ? 'reviewed' : 'not_started';
    if (trackerRow.programme_status !== expectedProgrammeStatus) {
      fail(`${entry.slug} programme status must be ${expectedProgrammeStatus}`);
    }
    if (trackerRow.profile_status !== expectedProfileStatus) {
      fail(`${entry.slug} profile status must be ${expectedProfileStatus}`);
    }
    if (hasProfile && (trackerRow.en_route_status !== 'complete' || trackerRow.ja_route_status !== 'complete')) {
      fail(`${entry.slug} production profile requires complete EN and JA routes`);
    }
  }

  for (const key of ['organiser_source_ids', 'distributor_source_ids', 'racecourse_ids', 'principal_racecourse_ids']) {
    if (!Array.isArray(entry[key])) fail(`${entry.slug}.${key} must be an array`);
    else if (new Set(entry[key]).size !== entry[key].length) fail(`${entry.slug}.${key} contains duplicates`);
  }
  const organisers = new Set(entry.organiser_source_ids ?? []);
  for (const id of entry.distributor_source_ids ?? []) {
    if (organisers.has(id)) fail(`${entry.slug} source ${id} cannot be both organiser and distributor`);
  }
  if (entry.organiser_status === 'confirmed' && !(entry.organiser_source_ids ?? []).length) {
    fail(`${entry.slug} confirmed organiser status requires an organiser source id`);
  }
  if (entry.organiser_status === 'pending' && (entry.organiser_source_ids ?? []).length) {
    fail(`${entry.slug} pending organiser status must not claim an organiser source id`);
  }
  if (entry.principal_racecourse_status === 'confirmed' && !(entry.principal_racecourse_ids ?? []).length) {
    fail(`${entry.slug} confirmed principal racecourse status requires an id`);
  }
  if (entry.principal_racecourse_status === 'pending' && (entry.principal_racecourse_ids ?? []).length) {
    fail(`${entry.slug} pending principal racecourse status must use an empty id list`);
  }
  for (const id of entry.principal_racecourse_ids ?? []) {
    if (!(entry.racecourse_ids ?? []).includes(id)) fail(`${entry.slug} principal racecourse is absent from racecourse_ids: ${id}`);
  }
}

const countryRegistry = indexUnique(countries, 'countries.json');
for (const entry of inventoryCountries) {
  const registered = countryRegistry.get(entry.country_id);
  if (entry.country_registry_status === 'registered') {
    if (!registered) fail(`registered country id is absent from countries.json: ${entry.country_id}`);
    else if (registered.slug !== entry.slug) fail(`countries.json slug mismatch for ${entry.country_id}`);
  } else if (entry.country_registry_status === 'reserved') {
    if (registered) fail(`reserved country id already exists in countries.json: ${entry.country_id}`);
  } else {
    fail(`invalid country_registry_status for ${entry.country_id}`);
  }
}

const sourceDefinitions = indexUnique(inventorySources, 'inventory sources');
const sourceRegistry = indexUnique(sources, 'sources.json');
for (const source of inventorySources) {
  if (!inventoryCountryById.has(source.country_id)) fail(`source has unknown country_id: ${source.id}`);
  if (!['organiser', 'distributor', 'supplementary'].includes(source.role)) fail(`invalid source role: ${source.id}`);
  if (!['registered', 'reserved', 'candidate'].includes(source.registry_status)) fail(`invalid source registry_status: ${source.id}`);
  const registered = sourceRegistry.get(source.id);
  if (source.registry_status === 'registered') {
    if (!registered) fail(`registered source id is absent from sources.json: ${source.id}`);
    else if (registered.country_id !== source.country_id) fail(`source country mismatch: ${source.id}`);
  } else if (registered) {
    fail(`${source.registry_status} source id already exists in sources.json: ${source.id}`);
  }
}

const racecourseDefinitions = indexUnique(inventoryRacecourses, 'inventory racecourses');
const racecourseRegistry = indexSplitRegistry(racecourses, 'racecourse registries');
for (const racecourse of inventoryRacecourses) {
  if (!inventoryCountryById.has(racecourse.country_id)) fail(`racecourse has unknown country_id: ${racecourse.id}`);
  if (!['confirmed', 'observed', 'candidate'].includes(racecourse.evidence_status)) fail(`invalid racecourse evidence_status: ${racecourse.id}`);
  if (!['registered', 'reserved', 'candidate'].includes(racecourse.registry_status)) fail(`invalid racecourse registry_status: ${racecourse.id}`);
  const registered = racecourseRegistry.get(racecourse.id);
  if (racecourse.registry_status === 'registered') {
    if (!registered) fail(`registered racecourse id is absent from registry: ${racecourse.id}`);
    else if (registered.country_id !== racecourse.country_id) fail(`racecourse country mismatch: ${racecourse.id}`);
  } else if (registered) {
    fail(`${racecourse.registry_status} racecourse id already exists in registry: ${racecourse.id}`);
  }
}

for (const entry of inventoryCountries) {
  for (const id of entry.organiser_source_ids ?? []) {
    const source = sourceDefinitions.get(id);
    if (!source) fail(`${entry.slug} has dangling organiser source id: ${id}`);
    else {
      if (source.country_id !== entry.country_id) fail(`${entry.slug} organiser source country mismatch: ${id}`);
      if (source.role !== 'organiser') fail(`${entry.slug} organiser source has wrong role: ${id}`);
    }
  }
  for (const id of entry.distributor_source_ids ?? []) {
    const source = sourceDefinitions.get(id);
    if (!source) fail(`${entry.slug} has dangling distributor source id: ${id}`);
    else {
      if (source.country_id !== entry.country_id) fail(`${entry.slug} distributor source country mismatch: ${id}`);
      if (!['distributor', 'supplementary'].includes(source.role)) fail(`${entry.slug} distributor source has wrong role: ${id}`);
    }
  }
  for (const id of entry.racecourse_ids ?? []) {
    const racecourse = racecourseDefinitions.get(id);
    if (!racecourse) fail(`${entry.slug} has dangling racecourse id: ${id}`);
    else if (racecourse.country_id !== entry.country_id) fail(`${entry.slug} racecourse country mismatch: ${id}`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log(`COUNTRY_PAGE_ID_INVENTORY_VALID countries=${inventoryCountries.length} sources=${inventorySources.length} racecourses=${inventoryRacecourses.length} registered_countries=${inventoryCountries.filter((entry) => entry.country_registry_status === 'registered').length} reserved_countries=${inventoryCountries.filter((entry) => entry.country_registry_status === 'reserved').length}`);
