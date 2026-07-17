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
const attribute = (html, name) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
const attributes = (html, name) => [...html.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))].map((match) => match[1]);

const paths = {
  contract: 'data/static/source-status-filter-contract-v1.json',
  audit: 'data/audits/source-status-filters-v1.json',
  data: 'src/lib/source-filter-data.ts',
  component: 'src/components/SourceDirectoryPage.astro',
  englishPage: 'src/pages/sources/index.astro',
  japanesePage: 'src/pages/ja/sources/index.astro',
  doc: 'docs/search/source-status-filters.md',
  workflow: '.github/workflows/source-status-filters.yml',
  temporaryWorkflow: '.github/workflows/temporary-source-filter-discovery.yml',
};

for (const required of Object.values(paths).filter((value) => value !== paths.temporaryWorkflow)) {
  if (!fs.existsSync(filePath(required))) fail(`required file missing: ${required}`);
}

const contract = parse(paths.contract);
const audit = parse(paths.audit);
const expectedOptions = {
  source_types: ['official'],
  data_types: ['link_only'],
  auto_levels: ['B', 'C'],
  terms_risks: ['unknown'],
  registry_statuses: ['alpha_link_first', 'not_recorded', 'pending_reachability'],
};
const expectedScope = {
  source_records: 171,
  countries_with_sources: 98,
  locales: 2,
  directory_routes: 2,
  bilingual_country_source_routes: 196,
  filter_controls: 7,
  url_parameters: 7,
  no_javascript_fallback_records_per_locale: 171,
};
const expectedVerified = {
  source_records: 171,
  english_rendered_records: 171,
  japanese_rendered_records: 171,
  countries_with_sources: 98,
  directory_routes: 2,
  bilingual_country_source_routes: 196,
  filter_controls: 7,
  url_parameters: 7,
  duplicate_source_ids: 0,
  missing_search_text: 0,
  missing_filter_attributes: 0,
  unknown_country_options: 0,
  unknown_source_type_options: 0,
  unknown_data_type_options: 0,
  unknown_auto_level_options: 0,
  unknown_terms_risk_options: 0,
  unknown_registry_status_options: 0,
  broken_country_source_links: 0,
  invalid_external_source_urls: 0,
  no_javascript_missing_records: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
};

if (contract.schema_version !== 'source-status-filter-contract-v1') fail('contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('Work ID differs');
if (contract.implementation_unit !== 'SOURCE-STATUS-FILTERS-01') fail('implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-17') fail('contract release state differs');
if (!exact(contract.scope, expectedScope)) fail('contract scope differs');
if (!exact(contract.option_contract, expectedOptions)) fail('option contract differs');

const filterContract = contract.filter_contract ?? {};
for (const [key, value] of Object.entries({
  keyword_parameter: 'q',
  country_parameter: 'country',
  source_type_parameter: 'source_type',
  data_type_parameter: 'data_type',
  auto_level_parameter: 'auto_level',
  terms_risk_parameter: 'risk',
  registry_status_parameter: 'status',
  registry_status_source_field: 'm3_status',
  missing_registry_status_value: 'not_recorded',
  unicode_normalization: 'NFKC',
  case_insensitive: true,
  whitespace_normalized: true,
  combined_filters_required: true,
  url_state_restoration_required: true,
  live_result_count_required: true,
  zero_result_state_required: true,
  clear_filters_required: true,
  no_javascript_complete_list_required: true,
})) if (filterContract[key] !== value) fail(`filter contract differs: ${key}`);

const recordContract = contract.record_contract ?? {};
const expectedFields = ['id', 'url', 'country_id', 'country_href', 'source_type', 'data_type', 'auto_level', 'terms_risk', 'registry_status', 'search_text'];
if (!exact(recordContract.required_fields, expectedFields)) fail('required source fields differ');
if (recordContract.english_country_source_pattern !== '/sources/{country-slug}/') fail('English source route pattern differs');
if (recordContract.japanese_country_source_pattern !== '/ja/sources/{country-slug}/') fail('Japanese source route pattern differs');
if (recordContract.duplicate_ids_allowed !== false || recordContract.empty_search_text_allowed !== false || recordContract.unknown_filter_values_allowed !== false) fail('source uniqueness contract differs');
if (recordContract.external_source_url_required !== true) fail('external URL requirement differs');

for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const allowed = ['public_source_ids_allowed', 'public_source_urls_allowed', 'public_country_links_allowed', 'public_source_metadata_allowed'].includes(key);
  if (value !== allowed) fail(`public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('automation boundary differs');
if (contract.previous_implementation_unit !== 'REGION-FILTERS-01' || contract.next_implementation_unit !== 'GLOSSARY-SEARCH-IMPROVEMENT-01') fail('roadmap linkage differs');

if (audit.schema_version !== 'source-status-filters-audit-v1') fail('audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at || audit.status !== 'complete') fail('audit release identity differs');
if (!exact(audit.verified, expectedVerified)) fail('audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('audit boundary snapshot differs');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('audit roadmap linkage differs');

const dataSource = read(paths.data);
for (const marker of ['SourceFilterRecord', 'SourceFilterOptions', 'normalizeSourceFilterText', "normalize('NFKC')", 'getSourceFilterRecords', 'getSourceFilterOptions', "source.m3_status) ? source.m3_status : 'not_recorded'"]) {
  if (!dataSource.includes(marker)) fail(`data projection missing: ${marker}`);
}
const component = read(paths.component);
for (const marker of ['data-source-directory', 'data-source-filter-form', 'data-source-filter-query', 'data-source-filter-country', 'data-source-filter-source-type', 'data-source-filter-data-type', 'data-source-filter-auto-level', 'data-source-filter-risk', 'data-source-filter-status', 'data-source-filter-reset', 'data-source-filter-count', 'data-source-filter-empty', 'data-source-record', 'data-source-search-text', "restoreSelect(statusSelect, 'status')", 'window.history.replaceState', '<noscript>']) {
  if (!component.includes(marker)) fail(`component missing: ${marker}`);
}
for (const source of [dataSource, component]) {
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
    if (source.includes(forbidden)) fail(`forbidden client behavior found: ${forbidden}`);
  }
}
for (const [page, locale] of [[paths.englishPage, 'en'], [paths.japanesePage, 'ja']]) {
  const source = read(page);
  for (const marker of ['SourceDirectoryPage', 'getSourceFilterOptions', 'getSourceFilterRecords', `locale="${locale}"`]) if (!source.includes(marker)) fail(`${page} missing ${marker}`);
}

const doc = read(paths.doc);
for (const marker of ['SOURCE-STATUS-FILTERS-01', '171 unique reviewed public source records', '98 countries and regions', 'chile-hipodromo-chile-home', 'scripts/check-source-status-filters.mjs', '.github/workflows/source-status-filters.yml', 'GLOSSARY-SEARCH-IMPROVEMENT-01']) {
  if (!doc.includes(marker)) fail(`documentation missing: ${marker}`);
}
const workflow = read(paths.workflow);
for (const marker of ['npm install --package-lock=false', 'npm run build', 'node scripts/check-glossary-qa-release.mjs', 'node scripts/check-global-search-foundation.mjs', 'node scripts/check-country-filters.mjs', 'node scripts/check-race-type-filters.mjs', 'node scripts/check-region-filters.mjs', 'node scripts/check-source-status-filters.mjs', 'git status --porcelain']) {
  if (!workflow.includes(marker)) fail(`workflow missing: ${marker}`);
}
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`workflow contains forbidden marker: ${forbidden}`);
}
if (fs.existsSync(filePath(paths.temporaryWorkflow))) fail('temporary source discovery workflow remains');

function optionValues(html, selectId) {
  const match = html.match(new RegExp(`<select[^>]*id="${selectId}"[^>]*>([\\s\\S]*?)<\\/select>`));
  if (!match) return null;
  return [...match[1].matchAll(/<option value="([^"]*)"/g)].map((option) => option[1]).filter((value) => value !== 'all');
}

function verifyRenderedDirectory({ file, lang, countryPrefix }) {
  if (!fs.existsSync(filePath(file))) return fail(`rendered directory missing: ${file}`);
  const html = read(file);
  const cards = [...html.matchAll(/<article[^>]*data-source-record(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  if (cards.length !== 171) fail(`${file}: source card count differs ${cards.length}`);

  const ids = [];
  const countries = [];
  const countryHrefs = [];
  const optionSets = { sourceTypes: [], dataTypes: [], autoLevels: [], risks: [], statuses: [] };
  let missingAttributes = 0;
  let missingSearchText = 0;
  let badCountryLinks = 0;
  let badExternalUrls = 0;

  for (const card of cards) {
    const values = {
      id: attribute(card, 'data-source-id'),
      country: attribute(card, 'data-source-country'),
      sourceType: attribute(card, 'data-source-source-type'),
      dataType: attribute(card, 'data-source-data-type'),
      autoLevel: attribute(card, 'data-source-auto-level'),
      risk: attribute(card, 'data-source-risk'),
      status: attribute(card, 'data-source-status'),
      searchText: attribute(card, 'data-source-search-text'),
    };
    if (Object.values(values).some((value) => value === null)) missingAttributes += 1;
    if (!values.searchText) missingSearchText += 1;
    if (values.id) ids.push(values.id);
    if (values.country) countries.push(values.country);
    if (values.sourceType) optionSets.sourceTypes.push(values.sourceType);
    if (values.dataType) optionSets.dataTypes.push(values.dataType);
    if (values.autoLevel) optionSets.autoLevels.push(values.autoLevel);
    if (values.risk) optionSets.risks.push(values.risk);
    if (values.status) optionSets.statuses.push(values.status);

    const hrefs = attributes(card, 'href');
    const external = hrefs.find((href) => /^https?:\/\//i.test(href));
    try {
      const parsed = new URL((external ?? '').replaceAll('&amp;', '&'));
      if (!['http:', 'https:'].includes(parsed.protocol)) badExternalUrls += 1;
    } catch {
      badExternalUrls += 1;
    }
    const countryHref = hrefs.find((href) => href.startsWith(countryPrefix));
    if (!countryHref || !countryHref.endsWith('/')) badCountryLinks += 1;
    else countryHrefs.push(countryHref);
  }

  if (ids.length !== new Set(ids).size) fail(`${file}: duplicate source IDs ${ids.length - new Set(ids).size}`);
  if (missingAttributes) fail(`${file}: missing filter attributes ${missingAttributes}`);
  if (missingSearchText) fail(`${file}: missing search text ${missingSearchText}`);
  if (badCountryLinks) fail(`${file}: broken country source links ${badCountryLinks}`);
  if (badExternalUrls) fail(`${file}: invalid external URLs ${badExternalUrls}`);
  if (new Set(countries).size !== 98) fail(`${file}: countries with sources differ ${new Set(countries).size}`);
  if (!sameSet(optionSets.sourceTypes, expectedOptions.source_types)) fail(`${file}: source types differ`);
  if (!sameSet(optionSets.dataTypes, expectedOptions.data_types)) fail(`${file}: data types differ`);
  if (!sameSet(optionSets.autoLevels, expectedOptions.auto_levels)) fail(`${file}: automation levels differ`);
  if (!sameSet(optionSets.risks, expectedOptions.terms_risks)) fail(`${file}: terms risks differ`);
  if (!sameSet(optionSets.statuses, expectedOptions.registry_statuses)) fail(`${file}: registry statuses differ`);

  const controls = [
    ['source-filter-country', countries],
    ['source-filter-source-type', expectedOptions.source_types],
    ['source-filter-data-type', expectedOptions.data_types],
    ['source-filter-auto-level', expectedOptions.auto_levels],
    ['source-filter-risk', expectedOptions.terms_risks],
    ['source-filter-status', expectedOptions.registry_statuses],
  ];
  for (const [id, expected] of controls) {
    const actual = optionValues(html, id);
    if (!actual || !sameSet(actual, expected)) fail(`${file}: option set differs for ${id}`);
  }

  const uniqueRoutes = uniqueSorted(countryHrefs);
  if (uniqueRoutes.length !== 98) fail(`${file}: country source route count differs ${uniqueRoutes.length}`);
  for (const href of uniqueRoutes) {
    const rendered = path.join('dist', href.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(filePath(rendered))) fail(`${file}: rendered country source route missing ${href}`);
  }
  for (const marker of ['data-source-records="171"', 'data-source-country-options="98"', 'data-source-type-options="1"', 'data-source-data-type-options="1"', 'data-source-auto-level-options="2"', 'data-source-risk-options="1"', 'data-source-status-options="3"', 'data-source-filter-form', 'data-source-filter-empty', '<noscript>']) {
    if (!html.includes(marker)) fail(`${file}: rendered marker missing ${marker}`);
  }
  if (!html.includes(`<html lang="${lang}"`)) fail(`${file}: rendered locale differs`);
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
verifyRenderedDirectory({ file: 'dist/sources/index.html', lang: 'en', countryPrefix: '/sources/' });
verifyRenderedDirectory({ file: 'dist/ja/sources/index.html', lang: 'ja', countryPrefix: '/ja/sources/' });

if (errors.length) {
  console.error(`SOURCE_STATUS_FILTERS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('SOURCE_STATUS_FILTERS: pass');
console.log('SOURCE_RECORDS: 171');
console.log('COUNTRIES_WITH_SOURCES: 98');
console.log('BILINGUAL_COUNTRY_SOURCE_ROUTES: 196');
console.log('FILTER_CONTROLS: 7');
console.log('TEMPORARY_DISCOVERY_WORKFLOWS: 0');
