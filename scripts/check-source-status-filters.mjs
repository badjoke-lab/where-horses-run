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
const attributeValue = (html, name) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
const attributeValues = (html, name) => [...html.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))].map((match) => match[1]);

const contractPath = 'data/static/source-status-filter-contract-v1.json';
const auditPath = 'data/audits/source-status-filters-v1.json';
const dataPath = 'src/lib/source-filter-data.ts';
const componentPath = 'src/components/SourceDirectoryPage.astro';
const englishPagePath = 'src/pages/sources/index.astro';
const japanesePagePath = 'src/pages/ja/sources/index.astro';
const docPath = 'docs/search/source-status-filters.md';
const workflowPath = '.github/workflows/source-status-filters.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-source-filter-discovery.yml';

for (const requiredPath of [
  contractPath,
  auditPath,
  dataPath,
  componentPath,
  englishPagePath,
  japanesePagePath,
  docPath,
  workflowPath,
]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedSourceTypes = ['official'];
const expectedDataTypes = ['link_only'];
const expectedAutoLevels = ['B', 'C'];
const expectedTermsRisks = ['unknown'];
const expectedRegistryStatuses = ['alpha_link_first', 'not_recorded', 'pending_reachability'];

if (contract.schema_version !== 'source-status-filter-contract-v1') fail('source status filter contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('source status filter Work ID differs');
if (contract.implementation_unit !== 'SOURCE-STATUS-FILTERS-01') fail('source status filter implementation unit differs');
if (contract.status !== 'complete') fail('source status filter contract status differs');
if (contract.reviewed_at !== '2026-07-17') fail('source status filter review date differs');
if (!exact(contract.scope, {
  source_records: 172,
  countries_with_sources: 98,
  locales: 2,
  directory_routes: 2,
  bilingual_country_source_routes: 196,
  filter_controls: 7,
  url_parameters: 7,
  no_javascript_fallback_records_per_locale: 172,
})) fail('source status filter scope differs');
if (!exact(contract.option_contract, {
  source_types: expectedSourceTypes,
  data_types: expectedDataTypes,
  auto_levels: expectedAutoLevels,
  terms_risks: expectedTermsRisks,
  registry_statuses: expectedRegistryStatuses,
})) fail('source status filter option contract differs');
if (!exact(contract.filter_contract, {
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
})) fail('source status filter behavior contract differs');
if (!exact(contract.record_contract, {
  required_fields: [
    'id',
    'url',
    'country_id',
    'country_href',
    'source_type',
    'data_type',
    'auto_level',
    'terms_risk',
    'registry_status',
    'search_text',
  ],
  english_country_source_pattern: '/sources/{country-slug}/',
  japanese_country_source_pattern: '/ja/sources/{country-slug}/',
  duplicate_ids_allowed: false,
  empty_search_text_allowed: false,
  unknown_filter_values_allowed: false,
  external_source_url_required: true,
})) fail('source status filter record contract differs');
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = [
    'public_source_ids_allowed',
    'public_source_urls_allowed',
    'public_country_links_allowed',
    'public_source_metadata_allowed',
  ].includes(key);
  if (value !== expected) fail(`source public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('source privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('source automation boundary differs');
if (contract.previous_implementation_unit !== 'REGION-FILTERS-01') fail('previous source unit differs');
if (contract.next_implementation_unit !== 'GLOSSARY-SEARCH-IMPROVEMENT-01') fail('next source unit differs');

if (audit.schema_version !== 'source-status-filters-audit-v1') fail('source status filter audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('source filter audit identity differs');
if (audit.status !== 'complete') fail('source status filter audit status differs');
if (!exact(audit.verified, {
  source_records: 172,
  english_rendered_records: 172,
  japanese_rendered_records: 172,
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
})) fail('source status filter audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('source filter audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('source filter audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('source filter audit roadmap differs');

const dataSource = read(dataPath);
for (const marker of [
  'SourceFilterRecord',
  'SourceFilterOptions',
  'normalizeSourceFilterText',
  "normalize('NFKC')",
  "m3_status?: string",
  "registryStatus = nonempty(source.m3_status) ? source.m3_status : 'not_recorded'",
  'getSourceFilterRecords',
  'getSourceFilterOptions',
]) if (!dataSource.includes(marker)) fail(`source filter data projection missing ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (dataSource.includes(forbidden)) fail(`source filter data projection contains forbidden marker ${forbidden}`);
}

const component = read(componentPath);
for (const marker of [
  'data-source-directory',
  'data-source-filter-form',
  'data-source-filter-query',
  'data-source-filter-country',
  'data-source-filter-source-type',
  'data-source-filter-data-type',
  'data-source-filter-auto-level',
  'data-source-filter-risk',
  'data-source-filter-status',
  'data-source-filter-reset',
  'data-source-filter-count',
  'data-source-filter-empty',
  'data-source-record',
  'data-source-search-text',
  "restoreSelect(statusSelect, 'status')",
  'window.history.replaceState',
  '<noscript>',
]) if (!component.includes(marker)) fail(`source filter component missing ${marker}`);
for (const forbidden of ['fetch(', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (component.includes(forbidden)) fail(`source filter component contains forbidden marker ${forbidden}`);
}

for (const [pagePath, locale] of [[englishPagePath, 'en'], [japanesePagePath, 'ja']]) {
  const page = read(pagePath);
  for (const marker of ['SourceDirectoryPage', 'getSourceFilterOptions', 'getSourceFilterRecords', `locale="${locale}"`]) {
    if (!page.includes(marker)) fail(`${pagePath}: source directory page missing ${marker}`);
  }
}

const doc = read(docPath);
for (const marker of [
  'SOURCE-STATUS-FILTERS-01',
  '172 reviewed public source records',
  '98 countries and regions',
  'source_type',
  'data_type',
  'auto_level',
  'risk',
  'status',
  'not_recorded',
  'JavaScript is disabled',
  'scripts/check-source-status-filters.mjs',
  '.github/workflows/source-status-filters.yml',
  'GLOSSARY-SEARCH-IMPROVEMENT-01',
]) if (!doc.includes(marker)) fail(`source filter documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-glossary-qa-release.mjs',
  'node scripts/check-global-search-foundation.mjs',
  'node scripts/check-country-filters.mjs',
  'node scripts/check-race-type-filters.mjs',
  'node scripts/check-region-filters.mjs',
  'node scripts/check-source-status-filters.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`source filter workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`source filter workflow contains forbidden marker ${forbidden}`);
}
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail(`temporary discovery workflow remains: ${temporaryWorkflowPath}`);

function optionValues(html, selectId) {
  const match = html.match(new RegExp(`<select[^>]*id="${selectId}"[^>]*>([\\s\\S]*?)<\\/select>`));
  if (!match) return null;
  return [...match[1].matchAll(/<option value="([^"]*)"/g)].map((option) => option[1]).filter((value) => value !== 'all');
}

function verifyRenderedDirectory({ file, lang, countryPrefix }) {
  if (!fs.existsSync(filePath(file))) {
    fail(`rendered source directory missing: ${file}`);
    return;
  }

  const html = read(file);
  const cards = [...html.matchAll(/<article[^>]*data-source-record(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  if (cards.length !== 172) fail(`${file}: source card count differs ${cards.length}`);

  const ids = [];
  const countryIds = [];
  const countryHrefs = [];
  const sourceTypes = [];
  const dataTypes = [];
  const autoLevels = [];
  const termsRisks = [];
  const registryStatuses = [];
  let missingSearchText = 0;
  let missingFilterAttributes = 0;
  let brokenCountryLinks = 0;
  let invalidExternalUrls = 0;

  for (const card of cards) {
    const id = attributeValue(card, 'data-source-id');
    const countryId = attributeValue(card, 'data-source-country');
    const sourceType = attributeValue(card, 'data-source-source-type');
    const dataType = attributeValue(card, 'data-source-data-type');
    const autoLevel = attributeValue(card, 'data-source-auto-level');
    const risk = attributeValue(card, 'data-source-risk');
    const status = attributeValue(card, 'data-source-status');
    const searchText = attributeValue(card, 'data-source-search-text');
    const requiredValues = [id, countryId, sourceType, dataType, autoLevel, risk, status, searchText];
    if (requiredValues.some((value) => value === null)) missingFilterAttributes += 1;
    if (!searchText) missingSearchText += 1;
    if (id) ids.push(id);
    if (countryId) countryIds.push(countryId);
    if (sourceType) sourceTypes.push(sourceType);
    if (dataType) dataTypes.push(dataType);
    if (autoLevel) autoLevels.push(autoLevel);
    if (risk) termsRisks.push(risk);
    if (status) registryStatuses.push(status);

    const hrefs = attributeValues(card, 'href');
    const externalHref = hrefs.find((href) => /^https?:\/\//i.test(href));
    if (!externalHref) invalidExternalUrls += 1;
    else {
      try {
        const parsed = new URL(externalHref.replaceAll('&amp;', '&'));
        if (!['http:', 'https:'].includes(parsed.protocol)) invalidExternalUrls += 1;
      } catch {
        invalidExternalUrls += 1;
      }
    }

    const countryHref = hrefs.find((href) => href.startsWith(countryPrefix));
    if (!countryHref || !countryHref.endsWith('/')) brokenCountryLinks += 1;
    else countryHrefs.push(countryHref);
  }

  const duplicateIds = ids.length - new Set(ids).size;
  if (duplicateIds !== 0) fail(`${file}: duplicate source IDs ${duplicateIds}`);
  if (missingSearchText !== 0) fail(`${file}: missing search text ${missingSearchText}`);
  if (missingFilterAttributes !== 0) fail(`${file}: missing filter attributes ${missingFilterAttributes}`);
  if (brokenCountryLinks !== 0) fail(`${file}: broken country source links ${brokenCountryLinks}`);
  if (invalidExternalUrls !== 0) fail(`${file}: invalid external source URLs ${invalidExternalUrls}`);
  if (new Set(countryIds).size !== 98) fail(`${file}: countries with sources differ ${new Set(countryIds).size}`);
  if (!sameSet(sourceTypes, expectedSourceTypes)) fail(`${file}: source type values differ`);
  if (!sameSet(dataTypes, expectedDataTypes)) fail(`${file}: data type values differ`);
  if (!sameSet(autoLevels, expectedAutoLevels)) fail(`${file}: auto level values differ`);
  if (!sameSet(termsRisks, expectedTermsRisks)) fail(`${file}: terms risk values differ`);
  if (!sameSet(registryStatuses, expectedRegistryStatuses)) fail(`${file}: registry status values differ`);

  const countryOptions = optionValues(html, 'source-filter-country');
  const sourceTypeOptions = optionValues(html, 'source-filter-source-type');
  const dataTypeOptions = optionValues(html, 'source-filter-data-type');
  const autoLevelOptions = optionValues(html, 'source-filter-auto-level');
  const riskOptions = optionValues(html, 'source-filter-risk');
  const statusOptions = optionValues(html, 'source-filter-status');
  if (!countryOptions || !sameSet(countryOptions, countryIds)) fail(`${file}: country option values differ`);
  if (!sourceTypeOptions || !sameSet(sourceTypeOptions, expectedSourceTypes)) fail(`${file}: source type option values differ`);
  if (!dataTypeOptions || !sameSet(dataTypeOptions, expectedDataTypes)) fail(`${file}: data type option values differ`);
  if (!autoLevelOptions || !sameSet(autoLevelOptions, expectedAutoLevels)) fail(`${file}: auto level option values differ`);
  if (!riskOptions || !sameSet(riskOptions, expectedTermsRisks)) fail(`${file}: terms risk option values differ`);
  if (!statusOptions || !sameSet(statusOptions, expectedRegistryStatuses)) fail(`${file}: registry status option values differ`);

  const uniqueCountryHrefs = uniqueSorted(countryHrefs);
  if (uniqueCountryHrefs.length !== 98) fail(`${file}: unique country source routes differ ${uniqueCountryHrefs.length}`);
  for (const href of uniqueCountryHrefs) {
    const renderedPath = path.join('dist', href.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(filePath(renderedPath))) fail(`${file}: rendered country source route missing ${href}`);
  }

  for (const marker of [
    'data-source-records="172"',
    'data-source-country-options="98"',
    'data-source-type-options="1"',
    'data-source-data-type-options="1"',
    'data-source-auto-level-options="2"',
    'data-source-risk-options="1"',
    'data-source-status-options="3"',
    'data-source-filter-form',
    'data-source-filter-count',
    'data-source-filter-empty',
    '<noscript>',
  ]) if (!html.includes(marker)) fail(`${file}: rendered source marker missing ${marker}`);
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
console.log('SOURCE_RECORDS: 172');
console.log('COUNTRIES_WITH_SOURCES: 98');
console.log('BILINGUAL_COUNTRY_SOURCE_ROUTES: 196');
console.log('FILTER_CONTROLS: 7');
console.log('TEMPORARY_DISCOVERY_WORKFLOWS: 0');
