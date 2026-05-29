import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const inventory = readJson('data/static/country-racing-inventory.json');
const timetables = readJson('data/generated/timetables.json');

if (inventory.schema_version !== 'country-racing-inventory-v0') {
  fail('inventory schema_version must be country-racing-inventory-v0');
}

const allowedCoverageStatuses = new Set([
  'not_started',
  'initial_seed_only',
  'partial',
  'out_of_window_seed',
  'broad',
  'complete',
]);

const requiredCountries = ['japan', 'hong-kong', 'united-arab-emirates'];
const countries = inventory.countries ?? [];

for (const countryId of requiredCountries) {
  const country = countries.find((entry) => entry.country_id === countryId);
  if (!country) {
    fail(`inventory must include ${countryId}`);
    continue;
  }

  if (!allowedCoverageStatuses.has(country.overall_coverage_status)) {
    fail(`${countryId}: invalid overall_coverage_status ${country.overall_coverage_status}`);
  }

  if (country.overall_coverage_status === 'complete') {
    fail(`${countryId}: complete status is forbidden in the inventory gate until a separate completion pass exists`);
  }

  if (!Array.isArray(country.racing_systems) || country.racing_systems.length === 0) {
    fail(`${countryId}: racing_systems must not be empty`);
  }

  if (!Array.isArray(country.must_not_claim) || country.must_not_claim.length === 0) {
    fail(`${countryId}: must_not_claim must document prohibited coverage claims`);
  }

  for (const system of country.racing_systems ?? []) {
    if (!system.system_id) fail(`${countryId}: racing system missing system_id`);
    if (!system.name) fail(`${countryId}: racing system missing name`);
    if (!allowedCoverageStatuses.has(system.coverage_status)) {
      fail(`${countryId}/${system.system_id}: invalid coverage_status ${system.coverage_status}`);
    }
    if (system.coverage_status === 'complete') {
      fail(`${countryId}/${system.system_id}: complete status is forbidden in this gate`);
    }
    if (!Array.isArray(system.official_sources) || system.official_sources.length === 0) {
      fail(`${countryId}/${system.system_id}: official_sources must not be empty`);
    }
    if (!Array.isArray(system.racecourses)) {
      fail(`${countryId}/${system.system_id}: racecourses must be an array, even when not started`);
    }
    if (!system.coverage_notes) {
      fail(`${countryId}/${system.system_id}: coverage_notes is required`);
    }
  }
}

const japan = countries.find((entry) => entry.country_id === 'japan');
const jra = japan?.racing_systems?.find((system) => system.system_id === 'jra');
const jraRacecourses = new Set((jra?.racecourses ?? []).map((racecourse) => racecourse.racecourse_id));
for (const requiredJraRacecourse of [
  'sapporo-racecourse',
  'hakodate-racecourse',
  'fukushima-racecourse',
  'niigata-racecourse',
  'tokyo-racecourse',
  'nakayama-racecourse',
  'chukyo-racecourse',
  'kyoto-racecourse',
  'hanshin-racecourse',
  'kokura-racecourse',
]) {
  if (!jraRacecourses.has(requiredJraRacecourse)) {
    fail(`japan/jra: missing racecourse ${requiredJraRacecourse}`);
  }
}

for (const requiredJapanSystem of ['jra', 'nar', 'banei']) {
  if (!japan?.racing_systems?.some((system) => system.system_id === requiredJapanSystem)) {
    fail(`japan: missing racing system ${requiredJapanSystem}`);
  }
}

const hk = countries.find((entry) => entry.country_id === 'hong-kong');
const hkjc = hk?.racing_systems?.find((system) => system.system_id === 'hkjc');
const hkRacecourses = new Set((hkjc?.racecourses ?? []).map((racecourse) => racecourse.racecourse_id));
for (const requiredHkRacecourse of ['sha-tin-racecourse', 'happy-valley-racecourse']) {
  if (!hkRacecourses.has(requiredHkRacecourse)) {
    fail(`hong-kong/hkjc: missing racecourse ${requiredHkRacecourse}`);
  }
}

const uae = countries.find((entry) => entry.country_id === 'united-arab-emirates');
if (uae?.overall_coverage_status !== 'out_of_window_seed') {
  fail('united-arab-emirates: current overall_coverage_status must remain out_of_window_seed until active-window records exist');
}

const generatedDate = String(timetables.generated_at ?? '').slice(0, 10);
const uaeRecords = (timetables.records ?? []).filter((record) => record.country_id === 'united-arab-emirates');
if (generatedDate && uaeRecords.length > 0) {
  const startDate = new Date(`${generatedDate}T00:00:00.000Z`);
  const endDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + 30));
  const activeUaeRecords = uaeRecords.filter((record) => {
    const recordDate = new Date(`${record.date}T00:00:00.000Z`);
    return recordDate >= startDate && recordDate < endDate;
  });
  if (activeUaeRecords.length === 0 && uae?.overall_coverage_status !== 'out_of_window_seed') {
    fail('united-arab-emirates: no active-window records, so coverage status must be out_of_window_seed');
  }
}

for (const term of ['complete', 'covered', 'broad']) {
  const unsafeCountries = countries.filter((country) => {
    const stateText = `${country.current_seed_state ?? ''} ${country.coverage_notes ?? ''}`.toLowerCase();
    return country.overall_coverage_status === 'initial_seed_only' && stateText.includes(`${country.display_name?.toLowerCase()} ${term}`);
  });
  if (unsafeCountries.length) {
    fail(`initial seed countries must not imply ${term}: ${unsafeCountries.map((country) => country.country_id).join(', ')}`);
  }
}

if (errors.length) {
  console.error('Country racing inventory gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Country racing inventory gate passed.');
