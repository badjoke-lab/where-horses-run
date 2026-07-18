import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const uniqueSorted = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'));
const attr = (html, name) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
const attrs = (html, name) => [...html.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))].map((match) => match[1]);

const paths = {
  contract: 'data/static/source-status-filter-contract-v1.json',
  audit: 'data/audits/source-status-filters-v1.json',
  data: 'src/lib/source-filter-data.ts',
  component: 'src/components/SourceDirectoryPage.astro',
  englishPage: 'src/pages/sources/index.astro',
  japanesePage: 'src/pages/ja/sources/index.astro',
  doc: 'docs/search/source-status-filters.md',
  workflow: '.github/workflows/source-status-filters.yml',
};
const temporaryPaths = [
  '.github/workflows/temporary-source-filter-discovery.yml',
  '.github/workflows/temporary-v1-source-policy-discovery.yml',
  'scripts/temporary-discover-v1-source-policy.mjs',
  'scripts/temporary-normalize-v1-source-policy.mjs',
];
for (const required of Object.values(paths)) {
  if (!fs.existsSync(filePath(required))) fail(`required file missing: ${required}`);
}
for (const temporary of temporaryPaths) {
  if (fs.existsSync(filePath(temporary))) fail(`temporary source-policy file remains: ${temporary}`);
}

const contract = parse(paths.contract);
const audit = parse(paths.audit);
const expectedScope = {
  source_records: 171,
  source_registry_files: 26,
  countries_with_sources: 98,
  locales: 2,
  directory_routes: 2,
  bilingual_country_source_routes: 196,
  filter_controls: 2,
  url_parameters: 2,
  no_javascript_fallback_records_per_locale: 171,
};
const expectedVerified = {
  source_records: 171,
  source_registry_files: 26,
  english_rendered_records: 171,
  japanese_rendered_records: 171,
  countries_with_sources: 98,
  directory_routes: 2,
  bilingual_country_source_routes: 196,
  filter_controls: 2,
  url_parameters: 2,
  duplicate_source_ids: 0,
  invalid_external_source_urls: 0,
  missing_public_notes: 0,
  missing_search_text: 0,
  missing_public_attributes: 0,
  broken_country_source_links: 0,
  no_javascript_missing_records: 0,
  terms_risk_fields: 0,
  m3_status_fields: 0,
  m3_notes_fields: 0,
  auto_level_fields: 171,
  rendered_auto_level_instances: 0,
  rendered_terms_risk_instances: 0,
  rendered_registry_status_instances: 0,
  internal_search_text_instances: 0,
  internal_html_attribute_instances: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
};

if (contract.schema_version !== 'source-status-filter-contract-v1') fail('contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('Work ID differs');
if (contract.implementation_unit !== 'SOURCE-STATUS-FILTERS-01') fail('implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-18') fail('contract release state differs');
if (contract.policy_revision_unit !== 'V1-SOURCE-POLICY-REVIEW-01') fail('policy revision unit differs');
if (!exact(contract.scope, expectedScope)) fail('contract scope differs');
if (!exact(contract.filter_contract, {
  keyword_parameter: 'q',
  country_parameter: 'country',
  unicode_normalization: 'NFKC',
  case_insensitive: true,
  whitespace_normalized: true,
  combined_filters_required: true,
  url_state_restoration_required: true,
  live_result_count_required: true,
  zero_result_state_required: true,
  clear_filters_required: true,
  no_javascript_complete_list_required: true,
})) fail('filter contract differs');
const projection = contract.public_projection ?? {};
if (!exact(projection.fields, ['id', 'url', 'country_id', 'country_href', 'source_type', 'data_type', 'notes', 'search_text'])) fail('public projection fields differ');
if (!exact(projection.source_type_values, ['official']) || !exact(projection.data_type_values, ['link_only'])) fail('public source values differ');
if (projection.duplicate_ids_allowed !== false || projection.empty_notes_allowed !== false || projection.empty_search_text_allowed !== false || projection.external_source_url_required !== true) fail('public projection requirements differ');
if (projection.english_country_source_pattern !== '/sources/{country-slug}/' || projection.japanese_country_source_pattern !== '/ja/sources/{country-slug}/') fail('country source route patterns differ');
const internal = contract.internal_metadata_boundary ?? {};
for (const key of ['auto_level_exposed_in_directory', 'terms_risk_allowed_in_registry', 'm3_status_allowed_in_registry', 'm3_notes_allowed_in_registry', 'internal_metadata_allowed_in_search_text', 'internal_metadata_allowed_in_html_attributes', 'internal_metadata_allowed_in_visible_labels']) {
  if (internal[key] !== false) fail(`internal metadata boundary differs: ${key}`);
}
if (internal.auto_level_retained_in_registry !== true) fail('auto-level retention boundary differs');
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('automation boundary differs');

if (audit.schema_version !== 'source-status-filters-audit-v1') fail('audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at || audit.policy_revision_unit !== contract.policy_revision_unit || audit.status !== 'complete') fail('audit identity differs');
if (!exact(audit.verified, expectedVerified)) fail('audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('audit behavior differs');
if (!exact(audit.public_boundary, contract.public_boundary) || !exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('audit boundary snapshot differs');

const registryFiles = [
  'data/static/sources.json',
  ...fs.readdirSync(filePath('data/static')).filter((name) => /^country-page-sources-.*\.json$/.test(name)).sort().map((name) => `data/static/${name}`),
  'data/static/racecourse-link-amendments-v1.json',
];
if (registryFiles.length !== 26) fail(`source registry file count differs: ${registryFiles.length}`);
const sourceRows = [];
for (const file of registryFiles) {
  const value = parse(file);
  const rows = Array.isArray(value) ? value : Array.isArray(value.source_records) ? value.source_records : [];
  sourceRows.push(...rows);
}
if (sourceRows.length !== 171) fail(`source record count differs: ${sourceRows.length}`);
const ids = sourceRows.map((row) => row.id);
if (new Set(ids).size !== ids.length) fail(`duplicate source IDs remain: ${ids.length - new Set(ids).size}`);
let termsRiskFields = 0;
let m3StatusFields = 0;
let m3NotesFields = 0;
let autoLevelFields = 0;
let missingNotes = 0;
let invalidUrls = 0;
for (const row of sourceRows) {
  if (Object.hasOwn(row, 'terms_risk')) termsRiskFields += 1;
  if (Object.hasOwn(row, 'm3_status')) m3StatusFields += 1;
  if (Object.hasOwn(row, 'm3_notes')) m3NotesFields += 1;
  if (typeof row.auto_level === 'string' && row.auto_level.trim()) autoLevelFields += 1;
  if (typeof row.notes !== 'string' || !row.notes.trim()) missingNotes += 1;
  if (row.source_type !== 'official') fail(`non-official source type remains: ${row.id}`);
  if (row.data_type !== 'link_only') fail(`non-link-only data type remains: ${row.id}`);
  try {
    const url = new URL(row.url);
    if (!['http:', 'https:'].includes(url.protocol)) invalidUrls += 1;
  } catch {
    invalidUrls += 1;
  }
}
if (termsRiskFields || m3StatusFields || m3NotesFields) fail(`internal registry fields remain: terms=${termsRiskFields}, status=${m3StatusFields}, notes=${m3NotesFields}`);
if (autoLevelFields !== 171) fail(`auto-level retention differs: ${autoLevelFields}`);
if (missingNotes) fail(`public source notes missing: ${missingNotes}`);
if (invalidUrls) fail(`invalid source URLs remain: ${invalidUrls}`);

const dataSource = read(paths.data);
for (const marker of ['SourceFilterRecord', 'SourceFilterOptions', 'normalizeSourceFilterText', "normalize('NFKC')", 'getSourceFilterRecords', 'getSourceFilterOptions']) {
  if (!dataSource.includes(marker)) fail(`data projection missing: ${marker}`);
}
const component = read(paths.component);
for (const marker of ['data-source-directory', 'data-source-filter-controls="2"', 'data-source-url-parameters="2"', 'data-source-filter-query', 'data-source-filter-country', 'data-source-filter-reset', 'data-source-filter-count', 'data-source-filter-empty', 'data-source-record', 'data-source-search-text', 'window.history.replaceState', '<noscript>']) {
  if (!component.includes(marker)) fail(`component missing: ${marker}`);
}
const forbiddenPublicMarkers = ['autoLevel', 'termsRisk', 'registryStatus', 'm3_status', 'terms_risk', 'data-source-auto-level', 'data-source-risk', 'data-source-status', 'source-filter-auto-level', 'source-filter-risk', 'source-filter-status', 'Automation level', 'Terms risk', 'Registry status', '自動化レベル', '利用条件リスク', '登録状態'];
for (const source of [dataSource, component]) {
  for (const marker of forbiddenPublicMarkers) if (source.includes(marker)) fail(`internal public marker remains: ${marker}`);
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) if (source.includes(forbidden)) fail(`forbidden client behavior found: ${forbidden}`);
}

function verifyRenderedDirectory(file, lang, countryPrefix) {
  if (!fs.existsSync(filePath(file))) return fail(`rendered directory missing: ${file}`);
  const html = read(file);
  const cards = [...html.matchAll(/<article[^>]*data-source-record(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  if (cards.length !== 171) fail(`${file}: source card count differs ${cards.length}`);
  const cardIds = [];
  const countries = [];
  const countryHrefs = [];
  let missingAttributes = 0;
  let missingSearchText = 0;
  let badCountryLinks = 0;
  let badExternalUrls = 0;
  for (const card of cards) {
    const id = attr(card, 'data-source-id');
    const country = attr(card, 'data-source-country');
    const searchText = attr(card, 'data-source-search-text');
    if (!id || !country || searchText === null) missingAttributes += 1;
    if (!searchText) missingSearchText += 1;
    if (id) cardIds.push(id);
    if (country) countries.push(country);
    const hrefs = attrs(card, 'href');
    const external = hrefs.find((href) => /^https?:\/\//i.test(href));
    try {
      const url = new URL((external ?? '').replaceAll('&amp;', '&'));
      if (!['http:', 'https:'].includes(url.protocol)) badExternalUrls += 1;
    } catch {
      badExternalUrls += 1;
    }
    const countryHref = hrefs.find((href) => href.startsWith(countryPrefix));
    if (!countryHref || !countryHref.endsWith('/')) badCountryLinks += 1;
    else countryHrefs.push(countryHref);
  }
  if (new Set(cardIds).size !== 171) fail(`${file}: rendered source IDs are not unique`);
  if (new Set(countries).size !== 98) fail(`${file}: countries with sources differ ${new Set(countries).size}`);
  if (missingAttributes) fail(`${file}: public attributes missing ${missingAttributes}`);
  if (missingSearchText) fail(`${file}: search text missing ${missingSearchText}`);
  if (badCountryLinks) fail(`${file}: country source links broken ${badCountryLinks}`);
  if (badExternalUrls) fail(`${file}: external source URLs invalid ${badExternalUrls}`);
  const routes = uniqueSorted(countryHrefs);
  if (routes.length !== 98) fail(`${file}: country source route count differs ${routes.length}`);
  for (const href of routes) {
    const rendered = path.join('dist', href.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(filePath(rendered))) fail(`${file}: rendered country source route missing ${href}`);
  }
  for (const marker of ['data-source-records="171"', 'data-source-country-options="98"', 'data-source-filter-controls="2"', 'data-source-url-parameters="2"', 'data-source-filter-form', 'data-source-filter-empty', '<noscript>']) {
    if (!html.includes(marker)) fail(`${file}: rendered marker missing ${marker}`);
  }
  for (const marker of forbiddenPublicMarkers) if (html.includes(marker)) fail(`${file}: internal rendered marker remains ${marker}`);
  if (!html.includes(`<html lang="${lang}"`)) fail(`${file}: rendered locale differs`);
}
if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
verifyRenderedDirectory('dist/sources/index.html', 'en', '/sources/');
verifyRenderedDirectory('dist/ja/sources/index.html', 'ja', '/ja/sources/');

for (const [page, locale] of [[paths.englishPage, 'en'], [paths.japanesePage, 'ja']]) {
  const source = read(page);
  for (const marker of ['SourceDirectoryPage', 'getSourceFilterOptions', 'getSourceFilterRecords', `locale="${locale}"`]) if (!source.includes(marker)) fail(`${page} missing ${marker}`);
}
const doc = read(paths.doc);
for (const marker of ['SOURCE-STATUS-FILTERS-01', 'V1-SOURCE-POLICY-REVIEW-01', '171', '98', '2 controls', 'scripts/check-source-status-filters.mjs', '.github/workflows/source-status-filters.yml']) if (!doc.includes(marker)) fail(`documentation missing: ${marker}`);
const workflow = read(paths.workflow);
for (const marker of ['permissions:', 'contents: read', 'npm install --package-lock=false', 'npm run build', 'node scripts/check-source-status-filters.mjs', 'git status --porcelain']) if (!workflow.includes(marker)) fail(`workflow missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`workflow contains forbidden marker: ${forbidden}`);

if (errors.length) {
  console.error(`SOURCE_STATUS_FILTERS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('SOURCE_STATUS_FILTERS: pass');
console.log('SOURCE_RECORDS: 171');
console.log('COUNTRIES_WITH_SOURCES: 98');
console.log('FILTER_CONTROLS: 2');
console.log('URL_PARAMETERS: 2');
console.log('INTERNAL_REGISTRY_FIELDS: 0');
console.log('INTERNAL_RENDERED_FIELDS: 0');
