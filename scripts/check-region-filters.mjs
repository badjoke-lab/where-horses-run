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

const contractPath = 'data/static/region-filter-contract-v1.json';
const auditPath = 'data/audits/region-filters-v1.json';
const dataPath = 'src/lib/country-filter-data.ts';
const componentPath = 'src/components/CountryDirectoryPage.astro';
const docPath = 'docs/search/region-filters.md';
const workflowPath = '.github/workflows/region-filters.yml';

for (const requiredPath of [contractPath, auditPath, dataPath, componentPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedRegionIds = [
  'Africa',
  'Asia',
  'Caribbean',
  'Central America',
  'Central Asia',
  'East Africa',
  'East Asia',
  'Europe',
  'Middle East',
  'North Africa',
  'North America',
  'Oceania',
  'South America',
  'South Caucasus',
  'Southeast Asia',
  'Southern Africa',
  'Southern Europe',
  'West Africa',
  'West Asia',
];
const expectedRegionCounts = {
  Africa: 9,
  Asia: 12,
  Caribbean: 7,
  'Central America': 7,
  'Central Asia': 1,
  'East Africa': 1,
  'East Asia': 2,
  Europe: 28,
  'Middle East': 6,
  'North Africa': 2,
  'North America': 3,
  Oceania: 2,
  'South America': 10,
  'South Caucasus': 1,
  'Southeast Asia': 2,
  'Southern Africa': 1,
  'Southern Europe': 1,
  'West Africa': 1,
  'West Asia': 3,
};

if (contract.schema_version !== 'region-filter-contract-v1') fail('region filter contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('region filter Work ID differs');
if (contract.implementation_unit !== 'REGION-FILTERS-01') fail('region filter implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(contract.status)) fail('region filter contract status differs');
if (contract.reviewed_at !== '2026-07-16') fail('region filter review date differs');
if (!exact(contract.scope, {
  country_records: 98,
  region_facets: 19,
  locales: 2,
  directory_routes: 2,
  region_navigation_links_per_locale: 19,
  region_navigation_links_total: 38,
  no_javascript_fallback_records_per_locale: 98,
})) fail('region filter scope differs');
if (!exact(contract.region_ids, expectedRegionIds)) fail('region filter ID contract differs');
if (!exact(contract.region_counts, expectedRegionCounts)) fail('region filter count contract differs');
if (!exact(contract.region_contract, {
  source_field: 'region',
  separator: '/',
  trim_membership_values: true,
  deduplicate_membership_values: true,
  multiple_region_memberships_allowed: true,
  source_derived_taxonomy_preserved: true,
  broad_and_subregion_labels_may_coexist: true,
  region_count_required: true,
  region_navigation_required: true,
  url_parameter: 'region',
  url_state_restoration_required: true,
  active_region_marker_required: true,
  combined_country_filters_preserved: true,
  no_javascript_complete_list_required: true,
})) fail('region behavior contract differs');
if (!exact(contract.route_contract, {
  english_directory: '/countries/',
  japanese_directory: '/ja/countries/',
  english_region_pattern: '/countries/?region={region}',
  japanese_region_pattern: '/ja/countries/?region={region}',
})) fail('region route contract differs');
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = ['public_region_labels_allowed', 'public_region_counts_allowed', 'public_country_links_allowed'].includes(key);
  if (value !== expected) fail(`region public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('region privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('region automation boundary differs');
if (contract.previous_implementation_unit !== 'RACE-TYPE-FILTERS-01') fail('previous region unit differs');
if (contract.next_implementation_unit !== 'SOURCE-STATUS-FILTERS-01') fail('next region unit differs');

if (audit.schema_version !== 'region-filters-audit-v1') fail('region filter audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('region audit identity differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('region audit status differs');
if (!exact(audit.verified, {
  country_records: 98,
  english_rendered_records: 98,
  japanese_rendered_records: 98,
  region_facets: 19,
  english_region_navigation_links: 19,
  japanese_region_navigation_links: 19,
  countries_without_region_membership: 0,
  unknown_region_ids: 0,
  duplicate_region_memberships: 0,
  region_option_set_mismatches: 0,
  region_navigation_set_mismatches: 0,
  region_count_mismatches: 0,
  broken_region_links: 0,
  no_javascript_missing_records: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('region audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('region audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('region audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('region audit roadmap differs');

const dataSource = read(dataPath);
for (const marker of [
  'splitCountryRegions', "value.split('/')", 'regions: string[]',
  'CountryRegionOption', 'regionCounts', 'record.regions',
]) if (!dataSource.includes(marker)) fail(`region data projection missing ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (dataSource.includes(forbidden)) fail(`region data projection contains forbidden marker ${forbidden}`);
}

const component = read(componentPath);
for (const marker of [
  'data-region-filter-navigation', 'data-region-filter-card', 'data-region-id',
  'data-region-count', 'data-region-filter-link', 'data-region-filter-id',
  'data-country-regions', 'encodeURIComponent(region.id)',
  "regions.includes(region)", "link.setAttribute('aria-current', 'page')",
  "restoreSelect(regionSelect, 'region')", "'Central America': '中央アメリカ'",
  "'West Asia': '西アジア'", '<noscript>',
]) if (!component.includes(marker)) fail(`region component missing ${marker}`);
for (const forbidden of ['fetch(', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (component.includes(forbidden)) fail(`region component contains forbidden marker ${forbidden}`);
}

const doc = read(docPath);
for (const marker of [
  'REGION-FILTERS-01', 'Nineteen source-derived facets', 'Central America', 'West Asia',
  '/countries/?region=Asia', '/ja/countries/?region=Asia', 'aria-current="page"',
  'JavaScript is disabled', '38 bilingual region links', 'SOURCE-STATUS-FILTERS-01',
]) if (!doc.includes(marker)) fail(`region documentation missing ${marker}`);

if (fs.existsSync(filePath(workflowPath))) {
  const workflow = read(workflowPath);
  for (const marker of [
    'npm install --package-lock=false', 'npm run build',
    'node scripts/check-glossary-qa-release.mjs',
    'node scripts/check-global-search-foundation.mjs',
    'node scripts/check-country-filters.mjs',
    'node scripts/check-race-type-filters.mjs',
    'node scripts/check-region-filters.mjs',
    'git status --porcelain',
  ]) if (!workflow.includes(marker)) fail(`region workflow missing ${marker}`);
  for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
    if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`region workflow contains forbidden marker ${forbidden}`);
  }
}

function optionValues(html, selectId) {
  const match = html.match(new RegExp(`<select[^>]*id="${selectId}"[^>]*>([\\s\\S]*?)<\\/select>`));
  if (!match) return null;
  return [...match[1].matchAll(/<option value="([^"]*)"/g)].map((option) => option[1]).filter((value) => value !== 'all');
}

function verifyRenderedRegions({ file, lang, directoryPath }) {
  if (!fs.existsSync(filePath(file))) {
    fail(`rendered region directory missing: ${file}`);
    return;
  }

  const html = read(file);
  const countryCards = [...html.matchAll(/<article[^>]*data-country-record(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  const regionCards = [...html.matchAll(/<article[^>]*data-region-filter-card(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  if (countryCards.length !== 98) fail(`${file}: country card count differs ${countryCards.length}`);
  if (regionCards.length !== 19) fail(`${file}: region navigation card count differs ${regionCards.length}`);

  const membershipCounts = new Map(expectedRegionIds.map((id) => [id, 0]));
  let countriesWithoutMembership = 0;
  let duplicateMemberships = 0;
  let unknownRegionIds = 0;
  for (const card of countryCards) {
    const group = attributeValues(card, 'data-country-regions')[0] ?? '';
    const memberships = group.split('|').filter(Boolean);
    if (!memberships.length) countriesWithoutMembership += 1;
    if (new Set(memberships).size !== memberships.length) duplicateMemberships += 1;
    for (const region of memberships) {
      if (!membershipCounts.has(region)) unknownRegionIds += 1;
      else membershipCounts.set(region, membershipCounts.get(region) + 1);
    }
  }
  if (countriesWithoutMembership !== 0) fail(`${file}: countries without region membership ${countriesWithoutMembership}`);
  if (duplicateMemberships !== 0) fail(`${file}: duplicate region memberships ${duplicateMemberships}`);
  if (unknownRegionIds !== 0) fail(`${file}: unknown region IDs ${unknownRegionIds}`);

  const measuredCounts = Object.fromEntries(expectedRegionIds.map((id) => [id, membershipCounts.get(id)]));
  if (!exact(measuredCounts, expectedRegionCounts)) fail(`${file}: measured region counts differ ${JSON.stringify(measuredCounts)}`);

  const optionIds = optionValues(html, 'country-filter-region');
  if (!optionIds || !sameSet(optionIds, expectedRegionIds)) fail(`${file}: region option set differs`);

  const navIds = [];
  let countMismatches = 0;
  let brokenRegionLinks = 0;
  for (const card of regionCards) {
    const id = attributeValues(card, 'data-region-id')[0];
    const count = Number(attributeValues(card, 'data-region-count')[0]);
    const href = card.match(/data-region-filter-link[^>]*href="([^"]+)"|href="([^"]+)"[^>]*data-region-filter-link/)?.slice(1).find(Boolean);
    if (id) navIds.push(id);
    if (!id || count !== membershipCounts.get(id) || count !== expectedRegionCounts[id]) countMismatches += 1;
    const expectedHref = `${directoryPath}?region=${encodeURIComponent(id ?? '')}`;
    if (href !== expectedHref) brokenRegionLinks += 1;
  }
  if (!sameSet(navIds, expectedRegionIds)) fail(`${file}: region navigation set differs`);
  if (countMismatches !== 0) fail(`${file}: region count mismatches ${countMismatches}`);
  if (brokenRegionLinks !== 0) fail(`${file}: broken region links ${brokenRegionLinks}`);

  for (const marker of [
    'data-country-records="98"', 'data-country-regions="19"',
    'data-region-filter-navigation', 'data-region-filter-link',
    'data-country-filter-region', '<noscript>',
  ]) if (!html.includes(marker)) fail(`${file}: rendered region marker missing ${marker}`);
  if (!html.includes(`<html lang="${lang}"`)) fail(`${file}: rendered locale differs`);
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
verifyRenderedRegions({ file: 'dist/countries/index.html', lang: 'en', directoryPath: '/countries/' });
verifyRenderedRegions({ file: 'dist/ja/countries/index.html', lang: 'ja', directoryPath: '/ja/countries/' });

if (errors.length) {
  console.error(`REGION_FILTERS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('REGION_FILTERS: pass');
console.log('COUNTRY_RECORDS: 98');
console.log('REGION_FACETS: 19');
console.log('REGION_NAVIGATION_LINKS: 38');
console.log('MULTIPLE_REGION_MEMBERSHIPS: supported');
console.log('NO_JAVASCRIPT_FALLBACK: complete');
console.log('EXTERNAL_FILTER_SERVICE: false');
console.log('QUERY_LOGGING: false');
console.log('NEXT_IMPLEMENTATION_UNIT: SOURCE-STATUS-FILTERS-01');
