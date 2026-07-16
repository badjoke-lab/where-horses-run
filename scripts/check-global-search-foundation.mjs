import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const count = (text, marker) => text.split(marker).length - 1;

const contract = parse('data/static/global-search-contract-v1.json');
const audit = parse('data/audits/global-search-foundation-v1.json');
const workflowPath = '.github/workflows/global-search-foundation.yml';
const docPath = 'docs/search/global-search-foundation.md';
const dataPath = 'src/lib/search-data.ts';
const componentPath = 'src/components/GlobalSearchPage.astro';
const layoutPath = 'src/layouts/BaseLayout.astro';
const pagePaths = ['src/pages/search/index.astro', 'src/pages/ja/search/index.astro'];

for (const requiredPath of [workflowPath, docPath, dataPath, componentPath, layoutPath, ...pagePaths]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

if (contract.schema_version !== 'global-search-contract-v1') fail('search contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('search contract Work ID differs');
if (contract.implementation_unit !== 'GLOBAL-SEARCH-FOUNDATION-01') fail('search contract implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(contract.status)) fail('search contract status differs');
if (contract.reviewed_at !== '2026-07-16') fail('search contract review date differs');
if (!exact(contract.scope, {
  country_records: 98,
  racecourse_records: 36,
  glossary_records: 48,
  total_records: 182,
  locales: 2,
  search_routes: 2,
  record_type_filters: 3,
  no_javascript_fallback_records_per_locale: 182,
})) fail('search contract scope differs');
if (!exact(contract.record_types, ['country', 'racecourse', 'glossary'])) fail('search record types differ');
if (!exact(contract.route_contract, {
  english_search: '/search/',
  japanese_search: '/ja/search/',
  country_route_pattern_en: '/countries/{slug}/',
  country_route_pattern_ja: '/ja/countries/{slug}/',
  racecourse_route_pattern_en: '/tracks/{slug}/',
  racecourse_route_pattern_ja: '/ja/tracks/{slug}/',
  glossary_route_pattern_en: '/glossary/{slug}/',
  glossary_route_pattern_ja: '/ja/glossary/{slug}/',
})) fail('search route contract differs');
if (contract.search_contract?.unicode_normalization !== 'NFKC') fail('search normalization differs');
for (const key of ['case_insensitive', 'whitespace_normalized', 'live_client_filtering', 'form_submission_supported', 'zero_result_state_required', 'no_javascript_complete_list_required']) {
  if (contract.search_contract?.[key] !== true) fail(`search contract ${key} differs`);
}
if (contract.search_contract?.server_or_external_search_service_required !== false) fail('external search service boundary differs');
if (contract.search_contract?.url_query_parameter !== 'q' || contract.search_contract?.url_type_parameter !== 'type') fail('search query parameter contract differs');
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = ['public_page_labels_allowed', 'public_summaries_allowed', 'public_internal_links_allowed'].includes(key);
  if (value !== expected) fail(`search public boundary differs: ${key}`);
}
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('search automation boundary differs');
if (contract.next_implementation_unit !== 'COUNTRY-FILTERS-01') fail('next search implementation unit differs');

if (audit.schema_version !== 'global-search-foundation-v1') fail('search audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('search audit identity differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('search audit status differs');
if (!exact(audit.verified, {
  country_records: 98,
  racecourse_records: 36,
  glossary_records: 48,
  total_records: 182,
  english_rendered_records: 182,
  japanese_rendered_records: 182,
  search_routes: 2,
  type_filters: 3,
  broken_internal_links: 0,
  duplicate_record_keys: 0,
  missing_search_text: 0,
  missing_localized_labels: 0,
  missing_no_javascript_records: 0,
  search_contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('search audit measurements differ');
for (const value of Object.values(audit.user_behavior ?? {})) if (value !== true) fail('search user behavior differs');
if (!exact(audit.public_boundary, contract.public_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('search audit boundary differs');
if (audit.next_implementation_unit !== contract.next_implementation_unit) fail('search audit next unit differs');

const dataSource = read(dataPath);
for (const marker of [
  "getCountries", "getRacecourses", "getGlossaryEntries", "normalize('NFKC')",
  "type: 'country'", "type: 'racecourse'", "type: 'glossary'",
  '/countries/${country.slug}/', '/tracks/${racecourse.slug}/', '/glossary/${entry.slug}/',
  '/ja/countries/${country.slug}/', '/ja/tracks/${racecourse.slug}/', '/ja/glossary/${entry.slug}/',
]) if (!dataSource.includes(marker)) fail(`search data builder missing ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (dataSource.includes(forbidden)) fail(`search data builder contains forbidden marker ${forbidden}`);
}

const component = read(componentPath);
for (const marker of [
  'data-global-search', 'data-search-records={records.length}', 'data-search-record',
  'data-search-type={record.type}', 'data-search-text={record.searchText}',
  'data-search-empty', '<noscript>', 'new URLSearchParams(window.location.search)',
  "params.get('q')", "params.get('type')", "normalize('NFKC')",
  "record.hidden = !show", 'window.history.replaceState',
]) if (!component.includes(marker)) fail(`search component missing ${marker}`);
for (const forbidden of ['fetch(', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (component.includes(forbidden)) fail(`search component contains forbidden marker ${forbidden}`);
}

const layout = read(layoutPath);
for (const marker of ["|search|", "'/ja/search/' : '/search/'", "'検索' : 'Search'"]) {
  if (!layout.includes(marker)) fail(`base layout missing search marker ${marker}`);
}
for (const page of pagePaths) {
  const source = read(page);
  for (const marker of ['GlobalSearchPage', 'getGlobalSearchRecords']) if (!source.includes(marker)) fail(`${page}: search route missing ${marker}`);
}

const doc = read(docPath);
for (const marker of [
  'GLOBAL-SEARCH-FOUNDATION-01', '98', '36', '48', '182',
  '/search/', '/ja/search/', 'NFKC', 'JavaScript is disabled',
  'no external search service', 'COUNTRY-FILTERS-01',
]) if (!doc.includes(marker)) fail(`search documentation missing ${marker}`);

if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of [
    'npm install --package-lock=false', 'npm run build',
    'node scripts/check-glossary-qa-release.mjs',
    'node scripts/check-global-search-foundation.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`search workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`search workflow contains forbidden marker ${forbidden}`);
  }
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
const renderedPages = [
  {
    file: 'dist/search/index.html',
    lang: 'en',
    totals: { country: 98, racecourse: 36, glossary: 48, all: 182 },
    requiredLinks: ['/countries/japan/', '/tracks/tokyo-racecourse/', '/glossary/post-time/'],
  },
  {
    file: 'dist/ja/search/index.html',
    lang: 'ja',
    totals: { country: 98, racecourse: 36, glossary: 48, all: 182 },
    requiredLinks: ['/ja/countries/japan/', '/ja/tracks/tokyo-racecourse/', '/ja/glossary/post-time/'],
  },
];
let renderedMarkerErrors = 0;
for (const page of renderedPages) {
  if (!fs.existsSync(filePath(page.file))) { fail(`rendered search route missing: ${page.file}`); renderedMarkerErrors += 1; continue; }
  const html = read(page.file);
  const measurements = {
    all: count(html, 'data-search-record'),
    country: count(html, 'data-search-type="country"'),
    racecourse: count(html, 'data-search-type="racecourse"'),
    glossary: count(html, 'data-search-type="glossary"'),
    text: count(html, 'data-search-text='),
  };
  if (measurements.all !== page.totals.all || measurements.country !== page.totals.country || measurements.racecourse !== page.totals.racecourse || measurements.glossary !== page.totals.glossary || measurements.text !== page.totals.all) {
    fail(`${page.file}: rendered record counts differ ${JSON.stringify(measurements)}`);
    renderedMarkerErrors += 1;
  }
  for (const marker of [
    'data-search-records="182"', 'data-search-countries="98"',
    'data-search-racecourses="36"', 'data-search-glossary="48"',
    'data-search-empty', '<noscript>', 'data-search-query', 'data-search-type',
    ...page.requiredLinks,
  ]) if (!html.includes(marker)) { fail(`${page.file}: rendered search marker missing ${marker}`); renderedMarkerErrors += 1; }
  if (!html.includes(`<html lang="${page.lang}"`)) { fail(`${page.file}: rendered locale differs`); renderedMarkerErrors += 1; }
}
if (renderedMarkerErrors !== 0) fail(`rendered search marker errors: ${renderedMarkerErrors}`);

if (errors.length) {
  console.error(`GLOBAL_SEARCH_FOUNDATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('GLOBAL_SEARCH_FOUNDATION: pass');
console.log('COUNTRY_RECORDS: 98');
console.log('RACECOURSE_RECORDS: 36');
console.log('GLOSSARY_RECORDS: 48');
console.log('TOTAL_RECORDS: 182');
console.log('SEARCH_ROUTES: 2');
console.log('NO_JAVASCRIPT_FALLBACK: complete');
console.log('EXTERNAL_SEARCH_SERVICE: false');
console.log('QUERY_LOGGING: false');
console.log('NEXT_IMPLEMENTATION_UNIT: COUNTRY-FILTERS-01');
