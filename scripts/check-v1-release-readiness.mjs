import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const count = (value, pattern) => (value.match(pattern) ?? []).length;

const files = {
  contract: 'data/static/v1-release-readiness-v1.json',
  audit: 'data/audits/v1-release-readiness-v1.json',
  readinessDoc: 'docs/release/v1-release-readiness.md',
  releaseNotes: 'docs/release/v1-release-notes.md',
  workflow: '.github/workflows/v1-release-readiness.yml',
  sitemap: 'dist/sitemap.xml',
  scope: 'data/static/v1-scope-freeze-v1.json',
  dataAudit: 'data/static/v1-data-audit-v1.json',
  mobile: 'data/static/v1-mobile-qa-v1.json',
  accessibility: 'data/static/v1-accessibility-qa-v1.json',
  performance: 'data/static/v1-performance-qa-v1.json',
  sourcePolicy: 'data/static/v1-source-policy-review-v1.json',
  limitations: 'data/static/v1-known-limitations-v1.json',
  performanceReport: 'v1-performance-qa-report.json',
};

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) fail(`required release-readiness file missing: ${file}`);
}
for (const file of [
  '.github/workflows/temporary-v1-release-readiness-discovery.yml',
  'scripts/temporary-discover-v1-release-readiness.mjs',
  'data/audits/temporary-v1-release-readiness-discovery.json',
  'v1-mobile-qa-report.json',
  'v1-accessibility-qa-report.json',
  'v1-performance-qa-discovery.json',
  'v1-release-readiness.log',
  'v1-release-readiness.exit',
]) {
  if (fs.existsSync(file)) fail(`temporary release-readiness file remains: ${file}`);
}

const contract = json(files.contract);
const audit = json(files.audit);
const scope = json(files.scope);
const dataAudit = json(files.dataAudit);
const mobile = json(files.mobile);
const accessibility = json(files.accessibility);
const performance = json(files.performance);
const sourcePolicy = json(files.sourcePolicy);
const limitations = json(files.limitations);
const performanceReport = json(files.performanceReport);
const sitemap = read(files.sitemap);
const currentPublicPages = count(sitemap, /<loc>/g);

if (contract.schema_version !== 'v1-release-readiness-v1') fail('release-readiness contract schema differs');
if (contract.release_id !== 'WHR-V1-PREPARATION-V1' || contract.work_id !== contract.release_id) fail('release-readiness identity differs');
if (contract.implementation_unit !== 'V1-RELEASE-READINESS-01') fail('release-readiness implementation unit differs');
if (contract.status !== 'release_candidate_ready' || contract.reviewed_at !== '2026-07-18') fail('release-readiness status differs');
if (contract.previous_implementation_unit !== 'V1-KNOWN-LIMITATIONS-01' || contract.next_implementation_unit !== 'V1-RELEASE-DECISION-01') fail('release-readiness roadmap linkage differs');

const expectedUnits = [
  'V1-SCOPE-FREEZE-01',
  'V1-DATA-AUDIT-01',
  'V1-MOBILE-QA-01',
  'V1-ACCESSIBILITY-QA-01',
  'V1-PERFORMANCE-QA-01',
  'V1-SOURCE-POLICY-REVIEW-01',
  'V1-KNOWN-LIMITATIONS-01',
];
if (!exact(contract.completed_units, expectedUnits)) fail('release-readiness completed-unit sequence differs');

const baselineContracts = [scope, dataAudit, mobile, accessibility, performance, sourcePolicy, limitations];
for (let index = 0; index < baselineContracts.length; index += 1) {
  const baseline = baselineContracts[index];
  if (baseline.release_id !== contract.release_id || baseline.work_id !== contract.work_id) fail(`release-readiness baseline identity differs: ${expectedUnits[index]}`);
  if (baseline.implementation_unit !== expectedUnits[index] || baseline.status !== 'complete') fail(`release-readiness baseline incomplete: ${expectedUnits[index]}`);
}

// Accepted-v1 inventory is immutable historical evidence.
const expectedInventory = {
  locales: 2,
  public_pages: 771,
  english_pages: 387,
  japanese_pages: 384,
  route_families: 17,
  audited_json_files: 154,
  top_level_data_rows: 462,
  official_source_records: 171,
  countries_and_regions_with_sources: 98,
  racecourse_records: 36,
  mobile_page_viewport_checks: 2313,
  accessibility_page_checks: 771,
  performance_measured_pages: 771,
  known_limitation_categories: 12,
  new_public_routes: 0,
  new_public_data_classes: 0,
};
if (!exact(contract.candidate_inventory, expectedInventory)) fail('release-readiness historical candidate inventory differs');
if (scope.baseline_inventory.public_pages !== 771 || scope.baseline_inventory.route_families !== 17) fail('release-readiness historical scope inventory differs');
if (dataAudit.input_inventory.audited_json_files !== 154 || dataAudit.input_inventory.top_level_rows !== 462) fail('release-readiness historical data inventory differs');
if (dataAudit.merged_collections.sources.records !== 171 || dataAudit.merged_collections.racecourses.records !== 36) fail('release-readiness historical merged collection inventory differs');
if (mobile.browser_audit.page_viewport_checks !== 2313 || Object.values(mobile.required_results).some((value) => value !== 0)) fail('release-readiness historical mobile acceptance differs');
if (accessibility.browser_audit.page_checks !== 771 || Object.values(accessibility.required_results).some((value) => value !== 0)) fail('release-readiness historical accessibility acceptance differs');
if (performance.baseline_inventory.measured_pages !== 771 || performance.baseline_inventory.javascript_files !== 0) fail('release-readiness historical performance inventory differs');
if (sourcePolicy.registry_inventory.source_records !== 171 || sourcePolicy.registry_inventory.countries_with_sources !== 98) fail('release-readiness source inventory differs');
if (sourcePolicy.registry_inventory.invalid_urls !== 0 || sourcePolicy.registry_inventory.non_https_urls !== 0 || sourcePolicy.registry_inventory.missing_public_notes !== 0) fail('release-readiness source quality differs');
if (limitations.public_audit.limitation_categories !== 12 || limitations.public_audit.new_public_routes !== 0 || limitations.public_audit.new_public_data_classes !== 0) fail('release-readiness known-limitations inventory differs');

for (const [key, value] of Object.entries(contract.quality_results ?? {})) {
  if (key.endsWith('_errors') && value !== 0) fail(`release-readiness quality error differs: ${key}`);
  if (!key.endsWith('_errors') && value !== true) fail(`release-readiness quality requirement differs: ${key}`);
}
if (contract.release_materials.release_notes !== files.releaseNotes || contract.release_materials.readiness_document !== files.readinessDoc) fail('release-readiness material paths differ');
for (const [key, value] of Object.entries(contract.release_materials)) {
  if (['release_notes', 'readiness_document'].includes(key)) continue;
  if (key === 'internal_revenue_budget_or_other_project_context_included') {
    if (value !== false) fail('release-readiness internal release-note boundary differs');
  } else if (value !== true) fail(`release-readiness material requirement differs: ${key}`);
}
for (const value of Object.values(contract.cleanup ?? {})) {
  if (typeof value === 'number' && value !== 0) fail('release-readiness cleanup count differs');
  if (typeof value === 'boolean' && value !== true) fail('release-readiness cleanup requirement differs');
}
if (contract.release_decision.readiness_decision !== 'ready_for_v1_release_decision') fail('release-readiness decision differs');
if (contract.release_decision.final_release_decision_complete !== false || contract.release_decision.release_tag_created !== false || contract.release_decision.deployment_authorized !== false || contract.release_decision.deployment_performed !== false) fail('release-readiness final-decision boundary differs');
if (contract.release_decision.next_required_unit !== 'V1-RELEASE-DECISION-01') fail('release-readiness next decision unit differs');

for (const key of ['public_boundary', 'privacy_boundary', 'automation_boundary']) {
  if (!exact(audit[key], contract[key])) fail(`release-readiness audit boundary differs: ${key}`);
}
if (audit.schema_version !== 'v1-release-readiness-audit-v1' || audit.release_id !== contract.release_id || audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.status !== contract.status || audit.reviewed_at !== contract.reviewed_at) fail('release-readiness audit identity differs');
for (const [key, value] of Object.entries(audit.readiness ?? {})) {
  if (['final_release_decision_complete', 'deployment_authorized', 'deployment_performed'].includes(key)) {
    if (value !== false) fail(`release-readiness audit final boundary differs: ${key}`);
  } else if (value !== true) fail(`release-readiness audit requirement differs: ${key}`);
}
for (const [key, value] of Object.entries(audit.verified ?? {})) {
  if (key.endsWith('_errors') || key.includes('new_public_') || key.includes('temporary_') || key === 'generated_diagnostic_files_committed') {
    if (value !== 0) fail(`release-readiness audit error count differs: ${key}`);
  }
}

// Current maintenance state must still satisfy the static-first performance contract,
// but the approved GA4 tag is the sole bounded external-runtime exception.
const analytics = performance.current_maintenance_exceptions?.google_analytics;
const expectedAnalyticsRuntimeReferences = currentPublicPages * (analytics?.external_runtime_references_per_page ?? 0);
if (performanceReport.schemaVersion !== 'v1-performance-qa-discovery-v1') fail('release-readiness performance report schema differs');
if (currentPublicPages < contract.candidate_inventory.public_pages) fail('release-readiness current public inventory shrank below accepted v1');
if (performanceReport.publicPages !== currentPublicPages || performanceReport.measuredPages !== currentPublicPages) fail('release-readiness current performance report page count differs from sitemap');
if (
  (performanceReport.typeTotals?.javascript?.files ?? 0) !== 0 ||
  performanceReport.missingLocalReferenceInstances !== 0 ||
  analytics?.status !== 'approved' ||
  analytics.measurement_id !== 'G-79W3MF08Y9' ||
  analytics.external_runtime_references_per_page !== 1 ||
  analytics.script_src_references_per_page !== 1 ||
  performanceReport.pagesWithExternalRuntimeReferences !== currentPublicPages ||
  performanceReport.externalRuntimeReferenceInstances !== expectedAnalyticsRuntimeReferences ||
  performanceReport.pagesWithScriptReferences !== currentPublicPages
) fail('release-readiness current bounded-runtime performance result differs');

for (const route of ['/faq/', '/ja/faq/', '/methods/', '/ja/methods/', '/sources/', '/ja/sources/']) {
  if (!sitemap.includes(`<loc>https://whr.badjoke-lab.com${route}</loc>`)) fail(`release-readiness required route missing: ${route}`);
}

const releaseNotes = read(files.releaseNotes);
for (const marker of [
  'Status: ready for final release decision',
  '771 public pages',
  '171 reviewed official-source records',
  'The site does not claim complete global coverage or real-time updates.',
  'What v1 does not publish',
  'Known limitations',
  '2,313 page-viewport checks',
  'does not create a release tag, publish automatically, authorize deployment, or perform deployment',
]) {
  if (!releaseNotes.includes(marker)) fail(`release-readiness release-note marker missing: ${marker}`);
}
for (const forbidden of ['other project', 'personal financial', 'operating budget', 'advertising revenue', 'private circumstance']) {
  if (releaseNotes.toLocaleLowerCase('en').includes(forbidden)) fail(`release-readiness release-note boundary violation: ${forbidden}`);
}

const readinessDoc = read(files.readinessDoc);
for (const marker of ['V1-RELEASE-READINESS-01', 'release candidate ready', 'completed v1 preparation sequence', 'public pages: 771', 'ready_for_v1_release_decision', 'V1-RELEASE-DECISION-01']) {
  if (!readinessDoc.toLocaleLowerCase('en').includes(marker.toLocaleLowerCase('en'))) fail(`release-readiness documentation marker missing: ${marker}`);
}

const workflow = read(files.workflow);
for (const marker of ['permissions:', 'contents: read', 'npm install --package-lock=false', 'npm run build', 'node scripts/check-seo-qa-release.mjs', 'node scripts/check-v1-scope-freeze.mjs', 'node scripts/check-v1-data-audit.mjs', 'node scripts/check-v1-source-policy-review.mjs', 'node scripts/check-v1-known-limitations.mjs', 'node scripts/run-v1-performance-qa.mjs', 'node scripts/check-v1-performance-qa.mjs', 'node scripts/check-v1-release-readiness.mjs', 'git status --porcelain']) {
  if (!workflow.includes(marker)) fail(`release-readiness workflow marker missing: ${marker}`);
}
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare pages deploy', 'git tag', 'gh release']) {
  if (workflow.toLocaleLowerCase('en').includes(forbidden.toLocaleLowerCase('en'))) fail(`release-readiness workflow forbidden marker: ${forbidden}`);
}

if (errors.length) {
  console.error(`V1_RELEASE_READINESS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('V1_RELEASE_READINESS: pass');
console.log(`HISTORICAL_PUBLIC_PAGES: ${contract.candidate_inventory.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${currentPublicPages}`);
console.log('COMPLETED_PREPARATION_UNITS: 7');
console.log('READINESS: ready_for_v1_release_decision');
console.log('FINAL_RELEASE_DECISION_COMPLETE: false');
console.log('DEPLOYMENT_AUTHORIZED: false');
console.log('NEXT_IMPLEMENTATION_UNIT: V1-RELEASE-DECISION-01');
