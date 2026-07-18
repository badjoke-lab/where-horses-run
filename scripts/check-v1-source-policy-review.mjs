import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const paths = {
  contract: 'data/static/v1-source-policy-review-v1.json',
  audit: 'data/audits/v1-source-policy-review-v1.json',
  doc: 'docs/release/v1-source-policy-review.md',
  checker: 'scripts/check-v1-source-policy-review.mjs',
  directoryChecker: 'scripts/check-source-status-filters.mjs',
  workflow: '.github/workflows/v1-source-policy-review.yml',
  scope: 'data/static/v1-scope-freeze-v1.json',
  dataAudit: 'data/static/v1-data-audit-v1.json',
  mobile: 'data/static/v1-mobile-qa-v1.json',
  accessibility: 'data/static/v1-accessibility-qa-v1.json',
  performance: 'data/static/v1-performance-qa-v1.json',
};
const temporaryPaths = [
  '.github/workflows/temporary-v1-source-policy-discovery.yml',
  'scripts/temporary-discover-v1-source-policy.mjs',
  'scripts/temporary-normalize-v1-source-policy.mjs',
];
for (const required of Object.values(paths)) if (!fs.existsSync(filePath(required))) fail(`required source-policy file missing: ${required}`);
for (const temporary of temporaryPaths) if (fs.existsSync(filePath(temporary))) fail(`temporary source-policy file remains: ${temporary}`);

const contract = parse(paths.contract);
const audit = parse(paths.audit);
if (contract.schema_version !== 'v1-source-policy-review-v1') fail('source-policy contract schema differs');
if (contract.release_id !== 'WHR-V1-PREPARATION-V1' || contract.work_id !== contract.release_id) fail('source-policy release identity differs');
if (contract.implementation_unit !== 'V1-SOURCE-POLICY-REVIEW-01') fail('source-policy implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-18') fail('source-policy release state differs');
if (contract.previous_implementation_unit !== 'V1-PERFORMANCE-QA-01' || contract.next_implementation_unit !== 'V1-KNOWN-LIMITATIONS-01') fail('source-policy roadmap linkage differs');

const expectedInventory = {
  source_registry_files: 26,
  source_records: 171,
  unique_source_ids: 171,
  countries_with_sources: 98,
  unique_hosts: 124,
  duplicate_url_values: 3,
  duplicate_source_ids: 0,
  invalid_urls: 0,
  non_https_urls: 0,
  unknown_country_ids: 0,
  missing_required_fields: 0,
  missing_public_notes: 0,
  source_type_counts: { official: 171 },
  data_type_counts: { link_only: 171 },
  auto_level_counts: { B: 9, C: 162 },
  url_path_kinds: { host_root: 69, deep_page: 99, pdf: 3 },
};
if (!exact(contract.registry_inventory, expectedInventory)) fail('source-policy registry inventory differs');
if (!exact(contract.normalization, {
  terms_risk_fields_removed: 171,
  m3_status_fields_removed: 163,
  m3_notes_fields_removed: 163,
  total_internal_fields_removed: 497,
  public_notes_added: 7,
  auto_level_fields_retained: 171,
  source_ids_changed: 0,
  source_urls_changed: 0,
})) fail('source-policy normalization snapshot differs');
const directory = contract.public_directory ?? {};
if (directory.locales !== 2 || directory.directory_routes !== 2 || directory.records_per_locale !== 171 || directory.country_source_routes !== 196 || directory.filter_controls !== 2 || directory.url_parameters !== 2 || directory.keyword_parameter !== 'q' || directory.country_parameter !== 'country') fail('source-policy public directory scope differs');
if (!exact(directory.public_record_fields, ['id', 'url', 'country_id', 'country_href', 'source_type', 'data_type', 'notes', 'search_text'])) fail('source-policy public record fields differ');
for (const key of ['rendered_internal_metadata_instances', 'internal_html_attribute_instances', 'internal_search_text_instances']) if (directory[key] !== 0) fail(`source-policy internal exposure differs: ${key}`);
if (directory.no_javascript_complete_list_required !== true) fail('source-policy no-JavaScript boundary differs');
if (contract.duplicate_url_policy?.duplicate_url_values_allowed !== true || contract.duplicate_url_policy?.duplicate_source_ids_allowed !== false) fail('source-policy duplicate URL boundary differs');
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('source-policy privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('source-policy automation boundary differs');

if (audit.schema_version !== 'v1-source-policy-review-audit-v1') fail('source-policy audit schema differs');
if (audit.release_id !== contract.release_id || audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.status !== contract.status || audit.reviewed_at !== contract.reviewed_at) fail('source-policy audit identity differs');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('source-policy audit roadmap linkage differs');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('source-policy audit behavior differs');
if (!exact(audit.publication_boundary, contract.publication_boundary) || !exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('source-policy audit boundary snapshot differs');

const registryFiles = [
  'data/static/sources.json',
  ...fs.readdirSync(filePath('data/static')).filter((name) => /^country-page-sources-.*\.json$/.test(name)).sort().map((name) => `data/static/${name}`),
  'data/static/racecourse-link-amendments-v1.json',
];
const rows = [];
for (const file of registryFiles) {
  const value = parse(file);
  rows.push(...(Array.isArray(value) ? value : Array.isArray(value.source_records) ? value.source_records : []));
}
const countries = new Set();
const hosts = new Set();
const ids = [];
const urls = [];
const sourceTypes = {};
const dataTypes = {};
const autoLevels = {};
const pathKinds = { host_root: 0, deep_page: 0, pdf: 0 };
let missingRequired = 0;
let missingNotes = 0;
let invalidUrls = 0;
let nonHttps = 0;
let forbiddenFields = 0;
for (const row of rows) {
  ids.push(row.id);
  urls.push(row.url);
  countries.add(row.country_id);
  for (const key of ['id', 'country_id', 'source_type', 'url', 'data_type', 'auto_level', 'notes']) if (typeof row[key] !== 'string' || !row[key].trim()) missingRequired += 1;
  if (typeof row.notes !== 'string' || !row.notes.trim()) missingNotes += 1;
  for (const key of ['terms_risk', 'm3_status', 'm3_notes']) if (Object.hasOwn(row, key)) forbiddenFields += 1;
  sourceTypes[row.source_type] = (sourceTypes[row.source_type] ?? 0) + 1;
  dataTypes[row.data_type] = (dataTypes[row.data_type] ?? 0) + 1;
  autoLevels[row.auto_level] = (autoLevels[row.auto_level] ?? 0) + 1;
  try {
    const url = new URL(row.url);
    hosts.add(url.hostname);
    if (url.protocol !== 'https:') nonHttps += 1;
    if (/\.pdf(?:$|[?#])/i.test(url.pathname)) pathKinds.pdf += 1;
    else if (!url.pathname || url.pathname === '/') pathKinds.host_root += 1;
    else pathKinds.deep_page += 1;
  } catch {
    invalidUrls += 1;
  }
}
const duplicateUrlValues = [...new Set(urls.filter((url, index) => urls.indexOf(url) !== index))].length;
const measured = {
  source_registry_files: registryFiles.length,
  source_records: rows.length,
  unique_source_ids: new Set(ids).size,
  countries_with_sources: countries.size,
  unique_hosts: hosts.size,
  duplicate_url_values: duplicateUrlValues,
  duplicate_source_ids: ids.length - new Set(ids).size,
  invalid_urls: invalidUrls,
  non_https_urls: nonHttps,
  unknown_country_ids: 0,
  missing_required_fields: missingRequired,
  missing_public_notes: missingNotes,
  source_type_counts: sourceTypes,
  data_type_counts: dataTypes,
  auto_level_counts: autoLevels,
  url_path_kinds: pathKinds,
};
if (!exact(measured, expectedInventory)) fail(`measured source-policy inventory differs: ${JSON.stringify(measured)}`);
if (forbiddenFields !== 0) fail(`source-policy forbidden registry fields remain: ${forbiddenFields}`);

try {
  execFileSync(process.execPath, [paths.directoryChecker], { stdio: 'inherit' });
} catch {
  fail('source directory checker failed');
}

const baselineExpectations = {
  scope: 'V1-SCOPE-FREEZE-01',
  dataAudit: 'V1-DATA-AUDIT-01',
  mobile: 'V1-MOBILE-QA-01',
  accessibility: 'V1-ACCESSIBILITY-QA-01',
  performance: 'V1-PERFORMANCE-QA-01',
};
for (const [key, unit] of Object.entries(baselineExpectations)) {
  const baseline = parse(paths[key]);
  if (baseline.implementation_unit !== unit || !['complete', 'release_ready'].includes(baseline.status)) fail(`source-policy baseline incomplete: ${unit}`);
}
const verified = audit.verified ?? {};
for (const [key, value] of Object.entries({
  source_registry_files: 26,
  source_records: 171,
  unique_source_ids: 171,
  countries_with_sources: 98,
  unique_hosts: 124,
  duplicate_url_values: 3,
  duplicate_source_ids: 0,
  invalid_urls: 0,
  non_https_urls: 0,
  missing_required_fields: 0,
  missing_public_notes: 0,
  official_source_records: 171,
  link_only_records: 171,
  auto_level_b_records: 9,
  auto_level_c_records: 162,
  terms_risk_fields: 0,
  m3_status_fields: 0,
  m3_notes_fields: 0,
  auto_level_fields: 171,
  public_notes_added: 7,
  english_directory_records: 171,
  japanese_directory_records: 171,
  country_source_routes: 196,
  filter_controls: 2,
  url_parameters: 2,
  rendered_internal_metadata_instances: 0,
  internal_html_attribute_instances: 0,
  internal_search_text_instances: 0,
  temporary_source_policy_files: 0,
})) if (verified[key] !== value) fail(`source-policy audit measurement differs: ${key}`);
for (const key of ['scope_errors', 'data_audit_errors', 'mobile_qa_errors', 'accessibility_qa_errors', 'performance_qa_errors', 'source_directory_errors', 'public_boundary_errors', 'privacy_boundary_errors', 'automation_boundary_errors', 'workflow_errors', 'contract_errors', 'output_errors']) if (verified[key] !== 0) fail(`source-policy audit error differs: ${key}`);

const doc = read(paths.doc);
for (const marker of ['V1-SOURCE-POLICY-REVIEW-01', 'Source registry files: 26', 'Source records: 171', 'Unique hosts: 124', 'Total: 497 fields', '2 controls', 'scripts/check-v1-source-policy-review.mjs', '.github/workflows/v1-source-policy-review.yml', 'V1-KNOWN-LIMITATIONS-01']) if (!doc.includes(marker)) fail(`source-policy documentation marker missing: ${marker}`);
const workflow = read(paths.workflow);
for (const marker of ['permissions:', 'contents: read', 'npm install --package-lock=false', 'npm run build', 'node scripts/check-v1-source-policy-review.mjs', 'git status --porcelain']) if (!workflow.includes(marker)) fail(`source-policy workflow marker missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`source-policy workflow contains forbidden marker: ${forbidden}`);

if (errors.length) {
  console.error(`V1_SOURCE_POLICY_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('V1_SOURCE_POLICY_REVIEW: pass');
console.log('SOURCE_RECORDS: 171');
console.log('SOURCE_REGISTRY_FILES: 26');
console.log('UNIQUE_HOSTS: 124');
console.log('INTERNAL_FIELDS_REMOVED: 497');
console.log('PUBLIC_FILTER_CONTROLS: 2');
console.log('NEXT_IMPLEMENTATION_UNIT: V1-KNOWN-LIMITATIONS-01');
