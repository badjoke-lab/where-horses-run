import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

const dataTs = read('src/lib/data.ts');
const englishPage = read('src/pages/countries/[slug].astro');
const japanesePage = read('src/pages/ja/countries/[slug].astro');
const inventory = JSON.parse(read('data/static/country-racing-inventory.json'));

if (!dataTs.includes('country-racing-inventory.json')) {
  fail('src/lib/data.ts must import country-racing-inventory.json');
}

if (!dataTs.includes('countryRacingInventory')) {
  fail('src/lib/data.ts must export countryRacingInventory through siteData');
}

for (const [label, page] of [
  ['English country page', englishPage],
  ['Japanese country page', japanesePage],
]) {
  for (const required of [
    'siteData.countryRacingInventory',
    'countryInventory',
    'overall_coverage_status',
    'current_seed_state',
    'racing_systems',
    'coverage_status',
    'coverage_notes',
    'must_not_claim',
    'activeWindowRecords',
    'outOfWindowRecords',
  ]) {
    if (!page.includes(required)) {
      fail(`${label} must include ${required}`);
    }
  }

  for (const requiredText of [
    'initial seed',
    'out-of-window',
    'must not',
  ]) {
    if (!page.toLowerCase().includes(requiredText)) {
      fail(`${label} must visibly explain ${requiredText} coverage limitations`);
    }
  }
}

const japan = inventory.countries.find((country) => country.country_id === 'japan');
if (!japan) fail('Inventory must include Japan');
if (japan?.overall_coverage_status === 'complete') {
  fail('Japan must not be complete');
}
for (const systemId of ['jra', 'nar', 'banei']) {
  if (!japan?.racing_systems.some((system) => system.system_id === systemId)) {
    fail(`Japan inventory must include ${systemId}`);
  }
}

const nar = japan?.racing_systems.find((system) => system.system_id === 'nar');
if (nar?.coverage_status !== 'not_started') {
  fail('NAR must remain not_started until actual source/calendar work is implemented');
}

const uae = inventory.countries.find((country) => country.country_id === 'united-arab-emirates');
if (uae?.overall_coverage_status !== 'out_of_window_seed') {
  fail('UAE must remain out_of_window_seed until active-window records exist');
}

if (errors.length) {
  console.error('Seed audit labels UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Seed audit labels UI check passed.');
