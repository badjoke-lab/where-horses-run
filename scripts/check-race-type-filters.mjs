import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const uniqueSorted = (values) => [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en'));
const sameSet = (left, right) => exact(uniqueSorted(left), uniqueSorted(right));
const attributeValues = (html, name) => [...html.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))].map((match) => match[1]);
const recordCount = (html) => [...html.matchAll(/\sdata-racecourse-record(?=[\s>])/g)].length;

const contractPath = 'data/static/race-type-filter-contract-v1.json';
const auditPath = 'data/audits/race-type-filters-v1.json';
const racecoursesPath = 'data/static/racecourses.json';
const dataPath = 'src/lib/racecourse-filter-data.ts';
const componentPath = 'src/components/RacecourseDirectoryPage.astro';
const docPath = 'docs/search/race-type-filters.md';
const workflowPath = '.github/workflows/race-type-filters.yml';
const pagePaths = ['src/pages/tracks/index.astro', 'src/pages/ja/tracks/index.astro'];

for (const requiredPath of [contractPath, auditPath, racecoursesPath, dataPath, componentPath, docPath, workflowPath, ...pagePaths]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const racecourses = parse(racecoursesPath);

if (contract.schema_version !== 'race-type-filter-contract-v1') fail('race type filter contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('race type filter Work ID differs');
if (contract.implementation_unit !== 'RACE-TYPE-FILTERS-01') fail('race type filter implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(contract.status)) fail('race type filter contract status differs');
if (contract.reviewed_at !== '2026-07-16') fail('race type filter review date differs');
const historicalScope = {
  racecourse_records: 36,
  locales: 2,
  directory_routes: 2,
  bilingual_detail_routes: 72,
  filter_controls: 4,
  url_parameters: 4,
  no_javascript_fallback_records_per_locale: 36,
};
if (!exact(contract.scope, historicalScope)) fail('race type filter historical scope differs');
if (!exact(contract.filter_contract, {
  keyword_parameter: 'q',
  country_parameter: 'country',
  racing_type_parameter: 'racing_type',
  surface_parameter: 'surface',
  unicode_normalization: 'NFKC',
  case_insensitive: true,
  whitespace_normalized: true,
  combined_filters_required: true,
  url_state_restoration_required: true,
  live_result_count_required: true,
  zero_result_state_required: true,
  clear_filters_required: true,
  no_javascript_complete_list_required: true,
})) fail('race type filter behavior contract differs');
if (!exact(contract.record_contract?.required_fields, [
  'id', 'slug', 'href', 'name', 'country_id', 'country_href', 'city', 'region',
  'racing_types', 'surfaces', 'direction', 'status', 'schedule_status',
  'course_profile_status', 'search_text',
])) fail('racecourse filter record fields differ');
if (contract.record_contract?.english_route_pattern !== '/tracks/{slug}/' || contract.record_contract?.japanese_route_pattern !== '/ja/tracks/{slug}/') fail('racecourse route pattern differs');
for (const key of ['duplicate_ids_allowed', 'empty_search_text_allowed', 'unknown_filter_values_allowed']) {
  if (contract.record_contract?.[key] !== false) fail(`racecourse record contract ${key} differs`);
}
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = ['public_racecourse_labels_allowed', 'public_course_metadata_allowed', 'public_country_links_allowed', 'public_racing_type_links_allowed'].includes(key);
  if (value !== expected) fail(`race type filter public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('race type filter privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('race type filter automation boundary differs');
if (contract.previous_implementation_unit !== 'COUNTRY-FILTERS-01') fail('previous race type filter unit differs');
if (contract.next_implementation_unit !== 'REGION-FILTERS-01') fail('next race type filter unit differs');

if (audit.schema_version !== 'race-type-filters-audit-v1') fail('race type filter audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('race type filter audit identity differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('race type filter audit status differs');
for (const [key, expected] of Object.entries({
  racecourse_records: 36,
  english_rendered_records: 36,
  japanese_rendered_records: 36,
  directory_routes: 2,
  bilingual_detail_routes: 72,
  filter_controls: 4,
  url_parameters: 4,
})) if (audit.verified?.[key] !== expected) fail(`race type filter historical audit ${key} differs`);
for (const key of [
  'duplicate_racecourse_ids', 'missing_search_text', 'missing_filter_attributes',
  'unknown_country_options', 'unknown_racing_type_options', 'unknown_surface_options',
  'broken_racecourse_links', 'broken_country_links', 'broken_racing_type_links',
  'no_javascript_missing_records', 'contract_errors', 'rendered_marker_errors',
]) if (audit.verified?.[key] !== 0) fail(`race type filter historical audit ${key} differs`);
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('race type filter audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('race type filter audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('race type filter audit roadmap differs');

if (!Array.isArray(racecourses)) fail('current racecourse inventory is not an array');
const currentRacecourseCount = Array.isArray(racecourses) ? racecourses.length : 0;
if (currentRacecourseCount < historicalScope.racecourse_records) fail(`current racecourse inventory shrank ${currentRacecourseCount} < ${historicalScope.racecourse_records}`);
const currentIds = racecourses.map((racecourse) => racecourse.id);
if (new Set(currentIds).size !== currentRacecourseCount) fail('current racecourse inventory contains duplicate IDs');
if (racecourses.some((racecourse) => !racecourse.id || !racecourse.slug || !racecourse.country_id || !racecourse.name_en || !racecourse.name_ja)) fail('current racecourse inventory contains incomplete public identity');

const dataSource = read(dataPath);
for (const marker of [
  'getCountries', 'getRacecourses', 'getRacingTypeById', "normalize('NFKC')",
  'getRacecourseFilterRecords', 'getRacecourseFilterOptions',
  '/tracks/${racecourse.slug}/', '/ja/tracks/${racecourse.slug}/',
  '/countries/${country.slug}/', '/ja/countries/${country.slug}/',
  '/types/${type.slug}/', '/ja/types/${type.slug}/',
  'records.flatMap((record) => record.surfaces)',
]) if (!dataSource.includes(marker)) fail(`racecourse filter data projection missing ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (dataSource.includes(forbidden)) fail(`racecourse filter data projection contains forbidden marker ${forbidden}`);
}

const component = read(componentPath);
for (const marker of [
  'data-racecourse-directory', 'data-racecourse-filter-form', 'data-racecourse-filter-query',
  'data-racecourse-filter-country', 'data-racecourse-filter-racing-type',
  'data-racecourse-filter-surface', 'data-racecourse-filter-reset',
  'data-racecourse-filter-count', 'data-racecourse-filter-empty', 'data-racecourse-record',
  'data-racecourse-country', 'data-racecourse-racing-types', 'data-racecourse-surfaces',
  'data-racecourse-search-text', "|| 'none'", "value !== 'none'", '<noscript>',
  'new URLSearchParams(window.location.search)', "params.get('q')",
  "restoreSelect(countrySelect, 'country')", "restoreSelect(racingTypeSelect, 'racing_type')",
  "restoreSelect(surfaceSelect, 'surface')", "normalize('NFKC')",
  'window.history.replaceState', 'record.hidden = !show',
  "queryInput.addEventListener('input', apply)",
]) if (!component.includes(marker)) fail(`racecourse filter component missing ${marker}`);
for (const forbidden of ['fetch(', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (component.includes(forbidden)) fail(`racecourse filter component contains forbidden marker ${forbidden}`);
}

for (const page of pagePaths) {
  const source = read(page);
  for (const marker of ['RacecourseDirectoryPage', 'getRacecourseFilterRecords', 'getRacecourseFilterOptions']) {
    if (!source.includes(marker)) fail(`${page}: racecourse filter page marker missing ${marker}`);
  }
}

const doc = read(docPath);
for (const marker of [
  'RACE-TYPE-FILTERS-01', '36', '/tracks/', '/ja/tracks/', 'racing_type',
  'NFKC', 'JavaScript is disabled', 'external filter service',
  'COUNTRY-FILTERS-01', 'REGION-FILTERS-01',
]) if (!doc.includes(marker)) fail(`race type filter documentation missing ${marker}`);

if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of [
    'npm install --package-lock=false', 'npm run build',
    'node scripts/check-glossary-qa-release.mjs',
    'node scripts/check-global-search-foundation.mjs',
    'node scripts/check-country-filters.mjs',
    'node scripts/check-race-type-filters.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`race type filter workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`race type filter workflow contains forbidden marker ${forbidden}`);
  }
}

function optionValues(html, selectId) {
  const match = html.match(new RegExp(`<select[^>]*id="${selectId}"[^>]*>([\\s\\S]*?)<\\/select>`));
  if (!match) return null;
  return [...match[1].matchAll(/<option value="([^"]*)"/g)].map((option) => option[1]).filter((value) => value !== 'all');
}

function builtTargetExists(href) {
  if (!href.startsWith('/') || !href.endsWith('/')) return false;
  return fs.existsSync(filePath(`dist${href}index.html`));
}

function verifyRenderedDirectory({ file, lang, routePrefix, countryPrefix, typePrefix }) {
  if (!fs.existsSync(filePath(file))) {
    fail(`rendered racecourse directory missing: ${file}`);
    return;
  }

  const html = read(file);
  const cards = [...html.matchAll(/<article[^>]*data-racecourse-record(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  const cardAttributeValues = (name) => cards.flatMap((card) => attributeValues(card, name));
  const ids = cardAttributeValues('data-racecourse-id');
  const countries = cardAttributeValues('data-racecourse-country');
  const racingTypeGroups = cardAttributeValues('data-racecourse-racing-types');
  const surfaceGroups = cardAttributeValues('data-racecourse-surfaces');
  const searchTexts = cardAttributeValues('data-racecourse-search-text');

  const measurements = {
    records: recordCount(html),
    ids: ids.length,
    countries: countries.length,
    racingTypeGroups: racingTypeGroups.length,
    surfaceGroups: surfaceGroups.length,
    searchTexts: searchTexts.length,
    cards: cards.length,
  };
  if (Object.values(measurements).some((value) => value !== currentRacecourseCount)) fail(`${file}: rendered racecourse counts differ ${JSON.stringify(measurements)} expected=${currentRacecourseCount}`);
  if (new Set(ids).size !== currentRacecourseCount) fail(`${file}: duplicate or missing racecourse IDs detected`);
  if (!sameSet(ids, currentIds)) fail(`${file}: rendered racecourse ID set differs from current inventory`);
  if (searchTexts.some((value) => !value.trim())) fail(`${file}: empty racecourse search text detected`);

  const expectedCountries = uniqueSorted(countries);
  const expectedRacingTypes = uniqueSorted(racingTypeGroups.flatMap((value) => value.split('|').filter((item) => item && item !== 'none')));
  const expectedSurfaces = uniqueSorted(surfaceGroups.flatMap((value) => value.split('|').filter((item) => item && item !== 'none')));
  const actualCountries = optionValues(html, 'racecourse-filter-country');
  const actualRacingTypes = optionValues(html, 'racecourse-filter-racing-type');
  const actualSurfaces = optionValues(html, 'racecourse-filter-surface');

  if (!actualCountries || !sameSet(actualCountries, expectedCountries)) fail(`${file}: country option set differs`);
  if (!actualRacingTypes || !sameSet(actualRacingTypes, expectedRacingTypes)) fail(`${file}: racing-type option set differs`);
  if (!actualSurfaces || !sameSet(actualSurfaces, expectedSurfaces)) fail(`${file}: surface option set differs`);

  let brokenRacecourseLinks = 0;
  let brokenCountryLinks = 0;
  let brokenRacingTypeLinks = 0;
  for (const card of cards) {
    const racecourseHref = card.match(new RegExp(`href="(${routePrefix}[^"/]+/)"`))?.[1];
    const countryHref = card.match(new RegExp(`href="(${countryPrefix}[^"/]+/)"`))?.[1];
    if (!racecourseHref || !builtTargetExists(racecourseHref)) brokenRacecourseLinks += 1;
    if (!countryHref || !builtTargetExists(countryHref)) brokenCountryLinks += 1;
    const typeHrefs = [...card.matchAll(new RegExp(`href="(${typePrefix}[^"/]+/)"`, 'g'))].map((match) => match[1]);
    for (const href of typeHrefs) if (!builtTargetExists(href)) brokenRacingTypeLinks += 1;
  }
  if (brokenRacecourseLinks !== 0) fail(`${file}: broken racecourse links ${brokenRacecourseLinks}`);
  if (brokenCountryLinks !== 0) fail(`${file}: broken country links ${brokenCountryLinks}`);
  if (brokenRacingTypeLinks !== 0) fail(`${file}: broken racing-type links ${brokenRacingTypeLinks}`);

  for (const marker of [
    `data-racecourse-records="${currentRacecourseCount}"`, 'data-racecourse-filter-query',
    'data-racecourse-filter-country', 'data-racecourse-filter-racing-type',
    'data-racecourse-filter-surface', 'data-racecourse-filter-reset',
    'data-racecourse-filter-count', 'data-racecourse-filter-empty', '<noscript>',
  ]) if (!html.includes(marker)) fail(`${file}: rendered racecourse marker missing ${marker}`);
  if (!html.includes(`<html lang="${lang}"`)) fail(`${file}: rendered locale differs`);
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
for (const racecourse of racecourses) {
  for (const href of [`/tracks/${racecourse.slug}/`, `/ja/tracks/${racecourse.slug}/`]) {
    if (!builtTargetExists(href)) fail(`current racecourse detail route missing: ${href}`);
  }
}
verifyRenderedDirectory({
  file: 'dist/tracks/index.html',
  lang: 'en',
  routePrefix: '/tracks/',
  countryPrefix: '/countries/',
  typePrefix: '/types/',
});
verifyRenderedDirectory({
  file: 'dist/ja/tracks/index.html',
  lang: 'ja',
  routePrefix: '/ja/tracks/',
  countryPrefix: '/ja/countries/',
  typePrefix: '/ja/types/',
});

if (errors.length) {
  console.error(`RACE_TYPE_FILTERS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('RACE_TYPE_FILTERS: pass');
console.log(`HISTORICAL_RACECOURSE_RECORDS: ${historicalScope.racecourse_records}`);
console.log(`CURRENT_RACECOURSE_RECORDS: ${currentRacecourseCount}`);
console.log(`CURRENT_BILINGUAL_DETAIL_ROUTES: ${currentRacecourseCount * 2}`);
console.log('DIRECTORY_ROUTES: 2');
console.log('FILTER_CONTROLS: 4');
console.log('URL_PARAMETERS: 4');
console.log('NO_JAVASCRIPT_FALLBACK: complete');
console.log('EXTERNAL_FILTER_SERVICE: false');
console.log('QUERY_LOGGING: false');
console.log('NEXT_IMPLEMENTATION_UNIT: REGION-FILTERS-01');
