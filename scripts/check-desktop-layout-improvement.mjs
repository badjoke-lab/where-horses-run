import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const contractPath = 'data/static/desktop-layout-contract-v1.json';
const auditPath = 'data/audits/desktop-layout-improvement-v1.json';
const layoutPath = 'src/layouts/BaseLayout.astro';
const themePath = 'src/styles/theme.css';
const stylePath = 'src/styles/desktop-layout.css';
const mobileStylePath = 'src/styles/mobile-navigation.css';
const docPath = 'docs/search/desktop-layout-improvement.md';
const workflowPath = '.github/workflows/desktop-layout-improvement.yml';

for (const requiredPath of [contractPath, auditPath, layoutPath, themePath, stylePath, mobileStylePath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const representativeRoutes = [
  '/',
  '/ja/',
  '/countries/',
  '/ja/countries/',
  '/glossary/',
  '/ja/glossary/',
  '/sources/',
  '/ja/sources/',
];

if (contract.schema_version !== 'desktop-layout-contract-v1') fail('desktop layout contract schema differs');
if (contract.work_id !== 'WHR-SEARCH-FILTER-SEO-V1') fail('desktop layout Work ID differs');
if (contract.implementation_unit !== 'DESKTOP-LAYOUT-IMPROVEMENT-01') fail('desktop layout implementation unit differs');
if (contract.status !== 'complete') fail('desktop layout contract status differs');
if (contract.reviewed_at !== '2026-07-17') fail('desktop layout review date differs');
if (!exact(contract.scope, {
  locales: 2,
  desktop_start_px: 721,
  wide_desktop_start_px: 960,
  content_max_width_px: 1120,
  header_columns: 2,
  section_grid_min_rem: 17,
  country_two_column_min_rem: 20,
  country_three_column_min_rem: 16,
})) fail('desktop layout scope differs');
if (!exact(contract.layout_contract, {
  mobile_rules_changed: false,
  desktop_stylesheet_isolated: true,
  header_uses_explicit_columns: true,
  brand_column_is_intrinsic: true,
  navigation_column_can_shrink: true,
  navigation_is_right_aligned: true,
  section_grid_uses_auto_fit: true,
  section_cards_use_equal_rows: true,
  section_cards_stretch: true,
  long_card_content_wraps: true,
  country_grids_use_auto_fit: true,
  hero_reading_width_is_bounded: true,
  completed_mobile_navigation_preserved: true,
})) fail('desktop layout behavior contract differs');
if (!exact(contract.representative_routes, representativeRoutes)) fail('desktop layout representative routes differ');
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('desktop layout privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('desktop layout automation boundary differs');
if (contract.previous_implementation_unit !== 'MOBILE-NAVIGATION-IMPROVEMENT-01') fail('previous desktop layout unit differs');
if (contract.next_implementation_unit !== 'NO-JS-FALLBACK-REVIEW-01') fail('next desktop layout unit differs');

if (audit.schema_version !== 'desktop-layout-improvement-audit-v1') fail('desktop layout audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('desktop layout audit identity differs');
if (audit.status !== 'complete') fail('desktop layout audit status differs');
if (!exact(audit.verified, {
  locales: 2,
  representative_routes: 8,
  desktop_breakpoints: 2,
  header_columns: 2,
  fixed_section_grid_declarations: 0,
  responsive_section_grid_declarations: 1,
  responsive_country_grid_declarations: 2,
  missing_desktop_layout_markers: 0,
  missing_mobile_navigation_markers: 0,
  missing_desktop_stylesheet_imports: 0,
  mobile_rule_overrides_below_721px: 0,
  layout_javascript_dependencies: 0,
  cookie_or_storage_dependencies: 0,
  contract_errors: 0,
  rendered_marker_errors: 0,
})) fail('desktop layout audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('desktop layout audit behavior differs');
if (!exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('desktop layout audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('desktop layout audit roadmap differs');

const layout = read(layoutPath);
for (const marker of [
  "import '../styles/mobile-navigation.css'",
  "import '../styles/desktop-layout.css'",
  'data-mobile-navigation="details-summary-v1"',
  'data-desktop-layout="responsive-shell-v1"',
  'data-desktop-content="responsive-grid-v1"',
  'class="site-header__inner"',
  'class="site-navigation"',
  'class="main-content"',
]) if (!layout.includes(marker)) fail(`desktop layout source missing ${marker}`);
if (layout.indexOf("import '../styles/desktop-layout.css'") < layout.indexOf("import '../styles/mobile-navigation.css'")) fail('desktop layout stylesheet import order differs');
for (const forbidden of ['<script', 'ResizeObserver', 'matchMedia(', 'localStorage', 'sessionStorage', 'document.cookie', 'fetch(']) {
  if (layout.includes(forbidden)) fail(`desktop layout source contains forbidden marker ${forbidden}`);
}

const theme = read(themePath);
if (!theme.includes('--whr-content-width: 1120px')) fail('shared content width differs');

const style = read(stylePath);
for (const marker of [
  '@media (min-width: 721px)',
  '@media (min-width: 960px)',
  '.site-header__inner',
  'grid-template-columns: max-content minmax(0, 1fr)',
  '.site-navigation',
  'min-width: 0',
  '.site-nav__list',
  'justify-content: flex-end',
  '.section-grid',
  'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))',
  'grid-auto-rows: 1fr',
  'align-items: stretch',
  '.section-grid > .card',
  'height: 100%',
  'overflow-wrap: anywhere',
  '.country-grid--2',
  'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
  '.country-grid--3',
  'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
  'max-width: 58rem',
]) if (!style.includes(marker)) fail(`desktop layout stylesheet missing ${marker}`);
const breakpoints = [...style.matchAll(/@media \(min-width: (\d+)px\)/g)].map((match) => Number(match[1]));
if (!exact(breakpoints, [721, 960])) fail(`desktop layout breakpoints differ ${JSON.stringify(breakpoints)}`);
if (/@media\s*\(max-width:/.test(style)) fail('desktop stylesheet contains a mobile max-width override');
if (/grid-template-columns:\s*repeat\(3,/.test(style)) fail('desktop stylesheet contains a fixed three-column section grid');
for (const forbidden of ['javascript:', 'url(http:', 'url(https:', 'behavior:']) {
  if (style.toLowerCase().includes(forbidden.toLowerCase())) fail(`desktop stylesheet contains forbidden marker ${forbidden}`);
}

const mobileStyle = read(mobileStylePath);
for (const marker of [
  '@media (max-width: 720px)',
  '.site-navigation[open]',
  '.site-nav__list',
  'display: grid',
]) if (!mobileStyle.includes(marker)) fail(`completed mobile navigation marker missing ${marker}`);

const doc = read(docPath);
for (const marker of [
  'DESKTOP-LAYOUT-IMPROVEMENT-01',
  '721 pixels',
  '960 pixels',
  'minmax(0, 1fr)',
  'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))',
  'minimum 20rem',
  'minimum 16rem',
  '1120-pixel',
  'scripts/check-desktop-layout-improvement.mjs',
  '.github/workflows/desktop-layout-improvement.yml',
  'NO-JS-FALLBACK-REVIEW-01',
]) if (!doc.includes(marker)) fail(`desktop layout documentation missing ${marker}`);

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
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`desktop layout workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`desktop layout workflow contains forbidden marker ${forbidden}`);
}

function renderedFile(route) {
  return route === '/'
    ? 'dist/index.html'
    : path.join('dist', route.replace(/^\//, ''), 'index.html');
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
for (const route of representativeRoutes) {
  const file = renderedFile(route);
  if (!fs.existsSync(filePath(file))) {
    fail(`representative desktop route missing: ${route}`);
    continue;
  }
  const html = read(file);
  if (!html.includes('data-desktop-layout="responsive-shell-v1"')) fail(`${route}: desktop shell marker missing`);
  if (!html.includes('data-desktop-content="responsive-grid-v1"')) fail(`${route}: desktop content marker missing`);
  if (!html.includes('data-mobile-navigation="details-summary-v1"')) fail(`${route}: mobile navigation marker missing`);
  if (!html.includes('class="site-header__inner"')) fail(`${route}: shared header inner missing`);
  if (!html.includes('class="main-content"')) fail(`${route}: shared main content missing`);
  if (!html.includes('class="section-grid"')) fail(`${route}: representative responsive grid missing`);
  const expectedLang = route.startsWith('/ja/') || route === '/ja/' ? 'ja' : 'en';
  if (!html.includes(`<html lang="${expectedLang}"`)) fail(`${route}: rendered locale differs`);
}

if (errors.length) {
  console.error(`DESKTOP_LAYOUT_IMPROVEMENT: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('DESKTOP_LAYOUT_IMPROVEMENT: pass');
console.log('REPRESENTATIVE_ROUTES: 8');
console.log('DESKTOP_BREAKPOINTS: 721,960');
console.log('CONTENT_MAX_WIDTH_PX: 1120');
console.log('SECTION_GRID_MIN_REM: 17');
console.log('MOBILE_RULES_CHANGED: false');
