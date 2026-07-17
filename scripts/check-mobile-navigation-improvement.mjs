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
const stripTags = (value) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const attributeValue = (value, name) => value.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;

const contractPath = 'data/static/mobile-navigation-contract-v1.json';
const auditPath = 'data/audits/mobile-navigation-improvement-v1.json';
const layoutPath = 'src/layouts/BaseLayout.astro';
const stylePath = 'src/styles/mobile-navigation.css';
const docPath = 'docs/search/mobile-navigation-improvement.md';
const workflowPath = '.github/workflows/mobile-navigation-improvement.yml';

for (const requiredPath of [contractPath, auditPath, layoutPath, stylePath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const englishRoutes = [
  '/today/',
  '/calendar/',
  '/search/',
  '/countries/',
  '/tracks/',
  '/types/',
  '/glossary/',
  '/sources/',
];
const japaneseRoutes = englishRoutes.map((route) => `/ja${route}`);
const routeIds = ['today', 'calendar', 'search', 'countries', 'tracks', 'types', 'glossary', 'sources'];

if (contract.schema_version !== 'mobile-navigation-contract-v1') fail('mobile navigation contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('mobile navigation Work ID differs');
if (contract.implementation_unit !== 'MOBILE-NAVIGATION-IMPROVEMENT-01') fail('mobile navigation implementation unit differs');
if (contract.status !== 'complete') fail('mobile navigation contract status differs');
if (contract.reviewed_at !== '2026-07-17') fail('mobile navigation review date differs');
if (!exact(contract.scope, {
  locales: 2,
  primary_navigation_links_per_locale: 8,
  language_switch_links_per_locale: 1,
  total_navigation_links_per_locale: 9,
  menu_summaries: 2,
  mobile_breakpoint_px: 720,
  minimum_navigation_target_px: 44,
})) fail('mobile navigation scope differs');
if (!exact(contract.navigation_contract, {
  container_element: 'details',
  toggle_element: 'summary',
  list_element: 'ul',
  item_element: 'li',
  javascript_required: false,
  closed_by_default_on_mobile: true,
  visible_without_open_attribute_on_desktop: true,
  current_page_aria_marker_required: true,
  language_hreflang_required: true,
  skip_link_preserved: true,
  keyboard_focus_indicator_required: true,
  mobile_vertical_navigation_required: true,
  desktop_wrapped_navigation_preserved: true,
})) fail('mobile navigation behavior contract differs');
if (!exact(contract.primary_route_ids, routeIds)) fail('mobile navigation route IDs differ');
if (!exact(contract.english_routes, englishRoutes)) fail('English mobile navigation routes differ');
if (!exact(contract.japanese_routes, japaneseRoutes)) fail('Japanese mobile navigation routes differ');
if (!exact(contract.labels, {
  english_menu: 'Menu',
  japanese_menu: 'メニュー',
  english_language_switch: '日本語',
  japanese_language_switch: 'English',
})) fail('mobile navigation labels differ');
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('mobile navigation privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('mobile navigation automation boundary differs');
if (contract.previous_implementation_unit !== 'GLOSSARY-SEARCH-IMPROVEMENT-01') fail('previous mobile navigation unit differs');
if (contract.next_implementation_unit !== 'DESKTOP-LAYOUT-IMPROVEMENT-01') fail('next mobile navigation unit differs');

if (audit.schema_version !== 'mobile-navigation-improvement-audit-v1') fail('mobile navigation audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('mobile navigation audit identity differs');
if (audit.status !== 'complete') fail('mobile navigation audit status differs');
if (!exact(audit.verified, {
  locales: 2,
  primary_navigation_links_per_locale: 8,
  language_switch_links_per_locale: 1,
  total_navigation_links_per_locale: 9,
  duplicate_navigation_hrefs: 0,
  missing_navigation_hrefs: 0,
  missing_navigation_labels: 0,
  missing_language_hreflang: 0,
  missing_current_page_markers: 0,
  missing_menu_summaries: 0,
  missing_list_semantics: 0,
  javascript_dependencies: 0,
  cookie_or_storage_dependencies: 0,
  mobile_target_size_errors: 0,
  desktop_visibility_contract_errors: 0,
  skip_link_errors: 0,
  rendered_marker_errors: 0,
  contract_errors: 0,
})) fail('mobile navigation audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('mobile navigation audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('mobile navigation audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('mobile navigation audit roadmap differs');

const layout = read(layoutPath);
for (const marker of [
  "import '../styles/mobile-navigation.css'",
  'data-mobile-navigation="details-summary-v1"',
  'data-mobile-navigation-links="9"',
  '<details class="site-navigation">',
  '<summary class="site-navigation__summary">',
  '<nav class="site-nav"',
  '<ul class="site-nav__list">',
  'navigationItems.map',
  "aria-current={isCurrentNavigationItem(item.href) ? 'page' : undefined}",
  "hreflang={isJapanese ? 'en' : 'ja'}",
  'class="skip-link"',
  'href="#main-content"',
]) if (!layout.includes(marker)) fail(`mobile navigation layout missing ${marker}`);
if (/<details class="site-navigation"\s+open/.test(layout)) fail('mobile navigation details must not be open by default');
for (const forbidden of ['<script', 'addEventListener(', 'localStorage', 'sessionStorage', 'document.cookie', 'sendBeacon', 'fetch(']) {
  if (layout.includes(forbidden)) fail(`mobile navigation layout contains forbidden marker ${forbidden}`);
}

const style = read(stylePath);
for (const marker of [
  '.site-navigation__summary',
  'min-height: 2.75rem',
  '.site-navigation__summary:focus-visible',
  '.site-nav a:focus-visible',
  '@media (min-width: 721px)',
  '.site-navigation:not([open]) > .site-nav',
  'display: block',
  '@media (max-width: 720px)',
  '.site-navigation[open]',
  '.site-nav__list',
  'display: grid',
  'width: 100%',
]) if (!style.includes(marker)) fail(`mobile navigation stylesheet missing ${marker}`);
for (const forbidden of ['javascript:', 'url(http:', 'url(https:', 'behavior:']) {
  if (style.toLowerCase().includes(forbidden.toLowerCase())) fail(`mobile navigation stylesheet contains forbidden marker ${forbidden}`);
}

const doc = read(docPath);
for (const marker of [
  'MOBILE-NAVIGATION-IMPROVEMENT-01',
  'details',
  'summary',
  'nine links per locale',
  'minimum height of 44 pixels',
  'aria-current="page"',
  'hreflang',
  'No click listener',
  'scripts/check-mobile-navigation-improvement.mjs',
  '.github/workflows/mobile-navigation-improvement.yml',
  'DESKTOP-LAYOUT-IMPROVEMENT-01',
]) if (!doc.includes(marker)) fail(`mobile navigation documentation missing ${marker}`);

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
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`mobile navigation workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`mobile navigation workflow contains forbidden marker ${forbidden}`);
}

function extractAnchors(fragment) {
  return [...fragment.matchAll(/<a\s+([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({
    attributes: match[1],
    href: attributeValue(match[1], 'href'),
    hreflang: attributeValue(match[1], 'hreflang'),
    ariaCurrent: attributeValue(match[1], 'aria-current'),
    label: stripTags(match[2]),
  }));
}

function verifyRenderedNavigation({ file, lang, expectedRoutes, menuLabel, languageHref, languageLabel, languageCode, activeHref = null }) {
  if (!fs.existsSync(filePath(file))) {
    fail(`rendered navigation page missing: ${file}`);
    return;
  }
  const html = read(file);
  const headerMatch = html.match(/<header[^>]*data-mobile-navigation="details-summary-v1"[^>]*>[\s\S]*?<\/header>/);
  if (!headerMatch) {
    fail(`${file}: mobile navigation header missing`);
    return;
  }
  const header = headerMatch[0];
  if (attributeValue(header.match(/^<header[^>]*>/)?.[0] ?? '', 'data-mobile-navigation-links') !== '9') fail(`${file}: mobile navigation link marker differs`);
  const detailsOpen = header.match(/<details[^>]*class="site-navigation"[^>]*>/)?.[0];
  if (!detailsOpen) fail(`${file}: details container missing`);
  else if (/\sopen(?:\s|=|>)/.test(detailsOpen)) fail(`${file}: details container is open by default`);
  const summaryMatch = header.match(/<summary[^>]*class="site-navigation__summary"[^>]*>([\s\S]*?)<\/summary>/);
  if (!summaryMatch || stripTags(summaryMatch[1]) !== menuLabel) fail(`${file}: menu summary differs`);
  const navMatch = header.match(/<nav[^>]*class="site-nav"[^>]*>([\s\S]*?)<\/nav>/);
  if (!navMatch) {
    fail(`${file}: main navigation missing`);
    return;
  }
  const nav = navMatch[0];
  if (!nav.includes('<ul class="site-nav__list">')) fail(`${file}: navigation list missing`);
  const itemCount = (nav.match(/<li(?:\s|>)/g) ?? []).length;
  if (itemCount !== 9) fail(`${file}: navigation item count differs ${itemCount}`);
  const anchors = extractAnchors(nav);
  if (anchors.length !== 9) fail(`${file}: navigation link count differs ${anchors.length}`);
  const hrefs = anchors.map((anchor) => anchor.href).filter(Boolean);
  if (new Set(hrefs).size !== hrefs.length) fail(`${file}: duplicate navigation hrefs`);
  const primaryHrefs = hrefs.filter((href) => href !== languageHref);
  if (!exact(uniqueSorted(primaryHrefs), uniqueSorted(expectedRoutes))) fail(`${file}: primary navigation hrefs differ ${JSON.stringify(primaryHrefs)}`);
  const languageAnchor = anchors.find((anchor) => anchor.href === languageHref);
  if (!languageAnchor || languageAnchor.label !== languageLabel || languageAnchor.hreflang !== languageCode) fail(`${file}: language switch differs`);
  if (anchors.some((anchor) => !anchor.href || !anchor.label)) fail(`${file}: empty navigation href or label`);
  if (activeHref) {
    const activeAnchor = anchors.find((anchor) => anchor.href === activeHref);
    if (!activeAnchor || activeAnchor.ariaCurrent !== 'page') fail(`${file}: current-page marker missing for ${activeHref}`);
    if (anchors.filter((anchor) => anchor.ariaCurrent === 'page').length !== 1) fail(`${file}: current-page marker count differs`);
  }
  if (!html.includes(`<html lang="${lang}"`)) fail(`${file}: rendered language differs`);
  const skipIndex = html.indexOf('class="skip-link"');
  const shellIndex = html.indexOf('class="site-shell"');
  if (skipIndex < 0 || shellIndex < 0 || skipIndex > shellIndex || !html.includes('href="#main-content"')) fail(`${file}: skip link differs`);
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
verifyRenderedNavigation({
  file: 'dist/index.html',
  lang: 'en',
  expectedRoutes: englishRoutes,
  menuLabel: 'Menu',
  languageHref: '/ja/',
  languageLabel: '日本語',
  languageCode: 'ja',
});
verifyRenderedNavigation({
  file: 'dist/ja/index.html',
  lang: 'ja',
  expectedRoutes: japaneseRoutes,
  menuLabel: 'メニュー',
  languageHref: '/',
  languageLabel: 'English',
  languageCode: 'en',
});

for (let index = 0; index < englishRoutes.length; index += 1) {
  const englishRoute = englishRoutes[index];
  const japaneseRoute = japaneseRoutes[index];
  verifyRenderedNavigation({
    file: path.join('dist', englishRoute.replace(/^\//, ''), 'index.html'),
    lang: 'en',
    expectedRoutes: englishRoutes,
    menuLabel: 'Menu',
    languageHref: japaneseRoute,
    languageLabel: '日本語',
    languageCode: 'ja',
    activeHref: englishRoute,
  });
  verifyRenderedNavigation({
    file: path.join('dist', japaneseRoute.replace(/^\//, ''), 'index.html'),
    lang: 'ja',
    expectedRoutes: japaneseRoutes,
    menuLabel: 'メニュー',
    languageHref: englishRoute,
    languageLabel: 'English',
    languageCode: 'en',
    activeHref: japaneseRoute,
  });
}

if (errors.length) {
  console.error(`MOBILE_NAVIGATION_IMPROVEMENT: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('MOBILE_NAVIGATION_IMPROVEMENT: pass');
console.log('LOCALES: 2');
console.log('PRIMARY_LINKS_PER_LOCALE: 8');
console.log('TOTAL_LINKS_PER_LOCALE: 9');
console.log('MOBILE_BREAKPOINT_PX: 720');
console.log('MINIMUM_TARGET_PX: 44');
console.log('JAVASCRIPT_REQUIRED: false');
