import fs from 'node:fs';

const CONTRACT_PATH = 'data/static/v1-mobile-qa-v1.json';
const AUDIT_PATH = 'data/audits/v1-mobile-qa-v1.json';
const DOC_PATH = 'docs/release/v1-mobile-qa.md';
const WORKFLOW_PATH = '.github/workflows/v1-mobile-qa.yml';
const REPORT_PATH = 'v1-mobile-qa-report.json';
const SITEMAP_PATH = 'dist/sitemap.xml';
const LAYOUT_PATH = 'src/layouts/BaseLayout.astro';
const STYLE_PATH = 'src/styles/v1-mobile-qa.css';
const RUNNER_PATH = 'scripts/run-v1-mobile-qa-browser.mjs';
const TEMPORARY_PATHS = [
  '.github/workflows/temporary-v1-mobile-qa-discovery.yml',
  'scripts/temporary-discover-v1-mobile-qa.mjs',
];

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

for (const file of [CONTRACT_PATH, AUDIT_PATH, DOC_PATH, WORKFLOW_PATH, REPORT_PATH, SITEMAP_PATH, LAYOUT_PATH, STYLE_PATH, RUNNER_PATH]) {
  expect(fs.existsSync(file), `Required v1 mobile QA file is missing: ${file}`);
}
for (const file of TEMPORARY_PATHS) expect(!fs.existsSync(file), `Temporary mobile QA file remains: ${file}`);

const contract = json(CONTRACT_PATH);
const audit = json(AUDIT_PATH);
const report = json(REPORT_PATH);
const currentPublicUrls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

expect(contract.schema_version === 'v1-mobile-qa-v1', 'v1 mobile contract schema differs');
expect(contract.release_id === 'WHR-V1-PREPARATION-V1', 'v1 mobile release ID differs');
expect(contract.work_id === contract.release_id, 'v1 mobile Work ID differs');
expect(contract.implementation_unit === 'V1-MOBILE-QA-01', 'v1 mobile implementation unit differs');
expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18', 'v1 mobile status or date differs');
expect(contract.baseline_release_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'v1 mobile SEO baseline differs');
expect(contract.scope_contract_id === 'V1-SCOPE-FREEZE-01', 'v1 mobile scope baseline differs');
expect(contract.data_audit_contract_id === 'V1-DATA-AUDIT-01', 'v1 mobile data baseline differs');
expect(contract.previous_implementation_unit === 'V1-DATA-AUDIT-01', 'v1 mobile previous unit differs');
expect(contract.next_implementation_unit === 'V1-ACCESSIBILITY-QA-01', 'v1 mobile next unit differs');
expect(Object.values(contract.fixes).every((value) => value === true), 'v1 mobile fixes differ');
expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'v1 mobile privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'v1 mobile automation boundary differs');
expect(contract.public_boundary.existing_route_families_only === true, 'v1 mobile route boundary differs');
expect(contract.public_boundary.existing_public_data_classes_only === true, 'v1 mobile data-class boundary differs');
expect(contract.public_boundary.responsive_presentation_changes_allowed === true, 'v1 mobile presentation boundary differs');
for (const [key, value] of Object.entries(contract.public_boundary)) {
  if (['existing_route_families_only', 'existing_public_data_classes_only', 'responsive_presentation_changes_allowed'].includes(key)) continue;
  expect(value === false, `v1 mobile public boundary differs: ${key}`);
}

// Historical accepted-v1 browser evidence remains immutable.
const browser = contract.browser_audit;
expect(browser.engine === 'Chrome DevTools Protocol', 'v1 mobile browser engine differs');
expect(browser.browser_mode === 'headless-new', 'v1 mobile browser mode differs');
expect(browser.public_pages === 771, 'historical v1 mobile public-page count differs');
expect(exact(browser.viewports_css_px, [320, 375, 720]), 'v1 mobile viewport set differs');
expect(browser.viewport_height_css_px === 900, 'v1 mobile viewport height differs');
expect(browser.device_scale_factor === 1, 'v1 mobile device scale differs');
expect(browser.page_viewport_checks === 2313, 'historical v1 mobile check count differs');
expect(browser.minimum_interactive_target_css_px === 44, 'v1 mobile target threshold differs');
expect(browser.horizontal_overflow_tolerance_css_px === 1, 'v1 mobile overflow tolerance differs');
expect(browser.local_static_server_only === true && browser.external_network_required === false, 'v1 mobile server boundary differs');
expect(Object.values(contract.required_results).every((value) => value === 0), 'v1 mobile required results must remain zero');
expect(Object.values(contract.quality_contract).every((value) => value === true || value === false), 'v1 mobile quality contract values differ');
expect(contract.quality_contract.page_level_horizontal_scrolling_allowed === false, 'v1 mobile horizontal-scroll boundary differs');
expect(contract.quality_contract.explicit_local_table_scrolling_allowed === true, 'v1 mobile local-table boundary differs');
expect(contract.diagnostic_inventory?.internal_table_overflow_is_allowed_inside_explicit_scroll_or_mobile_table_presentation === true, 'v1 mobile local-table diagnostic boundary differs');
expect(contract.diagnostic_inventory?.diagnostics_do_not_override_page_level_failure_rules === true, 'v1 mobile diagnostic precedence differs');

expect(audit.schema_version === 'v1-mobile-qa-audit-v1', 'v1 mobile audit schema differs');
expect(audit.release_id === contract.release_id && audit.work_id === contract.work_id, 'v1 mobile audit identity differs');
expect(audit.implementation_unit === contract.implementation_unit, 'v1 mobile audit unit differs');
expect(audit.status === contract.status && audit.reviewed_at === contract.reviewed_at, 'v1 mobile audit status differs');
expect(exact(audit.fixes, contract.fixes), 'v1 mobile audit fixes differ');
expect(exact(audit.public_boundary, contract.public_boundary), 'v1 mobile audit public boundary differs');
expect(exact(audit.privacy_boundary, contract.privacy_boundary), 'v1 mobile audit privacy boundary differs');
expect(exact(audit.automation_boundary, contract.automation_boundary), 'v1 mobile audit automation boundary differs');
expect(audit.previous_implementation_unit === contract.previous_implementation_unit, 'v1 mobile audit previous unit differs');
expect(audit.next_implementation_unit === contract.next_implementation_unit, 'v1 mobile audit next unit differs');
expect(Object.values(audit.behavior).every((value) => value === true), 'v1 mobile audit behavior differs');
expect(audit.verified.public_pages === browser.public_pages, 'historical v1 mobile audit page count differs');
expect(audit.verified.viewports === browser.viewports_css_px.length, 'historical v1 mobile audit viewport count differs');
expect(audit.verified.page_viewport_checks === browser.page_viewport_checks, 'historical v1 mobile audit check count differs');
for (const [contractKey, expected] of Object.entries(contract.required_results)) {
  expect(audit.verified[contractKey] === expected, `historical v1 mobile audit result differs: ${contractKey}`);
}

// Current QA is stricter operationally: every current sitemap URL is swept at all accepted viewports.
expect(currentPublicUrls.length >= browser.public_pages, 'current public sitemap unexpectedly shrank below the accepted v1 inventory');
expect(report.schemaVersion === 'v1-mobile-qa-discovery-v1', 'v1 mobile browser report schema differs');
expect(report.publicPages === currentPublicUrls.length, `current v1 mobile report must cover all sitemap pages: report=${report.publicPages} sitemap=${currentPublicUrls.length}`);
expect(exact(report.viewports, browser.viewports_css_px), 'current v1 mobile report viewports differ');
expect(report.pageViewportChecks === currentPublicUrls.length * browser.viewports_css_px.length, 'current v1 mobile report check count differs');

// Only contract-required failure measurements must be zero. Table-width and nowrap
// values below are diagnostics: local table scrolling is explicitly allowed as long as
// it does not create page-level horizontal overflow.
const currentZeroResults = {
  failedPageLoads: 'failed page loads',
  horizontalOverflowChecks: 'page-level horizontal overflow checks',
  pagesWithSmallTargets: 'pages with small targets',
  smallTargetInstances: 'small target instances',
  viewportMetaErrors: 'viewport meta errors',
  oversizedImageChecks: 'oversized image checks',
};
for (const [reportKey, label] of Object.entries(currentZeroResults)) {
  expect(report[reportKey] === 0, `current browser QA found ${label}: ${report[reportKey]}`);
}
for (const [key, label] of [
  ['failures', 'page-load failures'],
  ['horizontalOverflow', 'horizontal-overflow details'],
  ['smallTargets', 'small-target details'],
  ['viewportMetaErrorsDetail', 'viewport-meta details'],
  ['oversizedImages', 'oversized-image details'],
]) {
  expect(Array.isArray(report[key]) && report[key].length === 0, `current v1 mobile ${label} remain`);
}
for (const [countKey, detailKey, label] of [
  ['overflowingTableChecks', 'overflowingTables', 'local-table overflow diagnostics'],
  ['uncontainedScrollChecks', 'uncontainedScroll', 'nowrap diagnostics'],
]) {
  expect(Number.isInteger(report[countKey]) && report[countKey] >= 0, `current v1 mobile ${label} count is invalid`);
  expect(Array.isArray(report[detailKey]), `current v1 mobile ${label} details are missing`);
  expect(report[detailKey].length === Math.min(report[countKey], 100), `current v1 mobile ${label} count/detail mismatch`);
  expect(report[countKey] <= report.pageViewportChecks, `current v1 mobile ${label} exceeds page-view checks`);
}
for (const key of ['pagesContainingTables','pagesContainingPre','pagesContainingCode','pagesContainingForms']) {
  expect(Number.isInteger(report[key]) && report[key] >= 0, `current v1 mobile diagnostic must be non-negative: ${key}`);
}

const layout = read(LAYOUT_PATH);
expect(layout.includes("import '../styles/v1-mobile-qa.css';"), 'BaseLayout does not load v1 mobile QA styles');
const style = read(STYLE_PATH);
for (const marker of [
  '.main-content',
  'overflow-x: clip',
  'overflow-wrap: anywhere',
  'min-height: 2.75rem',
  'min-width: 2.75rem',
  '.site-navigation:not([open]) > .site-nav',
  'display: none',
]) expect(style.includes(marker), `v1 mobile style marker is missing: ${marker}`);

const runner = read(RUNNER_PATH);
for (const marker of [
  "const viewports = [320, 375, 720]",
  "'--headless=new'",
  "'--remote-debugging-pipe'",
  "horizontalOverflowPx",
  "item.width < 44 || item.height < 44",
  "v1-mobile-qa-discovery.json",
]) expect(runner.includes(marker), `v1 mobile browser runner marker is missing: ${marker}`);

const doc = read(DOC_PATH);
for (const marker of [
  'V1-MOBILE-QA-01',
  'Public pages: 771',
  'Page-viewport checks: 2,313',
  'Page-level horizontal overflow checks: 0',
  'Small target instances: 0',
  'scripts/run-v1-mobile-qa-browser.mjs',
  'scripts/check-v1-mobile-qa.mjs',
  '.github/workflows/v1-mobile-qa.yml',
  'V1-ACCESSIBILITY-QA-01',
]) expect(doc.includes(marker), `v1 mobile documentation marker is missing: ${marker}`);

const workflow = read(WORKFLOW_PATH);
for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-seo-qa-release.mjs',
  'node scripts/check-v1-scope-freeze.mjs',
  'node scripts/check-v1-data-audit.mjs',
  'node scripts/run-v1-mobile-qa-browser.mjs',
  'mv v1-mobile-qa-discovery.json v1-mobile-qa-report.json',
  'node scripts/check-v1-mobile-qa.mjs',
  'git status --porcelain',
]) expect(workflow.includes(marker), `v1 mobile workflow marker is missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) {
  expect(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `v1 mobile workflow contains forbidden marker: ${forbidden}`);
}

console.log('V1_MOBILE_QA: pass');
console.log(`HISTORICAL_PUBLIC_PAGES: ${browser.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${currentPublicUrls.length}`);
console.log(`VIEWPORTS: ${browser.viewports_css_px.join(',')}`);
console.log(`CURRENT_PAGE_VIEWPORT_CHECKS: ${report.pageViewportChecks}`);
console.log('FAILED_PAGE_LOADS: 0');
console.log('PAGE_LEVEL_HORIZONTAL_OVERFLOW_CHECKS: 0');
console.log('SMALL_TARGET_INSTANCES: 0');
console.log('VIEWPORT_META_ERRORS: 0');
console.log('OVERSIZED_IMAGE_CHECKS: 0');
console.log(`LOCAL_TABLE_OVERFLOW_DIAGNOSTICS: ${report.overflowingTableChecks}`);
console.log(`UNCONTAINED_NOWRAP_DIAGNOSTICS: ${report.uncontainedScrollChecks}`);
console.log('NEXT_IMPLEMENTATION_UNIT: V1-ACCESSIBILITY-QA-01');
