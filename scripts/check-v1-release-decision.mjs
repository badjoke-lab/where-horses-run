import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const count = (value, pattern) => (value.match(pattern) ?? []).length;

const files = {
  contract: 'data/static/v1-release-decision-v1.json',
  audit: 'data/audits/v1-release-decision-v1.json',
  decisionDoc: 'docs/release/v1-release-decision.md',
  releaseNotes: 'docs/release/v1-release-notes.md',
  workflow: '.github/workflows/v1-release-decision.yml',
  readiness: 'data/static/v1-release-readiness-v1.json',
  scope: 'data/static/v1-scope-freeze-v1.json',
  dataAudit: 'data/static/v1-data-audit-v1.json',
  mobile: 'data/static/v1-mobile-qa-v1.json',
  accessibility: 'data/static/v1-accessibility-qa-v1.json',
  performance: 'data/static/v1-performance-qa-v1.json',
  sourcePolicy: 'data/static/v1-source-policy-review-v1.json',
  limitations: 'data/static/v1-known-limitations-v1.json',
  sitemap: 'dist/sitemap.xml',
  performanceReport: 'v1-performance-qa-report.json',
};

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) fail(`required release-decision file missing: ${file}`);
}
for (const file of [
  '.github/workflows/temporary-v1-release-decision-discovery.yml',
  'scripts/temporary-discover-v1-release-decision.mjs',
  'data/audits/temporary-v1-release-decision-discovery.json',
  'v1-mobile-qa-report.json',
  'v1-accessibility-qa-report.json',
  'v1-performance-qa-discovery.json',
  'v1-release-decision.log',
  'v1-release-decision.exit',
]) {
  if (fs.existsSync(file)) fail(`temporary release-decision file remains: ${file}`);
}

const contract = json(files.contract);
const audit = json(files.audit);
const readiness = json(files.readiness);
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

if (contract.schema_version !== 'v1-release-decision-v1') fail('release-decision contract schema differs');
if (contract.release_id !== 'WHR-V1' || contract.preparation_release_id !== 'WHR-V1-PREPARATION-V1' || contract.work_id !== 'WHR-V1-RELEASE') fail('release-decision identity differs');
if (contract.implementation_unit !== 'V1-RELEASE-DECISION-01') fail('release-decision implementation unit differs');
if (contract.status !== 'complete' || contract.decided_at !== '2026-07-19') fail('release-decision state differs');
if (contract.decision !== 'accepted_for_reviewed_static_public_release') fail('release-decision result differs');
if (contract.previous_implementation_unit !== 'V1-RELEASE-READINESS-01' || contract.next_stage !== 'reviewed_incremental_maintenance') fail('release-decision roadmap linkage differs');

if (readiness.release_id !== contract.preparation_release_id || readiness.implementation_unit !== 'V1-RELEASE-READINESS-01' || readiness.status !== 'release_candidate_ready') fail('release-readiness baseline is incomplete');
if (readiness.release_decision.readiness_decision !== 'ready_for_v1_release_decision' || readiness.release_decision.final_release_decision_complete !== false) fail('release-readiness handoff differs');

// The accepted v1 baseline is immutable historical evidence.
const expectedBaseline = {
  release_readiness_unit: 'V1-RELEASE-READINESS-01',
  release_readiness_status: 'release_candidate_ready',
  baseline_commit: '57da4a73d0646603eb59e3f5faff9ceaf5a3213e',
  public_pages: 771,
  english_pages: 387,
  japanese_pages: 384,
  route_families: 17,
  official_source_records: 171,
  countries_and_regions_with_sources: 98,
  racecourse_records: 36,
  known_limitation_categories: 12,
};
if (!exact(contract.candidate_baseline, expectedBaseline)) fail('release-decision candidate baseline differs');
if (!/^[0-9a-f]{40}$/.test(contract.candidate_baseline.baseline_commit)) fail('release-decision baseline commit is invalid');

const baselineUnits = [
  [scope, 'V1-SCOPE-FREEZE-01'],
  [dataAudit, 'V1-DATA-AUDIT-01'],
  [mobile, 'V1-MOBILE-QA-01'],
  [accessibility, 'V1-ACCESSIBILITY-QA-01'],
  [performance, 'V1-PERFORMANCE-QA-01'],
  [sourcePolicy, 'V1-SOURCE-POLICY-REVIEW-01'],
  [limitations, 'V1-KNOWN-LIMITATIONS-01'],
];
for (const [baseline, unit] of baselineUnits) {
  if (baseline.release_id !== contract.preparation_release_id || baseline.implementation_unit !== unit || baseline.status !== 'complete') fail(`release-decision baseline incomplete: ${unit}`);
}

if (scope.baseline_inventory.public_pages !== 771 || scope.baseline_inventory.english_pages !== 387 || scope.baseline_inventory.japanese_pages !== 384 || scope.baseline_inventory.route_families !== 17) fail('release-decision historical scope inventory differs');
if (dataAudit.input_inventory.audited_json_files !== 154 || dataAudit.input_inventory.top_level_rows !== 462) fail('release-decision historical data inventory differs');
if (dataAudit.merged_collections.sources.records !== 171 || dataAudit.merged_collections.racecourses.records !== 36) fail('release-decision historical merged collections differ');
if (mobile.browser_audit.page_viewport_checks !== 2313 || Object.values(mobile.required_results).some((value) => value !== 0)) fail('release-decision historical mobile acceptance differs');
if (accessibility.browser_audit.page_checks !== 771 || Object.values(accessibility.required_results).some((value) => value !== 0)) fail('release-decision historical accessibility acceptance differs');
if (performance.baseline_inventory.measured_pages !== 771 || performance.baseline_inventory.javascript_files !== 0) fail('release-decision historical performance inventory differs');
if (sourcePolicy.registry_inventory.source_records !== 171 || sourcePolicy.registry_inventory.countries_with_sources !== 98 || sourcePolicy.registry_inventory.invalid_urls !== 0 || sourcePolicy.registry_inventory.non_https_urls !== 0 || sourcePolicy.registry_inventory.missing_public_notes !== 0) fail('release-decision source policy differs');
if (limitations.public_audit.limitation_categories !== 12 || limitations.public_audit.new_public_routes !== 0 || limitations.public_audit.new_public_data_classes !== 0) fail('release-decision limitation inventory differs');

for (const [key, value] of Object.entries(contract.release_criteria ?? {})) {
  if (value !== true) fail(`release-decision criterion differs: ${key}`);
}
const expectedActions = {
  final_release_decision_complete: true,
  production_deployment_authorized: true,
  production_deployment_trigger: 'merge_to_main',
  deployment_performed_by_release_gate: false,
  production_confirmation_required_after_merge: true,
  production_confirmation_recorded_by_this_contract: false,
  recommended_release_tag: 'v1.0.0',
  release_tag_required_for_acceptance: false,
  release_tag_created_by_this_unit: false,
  github_release_created_by_this_unit: false,
};
if (!exact(contract.release_actions, expectedActions)) fail('release-decision action boundary differs');

const expectedOperatingModel = {
  public_surface: 'static_build_from_reviewed_public_projection',
  ordinary_coverage: 'incremental_partial_allowed',
  completion_claims: 'explicit_completion_audit_only',
  source_confirmation: 'official_source_remains_final_authority',
  maintenance: 'reviewed_incremental_operation',
  publication: 'human_reviewed_merge_only',
  unattended_publication: false,
};
if (!exact(contract.accepted_operating_model, expectedOperatingModel)) fail('release-decision operating model differs');

for (const evidence of contract.evidence_records ?? []) {
  if (!fs.existsSync(evidence)) fail(`release-decision evidence file missing: ${evidence}`);
}
if ((contract.evidence_records ?? []).length !== 10) fail('release-decision evidence inventory differs');
if (!Array.isArray(contract.non_claims) || contract.non_claims.length !== 7) fail('release-decision non-claim inventory differs');

if (audit.schema_version !== 'v1-release-decision-audit-v1' || audit.release_id !== contract.release_id || audit.preparation_release_id !== contract.preparation_release_id || audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.status !== contract.status || audit.decided_at !== contract.decided_at || audit.decision !== contract.decision) fail('release-decision audit identity differs');
for (const key of ['public_boundary', 'privacy_boundary', 'automation_boundary']) {
  if (!exact(audit[key], contract[key])) fail(`release-decision audit boundary differs: ${key}`);
}
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_stage !== contract.next_stage) fail('release-decision audit roadmap linkage differs');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('release-decision behavior differs');

const expectedDecisionResults = {
  release_candidate_accepted: true,
  final_release_decision_complete: true,
  production_deployment_authorized: true,
  deployment_performed_by_release_gate: false,
  release_tag_required_for_acceptance: false,
  release_tag_created_by_this_unit: false,
  github_release_created_by_this_unit: false,
  reviewed_incremental_maintenance_is_next_stage: true,
};
if (!exact(audit.decision_results, expectedDecisionResults)) fail('release-decision audit results differ');
for (const [key, value] of Object.entries(audit.verified ?? {})) {
  if (key.endsWith('_errors') || key.includes('new_public_') || key.includes('temporary_') || key === 'generated_diagnostic_files_committed') {
    if (value !== 0) fail(`release-decision audit error count differs: ${key}`);
  }
}

// Current reviewed maintenance must satisfy the same static-first quality contract,
// while approved existing-route growth is allowed after the accepted v1 baseline.
if (currentPublicPages < contract.candidate_baseline.public_pages) fail('release-decision current public inventory shrank below accepted v1');
if (performanceReport.schemaVersion !== 'v1-performance-qa-discovery-v1') fail('release-decision performance report schema differs');
if (performanceReport.publicPages !== currentPublicPages || performanceReport.measuredPages !== currentPublicPages || (performanceReport.typeTotals?.javascript?.files ?? 0) !== 0) fail('release-decision current performance report inventory differs');
if (performanceReport.externalRuntimeReferenceInstances !== 0 || performanceReport.missingLocalReferenceInstances !== 0) fail('release-decision current static-first performance result differs');

for (const route of ['/calendar/', '/ja/calendar/', '/today/', '/ja/today/', '/tomorrow/', '/ja/tomorrow/', '/faq/', '/ja/faq/', '/methods/', '/ja/methods/', '/sources/', '/ja/sources/']) {
  if (!sitemap.includes(`<loc>https://whr.badjoke-lab.com${route}</loc>`)) fail(`release-decision required route missing: ${route}`);
}

const decisionDoc = read(files.decisionDoc);
for (const marker of [
  'V1-RELEASE-DECISION-01',
  'accepted for reviewed static public release',
  'public pages: 771',
  'Production deployment is authorized',
  'release-decision gate itself remains read-only',
  'v1.0.0',
  'reviewed incremental maintenance',
]) {
  if (!decisionDoc.includes(marker)) fail(`release-decision documentation marker missing: ${marker}`);
}

const releaseNotes = read(files.releaseNotes);
for (const marker of [
  'Status: accepted for reviewed static public release',
  '771 public pages',
  '171 reviewed official-source records',
  'The site does not claim complete global coverage or real-time updates.',
  'final release decision',
  'Production deployment is authorized',
  'v1.0.0',
  'Unattended publication',
]) {
  if (!releaseNotes.includes(marker)) fail(`release-decision release-note marker missing: ${marker}`);
}
for (const forbidden of ['other project', 'personal financial', 'operating budget', 'advertising revenue', 'private circumstance']) {
  if (releaseNotes.toLocaleLowerCase('en').includes(forbidden)) fail(`release-decision release-note boundary violation: ${forbidden}`);
}

const workflow = read(files.workflow);
for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-v1-release-readiness.mjs',
  'node scripts/run-v1-performance-qa.mjs',
  'node scripts/check-v1-performance-qa.mjs',
  'node scripts/check-v1-release-decision.mjs',
  'git status --porcelain',
]) {
  if (!workflow.includes(marker)) fail(`release-decision workflow marker missing: ${marker}`);
}
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare pages deploy', 'git tag', 'gh release', 'git push']) {
  if (workflow.toLocaleLowerCase('en').includes(forbidden.toLocaleLowerCase('en'))) fail(`release-decision workflow forbidden marker: ${forbidden}`);
}

if (errors.length) {
  console.error(`V1_RELEASE_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('V1_RELEASE_DECISION: pass');
console.log('RELEASE_ID: WHR-V1');
console.log(`HISTORICAL_PUBLIC_PAGES: ${contract.candidate_baseline.public_pages}`);
console.log(`CURRENT_PUBLIC_PAGES: ${currentPublicPages}`);
console.log('DECISION: accepted_for_reviewed_static_public_release');
console.log('FINAL_RELEASE_DECISION_COMPLETE: true');
console.log('PRODUCTION_DEPLOYMENT_AUTHORIZED: true');
console.log('NEXT_STAGE: reviewed_incremental_maintenance');
