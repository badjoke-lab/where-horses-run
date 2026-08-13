import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const CONTRACT_PATH = 'data/static/v1-performance-qa-v1.json';
const AUDIT_PATH = 'data/audits/v1-performance-qa-v1.json';
const DOC_PATH = 'docs/release/v1-performance-qa.md';
const WORKFLOW_PATH = '.github/workflows/v1-performance-qa.yml';
const REPORT_PATH = 'v1-performance-qa-report.json';
const RUNNER_PATH = 'scripts/run-v1-performance-qa.mjs';
const LEGACY_SOURCE_PATH = 'src/pages/major-countries/timetable.astro';
const SITEMAP_PATH = 'dist/sitemap.xml';
const BASELINES = {
  scope: 'data/static/v1-scope-freeze-v1.json',
  data: 'data/static/v1-data-audit-v1.json',
  mobile: 'data/static/v1-mobile-qa-v1.json',
  accessibility: 'data/static/v1-accessibility-qa-v1.json',
  seo: 'data/static/seo-qa-release-v1.json',
};
const TEMPORARY_PATHS = [
  '.github/workflows/temporary-v1-performance-qa-discovery.yml',
  'scripts/temporary-discover-v1-performance-qa.mjs',
  'scripts/temporary-measure-v1-performance-key-pages.mjs',
];
const CURRENT_MAINTENANCE_HEADROOM_FACTOR = 1.05;
const CURRENT_MAINTENANCE_HEADROOM_KEYS = new Set([
  'dist_bytes_max',
  'html_bytes_total_max',
  'largest_html_bytes_max',
  'p95_html_bytes_max',
  'p95_element_tags_max',
  'inline_style_bytes_max',
]);

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const gzipBytes = (buffer) => zlib.gzipSync(buffer, { level: 9 }).length;

for (const file of [CONTRACT_PATH, AUDIT_PATH, DOC_PATH, WORKFLOW_PATH, REPORT_PATH, RUNNER_PATH, LEGACY_SOURCE_PATH, SITEMAP_PATH, ...Object.values(BASELINES)]) {
  expect(fs.existsSync(file), `Required v1 performance QA file is missing: ${file}`);
}
for (const file of TEMPORARY_PATHS) expect(!fs.existsSync(file), `Temporary performance QA file remains: ${file}`);

const contract = json(CONTRACT_PATH);
const audit = json(AUDIT_PATH);
const report = json(REPORT_PATH);
const scope = json(BASELINES.scope);
const dataAudit = json(BASELINES.data);
const mobile = json(BASELINES.mobile);
const accessibility = json(BASELINES.accessibility);
const seo = json(BASELINES.seo);

expect(contract.schema_version === 'v1-performance-qa-v1', 'v1 performance contract schema differs');
expect(contract.release_id === 'WHR-V1-PREPARATION-V1' && contract.work_id === contract.release_id, 'v1 performance identity differs');
expect(contract.implementation_unit === 'V1-PERFORMANCE-QA-01', 'v1 performance unit differs');
expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18', 'v1 performance status or date differs');
expect(contract.previous_implementation_unit === 'V1-ACCESSIBILITY-QA-01', 'v1 performance previous unit differs');
expect(contract.next_implementation_unit === 'V1-SOURCE-POLICY-REVIEW-01', 'v1 performance next unit differs');
expect(scope.implementation_unit === contract.scope_contract_id && scope.status === 'complete', 'v1 scope baseline is incomplete');
expect(dataAudit.implementation_unit === contract.data_audit_contract_id && dataAudit.status === 'complete', 'v1 data baseline is incomplete');
expect(mobile.implementation_unit === contract.mobile_qa_contract_id && mobile.status === 'complete', 'v1 mobile baseline is incomplete');
expect(accessibility.implementation_unit === contract.accessibility_qa_contract_id && accessibility.status === 'complete', 'v1 accessibility baseline is incomplete');
expect(seo.release_id === contract.baseline_release_id && seo.status === 'release_ready', 'Phase 11 SEO baseline is incomplete');

expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'v1 performance privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'v1 performance automation boundary differs');
for (const [key, value] of Object.entries(contract.public_boundary)) {
  const allowed = ['existing_route_families_only', 'existing_public_data_classes_only', 'performance_reduction_and_legacy_retirement_allowed'].includes(key);
  expect(value === allowed, `v1 performance public boundary differs: ${key}`);
}

expect(audit.schema_version === 'v1-performance-qa-audit-v1', 'v1 performance audit schema differs');
expect(audit.release_id === contract.release_id && audit.work_id === contract.work_id, 'v1 performance audit identity differs');
expect(audit.implementation_unit === contract.implementation_unit, 'v1 performance audit unit differs');
expect(audit.status === contract.status && audit.reviewed_at === contract.reviewed_at, 'v1 performance audit status differs');
expect(exact(audit.public_boundary, contract.public_boundary), 'v1 performance audit public boundary differs');
expect(exact(audit.privacy_boundary, contract.privacy_boundary), 'v1 performance audit privacy boundary differs');
expect(exact(audit.automation_boundary, contract.automation_boundary), 'v1 performance audit automation boundary differs');
expect(Object.values(audit.behavior).every((value) => value === true), 'v1 performance audit behavior differs');

// The contract and audit retain the 2026-07-18 measurement as historical evidence.
// Current builds may contain additional human-reviewed routes inside the frozen v1
// route families and public data classes. Keep that historical evidence exact,
// derive current inventory from the rendered sitemap, scale aggregate ceilings for
// reviewed page-count growth, and allow only a narrow five-percent maintenance
// headroom for raw HTML shell metrics affected by persistent bilingual navigation.
const baseline = contract.baseline_inventory;
const historicalAuditMap = {
  public_pages: 'public_pages',
  rendered_html_pages: 'rendered_html_pages',
  measured_pages: 'measured_pages',
  dist_files: 'dist_files',
  dist_bytes: 'dist_bytes',
  dist_gzip_bytes: 'dist_gzip_bytes',
  html_files: 'html_files',
  html_bytes: 'html_bytes',
  html_gzip_bytes: 'html_gzip_bytes',
  css_files: 'css_files',
  css_bytes: 'css_bytes',
  css_gzip_bytes: 'css_gzip_bytes',
  javascript_files: 'javascript_files',
  image_files: 'image_files',
  image_bytes: 'image_bytes',
  data_files: 'data_files',
  data_bytes: 'data_bytes',
};
for (const [baselineKey, auditKey] of Object.entries(historicalAuditMap)) {
  expect(audit.verified[auditKey] === baseline[baselineKey], `historical performance audit differs: ${auditKey}`);
}
expect(scope.baseline_inventory.public_pages === baseline.public_pages, 'historical v1 performance/scope page baseline differs');
expect(contract.static_first_results.pages_with_inline_scripts === baseline.public_pages, 'historical inline-script page baseline differs');

const sitemapUrls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const currentPublicPages = sitemapUrls.length;
const baselineNonHtmlFiles = baseline.dist_files - baseline.html_files;
expect(currentPublicPages >= baseline.public_pages, `current performance inventory regressed ${currentPublicPages}`);

expect(report.schemaVersion === 'v1-performance-qa-discovery-v1', 'v1 performance report schema differs');
expect(report.publicPages === currentPublicPages, `v1 performance public-page count differs (${report.publicPages} !== ${currentPublicPages})`);
expect(report.renderedHtmlPages === currentPublicPages, `v1 performance rendered-page count differs (${report.renderedHtmlPages} !== ${currentPublicPages})`);
expect(report.measuredPages === currentPublicPages, `v1 performance measured-page count differs (${report.measuredPages} !== ${currentPublicPages})`);
expect(report.distFiles === currentPublicPages + baselineNonHtmlFiles, `v1 performance distribution file count differs (${report.distFiles} !== ${currentPublicPages + baselineNonHtmlFiles})`);
expect(report.typeTotals.html.files === currentPublicPages, `v1 performance HTML file count differs (${report.typeTotals.html.files} !== ${currentPublicPages})`);

const budget = contract.regression_budgets;
expect(report.typeTotals.css.files <= budget.css_files_max, 'v1 performance CSS file count exceeds budget');
expect((report.typeTotals.javascript?.files ?? 0) <= budget.javascript_files_max, 'v1 performance JavaScript file count exceeds budget');
expect(report.typeTotals.image.files <= baseline.image_files, 'v1 performance image file count increased');
expect(report.typeTotals.data.files <= baseline.data_files, 'v1 performance crawler data file count increased');

const checks = {
  dist_bytes_max: report.distBytes,
  dist_gzip_bytes_max: report.distGzipBytes,
  html_bytes_total_max: report.typeTotals.html.bytes,
  html_gzip_bytes_total_max: report.typeTotals.html.gzipBytes,
  largest_html_bytes_max: report.pageDistributions.htmlBytes.max,
  largest_html_gzip_bytes_max: report.pageDistributions.htmlGzipBytes.max,
  largest_element_tags_max: report.pageDistributions.elementTags.max,
  p95_html_bytes_max: report.pageDistributions.htmlBytes.p95,
  p95_html_gzip_bytes_max: report.pageDistributions.htmlGzipBytes.p95,
  p95_element_tags_max: report.pageDistributions.elementTags.p95,
  css_files_max: report.typeTotals.css.files,
  css_bytes_max: report.typeTotals.css.bytes,
  css_gzip_bytes_max: report.typeTotals.css.gzipBytes,
  javascript_files_max: report.typeTotals.javascript?.files ?? 0,
  pages_with_script_references_max: report.pagesWithScriptReferences,
  external_runtime_reference_instances_max: report.externalRuntimeReferenceInstances,
  missing_local_reference_instances_max: report.missingLocalReferenceInstances,
  unique_local_asset_references_per_page_max: report.pageDistributions.uniqueLocalAssetReferences.max,
  inline_script_bytes_max: report.pageDistributions.inlineScriptBytes.max,
  p95_inline_script_bytes_max: report.pageDistributions.inlineScriptBytes.p95,
  inline_style_bytes_max: report.pageDistributions.inlineStyleBytes.max,
};
const aggregateBudgetKeys = new Set([
  'dist_bytes_max',
  'dist_gzip_bytes_max',
  'html_bytes_total_max',
  'html_gzip_bytes_total_max',
]);
const aggregateScale = currentPublicPages / baseline.public_pages;
for (const [key, actual] of Object.entries(checks)) {
  let limit = aggregateBudgetKeys.has(key) ? Math.ceil(budget[key] * aggregateScale) : budget[key];
  if (CURRENT_MAINTENANCE_HEADROOM_KEYS.has(key)) {
    limit = Math.ceil(limit * CURRENT_MAINTENANCE_HEADROOM_FACTOR);
  }
  expect(actual <= limit, `v1 performance budget exceeded: ${key} (${actual} > ${limit})`);
}

expect(report.pagesWithExternalRuntimeReferences === 0, 'pages with external runtime references remain');
expect(report.externalRuntimeReferenceInstances === 0 && report.externalRuntimeReferences.length === 0, 'external runtime references remain');
expect(report.missingLocalReferenceInstances === 0 && report.missingLocalReferences.length === 0, 'missing local references remain');
expect(report.pagesWithScriptReferences === 0, 'script src references remain');
expect(report.pagesWithInlineScripts === currentPublicPages, `inline-script page count differs (${report.pagesWithInlineScripts} !== ${currentPublicPages})`);
expect(report.pagesWithImages === 0 && report.pagesWithPreloads === 0, 'image or preload page count differs');

function measureKeyPage(item) {
  const file = path.join('dist', item.file);
  expect(fs.existsSync(file), `key performance page is missing: ${item.file}`);
  const buffer = fs.readFileSync(file);
  const html = buffer.toString('utf8');
  return {
    file: item.file,
    bytes: buffer.length,
    gzip_bytes: gzipBytes(buffer),
    element_tags: (html.match(/<[a-z][^>]*>/gi) ?? []).length,
  };
}
const keyPages = {};
for (const [id, item] of Object.entries(contract.key_pages)) keyPages[id] = measureKeyPage(item);

const legacy = keyPages.legacy_major_country_timetable;
expect(legacy.bytes <= budget.legacy_timetable_bytes_max, 'legacy timetable raw budget exceeded');
expect(legacy.gzip_bytes <= budget.legacy_timetable_gzip_bytes_max, 'legacy timetable gzip budget exceeded');
expect(legacy.element_tags <= budget.legacy_timetable_element_tags_max, 'legacy timetable tag budget exceeded');
for (const id of ['current_timetable_en', 'current_timetable_ja']) {
  const currentTimetableRawLimit = Math.ceil(budget.current_timetable_bytes_max * CURRENT_MAINTENANCE_HEADROOM_FACTOR);
  expect(keyPages[id].bytes <= currentTimetableRawLimit, `${id} raw maintenance budget exceeded`);
  expect(keyPages[id].gzip_bytes <= budget.current_timetable_gzip_bytes_max, `${id} gzip budget exceeded`);
  expect(keyPages[id].element_tags <= budget.current_timetable_element_tags_max, `${id} tag budget exceeded`);
}
for (const id of ['search_en', 'search_ja']) {
  expect(keyPages[id].bytes <= budget.search_page_bytes_max, `${id} raw budget exceeded`);
  expect(keyPages[id].gzip_bytes <= budget.search_page_gzip_bytes_max, `${id} gzip budget exceeded`);
}
for (const id of ['sources_en', 'sources_ja']) {
  expect(keyPages[id].bytes <= budget.sources_page_bytes_max, `${id} raw budget exceeded`);
  expect(keyPages[id].gzip_bytes <= budget.sources_page_gzip_bytes_max, `${id} gzip budget exceeded`);
}

const legacySource = read(LEGACY_SOURCE_PATH);
for (const marker of [
  'Legacy Major-Country Timetable Retired',
  'Legacy timetable retired',
  '/major-countries/current-timetable/',
  '/calendar/', '/today/', '/tomorrow/', '/countries/',
  'Public list pages keep one meeting per row.',
]) expect(legacySource.includes(marker), `legacy timetable source marker is missing: ${marker}`);
expect(!legacySource.includes('major-country-timetable-v0.json'), 'legacy timetable still imports bulk v0 data');
expect(!legacySource.includes('record.races.map'), 'legacy timetable still expands race rows');
expect(contract.legacy_retirement.html_bytes_reduced === contract.legacy_retirement.before_html_bytes - contract.legacy_retirement.after_html_bytes, 'legacy HTML reduction arithmetic differs');
expect(contract.legacy_retirement.dist_bytes_reduced === contract.legacy_retirement.before_dist_bytes - contract.legacy_retirement.after_dist_bytes, 'legacy dist reduction arithmetic differs');
expect(audit.legacy_retirement.html_bytes_reduced === contract.legacy_retirement.html_bytes_reduced, 'legacy audit HTML reduction differs');
expect(audit.legacy_retirement.element_tags_reduced === contract.legacy_retirement.element_tags_reduced, 'legacy audit tag reduction differs');

const runner = read(RUNNER_PATH);
for (const marker of [
  "import zlib from 'node:zlib'", "const siteOrigin = 'https://whr.badjoke-lab.com'",
  'pageDistributions', 'externalRuntimeReferences', 'missingLocalReferences',
  'largestPages', 'largestAssets', 'v1-performance-qa-discovery.json',
]) expect(runner.includes(marker), `v1 performance runner marker is missing: ${marker}`);

const doc = read(DOC_PATH);
for (const marker of [
  'V1-PERFORMANCE-QA-01', 'Public pages: 771', 'Distribution bytes: 10,572,496',
  'HTML bytes before: 496,330', 'HTML bytes after: 8,213', 'HTML bytes reduced: 488,117',
  'External runtime references: 0', 'HTML bytes max: 291,083',
  'scripts/run-v1-performance-qa.mjs', 'scripts/check-v1-performance-qa.mjs',
  '.github/workflows/v1-performance-qa.yml', 'V1-SOURCE-POLICY-REVIEW-01',
]) expect(doc.includes(marker), `v1 performance documentation marker is missing: ${marker}`);

const workflow = read(WORKFLOW_PATH);
for (const marker of [
  'permissions:', 'contents: read', 'npm install --package-lock=false', 'npm run build',
  'node scripts/check-ux-polish-release.mjs', 'node scripts/check-seo-qa-release.mjs',
  'node scripts/check-v1-scope-freeze.mjs', 'node scripts/check-v1-data-audit.mjs',
  'node scripts/run-v1-performance-qa.mjs',
  'mv v1-performance-qa-discovery.json v1-performance-qa-report.json',
  'node scripts/check-v1-performance-qa.mjs', 'git status --porcelain',
]) expect(workflow.includes(marker), `v1 performance workflow marker is missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) {
  expect(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `v1 performance workflow contains forbidden marker: ${forbidden}`);
}

expect(audit.verified.performance_budget_errors === 0, 'performance budget audit errors differ');
console.log('V1_PERFORMANCE_QA: pass');
console.log(`HISTORICAL_PUBLIC_PAGES: ${baseline.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${report.publicPages}`);
console.log(`AGGREGATE_BUDGET_SCALE: ${aggregateScale.toFixed(6)}`);
console.log(`CURRENT_MAINTENANCE_HEADROOM_FACTOR: ${CURRENT_MAINTENANCE_HEADROOM_FACTOR.toFixed(2)}`);
console.log(`DIST_BYTES: ${report.distBytes}`);
console.log(`DIST_GZIP_BYTES: ${report.distGzipBytes}`);
console.log(`LARGEST_HTML_BYTES: ${report.pageDistributions.htmlBytes.max}`);
console.log(`P95_HTML_BYTES: ${report.pageDistributions.htmlBytes.p95}`);
console.log('EXTERNAL_RUNTIME_REFERENCE_INSTANCES: 0');
console.log('MISSING_LOCAL_REFERENCE_INSTANCES: 0');
console.log(`LEGACY_TIMETABLE_BYTES: ${legacy.bytes}`);
console.log('NEXT_IMPLEMENTATION_UNIT: V1-SOURCE-POLICY-REVIEW-01');
