import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const contractPath = 'data/static/no-js-fallback-review-contract-v1.json';
const auditPath = 'data/audits/no-js-fallback-review-v1.json';
const layoutPath = 'src/layouts/BaseLayout.astro';
const docPath = 'docs/search/no-js-fallback-review.md';
const workflowPath = '.github/workflows/no-js-fallback-review.yml';

for (const requiredPath of [contractPath, auditPath, layoutPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const surfaces = [
  {
    id: 'global_search',
    englishRoute: '/search/',
    japaneseRoute: '/ja/search/',
    count: 182,
    recordMarker: 'data-search-record',
    formMarker: 'data-search-form',
    countMarker: 'data-search-count',
    resultsMarker: 'data-search-results',
    emptyMarker: 'data-search-empty',
  },
  {
    id: 'country_directory',
    englishRoute: '/countries/',
    japaneseRoute: '/ja/countries/',
    count: 98,
    recordMarker: 'data-country-record',
    formMarker: 'data-country-filter-form',
    countMarker: 'data-country-filter-count',
    resultsMarker: 'data-country-filter-results',
    emptyMarker: 'data-country-filter-empty',
  },
  {
    id: 'racecourse_directory',
    englishRoute: '/tracks/',
    japaneseRoute: '/ja/tracks/',
    count: 36,
    recordMarker: 'data-racecourse-record',
    formMarker: 'data-racecourse-filter-form',
    countMarker: 'data-racecourse-filter-count',
    resultsMarker: 'data-racecourse-filter-results',
    emptyMarker: 'data-racecourse-filter-empty',
  },
  {
    id: 'source_directory',
    englishRoute: '/sources/',
    japaneseRoute: '/ja/sources/',
    count: 171,
    recordMarker: 'data-source-record',
    formMarker: 'data-source-filter-form',
    countMarker: 'data-source-filter-count',
    resultsMarker: 'data-source-filter-results',
    emptyMarker: 'data-source-filter-empty',
  },
  {
    id: 'glossary_directory',
    englishRoute: '/glossary/',
    japaneseRoute: '/ja/glossary/',
    count: 48,
    recordMarker: 'data-glossary-record',
    formMarker: 'data-glossary-filter-form',
    countMarker: 'data-glossary-filter-count',
    resultsMarker: 'data-glossary-filter-results',
    emptyMarker: 'data-glossary-filter-empty',
  },
];
const hiddenSelectors = [
  '[data-search-form]',
  '[data-country-filter-form]',
  '[data-racecourse-filter-form]',
  '[data-source-filter-form]',
  '[data-glossary-filter-form]',
  '[data-search-count]',
  '[data-country-filter-count]',
  '[data-racecourse-filter-count]',
  '[data-source-filter-count]',
  '[data-glossary-filter-count]',
  '[data-region-filter-navigation]',
  '[data-glossary-category-navigation]',
];
const expectedSurfaceContracts = surfaces.map((surface) => ({
  id: surface.id,
  english_route: surface.englishRoute,
  japanese_route: surface.japaneseRoute,
  records_per_locale: surface.count,
  record_marker: surface.recordMarker,
  form_marker: surface.formMarker,
  count_marker: surface.countMarker,
}));

if (contract.schema_version !== 'no-js-fallback-review-contract-v1') fail('no-JavaScript fallback contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('no-JavaScript fallback Work ID differs');
if (contract.implementation_unit !== 'NO-JS-FALLBACK-REVIEW-01') fail('no-JavaScript fallback implementation unit differs');
if (contract.status !== 'complete') fail('no-JavaScript fallback contract status differs');
if (contract.reviewed_at !== '2026-07-17') fail('no-JavaScript fallback review date differs');
if (!exact(contract.scope, {
  locales: 2,
  discovery_surfaces: 5,
  reviewed_routes: 10,
  record_cards_per_locale: 535,
  record_cards_total: 1070,
  inert_forms_hidden: 10,
  live_counts_hidden: 10,
  query_only_navigation_sections_hidden: 4,
  fallback_messages: 10,
  native_mobile_menus: 10,
})) fail('no-JavaScript fallback scope differs');
if (!exact(contract.surface_contracts, expectedSurfaceContracts)) fail('no-JavaScript surface contracts differ');
if (!exact(contract.fallback_contract, {
  shared_noscript_style_required: true,
  inert_forms_must_be_hidden: true,
  live_counts_must_be_hidden: true,
  query_only_navigation_must_be_hidden: true,
  complete_record_lists_must_remain_visible: true,
  record_links_must_remain_available: true,
  empty_states_must_remain_hidden: true,
  localized_fallback_message_required: true,
  native_mobile_navigation_must_remain_available: true,
  skip_link_must_remain_available: true,
  javascript_required_for_fallback: false,
  server_filter_endpoint_required: false,
})) fail('no-JavaScript fallback behavior contract differs');
if (!exact(contract.hidden_selectors, hiddenSelectors)) fail('no-JavaScript hidden selectors differ');
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('no-JavaScript fallback privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('no-JavaScript fallback automation boundary differs');
if (contract.previous_implementation_unit !== 'DESKTOP-LAYOUT-IMPROVEMENT-01') fail('previous no-JavaScript unit differs');
if (contract.next_implementation_unit !== 'UX-POLISH-RELEASE-01') fail('next no-JavaScript unit differs');

if (audit.schema_version !== 'no-js-fallback-review-audit-v1') fail('no-JavaScript fallback audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('no-JavaScript fallback audit identity differs');
if (audit.status !== 'complete') fail('no-JavaScript fallback audit status differs');
if (!exact(audit.verified, {
  locales: 2,
  discovery_surfaces: 5,
  reviewed_routes: 10,
  record_cards_total: 1070,
  missing_record_cards: 0,
  record_cards_hidden_initially: 0,
  record_cards_without_primary_links: 0,
  missing_fallback_messages: 0,
  missing_noscript_styles: 0,
  missing_hidden_form_selectors: 0,
  missing_hidden_count_selectors: 0,
  missing_hidden_query_navigation_selectors: 0,
  visible_inert_controls_without_javascript: 0,
  visible_query_only_navigation_without_javascript: 0,
  empty_states_without_hidden_attribute: 0,
  missing_native_mobile_menus: 0,
  mobile_menus_open_by_default: 0,
  missing_skip_links: 0,
  server_filter_endpoints: 0,
  cookie_or_storage_dependencies: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('no-JavaScript fallback audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('no-JavaScript fallback audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('no-JavaScript fallback audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('no-JavaScript fallback audit roadmap differs');

const layout = read(layoutPath);
for (const marker of [
  '<noscript>',
  '<style data-no-js-fallback-style>',
  'data-no-js-fallback="complete-list-v1"',
  'display: none !important',
  'data-mobile-navigation="details-summary-v1"',
  '<details class="site-navigation">',
  '<summary class="site-navigation__summary">',
  'class="skip-link"',
  'href="#main-content"',
]) if (!layout.includes(marker)) fail(`no-JavaScript shared layout missing ${marker}`);
for (const selector of hiddenSelectors) if (!layout.includes(selector)) fail(`no-JavaScript shared style missing selector ${selector}`);
for (const forbiddenSelector of [
  '[data-search-record]',
  '[data-country-record]',
  '[data-racecourse-record]',
  '[data-source-record]',
  '[data-glossary-record]',
  '[data-search-results]',
  '[data-country-filter-results]',
  '[data-racecourse-filter-results]',
  '[data-source-filter-results]',
  '[data-glossary-filter-results]',
]) {
  const styleMatch = layout.match(/<style data-no-js-fallback-style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  if (styleMatch.includes(forbiddenSelector)) fail(`no-JavaScript style hides content selector ${forbiddenSelector}`);
}
for (const forbidden of ['localStorage', 'sessionStorage', 'document.cookie', 'sendBeacon', 'fetch(']) {
  if (layout.includes(forbidden)) fail(`no-JavaScript shared layout contains forbidden dependency ${forbidden}`);
}

const doc = read(docPath);
for (const marker of [
  'NO-JS-FALLBACK-REVIEW-01',
  'ten routes',
  'Bilingual total: 1,070',
  'data-no-js-fallback-style',
  'data-no-js-fallback="complete-list-v1"',
  'five client-side form types',
  'five live-result count types',
  'all 182 global-search records',
  'all 98 country and region records',
  'all 36 racecourse records',
  'all 171 source records',
  'all 48 glossary records',
  'scripts/check-no-js-fallback-review.mjs',
  '.github/workflows/no-js-fallback-review.yml',
  'UX-POLISH-RELEASE-01',
]) if (!doc.includes(marker)) fail(`no-JavaScript documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-global-search-foundation.mjs',
  'node scripts/check-country-filters.mjs',
  'node scripts/check-race-type-filters.mjs',
  'node scripts/check-region-filters.mjs',
  'node scripts/check-source-status-filters.mjs',
  'node scripts/check-glossary-search-improvement.mjs',
  'node scripts/check-mobile-navigation-improvement.mjs',
  'node scripts/check-desktop-layout-improvement.mjs',
  'node scripts/check-no-js-fallback-review.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`no-JavaScript workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`no-JavaScript workflow contains forbidden marker ${forbidden}`);
}

function renderedFile(route) {
  return path.join('dist', route.replace(/^\//, ''), 'index.html');
}

function extractRecordCards(html, marker) {
  return [...html.matchAll(new RegExp(`<article[^>]*${marker}(?=[\\s>])[^>]*>[\\s\\S]*?<\\/article>`, 'g'))].map((match) => match[0]);
}

function verifyRoute({ route, surface, locale }) {
  const file = renderedFile(route);
  if (!fs.existsSync(filePath(file))) {
    fail(`${route}: rendered route missing`);
    return 0;
  }
  const html = read(file);
  if (!html.includes(`data-no-js-fallback="complete-list-v1"`)) fail(`${route}: no-JavaScript body marker missing`);
  const noscriptStyle = html.match(/<noscript>\s*<style data-no-js-fallback-style>([\s\S]*?)<\/style>\s*<\/noscript>/)?.[1];
  if (!noscriptStyle) fail(`${route}: shared no-JavaScript style missing`);
  else {
    for (const selector of hiddenSelectors) if (!noscriptStyle.includes(selector)) fail(`${route}: no-JavaScript selector missing ${selector}`);
    if (!noscriptStyle.includes('display: none !important')) fail(`${route}: no-JavaScript hide declaration missing`);
  }
  if (!html.includes(surface.formMarker)) fail(`${route}: client-side form marker missing`);
  if (!html.includes(surface.countMarker)) fail(`${route}: live-count marker missing`);
  if (!html.includes(surface.resultsMarker)) fail(`${route}: result container marker missing`);
  const formTag = html.match(new RegExp(`<form[^>]*${surface.formMarker}(?=[\\s>])[^>]*>`))?.[0];
  if (!formTag) fail(`${route}: client-side form missing`);
  else if (/\saction=|\smethod=/.test(formTag)) fail(`${route}: fallback form implies a server endpoint`);
  const messages = [...html.matchAll(/<noscript>\s*<p>([\s\S]*?)<\/p>\s*<\/noscript>/g)];
  if (!messages.length) fail(`${route}: localized fallback message missing`);
  else {
    const message = messages.map((match) => match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()).join(' ');
    if (locale === 'en' && !/JavaScript disabled|JavaScript is disabled|With JavaScript disabled/.test(message)) fail(`${route}: English fallback explanation differs`);
    if (locale === 'ja' && !message.includes('JavaScript')) fail(`${route}: Japanese fallback explanation differs`);
  }
  const cards = extractRecordCards(html, surface.recordMarker);
  if (cards.length !== surface.count) fail(`${route}: record count differs ${cards.length}`);
  let hiddenCards = 0;
  let cardsWithoutLinks = 0;
  for (const card of cards) {
    const openingTag = card.match(/^<article[^>]*>/)?.[0] ?? '';
    if (/\shidden(?:\s|=|>)/.test(openingTag)) hiddenCards += 1;
    if (!/<a\s+[^>]*href="[^"]+"/.test(card)) cardsWithoutLinks += 1;
  }
  if (hiddenCards) fail(`${route}: record cards hidden initially ${hiddenCards}`);
  if (cardsWithoutLinks) fail(`${route}: record cards without primary links ${cardsWithoutLinks}`);
  const emptyTag = html.match(new RegExp(`<section[^>]*${surface.emptyMarker}(?=[\\s>])[^>]*>`))?.[0];
  if (!emptyTag || !/\shidden(?:\s|=|>)/.test(emptyTag)) fail(`${route}: empty state is not hidden initially`);
  const detailsTag = html.match(/<details[^>]*class="site-navigation"[^>]*>/)?.[0];
  if (!detailsTag) fail(`${route}: native mobile menu missing`);
  else if (/\sopen(?:\s|=|>)/.test(detailsTag)) fail(`${route}: native mobile menu is open initially`);
  if (!html.includes('class="skip-link"') || !html.includes('href="#main-content"')) fail(`${route}: skip link missing`);
  const expectedLang = locale === 'ja' ? 'ja' : 'en';
  if (!html.includes(`<html lang="${expectedLang}"`)) fail(`${route}: locale differs`);
  return cards.length;
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
let totalCards = 0;
for (const surface of surfaces) {
  totalCards += verifyRoute({ route: surface.englishRoute, surface, locale: 'en' });
  totalCards += verifyRoute({ route: surface.japaneseRoute, surface, locale: 'ja' });
}
if (totalCards !== 1070) fail(`bilingual fallback record total differs ${totalCards}`);

const countryHtml = fs.existsSync(filePath('dist/countries/index.html')) ? read('dist/countries/index.html') : '';
const glossaryHtml = fs.existsSync(filePath('dist/glossary/index.html')) ? read('dist/glossary/index.html') : '';
if (!countryHtml.includes('data-region-filter-navigation')) fail('country query-only navigation source marker missing');
if (!glossaryHtml.includes('data-glossary-category-navigation')) fail('glossary query-only navigation source marker missing');

if (errors.length) {
  console.error(`NO_JS_FALLBACK_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('NO_JS_FALLBACK_REVIEW: pass');
console.log('DISCOVERY_SURFACES: 5');
console.log('REVIEWED_ROUTES: 10');
console.log('RECORD_CARDS_TOTAL: 1070');
console.log('INERT_FORMS_HIDDEN: 10');
console.log('QUERY_ONLY_NAVIGATION_SECTIONS_HIDDEN: 4');
console.log('JAVASCRIPT_REQUIRED_FOR_FALLBACK: false');
