import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const releasePath = 'data/static/ux-polish-release-v1.json';
const auditPath = 'data/audits/ux-polish-release-v1.json';
const layoutPath = 'src/layouts/BaseLayout.astro';
const stylePath = 'src/styles/ux-polish.css';
const docPath = 'docs/search/ux-polish-release.md';
const workflowPath = '.github/workflows/ux-polish-release.yml';

for (const requiredPath of [releasePath, auditPath, layoutPath, stylePath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const release = parse(releasePath);
const audit = parse(auditPath);
const completedUnits = [
  'GLOBAL-SEARCH-FOUNDATION-01',
  'COUNTRY-FILTERS-01',
  'RACE-TYPE-FILTERS-01',
  'REGION-FILTERS-01',
  'SOURCE-STATUS-FILTERS-01',
  'GLOSSARY-SEARCH-IMPROVEMENT-01',
  'MOBILE-NAVIGATION-IMPROVEMENT-01',
  'DESKTOP-LAYOUT-IMPROVEMENT-01',
  'NO-JS-FALLBACK-REVIEW-01',
  'UX-POLISH-RELEASE-01',
];
const routes = [
  '/search/',
  '/ja/search/',
  '/countries/',
  '/ja/countries/',
  '/tracks/',
  '/ja/tracks/',
  '/sources/',
  '/ja/sources/',
  '/glossary/',
  '/ja/glossary/',
];
const formMarkers = [
  'data-search-form',
  'data-country-filter-form',
  'data-racecourse-filter-form',
  'data-source-filter-form',
  'data-glossary-filter-form',
];
const countMarkers = [
  'data-search-count',
  'data-country-filter-count',
  'data-racecourse-filter-count',
  'data-source-filter-count',
  'data-glossary-filter-count',
];
const emptyMarkers = [
  'data-search-empty',
  'data-country-filter-empty',
  'data-racecourse-filter-empty',
  'data-source-filter-empty',
  'data-glossary-filter-empty',
];

if (release.schema_version !== 'ux-polish-release-v1') fail('UX release schema differs');
if (release.release_id !== 'WHR-UX-DISCOVERY-V1') fail('UX release ID differs');
if (release.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('UX release Work ID differs');
if (release.implementation_unit !== 'UX-POLISH-RELEASE-01') fail('UX release implementation unit differs');
if (release.status !== 'release_ready') fail('UX release status differs');
if (release.reviewed_at !== '2026-07-17') fail('UX release review date differs');
if (!exact(release.scope, {
  completed_units: 10,
  locales: 2,
  discovery_surfaces: 5,
  bilingual_discovery_routes: 10,
  global_search_records_per_locale: 182,
  country_records_per_locale: 98,
  region_facets: 19,
  racecourse_records_per_locale: 36,
  source_records_per_locale: 171,
  glossary_records_per_locale: 48,
  glossary_categories: 9,
  navigation_links_per_locale: 9,
  no_js_record_cards_total: 1070,
  minimum_control_target_px: 44,
})) fail('UX release scope differs');
if (!exact(release.completed_units, completedUnits)) fail('UX release completed units differ');
if (!exact(release.ux_contract, {
  shared_polish_stylesheet_required: true,
  responsive_form_grid_required: true,
  single_column_mobile_forms_required: true,
  full_width_mobile_actions_required: true,
  minimum_control_height_required: true,
  visible_input_focus_required: true,
  visible_button_focus_required: true,
  primary_action_emphasis_required: true,
  reset_action_distinction_required: true,
  live_count_separation_required: true,
  result_link_emphasis_required: true,
  empty_state_distinction_required: true,
  no_js_fallback_preserved: true,
  mobile_navigation_preserved: true,
  desktop_layout_preserved: true,
})) fail('UX behavior contract differs');
if (!exact(release.release_markers, {
  body_release_attribute: 'data-ux-polish-release',
  body_release_value: 'WHR-UX-DISCOVERY-V1',
  body_phase_attribute: 'data-ux-polish-phase',
  body_phase_value: '10',
})) fail('UX release markers differ');
for (const [key, value] of Object.entries(release.public_boundary ?? {})) {
  const expected = ['discovery_and_navigation_allowed', 'reviewed_public_metadata_allowed'].includes(key);
  if (value !== expected) fail(`UX public boundary differs: ${key}`);
}
for (const value of Object.values(release.privacy_boundary ?? {})) if (value !== false) fail('UX privacy boundary differs');
for (const value of Object.values(release.automation_boundary ?? {})) if (value !== false) fail('UX automation boundary differs');
if (release.previous_implementation_unit !== 'NO-JS-FALLBACK-REVIEW-01') fail('previous UX unit differs');
if (release.next_implementation_unit !== 'SITEMAP-ROBOTS-01') fail('next UX unit differs');

if (audit.schema_version !== 'ux-polish-release-audit-v1') fail('UX audit schema differs');
if (audit.release_id !== release.release_id || audit.work_id !== release.work_id || audit.implementation_unit !== release.implementation_unit || audit.reviewed_at !== release.reviewed_at) fail('UX audit identity differs');
if (audit.status !== 'release_ready') fail('UX audit status differs');
if (!exact(audit.verified, {
  completed_units: 10,
  locales: 2,
  discovery_surfaces: 5,
  bilingual_discovery_routes: 10,
  responsive_form_types: 5,
  reset_action_types: 4,
  live_count_types: 5,
  empty_state_types: 5,
  minimum_control_target_px: 44,
  missing_release_markers: 0,
  missing_stylesheet_imports: 0,
  missing_responsive_form_selectors: 0,
  missing_control_height_rules: 0,
  missing_focus_rules: 0,
  missing_reset_distinction_rules: 0,
  missing_live_count_rules: 0,
  missing_result_link_rules: 0,
  missing_empty_state_rules: 0,
  no_js_regressions: 0,
  mobile_navigation_regressions: 0,
  desktop_layout_regressions: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('UX audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('UX audit behavior differs');
if (!exact(audit.public_boundary, release.public_boundary) || !exact(audit.privacy_boundary, release.privacy_boundary) || !exact(audit.automation_boundary, release.automation_boundary)) fail('UX audit boundaries differ');
if (audit.previous_implementation_unit !== release.previous_implementation_unit || audit.next_implementation_unit !== release.next_implementation_unit) fail('UX audit roadmap differs');

const layout = read(layoutPath);
for (const marker of [
  "import '../styles/mobile-navigation.css'",
  "import '../styles/desktop-layout.css'",
  "import '../styles/ux-polish.css'",
  "import '../styles/utilities.css'",
  'data-ux-polish-release="WHR-UX-DISCOVERY-V1"',
  'data-ux-polish-phase="10"',
  'data-no-js-fallback="complete-list-v1"',
  'data-mobile-navigation="details-summary-v1"',
  'data-desktop-layout="responsive-shell-v1"',
]) if (!layout.includes(marker)) fail(`UX layout marker missing ${marker}`);
const mobileImport = layout.indexOf("import '../styles/mobile-navigation.css'");
const desktopImport = layout.indexOf("import '../styles/desktop-layout.css'");
const uxImport = layout.indexOf("import '../styles/ux-polish.css'");
const utilitiesImport = layout.indexOf("import '../styles/utilities.css'");
if (!(mobileImport < desktopImport && desktopImport < uxImport && uxImport < utilitiesImport)) fail('UX stylesheet import order differs');
for (const forbidden of ['ResizeObserver', 'matchMedia(', 'localStorage', 'sessionStorage', 'document.cookie', 'sendBeacon', 'fetch(']) {
  if (layout.includes(forbidden)) fail(`UX layout contains forbidden dependency ${forbidden}`);
}

const style = read(stylePath);
for (const marker of [
  '[data-search-form]',
  '[data-country-filter-form]',
  '[data-racecourse-filter-form]',
  '[data-source-filter-form]',
  '[data-glossary-filter-form]',
  'grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr))',
  'min-height: 2.75rem',
  ':is(input, select):focus-visible',
  'button:focus-visible',
  '[data-country-filter-reset]',
  '[data-racecourse-filter-reset]',
  '[data-source-filter-reset]',
  '[data-glossary-filter-reset]',
  'background: transparent !important',
  '[data-search-count]',
  '[data-country-filter-count]',
  '[data-racecourse-filter-count]',
  '[data-source-filter-count]',
  '[data-glossary-filter-count]',
  'border-block-start: 1px solid var(--whr-color-border)',
  '[data-search-results]',
  '[data-country-filter-results]',
  '[data-racecourse-filter-results]',
  '[data-source-filter-results]',
  '[data-glossary-filter-results]',
  'text-decoration-thickness: 0.1em',
  '[data-search-empty]',
  '[data-country-filter-empty]',
  '[data-racecourse-filter-empty]',
  '[data-source-filter-empty]',
  '[data-glossary-filter-empty]',
  'border-style: dashed',
  '@media (max-width: 720px)',
  'grid-template-columns: 1fr',
  'width: 100%',
]) if (!style.includes(marker)) fail(`UX polish stylesheet missing ${marker}`);
for (const forbidden of ['transition:', 'animation:', '@keyframes', 'javascript:', 'url(http:', 'url(https:', 'localStorage', 'sessionStorage', 'document.cookie']) {
  if (style.toLowerCase().includes(forbidden.toLowerCase())) fail(`UX polish stylesheet contains forbidden marker ${forbidden}`);
}
const formSelectorCount = formMarkers.filter((marker) => style.includes(`[${marker}]`)).length;
const countSelectorCount = countMarkers.filter((marker) => style.includes(`[${marker}]`)).length;
const emptySelectorCount = emptyMarkers.filter((marker) => style.includes(`[${marker}]`)).length;
if (formSelectorCount !== 5) fail(`UX form selector count differs ${formSelectorCount}`);
if (countSelectorCount !== 5) fail(`UX live-count selector count differs ${countSelectorCount}`);
if (emptySelectorCount !== 5) fail(`UX empty-state selector count differs ${emptySelectorCount}`);

const doc = read(docPath);
for (const marker of [
  'WHR-UX-DISCOVERY-V1',
  'UX-POLISH-RELEASE-01',
  'GLOBAL-SEARCH-FOUNDATION-01',
  'NO-JS-FALLBACK-REVIEW-01',
  'Global search records per locale: 182',
  'Country and region records per locale: 98',
  'Region facets: 19',
  'Racecourse records per locale: 36',
  'Source records per locale: 171',
  'Glossary records per locale: 48',
  'No-JavaScript bilingual record cards: 1,070',
  'src/styles/ux-polish.css',
  '44-pixel-equivalent',
  'data-ux-polish-release="WHR-UX-DISCOVERY-V1"',
  'scripts/check-ux-polish-release.mjs',
  '.github/workflows/ux-polish-release.yml',
  'SITEMAP-ROBOTS-01',
]) if (!doc.includes(marker)) fail(`UX release documentation missing ${marker}`);

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
  'node scripts/check-ux-polish-release.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`UX release workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`UX release workflow contains forbidden marker ${forbidden}`);
}

function renderedFile(route) {
  return path.join('dist', route.replace(/^\//, ''), 'index.html');
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
for (let index = 0; index < routes.length; index += 1) {
  const route = routes[index];
  const file = renderedFile(route);
  if (!fs.existsSync(filePath(file))) {
    fail(`${route}: rendered discovery route missing`);
    continue;
  }
  const html = read(file);
  if (!html.includes('data-ux-polish-release="WHR-UX-DISCOVERY-V1"')) fail(`${route}: UX release marker missing`);
  if (!html.includes('data-ux-polish-phase="10"')) fail(`${route}: UX phase marker missing`);
  if (!html.includes('data-no-js-fallback="complete-list-v1"')) fail(`${route}: no-JavaScript marker missing`);
  if (!html.includes('data-mobile-navigation="details-summary-v1"')) fail(`${route}: mobile navigation marker missing`);
  if (!html.includes('data-desktop-layout="responsive-shell-v1"')) fail(`${route}: desktop layout marker missing`);
  const formMarker = formMarkers[Math.floor(index / 2)];
  const countMarker = countMarkers[Math.floor(index / 2)];
  const emptyMarker = emptyMarkers[Math.floor(index / 2)];
  if (!html.includes(formMarker)) fail(`${route}: discovery form marker missing ${formMarker}`);
  if (!html.includes(countMarker)) fail(`${route}: live-count marker missing ${countMarker}`);
  if (!html.includes(emptyMarker)) fail(`${route}: empty-state marker missing ${emptyMarker}`);
  const emptyTag = html.match(new RegExp(`<section[^>]*${emptyMarker}(?=[\\s>])[^>]*>`))?.[0];
  if (!emptyTag || !/\shidden(?:\s|=|>)/.test(emptyTag)) fail(`${route}: empty state is not hidden initially`);
  const expectedLang = route.startsWith('/ja/') ? 'ja' : 'en';
  if (!html.includes(`<html lang="${expectedLang}"`)) fail(`${route}: rendered locale differs`);
}

if (errors.length) {
  console.error(`UX_POLISH_RELEASE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('UX_POLISH_RELEASE: pass');
console.log('RELEASE_ID: WHR-UX-DISCOVERY-V1');
console.log('COMPLETED_UNITS: 10');
console.log('DISCOVERY_SURFACES: 5');
console.log('BILINGUAL_DISCOVERY_ROUTES: 10');
console.log('MINIMUM_CONTROL_TARGET_PX: 44');
console.log('NEXT_IMPLEMENTATION_UNIT: SITEMAP-ROBOTS-01');
