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
const recordCount = (html) => [...html.matchAll(/\sdata-country-record(?=[\s>])/g)].length;

const contractPath = 'data/static/country-filter-contract-v1.json';
const auditPath = 'data/audits/country-filters-v1.json';
const dataPath = 'src/lib/country-filter-data.ts';
const componentPath = 'src/components/CountryDirectoryPage.astro';
const docPath = 'docs/search/country-filters.md';
const workflowPath = '.github/workflows/country-filters.yml';
const pagePaths = ['src/pages/countries/index.astro', 'src/pages/ja/countries/index.astro'];

for (const requiredPath of [contractPath, auditPath, dataPath, componentPath, docPath, workflowPath, ...pagePaths]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);

if (contract.schema_version !== 'country-filter-contract-v1') fail('country filter contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('country filter Work ID differs');
if (contract.implementation_unit !== 'COUNTRY-FILTERS-01') fail('country filter implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(contract.status)) fail('country filter contract status differs');
if (contract.reviewed_at !== '2026-07-16') fail('country filter review date differs');
if (!exact(contract.scope, {
  country_records: 98,
  locales: 2,
  directory_routes: 2,
  bilingual_detail_routes: 196,
  filter_controls: 5,
  url_parameters: 5,
  no_javascript_fallback_records_per_locale: 98,
})) fail('country filter scope differs');
if (!exact(contract.filter_contract, {
  keyword_parameter: 'q',
  region_parameter: 'region',
  racing_type_parameter: 'racing_type',
  status_parameter: 'status',
  coverage_parameter: 'coverage',
  unicode_normalization: 'NFKC',
  case_insensitive: true,
  whitespace_normalized: true,
  combined_filters_required: true,
  url_state_restoration_required: true,
  live_result_count_required: true,
  zero_result_state_required: true,
  clear_filters_required: true,
  no_javascript_complete_list_required: true,
})) fail('country filter behavior contract differs');
if (!exact(contract.record_contract?.required_fields, [
  'id', 'slug', 'href', 'name', 'summary', 'region', 'status', 'racing_types',
  'coverage_level', 'auto_level', 'search_text',
])) fail('country record fields differ');
if (contract.record_contract?.english_route_pattern !== '/countries/{slug}/' || contract.record_contract?.japanese_route_pattern !== '/ja/countries/{slug}/') fail('country route pattern differs');
for (const key of ['duplicate_ids_allowed', 'empty_search_text_allowed', 'unknown_filter_values_allowed']) {
  if (contract.record_contract?.[key] !== false) fail(`country record contract ${key} differs`);
}
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = ['public_country_labels_allowed', 'public_country_summaries_allowed', 'public_country_metadata_allowed', 'public_internal_links_allowed'].includes(key);
  if (value !== expected) fail(`country public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('country privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('country automation boundary differs');
if (contract.next_implementation_unit !== 'RACE-TYPE-FILTERS-01') fail('next country filter unit differs');

if (audit.schema_version !== 'country-filters-audit-v1') fail('country filter audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('country filter audit identity differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('country filter audit status differs');
if (!exact(audit.verified, {
  country_records: 98,
  english_rendered_records: 98,
  japanese_rendered_records: 98,
  directory_routes: 2,
  bilingual_detail_routes: 196,
  filter_controls: 5,
  url_parameters: 5,
  duplicate_country_ids: 0,
  missing_search_text: 0,
  missing_filter_attributes: 0,
  unknown_region_options: 0,
  unknown_racing_type_options: 0,
  unknown_status_options: 0,
  unknown_coverage_options: 0,
  broken_country_links: 0,
  no_javascript_missing_records: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('country filter audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('country filter audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('country filter audit boundaries differ');
if (audit.next_implementation_unit !== contract.next_implementation_unit) fail('country filter audit next unit differs');

const dataSource = read(dataPath);
for (const marker of [
  'getCountries', "normalize('NFKC')", 'splitCountryRegions',
  'getCountryFilterRecords', 'getCountryFilterOptions',
  '/countries/${country.slug}/', '/ja/countries/${country.slug}/',
  'records.flatMap((record) => record.racingTypes)', 'record.regions',
]) if (!dataSource.includes(marker)) fail(`country filter data projection missing ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (dataSource.includes(forbidden)) fail(`country filter data projection contains forbidden marker ${forbidden}`);
}

const component = read(componentPath);
for (const marker of [
  'data-country-directory', 'data-country-filter-form', 'data-country-filter-query',
  'data-country-filter-region', 'data-country-filter-racing-type', 'data-country-filter-status',
  'data-country-filter-coverage', 'data-country-filter-reset', 'data-country-filter-count',
  'data-country-filter-empty', 'data-country-record', 'data-country-region',
  'data-country-regions', 'data-country-search-text', '<noscript>',
  'new URLSearchParams(window.location.search)', "params.get('q')", "restoreSelect(regionSelect, 'region')",
  "restoreSelect(racingTypeSelect, 'racing_type')", "restoreSelect(statusSelect, 'status')",
  "restoreSelect(coverageSelect, 'coverage')", "normalize('NFKC')", 'window.history.replaceState',
  'regions.includes(region)', 'record.hidden = !show', "queryInput.addEventListener('input', apply)",
]) if (!component.includes(marker)) fail(`country filter component missing ${marker}`);
for (const forbidden of ['fetch(', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (component.includes(forbidden)) fail(`country filter component contains forbidden marker ${forbidden}`);
}

for (const page of pagePaths) {
  const source = read(page);
  for (const marker of ['CountryDirectoryPage', 'getCountryFilterRecords', 'getCountryFilterOptions']) {
    if (!source.includes(marker)) fail(`${page}: country filter page marker missing ${marker}`);
  }
}

const doc = read(docPath);
for (const marker of [
  'COUNTRY-FILTERS-01', '98', '/countries/', '/ja/countries/',
  'racing_type', 'NFKC', 'JavaScript is disabled', 'external filter service',
  'RACE-TYPE-FILTERS-01',
]) if (!doc.includes(marker)) fail(`country filter documentation missing ${marker}`);

if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of [
    'npm install --package-lock=false', 'npm run build',
    'node scripts/check-glossary-qa-release.mjs',
    'node scripts/check-global-search-foundation.mjs',
    'node scripts/check-country-filters.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`country filter workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`country filter workflow contains forbidden marker ${forbidden}`);
  }
}

function optionValues(html, selectId) {
  const match = html.match(new RegExp(`<select[^>]*id="${selectId}"[^>]*>([\\s\\S]*?)<\\/select>`));
  if (!match) return null;
  return [...match[1].matchAll(/<option value="([^"]*)"/g)].map((option) => option[1]).filter((value) => value !== 'all');
}

function verifyRenderedDirectory({ file, lang, routePrefix }) {
  if (!fs.existsSync(filePath(file))) {
    fail(`rendered country directory missing: ${file}`);
    return;
  }

  const html = read(file);
  const cards = [...html.matchAll(/<article[^>]*data-country-record(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  const cardAttributeValues = (name) => cards.flatMap((card) => attributeValues(card, name));
  const ids = cardAttributeValues('data-country-id');
  const displayRegions = cardAttributeValues('data-country-region');
  const regionGroups = cardAttributeValues('data-country-regions');
  const racingTypeGroups = cardAttributeValues('data-country-racing-types');
  const statuses = cardAttributeValues('data-country-status');
  const coverageLevels = cardAttributeValues('data-country-coverage');
  const searchTexts = cardAttributeValues('data-country-search-text');

  const measurements = {
    records: recordCount(html),
    ids: ids.length,
    displayRegions: displayRegions.length,
    regionGroups: regionGroups.length,
    racingTypeGroups: racingTypeGroups.length,
    statuses: statuses.length,
    coverageLevels: coverageLevels.length,
    searchTexts: searchTexts.length,
    cards: cards.length,
  };
  if (Object.values(measurements).some((value) => value !== 98)) fail(`${file}: rendered country counts differ ${JSON.stringify(measurements)}`);
  if (new Set(ids).size !== 98) fail(`${file}: duplicate country IDs detected`);
  if (searchTexts.some((value) => !value.trim())) fail(`${file}: empty country search text detected`);

  const expectedRegions = uniqueSorted(regionGroups.flatMap((value) => value.split('|').filter(Boolean)));
  const expectedRacingTypes = uniqueSorted(racingTypeGroups.flatMap((value) => value.split('|').filter(Boolean)));
  const expectedStatuses = uniqueSorted(statuses);
  const expectedCoverage = uniqueSorted(coverageLevels);
  const actualRegions = optionValues(html, 'country-filter-region');
  const actualRacingTypes = optionValues(html, 'country-filter-racing-type');
  const actualStatuses = optionValues(html, 'country-filter-status');
  const actualCoverage = optionValues(html, 'country-filter-coverage');

  if (!actualRegions || !sameSet(actualRegions, expectedRegions)) fail(`${file}: region option set differs`);
  if (!actualRacingTypes || !sameSet(actualRacingTypes, expectedRacingTypes)) fail(`${file}: racing-type option set differs`);
  if (!actualStatuses || !sameSet(actualStatuses, expectedStatuses)) fail(`${file}: status option set differs`);
  if (!actualCoverage || !sameSet(actualCoverage, expectedCoverage)) fail(`${file}: coverage option set differs`);

  let brokenLinks = 0;
  for (const card of cards) {
    const link = card.match(new RegExp(`href="(${routePrefix}[^"/]+/)"`));
    if (!link) {
      brokenLinks += 1;
      continue;
    }
    const target = `dist${link[1]}index.html`;
    if (!fs.existsSync(filePath(target))) brokenLinks += 1;
  }
  if (brokenLinks !== 0) fail(`${file}: broken country links ${brokenLinks}`);

  for (const marker of [
    'data-country-records="98"', 'data-country-filter-query', 'data-country-filter-region',
    'data-country-filter-racing-type', 'data-country-filter-status', 'data-country-filter-coverage',
    'data-country-filter-reset', 'data-country-filter-count', 'data-country-filter-empty', '<noscript>',
  ]) if (!html.includes(marker)) fail(`${file}: rendered country marker missing ${marker}`);
  if (!html.includes(`<html lang="${lang}"`)) fail(`${file}: rendered locale differs`);
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
verifyRenderedDirectory({ file: 'dist/countries/index.html', lang: 'en', routePrefix: '/countries/' });
verifyRenderedDirectory({ file: 'dist/ja/countries/index.html', lang: 'ja', routePrefix: '/ja/countries/' });

if (errors.length) {
  console.error(`COUNTRY_FILTERS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('COUNTRY_FILTERS: pass');
console.log('COUNTRY_RECORDS: 98');
console.log('DIRECTORY_ROUTES: 2');
console.log('BILINGUAL_DETAIL_ROUTES: 196');
console.log('FILTER_CONTROLS: 5');
console.log('URL_PARAMETERS: 5');
console.log('NO_JAVASCRIPT_FALLBACK: complete');
console.log('EXTERNAL_FILTER_SERVICE: false');
console.log('QUERY_LOGGING: false');
console.log('NEXT_IMPLEMENTATION_UNIT: RACE-TYPE-FILTERS-01');
