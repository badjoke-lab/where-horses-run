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

const contractPath = 'data/static/glossary-search-improvement-contract-v1.json';
const auditPath = 'data/audits/glossary-search-improvement-v1.json';
const dataPath = 'src/lib/glossary-search-data.ts';
const componentPath = 'src/components/GlossaryDirectoryPage.astro';
const englishPagePath = 'src/pages/glossary/index.astro';
const japanesePagePath = 'src/pages/ja/glossary/index.astro';
const docPath = 'docs/search/glossary-search-improvement.md';
const workflowPath = '.github/workflows/glossary-search-improvement.yml';

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
const expectedCategoryCounts = {
  race_type: 10,
  breed: 4,
  horse_type: 1,
  role: 8,
  data_term: 8,
  official_source: 5,
  governance_term: 3,
  track_term: 5,
  surface: 4,
};
const expectedCategoryIds = Object.keys(expectedCategoryCounts);
const expectedSearchFields = [
  'id',
  'slug',
  'term_en',
  'term_ja',
  'summary_en',
  'summary_ja',
  'aliases_en',
  'aliases_ja',
  'reading_ja',
  'pronunciation_en',
  'beginner_explanation_en',
  'beginner_explanation_ja',
  'category_id',
  'category_label_en',
  'category_label_ja',
];

if (contract.schema_version !== 'glossary-search-improvement-contract-v1') fail('glossary search contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('glossary search Work ID differs');
if (contract.implementation_unit !== 'GLOSSARY-SEARCH-IMPROVEMENT-01') fail('glossary search implementation unit differs');
if (contract.status !== 'complete') fail('glossary search contract status differs');
if (contract.reviewed_at !== '2026-07-17') fail('glossary search review date differs');
if (!exact(contract.scope, {
  glossary_concepts: 48,
  categories: 9,
  locales: 2,
  directory_routes: 2,
  bilingual_detail_routes: 96,
  relationship_edges: 57,
  filter_controls: 2,
  url_parameters: 2,
  category_navigation_links: 18,
  no_javascript_fallback_records_per_locale: 48,
})) fail('glossary search scope differs');
if (!exact(contract.category_counts, expectedCategoryCounts)) fail('glossary search category counts differ');
if (!exact(contract.search_contract, {
  keyword_parameter: 'q',
  category_parameter: 'category',
  unicode_normalization: 'NFKC',
  case_insensitive: true,
  whitespace_normalized: true,
  searched_fields: expectedSearchFields,
  combined_keyword_and_category_required: true,
  url_state_restoration_required: true,
  live_result_count_required: true,
  zero_result_state_required: true,
  clear_filters_required: true,
  category_navigation_required: true,
  active_category_marker_required: true,
  no_javascript_complete_list_required: true,
})) fail('glossary search behavior contract differs');
if (!exact(contract.route_contract, {
  english_directory: '/glossary/',
  japanese_directory: '/ja/glossary/',
  english_detail_pattern: '/glossary/{slug}/',
  japanese_detail_pattern: '/ja/glossary/{slug}/',
  english_category_pattern: '/glossary/?category={category}',
  japanese_category_pattern: '/ja/glossary/?category={category}',
})) fail('glossary search route contract differs');
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = [
    'definition_and_navigation_allowed',
    'localized_terms_and_explanations_allowed',
    'aggregate_category_counts_allowed',
  ].includes(key);
  if (value !== expected) fail(`glossary search public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('glossary search privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('glossary search automation boundary differs');
if (contract.previous_implementation_unit !== 'SOURCE-STATUS-FILTERS-01') fail('previous glossary search unit differs');
if (contract.next_implementation_unit !== 'MOBILE-NAVIGATION-IMPROVEMENT-01') fail('next glossary search unit differs');

if (audit.schema_version !== 'glossary-search-improvement-audit-v1') fail('glossary search audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('glossary search audit identity differs');
if (audit.status !== 'complete') fail('glossary search audit status differs');
if (!exact(audit.verified, {
  glossary_concepts: 48,
  english_rendered_records: 48,
  japanese_rendered_records: 48,
  categories: 9,
  english_category_navigation_links: 9,
  japanese_category_navigation_links: 9,
  bilingual_detail_routes: 96,
  relationship_edges: 57,
  filter_controls: 2,
  url_parameters: 2,
  duplicate_concept_ids: 0,
  missing_search_text: 0,
  missing_filter_attributes: 0,
  unknown_category_options: 0,
  category_count_mismatches: 0,
  broken_category_links: 0,
  broken_detail_links: 0,
  no_javascript_missing_records: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('glossary search audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('glossary search audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('glossary search audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('glossary search audit roadmap differs');

const dataSource = read(dataPath);
for (const marker of [
  'GlossarySearchRecord',
  'GlossaryCategoryOption',
  'normalizeGlossarySearchText',
  "normalize('NFKC')",
  'entry.term_en',
  'entry.term_ja',
  'entry.summary_en',
  'entry.summary_ja',
  '...aliasesEn',
  '...aliasesJa',
  'entry.reading_ja',
  'entry.pronunciation_en',
  'entry.beginner_explanation_en',
  'entry.beginner_explanation_ja',
  "getGlossaryCategoryLabel(entry.category, 'en')",
  "getGlossaryCategoryLabel(entry.category, 'ja')",
  'getGlossarySearchRecords',
  'getGlossaryCategoryOptions',
]) if (!dataSource.includes(marker)) fail(`glossary search data projection missing ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (dataSource.includes(forbidden)) fail(`glossary search data projection contains forbidden marker ${forbidden}`);
}

const component = read(componentPath);
for (const marker of [
  'data-glossary-directory',
  'data-glossary-filter-form',
  'data-glossary-filter-query',
  'data-glossary-filter-category',
  'data-glossary-filter-reset',
  'data-glossary-filter-count',
  'data-glossary-filter-empty',
  'data-glossary-category-navigation',
  'data-glossary-category-card',
  'data-glossary-category-link',
  'data-glossary-record',
  'data-glossary-search-text',
  "params.get('q')",
  "params.get('category')",
  "link.setAttribute('aria-current', 'page')",
  'window.history.replaceState',
  '<noscript>',
]) if (!component.includes(marker)) fail(`glossary search component missing ${marker}`);
for (const forbidden of ['fetch(', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (component.includes(forbidden)) fail(`glossary search component contains forbidden marker ${forbidden}`);
}

for (const [pagePath, locale] of [[englishPagePath, 'en'], [japanesePagePath, 'ja']]) {
  const page = read(pagePath);
  for (const marker of ['GlossaryDirectoryPage', 'getGlossaryCategoryOptions', 'getGlossarySearchRecords', `locale="${locale}"`]) {
    if (!page.includes(marker)) fail(`${pagePath}: glossary directory page missing ${marker}`);
  }
}

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-SEARCH-IMPROVEMENT-01',
  '48 concepts',
  'nine categories',
  '96 bilingual detail routes',
  'Unicode NFKC',
  'reading_ja',
  '/glossary/?category=role',
  '/ja/glossary/?category=role',
  'JavaScript is disabled',
  'scripts/check-glossary-search-improvement.mjs',
  '.github/workflows/glossary-search-improvement.yml',
  'MOBILE-NAVIGATION-IMPROVEMENT-01',
]) if (!doc.includes(marker)) fail(`glossary search documentation missing ${marker}`);

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
  'node scripts/check-glossary-search-improvement.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`glossary search workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`glossary search workflow contains forbidden marker ${forbidden}`);
}

function optionValues(html, selectId) {
  const match = html.match(new RegExp(`<select[^>]*id="${selectId}"[^>]*>([\\s\\S]*?)<\\/select>`));
  if (!match) return null;
  return [...match[1].matchAll(/<option value="([^"]*)"/g)].map((option) => option[1]).filter((value) => value !== 'all');
}

function verifyRenderedDirectory({ file, lang, basePath }) {
  if (!fs.existsSync(filePath(file))) {
    fail(`rendered glossary directory missing: ${file}`);
    return;
  }

  const html = read(file);
  const cards = [...html.matchAll(/<article[^>]*data-glossary-record(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  const categoryCards = [...html.matchAll(/<article[^>]*data-glossary-category-card(?=[\s>])[\s\S]*?<\/article>/g)].map((match) => match[0]);
  if (cards.length !== 48) fail(`${file}: glossary card count differs ${cards.length}`);
  if (categoryCards.length !== 9) fail(`${file}: category card count differs ${categoryCards.length}`);

  const ids = [];
  const categories = [];
  const detailHrefs = [];
  let missingSearchText = 0;
  let missingFilterAttributes = 0;
  let brokenDetailLinks = 0;

  for (const card of cards) {
    const id = attributeValue(card, 'data-glossary-id');
    const category = attributeValue(card, 'data-glossary-category');
    const searchText = attributeValue(card, 'data-glossary-search-text');
    if ([id, category, searchText].some((value) => value === null)) missingFilterAttributes += 1;
    if (!searchText) missingSearchText += 1;
    if (id) ids.push(id);
    if (category) categories.push(category);
    const href = attributeValues(card, 'href').find((value) => value.startsWith(basePath));
    if (!href || href === basePath || !href.endsWith('/')) brokenDetailLinks += 1;
    else detailHrefs.push(href);
  }

  const duplicateIds = ids.length - new Set(ids).size;
  if (duplicateIds !== 0) fail(`${file}: duplicate glossary IDs ${duplicateIds}`);
  if (missingSearchText !== 0) fail(`${file}: missing search text ${missingSearchText}`);
  if (missingFilterAttributes !== 0) fail(`${file}: missing filter attributes ${missingFilterAttributes}`);
  if (brokenDetailLinks !== 0) fail(`${file}: broken detail links ${brokenDetailLinks}`);
  if (!sameSet(categories, expectedCategoryIds)) fail(`${file}: rendered category set differs`);

  const measuredCounts = Object.fromEntries(expectedCategoryIds.map((id) => [id, categories.filter((value) => value === id).length]));
  if (!exact(measuredCounts, expectedCategoryCounts)) fail(`${file}: rendered category counts differ ${JSON.stringify(measuredCounts)}`);

  const options = optionValues(html, 'glossary-filter-category');
  if (!options || !sameSet(options, expectedCategoryIds)) fail(`${file}: category option values differ`);

  const navigationIds = [];
  let categoryCountMismatches = 0;
  let brokenCategoryLinks = 0;
  for (const card of categoryCards) {
    const id = attributeValue(card, 'data-glossary-category-id');
    const count = Number(attributeValue(card, 'data-glossary-category-count'));
    const href = attributeValues(card, 'href').find((value) => value.startsWith(basePath));
    if (id) navigationIds.push(id);
    if (!id || count !== expectedCategoryCounts[id]) categoryCountMismatches += 1;
    const expectedHref = `${basePath}?category=${encodeURIComponent(id ?? '')}`;
    if (href !== expectedHref) brokenCategoryLinks += 1;
  }
  if (!sameSet(navigationIds, expectedCategoryIds)) fail(`${file}: category navigation set differs`);
  if (categoryCountMismatches !== 0) fail(`${file}: category count mismatches ${categoryCountMismatches}`);
  if (brokenCategoryLinks !== 0) fail(`${file}: broken category links ${brokenCategoryLinks}`);

  const uniqueDetailHrefs = uniqueSorted(detailHrefs);
  if (uniqueDetailHrefs.length !== 48) fail(`${file}: unique glossary detail links differ ${uniqueDetailHrefs.length}`);
  for (const href of uniqueDetailHrefs) {
    const renderedPath = path.join('dist', href.replace(/^\//, ''), 'index.html');
    if (!fs.existsSync(filePath(renderedPath))) fail(`${file}: rendered glossary detail route missing ${href}`);
  }

  for (const marker of [
    'data-glossary-records="48"',
    'data-glossary-categories="9"',
    'data-glossary-concepts="48"',
    'data-glossary-relationships="57"',
    'data-glossary-filter-form',
    'data-glossary-filter-count',
    'data-glossary-filter-empty',
    'data-glossary-category-navigation',
    '<noscript>',
  ]) if (!html.includes(marker)) fail(`${file}: rendered glossary marker missing ${marker}`);
  if (!html.includes(`<html lang="${lang}"`)) fail(`${file}: rendered locale differs`);
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
verifyRenderedDirectory({ file: 'dist/glossary/index.html', lang: 'en', basePath: '/glossary/' });
verifyRenderedDirectory({ file: 'dist/ja/glossary/index.html', lang: 'ja', basePath: '/ja/glossary/' });

if (errors.length) {
  console.error(`GLOSSARY_SEARCH_IMPROVEMENT: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('GLOSSARY_SEARCH_IMPROVEMENT: pass');
console.log('GLOSSARY_CONCEPTS: 48');
console.log('CATEGORIES: 9');
console.log('BILINGUAL_DETAIL_ROUTES: 96');
console.log('CATEGORY_NAVIGATION_LINKS: 18');
console.log('FILTER_CONTROLS: 2');
