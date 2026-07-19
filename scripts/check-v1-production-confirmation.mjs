import fs from 'node:fs';

const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const files = {
  contract: 'data/static/v1-production-confirmation-v1.json',
  audit: 'data/audits/v1-production-confirmation-v1.json',
  releaseDecision: 'data/static/v1-release-decision-v1.json',
  report: 'v1-production-confirmation-report.json',
  runner: 'scripts/run-v1-production-confirmation.mjs',
  checker: 'scripts/check-v1-production-confirmation.mjs',
  workflow: '.github/workflows/v1-production-confirmation.yml',
  documentation: 'docs/release/v1-production-confirmation.md',
};

for (const file of Object.values(files)) if (!fs.existsSync(file)) fail(`required production-confirmation file missing: ${file}`);
for (const file of [
  '.github/workflows/temporary-v1-production-confirmation.yml',
  'scripts/temporary-v1-production-confirmation.mjs',
  'v1-production-confirmation-discovery.json',
]) {
  if (fs.existsSync(file)) fail(`temporary production-confirmation file remains: ${file}`);
}

const contract = json(files.contract);
const audit = json(files.audit);
const releaseDecision = json(files.releaseDecision);
const report = json(files.report);

if (contract.schema_version !== 'v1-production-confirmation-v1') fail('production-confirmation contract schema differs');
if (contract.release_id !== 'WHR-V1' || contract.work_id !== 'WHR-V1-RELEASE') fail('production-confirmation identity differs');
if (contract.implementation_unit !== 'V1-PRODUCTION-CONFIRMATION-01') fail('production-confirmation implementation unit differs');
if (contract.status !== 'complete' || contract.confirmed_at !== '2026-07-19') fail('production-confirmation state differs');
if (contract.origin !== 'https://whr.badjoke-lab.com') fail('production-confirmation origin differs');
if (contract.release_decision_unit !== 'V1-RELEASE-DECISION-01') fail('production-confirmation release-decision linkage differs');
if (contract.release_commit !== '6d45895fb04ccbc3160e763c54438a4d51dff905') fail('production-confirmation release commit differs');
if (contract.previous_implementation_unit !== 'V1-RELEASE-DECISION-01' || contract.next_stage !== 'reviewed_incremental_maintenance') fail('production-confirmation roadmap linkage differs');

if (releaseDecision.release_id !== contract.release_id || releaseDecision.implementation_unit !== contract.release_decision_unit || releaseDecision.status !== 'complete' || releaseDecision.decision !== 'accepted_for_reviewed_static_public_release') fail('production-confirmation release decision is incomplete');
if (releaseDecision.release_actions.production_deployment_authorized !== true || releaseDecision.release_actions.production_confirmation_required_after_merge !== true) fail('production-confirmation release action boundary differs');

if (!Array.isArray(contract.required_routes) || contract.required_routes.length !== 12) fail('production-confirmation route inventory differs');
if (contract.required_routes.filter((item) => item.kind === 'html').length !== 10) fail('production-confirmation HTML route inventory differs');
if (contract.required_routes.filter((item) => item.kind === 'sitemap').length !== 1) fail('production-confirmation sitemap inventory differs');
if (contract.required_routes.filter((item) => item.kind === 'robots').length !== 1) fail('production-confirmation robots inventory differs');
if (new Set(contract.required_routes.map((item) => item.path)).size !== 12) fail('production-confirmation route paths are not unique');

const expectedAcceptance = {
  required_route_checks: 12,
  required_html_checks: 10,
  required_sitemap_checks: 1,
  required_robots_checks: 1,
  failed_requests_allowed: 0,
  non_200_responses_allowed: 0,
  redirect_origin_errors_allowed: 0,
  content_type_errors_allowed: 0,
  marker_errors_allowed: 0,
  language_errors_allowed: 0,
  canonical_errors_allowed: 0,
  sitemap_count_errors_allowed: 0,
  sitemap_route_errors_allowed: 0,
  robots_errors_allowed: 0,
};
if (!exact(contract.acceptance, expectedAcceptance)) fail('production-confirmation acceptance boundary differs');
if (contract.response_contract.required_http_status !== 200 || contract.response_contract.sitemap_url_count !== 771) fail('production-confirmation response contract differs');
if (contract.request_contract.external_network_required !== true || contract.request_contract.authentication_required !== false) fail('production-confirmation request boundary differs');

if (report.schema_version !== 'v1-production-confirmation-report-v1') fail('production-confirmation report schema differs');
if (report.release_id !== contract.release_id || report.implementation_unit !== contract.implementation_unit || report.release_commit !== contract.release_commit || report.origin !== contract.origin) fail('production-confirmation report identity differs');
if (!Number.isFinite(Date.parse(report.checked_at))) fail('production-confirmation report timestamp is invalid');
if (!Array.isArray(report.routes) || report.routes.length !== contract.required_routes.length) fail('production-confirmation report route count differs');

const aggregateExpected = {
  required_route_checks: 12,
  completed_route_checks: 12,
  failed_requests: 0,
  non_200_responses: 0,
  redirect_origin_errors: 0,
  content_type_errors: 0,
  marker_errors: 0,
  language_errors: 0,
  canonical_errors: 0,
  sitemap_count_errors: 0,
  sitemap_route_errors: 0,
  robots_errors: 0,
  total_route_errors: 0,
};
if (!exact(report.aggregate, aggregateExpected)) fail(`production-confirmation aggregate differs: ${JSON.stringify(report.aggregate)}`);

const contractByPath = new Map(contract.required_routes.map((item) => [item.path, item]));
for (const result of report.routes ?? []) {
  const expected = contractByPath.get(result.path);
  if (!expected) {
    fail(`production-confirmation unexpected route: ${result.path}`);
    continue;
  }
  if (result.kind !== expected.kind) fail(`production-confirmation route kind differs: ${result.path}`);
  if (result.status !== 200) fail(`production-confirmation route status differs: ${result.path}`);
  if (new URL(result.final_url).origin !== contract.origin) fail(`production-confirmation final origin differs: ${result.path}`);
  if (!Number.isInteger(result.bytes) || result.bytes <= 0) fail(`production-confirmation empty response: ${result.path}`);
  if (!Number.isInteger(result.duration_ms) || result.duration_ms < 0 || result.duration_ms > contract.request_contract.timeout_ms) fail(`production-confirmation duration differs: ${result.path}`);
  if (!Array.isArray(result.errors) || result.errors.length !== 0) fail(`production-confirmation route errors remain: ${result.path}`);
  for (const [name, value] of Object.entries(result.checks ?? {})) if (value !== true) fail(`production-confirmation route check differs: ${result.path} ${name}`);
  if (expected.kind === 'html') {
    if (result.observed_language !== expected.locale) fail(`production-confirmation language differs: ${result.path}`);
    if (result.observed_canonical !== new URL(expected.path, contract.origin).href) fail(`production-confirmation canonical differs: ${result.path}`);
    if (!Array.isArray(result.missing_markers) || result.missing_markers.length !== 0) fail(`production-confirmation HTML markers differ: ${result.path}`);
  }
  if (expected.kind === 'sitemap') {
    if (result.observed_url_count !== 771) fail('production-confirmation sitemap URL count differs');
    if (!Array.isArray(result.missing_required_routes) || result.missing_required_routes.length !== 0) fail('production-confirmation sitemap route errors remain');
  }
  if (expected.kind === 'robots' && (!Array.isArray(result.missing_markers) || result.missing_markers.length !== 0)) fail('production-confirmation robots markers differ');
}

if (audit.schema_version !== 'v1-production-confirmation-audit-v1' || audit.release_id !== contract.release_id || audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.status !== contract.status || audit.confirmed_at !== contract.confirmed_at || audit.origin !== contract.origin || audit.release_commit !== contract.release_commit) fail('production-confirmation audit identity differs');
for (const key of ['release_result', 'scope_boundary', 'privacy_boundary', 'automation_boundary']) if (!exact(audit[key], contract[key])) fail(`production-confirmation audit boundary differs: ${key}`);
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_stage !== contract.next_stage) fail('production-confirmation audit roadmap linkage differs');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('production-confirmation audit behavior differs');
for (const [key, value] of Object.entries(audit.verified ?? {})) {
  if (key.endsWith('_errors') || key === 'failed_requests' || key === 'non_200_responses' || key === 'temporary_probe_files_committed') {
    if (value !== 0) fail(`production-confirmation audit error differs: ${key}`);
  }
}

const runner = read(files.runner);
for (const marker of ["const outputPath = 'v1-production-confirmation-report.json'", 'AbortSignal.timeout', "cache: 'no-store'", 'canonicalHref', 'htmlLanguage', 'total_route_errors']) if (!runner.includes(marker)) fail(`production-confirmation runner marker missing: ${marker}`);

const documentation = read(files.documentation);
for (const marker of ['V1-PRODUCTION-CONFIRMATION-01', 'https://whr.badjoke-lab.com', '12 public route checks', '771 sitemap URLs', 'release commit `6d45895f', 'reviewed incremental maintenance']) if (!documentation.includes(marker)) fail(`production-confirmation documentation marker missing: ${marker}`);

const workflow = read(files.workflow);
for (const marker of ['permissions:', 'contents: read', 'node --check scripts/run-v1-production-confirmation.mjs', 'node scripts/run-v1-production-confirmation.mjs', 'node scripts/check-v1-production-confirmation.mjs', 'actions/upload-artifact@v4', 'git status --porcelain']) if (!workflow.includes(marker)) fail(`production-confirmation workflow marker missing: ${marker}`);
for (const forbidden of ['contents: write', 'pull-requests: write', 'wrangler', 'cloudflare pages deploy', 'git push', 'git tag', 'gh release']) if (workflow.toLocaleLowerCase('en').includes(forbidden.toLocaleLowerCase('en'))) fail(`production-confirmation workflow forbidden marker: ${forbidden}`);

if (errors.length) {
  console.error(`V1_PRODUCTION_CONFIRMATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('V1_PRODUCTION_CONFIRMATION: pass');
console.log('RELEASE_ID: WHR-V1');
console.log('ORIGIN: https://whr.badjoke-lab.com');
console.log('ROUTE_CHECKS: 12');
console.log('SITEMAP_URLS: 771');
console.log('PRODUCTION_PUBLIC_SURFACE_CONFIRMED: true');
console.log('NEXT_STAGE: reviewed_incremental_maintenance');
