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
const englishRoute = read('src/pages/countries/[slug].astro');
const japaneseRoute = read('src/pages/ja/countries/[slug].astro');
const countryPage = read('src/components/CountryDetailPage.astro');
const inventory = JSON.parse(read('data/static/country-racing-inventory.json'));

if (!dataTs.includes('country-racing-inventory.json')) {
  fail('src/lib/data.ts must import country-racing-inventory.json');
}

if (!dataTs.includes('countryRacingInventory')) {
  fail('src/lib/data.ts must export countryRacingInventory through siteData');
}

for (const [label, route, locale] of [
  ['English country route', englishRoute, 'en'],
  ['Japanese country route', japaneseRoute, 'ja'],
]) {
  if (!route.includes('CountryDetailPage')) fail(`${label} must delegate to CountryDetailPage`);
  if (!route.includes(`locale="${locale}"`)) fail(`${label} must select locale ${locale}`);
}

for (const required of [
  'getPublicTimetableMeetingRowsByCountry',
  'createCalendarDateContext',
  'filterRecordsForWindow',
  'activeWindowRecords',
  'outOfWindowRecords',
  'countryInventory',
  'current_seed_state',
  'coverage_note_en',
  'coverage_note_ja',
]) {
  if (!countryPage.includes(required)) fail(`CountryDetailPage must include ${required}`);
}

for (const requiredText of [
  'may not cover every meeting',
  'does not mean there is no racing',
  'does not replace official calendars or racecards',
  'すべての開催を網羅しているとは限りません',
  '開催がないことを意味しません',
  '公式カレンダーやレースカードの代替ではありません',
]) {
  if (!countryPage.includes(requiredText)) {
    fail(`CountryDetailPage must visibly preserve the coverage boundary: ${requiredText}`);
  }
}

for (const prohibitedPublicItem of [
  'Entries, horses, jockeys, and trainers',
  'Odds and popularity',
  'Predictions and betting tips',
  'Results and payouts',
  '出走馬、騎手、調教師',
  'オッズ、人気',
  '予想、買い目',
  '結果、払戻',
]) {
  if (!countryPage.includes(prohibitedPublicItem)) {
    fail(`CountryDetailPage must list the non-public boundary item: ${prohibitedPublicItem}`);
  }
}

if (inventory.schema_version !== 'country-racing-inventory-v0') {
  fail('Country racing inventory schema must remain country-racing-inventory-v0');
}
if (!Array.isArray(inventory.global_rules) || !inventory.global_rules.some((rule) => rule.includes('Do not call a country complete'))) {
  fail('Country racing inventory must retain the no-unreviewed-completeness rule');
}

const japan = inventory.countries.find((country) => country.country_id === 'japan');
if (!japan) fail('Inventory must include Japan');
if (japan?.overall_coverage_status === 'complete') fail('Japan must not be marked complete by the legacy seed inventory');
for (const systemId of ['jra', 'nar', 'banei']) {
  if (!japan?.racing_systems.some((system) => system.system_id === systemId)) {
    fail(`Japan inventory must include ${systemId}`);
  }
}

const uae = inventory.countries.find((country) => country.country_id === 'united-arab-emirates');
if (!uae) fail('Inventory must include United Arab Emirates');
if (uae?.overall_coverage_status === 'complete') fail('UAE must not be marked complete by the legacy seed inventory');

// The inventory is a historical seed-era audit input. Current country pages are
// driven by reviewed Public v1 meeting rows and must not be forced back to old
// NAR/Banei/UAE seed statuses by this validator.

if (errors.length) {
  console.error('Country Public v1 coverage boundary check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Country Public v1 coverage boundary check passed.');
