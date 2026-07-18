import fs from 'node:fs';

const CONTRACT_PATH = 'data/static/v1-accessibility-qa-v1.json';
const AUDIT_PATH = 'data/audits/v1-accessibility-qa-v1.json';
const DOC_PATH = 'docs/release/v1-accessibility-qa.md';
const WORKFLOW_PATH = '.github/workflows/v1-accessibility-qa.yml';
const REPORT_PATH = 'v1-accessibility-qa-report.json';
const RUNNER_PATH = 'scripts/run-v1-accessibility-qa-browser.mjs';
const SCOPE_PATH = 'data/static/v1-scope-freeze-v1.json';
const DATA_AUDIT_PATH = 'data/static/v1-data-audit-v1.json';
const MOBILE_QA_PATH = 'data/static/v1-mobile-qa-v1.json';
const SEO_RELEASE_PATH = 'data/static/seo-qa-release-v1.json';
const TEMPORARY_PATHS = [
  '.github/workflows/temporary-v1-accessibility-qa-discovery.yml',
  'scripts/temporary-discover-v1-accessibility-qa.mjs',
];

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

for (const file of [
  CONTRACT_PATH, AUDIT_PATH, DOC_PATH, WORKFLOW_PATH, REPORT_PATH, RUNNER_PATH,
  SCOPE_PATH, DATA_AUDIT_PATH, MOBILE_QA_PATH, SEO_RELEASE_PATH,
]) expect(fs.existsSync(file), `Required v1 accessibility QA file is missing: ${file}`);
for (const file of TEMPORARY_PATHS) expect(!fs.existsSync(file), `Temporary accessibility QA file remains: ${file}`);

const contract = json(CONTRACT_PATH);
const audit = json(AUDIT_PATH);
const report = json(REPORT_PATH);
const scope = json(SCOPE_PATH);
const dataAudit = json(DATA_AUDIT_PATH);
const mobile = json(MOBILE_QA_PATH);
const seo = json(SEO_RELEASE_PATH);

expect(contract.schema_version === 'v1-accessibility-qa-v1', 'v1 accessibility contract schema differs');
expect(contract.release_id === 'WHR-V1-PREPARATION-V1', 'v1 accessibility release ID differs');
expect(contract.work_id === contract.release_id, 'v1 accessibility Work ID differs');
expect(contract.implementation_unit === 'V1-ACCESSIBILITY-QA-01', 'v1 accessibility unit differs');
expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18', 'v1 accessibility status or date differs');
expect(contract.baseline_release_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'v1 accessibility SEO baseline differs');
expect(contract.scope_contract_id === 'V1-SCOPE-FREEZE-01', 'v1 accessibility scope baseline differs');
expect(contract.data_audit_contract_id === 'V1-DATA-AUDIT-01', 'v1 accessibility data baseline differs');
expect(contract.mobile_qa_contract_id === 'V1-MOBILE-QA-01', 'v1 accessibility mobile baseline differs');
expect(contract.previous_implementation_unit === 'V1-MOBILE-QA-01', 'v1 accessibility previous unit differs');
expect(contract.next_implementation_unit === 'V1-PERFORMANCE-QA-01', 'v1 accessibility next unit differs');

expect(scope.implementation_unit === contract.scope_contract_id && scope.status === 'complete', 'v1 scope baseline is incomplete');
expect(dataAudit.implementation_unit === contract.data_audit_contract_id && dataAudit.status === 'complete', 'v1 data audit baseline is incomplete');
expect(mobile.implementation_unit === contract.mobile_qa_contract_id && mobile.status === 'complete', 'v1 mobile QA baseline is incomplete');
expect(Object.values(mobile.required_results).every((value) => value === 0), 'v1 mobile QA zero-result baseline differs');
expect(seo.release_id === contract.baseline_release_id && seo.status === 'release_ready', 'Phase 11 SEO baseline differs');
expect(scope.baseline_inventory.public_pages === contract.browser_audit.public_pages, 'v1 scope page count differs');
expect(mobile.browser_audit.public_pages === contract.browser_audit.public_pages, 'v1 mobile page count differs');

const browser = contract.browser_audit;
expect(browser.engine === 'Chrome DevTools Protocol', 'v1 accessibility browser engine differs');
expect(browser.browser_mode === 'headless-new', 'v1 accessibility browser mode differs');
expect(browser.public_pages === 771 && browser.page_checks === 771, 'v1 accessibility page counts differ');
expect(browser.viewport_width_css_px === 1280 && browser.viewport_height_css_px === 900, 'v1 accessibility viewport differs');
expect(browser.device_scale_factor === 1, 'v1 accessibility device scale differs');
expect(browser.local_static_server_only === true && browser.external_network_required === false, 'v1 accessibility server boundary differs');
expect(Object.values(contract.required_results).every((value) => value === 0), 'v1 accessibility required results must remain zero');
expect(Object.values(contract.audit_rules).every((value) => value === true || value === false), 'v1 accessibility rule values differ');
for (const key of [
  'heading_level_jumps_allowed', 'duplicate_ids_allowed', 'broken_aria_references_allowed',
  'unnamed_links_allowed', 'unnamed_buttons_summaries_or_button_roles_allowed',
  'images_without_alt_allowed', 'unlabelled_form_controls_allowed',
  'details_without_direct_summary_allowed', 'tables_without_header_cells_allowed',
  'unnamed_navigation_landmarks_allowed', 'nested_interactive_controls_allowed',
]) expect(contract.audit_rules[key] === false, `v1 accessibility prohibition differs: ${key}`);

expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'v1 accessibility privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'v1 accessibility automation boundary differs');
for (const [key, value] of Object.entries(contract.public_boundary)) {
  const allowed = ['existing_route_families_only', 'existing_public_data_classes_only', 'semantic_labeling_and_keyboard_qa_allowed'].includes(key);
  expect(value === allowed, `v1 accessibility public boundary differs: ${key}`);
}

expect(audit.schema_version === 'v1-accessibility-qa-audit-v1', 'v1 accessibility audit schema differs');
expect(audit.release_id === contract.release_id && audit.work_id === contract.work_id, 'v1 accessibility audit identity differs');
expect(audit.implementation_unit === contract.implementation_unit, 'v1 accessibility audit unit differs');
expect(audit.status === contract.status && audit.reviewed_at === contract.reviewed_at, 'v1 accessibility audit status differs');
expect(exact(audit.public_boundary, contract.public_boundary), 'v1 accessibility audit public boundary differs');
expect(exact(audit.privacy_boundary, contract.privacy_boundary), 'v1 accessibility audit privacy boundary differs');
expect(exact(audit.automation_boundary, contract.automation_boundary), 'v1 accessibility audit automation boundary differs');
expect(audit.previous_implementation_unit === contract.previous_implementation_unit, 'v1 accessibility audit previous unit differs');
expect(audit.next_implementation_unit === contract.next_implementation_unit, 'v1 accessibility audit next unit differs');
expect(Object.values(audit.behavior).every((value) => value === true), 'v1 accessibility audit behavior differs');

expect(report.schemaVersion === 'v1-accessibility-qa-discovery-v1', 'v1 accessibility report schema differs');
expect(report.publicPages === browser.public_pages, 'v1 accessibility report page inventory differs');
expect(report.pageChecks === browser.page_checks, 'v1 accessibility report check count differs');
const resultMap = {
  failed_page_loads: 'failedPageLoads',
  pages_with_errors: 'pagesWithErrors',
  title_errors: 'titleErrors',
  language_errors: 'languageErrors',
  main_errors: 'mainErrors',
  skip_link_errors: 'skipLinkErrors',
  h1_errors: 'h1Errors',
  heading_jump_instances: 'headingJumpInstances',
  duplicate_id_instances: 'duplicateIdInstances',
  missing_aria_reference_instances: 'missingAriaReferenceInstances',
  unnamed_link_instances: 'unnamedLinkInstances',
  unnamed_control_instances: 'unnamedControlInstances',
  image_alt_errors: 'imageAltErrors',
  form_label_errors: 'formLabelErrors',
  details_summary_errors: 'detailsSummaryErrors',
  table_header_errors: 'tableHeaderErrors',
  nav_name_errors: 'navNameErrors',
  nested_interactive_instances: 'nestedInteractiveInstances',
};
for (const [contractKey, reportKey] of Object.entries(resultMap)) {
  expect(report[reportKey] === contract.required_results[contractKey], `v1 accessibility report differs: ${reportKey}`);
  expect(audit.verified[contractKey] === contract.required_results[contractKey], `v1 accessibility audit differs: ${contractKey}`);
}
expect(Array.isArray(report.failures) && report.failures.length === 0, 'v1 accessibility page-load failures remain');
expect(Array.isArray(report.pageErrors) && report.pageErrors.length === 0, 'v1 accessibility page errors remain');

const inventoryMap = {
  images: 'images',
  form_controls: 'formControls',
  details_elements: 'details',
  tables: 'tables',
  navigation_landmarks: 'navs',
};
for (const [contractKey, reportKey] of Object.entries(inventoryMap)) {
  expect(report[reportKey] === contract.semantic_inventory[contractKey], `v1 accessibility inventory differs: ${reportKey}`);
  expect(audit.verified[contractKey] === contract.semantic_inventory[contractKey], `v1 accessibility audit inventory differs: ${contractKey}`);
}
expect(audit.verified.public_pages === browser.public_pages, 'v1 accessibility audit public-page count differs');
expect(audit.verified.page_checks === browser.page_checks, 'v1 accessibility audit check count differs');

const runner = read(RUNNER_PATH);
for (const marker of [
  "const viewport = { width: 1280, height: 900",
  "'--headless=new'",
  "skipLinkCount",
  "firstFocusableIsSkipLink",
  "headingJumps",
  "duplicateIds",
  "missingAriaRefs",
  "formControlsWithoutLabel",
  "nestedInteractive",
  "v1-accessibility-qa-discovery.json",
]) expect(runner.includes(marker), `v1 accessibility runner marker is missing: ${marker}`);

const doc = read(DOC_PATH);
for (const marker of [
  'V1-ACCESSIBILITY-QA-01',
  'Public pages: 771',
  'Browser DOM checks: 771',
  'Pages with accessibility errors: 0',
  'Heading-jump instances: 0',
  'Visible form controls: 40',
  'Details elements: 973',
  'Tables: 180',
  'Navigation landmarks: 1,126',
  'scripts/run-v1-accessibility-qa-browser.mjs',
  'scripts/check-v1-accessibility-qa.mjs',
  '.github/workflows/v1-accessibility-qa.yml',
  'V1-PERFORMANCE-QA-01',
]) expect(doc.includes(marker), `v1 accessibility documentation marker is missing: ${marker}`);

const workflow = read(WORKFLOW_PATH);
for (const marker of [
  'permissions:', 'contents: read', 'npm install --package-lock=false', 'npm run build',
  'node scripts/check-ux-polish-release.mjs', 'node scripts/check-seo-qa-release.mjs',
  'node scripts/check-v1-scope-freeze.mjs', 'node scripts/check-v1-data-audit.mjs',
  'node scripts/run-v1-accessibility-qa-browser.mjs',
  'mv v1-accessibility-qa-discovery.json v1-accessibility-qa-report.json',
  'node scripts/check-v1-accessibility-qa.mjs', 'git status --porcelain',
]) expect(workflow.includes(marker), `v1 accessibility workflow marker is missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) {
  expect(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `v1 accessibility workflow contains forbidden marker: ${forbidden}`);
}

console.log('V1_ACCESSIBILITY_QA: pass');
console.log(`PUBLIC_PAGES: ${browser.public_pages}`);
console.log(`PAGE_CHECKS: ${browser.page_checks}`);
console.log('PAGES_WITH_ERRORS: 0');
console.log('SKIP_LINK_ERRORS: 0');
console.log('HEADING_JUMP_INSTANCES: 0');
console.log('DUPLICATE_ID_INSTANCES: 0');
console.log('MISSING_ARIA_REFERENCE_INSTANCES: 0');
console.log('UNNAMED_INTERACTIVE_INSTANCES: 0');
console.log('FORM_LABEL_ERRORS: 0');
console.log('TABLE_HEADER_ERRORS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: V1-PERFORMANCE-QA-01');
