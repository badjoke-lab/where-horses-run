import fs from 'node:fs';
import path from 'node:path';

const CONTRACT_PATH = 'data/static/v1-data-audit-v1.json';
const AUDIT_PATH = 'data/audits/v1-data-audit-v1.json';
const DOC_PATH = 'docs/release/v1-data-audit.md';
const WORKFLOW_PATH = '.github/workflows/v1-data-audit.yml';
const SCOPE_CONTRACT_PATH = 'data/static/v1-scope-freeze-v1.json';
const SEO_RELEASE_PATH = 'data/static/seo-qa-release-v1.json';
const DATA_MODULE_PATH = 'src/lib/data.ts';
const RECONCILIATION_PATH = 'data/static/country-page-id-inventory-01-12-reconciliation-v1.json';
const SITEMAP_PATH = 'dist/sitemap.xml';
const TEMPORARY_FILES = [
  '.github/workflows/temporary-v1-data-audit-discovery.yml',
  'scripts/temporary-discover-v1-data-audit.mjs',
  'scripts/temporary-scan-v1-data-public-boundary.mjs',
];

const forbiddenKeyTokens = new Set([
  'horse', 'horses', 'horse_name', 'horse_names', 'jockey', 'jockeys', 'trainer', 'trainers',
  'draw', 'draws', 'gate', 'gates', 'post_position', 'weight', 'weights', 'body_weight',
  'odds', 'result', 'results', 'payout', 'payouts', 'dividend', 'dividends', 'prediction',
  'predictions', 'tip', 'tips', 'pick', 'picks', 'bet', 'bets', 'betting', 'entries',
  'participants', 'racecard', 'racecards',
]);
const noteLikeTokens = new Set([
  'notes', 'note', 'm3_notes', 'internal_notes', 'parser_notes', 'candidate_notes',
  'implementation_notes', 'acquisition_notes', 'next_step', 'next_steps', 'follow_up',
]);
const restrictedPatterns = [
  /\bearly candidate\b/i,
  /\bcandidate for\b/i,
  /\bcandidate generation\b/i,
  /\bsource(?: record)? candidate\b/i,
  /\bparser work\b/i,
  /\bparser\b/i,
  /\bautomation\b/i,
  /\bautomate\b/i,
  /\binternally\b/i,
  /\binternal\b/i,
  /\bscrap(?:e|ing)\b/i,
  /\bacquisition\b/i,
  /\brisk posture\b/i,
  /\btarget for\b/i,
  /\bpriority candidate\b/i,
  /\bm3\b/i,
  /\bpr[- ]?\d+\b/i,
  /\bnext step\b/i,
  /\bdry[- ]run\b/i,
  /\blive fetch(?:ing)?\b/i,
];

const expect = (condition, message) => { if (!condition) throw new Error(message); };
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

function topRows(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const key of ['meetings', 'records', 'items', 'sources', 'entries', 'countries', 'racecourses']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function uniqueDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values.filter((item) => typeof item === 'string' && item)) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function walkKeys(value, visit, pointer = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkKeys(item, visit, `${pointer}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    visit(key, child, `${pointer}.${key}`);
    walkKeys(child, visit, `${pointer}.${key}`);
  }
}

function scanFile(file, data) {
  const rows = topRows(data);
  const ids = rows.map((row) => row?.id ?? row?.country_id ?? row?.source_id);
  const slugs = rows.map((row) => row?.slug);
  const findings = {
    duplicateIds: uniqueDuplicates(ids),
    duplicateSlugs: uniqueDuplicates(slugs),
    invalidUrls: [],
    forbiddenKeys: [],
    restrictedText: [],
    noteLikeValues: 0,
    placeholders: 0,
  };

  walkKeys(data, (key, value, pointer) => {
    const normalized = normalizeKey(key);
    if (forbiddenKeyTokens.has(normalized)) findings.forbiddenKeys.push({ file, pointer, key: normalized });
    if (noteLikeTokens.has(normalized) && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      findings.noteLikeValues += 1;
    }
    if (typeof value !== 'string') return;
    if (value.toLowerCase() === 'placeholder') findings.placeholders += 1;
    if (/url$/i.test(key) || key === 'href') {
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) findings.invalidUrls.push({ file, pointer, value });
      } catch {
        findings.invalidUrls.push({ file, pointer, value });
      }
    }
    for (const pattern of restrictedPatterns) {
      if (!pattern.test(value)) continue;
      findings.restrictedText.push({ file, pointer, pattern: pattern.source, value: value.trim().slice(0, 300) });
      break;
    }
  });

  return {
    file,
    rows: rows.length,
    ids: ids.filter(Boolean).length,
    slugs: slugs.filter(Boolean).length,
    ...findings,
  };
}

function rowsFromFiles(parsed, predicate) {
  return Object.entries(parsed)
    .filter(([file]) => predicate(file))
    .flatMap(([file, data]) => topRows(data).map((row, index) => ({ file, index, row })));
}

function mergedSummary(entries, idKeys, slugKey = 'slug') {
  const identifiers = entries.map(({ row }) => idKeys.map((key) => row?.[key]).find((value) => typeof value === 'string' && value));
  const slugs = entries.map(({ row }) => row?.[slugKey]);
  return {
    records: entries.length,
    identifiers: identifiers.filter(Boolean).length,
    slugs: slugs.filter(Boolean).length,
    duplicateIds: uniqueDuplicates(identifiers),
    duplicateSlugs: uniqueDuplicates(slugs),
  };
}

for (const file of [CONTRACT_PATH, AUDIT_PATH, DOC_PATH, WORKFLOW_PATH, SCOPE_CONTRACT_PATH, SEO_RELEASE_PATH, DATA_MODULE_PATH, RECONCILIATION_PATH, SITEMAP_PATH]) {
  expect(fs.existsSync(file), `Required v1 data audit file is missing: ${file}`);
}
for (const file of TEMPORARY_FILES) expect(!fs.existsSync(file), `Temporary data audit file remains: ${file}`);

const contract = json(CONTRACT_PATH);
const audit = json(AUDIT_PATH);
const scopeContract = json(SCOPE_CONTRACT_PATH);
const seoRelease = json(SEO_RELEASE_PATH);
const reconciliation = json(RECONCILIATION_PATH);

expect(contract.schema_version === 'v1-data-audit-v1', 'v1 data audit schema differs');
expect(contract.release_id === 'WHR-V1-PREPARATION-V1', 'v1 data audit release ID differs');
expect(contract.work_id === 'WHR-V1-PREPARATION-V1', 'v1 data audit Work ID differs');
expect(contract.implementation_unit === 'V1-DATA-AUDIT-01', 'v1 data audit unit differs');
expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-18', 'v1 data audit status or date differs');
expect(contract.baseline_release_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'v1 data baseline release differs');
expect(contract.scope_contract_id === 'V1-SCOPE-FREEZE-01', 'v1 data scope contract differs');
expect(contract.previous_implementation_unit === 'V1-SCOPE-FREEZE-01', 'v1 data previous unit differs');
expect(contract.next_implementation_unit === 'V1-MOBILE-QA-01', 'v1 data next unit differs');
expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'v1 data privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'v1 data automation boundary differs');
for (const [key, value] of Object.entries(contract.public_boundary)) {
  const allowed = ['reviewed_entity_and_source_metadata_allowed', 'reviewed_coverage_status_allowed', 'public_safe_notes_and_limitations_allowed', 'explicit_placeholder_status_allowed'].includes(key);
  expect(value === allowed, `v1 data public boundary differs: ${key}`);
}
expect(Object.values(contract.data_quality_contract).every((value) => value === true || value === false), 'v1 data quality values differ');
expect(contract.data_quality_contract.duplicate_ids_within_files_allowed === false, 'v1 duplicate ID boundary differs');
expect(contract.data_quality_contract.invalid_http_or_https_urls_allowed === false, 'v1 URL boundary differs');
expect(contract.data_quality_contract.restricted_internal_workflow_text_allowed === false, 'v1 text boundary differs');
expect(contract.data_quality_contract.placeholder_values_allowed_when_explicitly_classified === true, 'v1 placeholder boundary differs');
expect(contract.placeholder_contract.placeholder_count_growth_allowed_without_review === false, 'v1 placeholder growth boundary differs');

expect(audit.schema_version === 'v1-data-audit-audit-v1', 'v1 data audit result schema differs');
expect(audit.release_id === contract.release_id && audit.work_id === contract.work_id, 'v1 data audit result identity differs');
expect(audit.implementation_unit === contract.implementation_unit, 'v1 data audit result unit differs');
expect(audit.status === contract.status && audit.reviewed_at === contract.reviewed_at, 'v1 data audit result status differs');
expect(exact(audit.public_boundary, contract.public_boundary), 'v1 data audit result public boundary differs');
expect(exact(audit.privacy_boundary, contract.privacy_boundary), 'v1 data audit result privacy boundary differs');
expect(exact(audit.automation_boundary, contract.automation_boundary), 'v1 data audit result automation boundary differs');
expect(audit.previous_implementation_unit === contract.previous_implementation_unit, 'v1 data audit result previous unit differs');
expect(audit.next_implementation_unit === contract.next_implementation_unit, 'v1 data audit result next unit differs');
expect(Object.values(audit.behavior).every((value) => value === true), 'v1 data audit result behavior differs');
expect(exact(audit.corrections, contract.correction_summary), 'v1 data audit correction summary differs');

expect(scopeContract.implementation_unit === 'V1-SCOPE-FREEZE-01' && scopeContract.status === 'complete', 'v1 scope baseline is not complete');
expect(scopeContract.baseline_inventory.public_pages === contract.input_inventory.sitemap_urls, 'v1 scope public-page baseline differs');
expect(seoRelease.release_id === contract.baseline_release_id && seoRelease.status === 'release_ready', 'Phase 11 baseline release differs');
expect(seoRelease.scope.public_pages === contract.input_inventory.sitemap_urls, 'Phase 11 public-page baseline differs');

const dataModule = read(DATA_MODULE_PATH);
const importedFiles = [...dataModule.matchAll(/from ['"]\.\.\/\.\.\/(data\/(?:static|generated)\/[^'"]+\.json)['"]/g)].map((match) => match[1]);
const uniqueImportedFiles = [...new Set(importedFiles)].sort();
const auditedFiles = [...new Set([...uniqueImportedFiles, 'data/static/i18n/en.json', 'data/static/i18n/ja.json'])].sort();
for (const file of auditedFiles) expect(fs.existsSync(file), `Imported JSON file is missing: ${file}`);

const parsed = {};
for (const file of auditedFiles) {
  try { parsed[file] = json(file); }
  catch (error) { throw new Error(`Imported JSON parse failed: ${file}: ${error.message}`); }
}
const scans = auditedFiles.map((file) => scanFile(file, parsed[file]));
const countryEntries = rowsFromFiles(parsed, (file) => /data\/static\/(?:countries\.json|country-page-countries-[^/]+\.json)$/.test(file));
const profileEntries = rowsFromFiles(parsed, (file) => /data\/static\/country-profiles-v2(?:-[^/]+)?\.json$/.test(file));
const racecourseEntries = rowsFromFiles(parsed, (file) => /data\/static\/(?:racecourses\.json|racecourses-extensions\.json|racecourses-public-timetable-identities-v1\.json|country-page-racecourses-[^/]+\.json)$/.test(file));
const sourceEntries = rowsFromFiles(parsed, (file) => /data\/static\/(?:sources\.json|country-page-sources-[^/]+\.json)$/.test(file));
for (const [index, row] of (parsed['data/static/racecourse-link-amendments-v1.json']?.source_records ?? []).entries()) {
  sourceEntries.push({ file: 'data/static/racecourse-link-amendments-v1.json#source_records', index, row });
}
const merged = {
  countries: mergedSummary(countryEntries, ['id']),
  country_profiles: mergedSummary(profileEntries, ['country_id', 'id']),
  racecourses: mergedSummary(racecourseEntries, ['id']),
  sources: mergedSummary(sourceEntries, ['id', 'source_id']),
};

const sitemapUrls = [...read(SITEMAP_PATH).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const metrics = {
  data_module_json_imports: importedFiles.length,
  unique_data_module_json_imports: uniqueImportedFiles.length,
  audited_json_files: auditedFiles.length,
  static_json_files: auditedFiles.filter((file) => file.startsWith('data/static/')).length,
  generated_json_files: auditedFiles.filter((file) => file.startsWith('data/generated/')).length,
  sitemap_urls: sitemapUrls.length,
  top_level_rows: scans.reduce((sum, scan) => sum + scan.rows, 0),
  url_values: scans.reduce((sum, scan) => sum + scan.invalidUrls.length, 0),
  note_like_metadata_values: scans.reduce((sum, scan) => sum + scan.noteLikeValues, 0),
  placeholder_values: scans.reduce((sum, scan) => sum + scan.placeholders, 0),
  static_racecourse_placeholder_values: scans.filter((scan) => scan.file.startsWith('data/static/') && scan.file.includes('racecourse')).reduce((sum, scan) => sum + scan.placeholders, 0),
  generated_placeholder_values: scans.filter((scan) => scan.file.startsWith('data/generated/')).reduce((sum, scan) => sum + scan.placeholders, 0),
};
metrics.url_values = 0;
for (const file of auditedFiles) {
  walkKeys(parsed[file], (key, value) => {
    if (typeof value === 'string' && (/url$/i.test(key) || key === 'href')) metrics.url_values += 1;
  });
}

for (const [key, expected] of Object.entries(contract.input_inventory)) expect(metrics[key] === expected, `v1 data input metric differs: ${key} (${metrics[key]} !== ${expected})`);
for (const [name, expected] of Object.entries(contract.merged_collections)) {
  const actual = merged[name];
  expect(actual.records === expected.records, `${name} record count differs`);
  expect(actual.identifiers === expected.identifiers, `${name} identifier count differs`);
  expect(actual.slugs === expected.slugs, `${name} slug count differs`);
  expect(actual.duplicateIds.length === 0, `${name} duplicate IDs remain: ${actual.duplicateIds.join(', ')}`);
  expect(actual.duplicateSlugs.length === 0, `${name} duplicate slugs remain: ${actual.duplicateSlugs.join(', ')}`);
}

const duplicateIdsWithin = scans.reduce((sum, scan) => sum + scan.duplicateIds.length, 0);
const duplicateSlugsWithin = scans.reduce((sum, scan) => sum + scan.duplicateSlugs.length, 0);
const duplicateIdsMerged = Object.values(merged).reduce((sum, collection) => sum + collection.duplicateIds.length, 0);
const duplicateSlugsMerged = Object.values(merged).reduce((sum, collection) => sum + collection.duplicateSlugs.length, 0);
const invalidUrls = scans.reduce((sum, scan) => sum + scan.invalidUrls.length, 0);
const forbiddenKeys = scans.reduce((sum, scan) => sum + scan.forbiddenKeys.length, 0);
const restrictedText = scans.reduce((sum, scan) => sum + scan.restrictedText.length, 0);
const unclassifiedPlaceholders = metrics.placeholder_values - metrics.static_racecourse_placeholder_values - metrics.generated_placeholder_values;
for (const [key, actual] of Object.entries({
  duplicate_id_groups_within_files: duplicateIdsWithin,
  duplicate_slug_groups_within_files: duplicateSlugsWithin,
  duplicate_id_groups_across_merged_collections: duplicateIdsMerged,
  duplicate_slug_groups_across_merged_collections: duplicateSlugsMerged,
  invalid_urls: invalidUrls,
  forbidden_public_data_keys: forbiddenKeys,
  restricted_public_text_matches: restrictedText,
  restricted_rendered_text_matches: restrictedText,
  unclassified_placeholder_values: unclassifiedPlaceholders,
})) expect(actual === 0 && audit.verified[key] === 0, `v1 data error metric differs: ${key} (${actual})`);

for (const [key, expected] of Object.entries({
  country_records: merged.countries.records,
  country_profile_records: merged.country_profiles.records,
  racecourse_records: merged.racecourses.records,
  source_records: merged.sources.records,
})) expect(audit.verified[key] === expected, `v1 data audit collection result differs: ${key}`);
for (const [key, expected] of Object.entries(contract.input_inventory)) expect(audit.verified[key] === expected, `v1 data audit result differs: ${key}`);

expect(reconciliation.schema_version === '1.0.0', 'ID reconciliation schema differs');
expect(reconciliation.base_inventory === 'data/static/country-page-id-inventory-01-12.json', 'ID reconciliation base differs');
expect(reconciliation.reviewed_at === '2026-07-18', 'ID reconciliation date differs');
expect(reconciliation.racecourse_registry_status_overrides.length === contract.id_reconciliation_contract.racecourse_overrides, 'ID reconciliation count differs');
for (const override of reconciliation.racecourse_registry_status_overrides) {
  expect(override.previous_status === 'reserved' && override.effective_status === 'registered', `ID reconciliation transition differs: ${override.id}`);
}
expect(audit.verified.country_id_reconciliations === reconciliation.racecourse_registry_status_overrides.length, 'ID reconciliation audit count differs');

const doc = read(DOC_PATH);
for (const marker of [
  'V1-DATA-AUDIT-01',
  'Audited JSON files including locale dictionaries: 154',
  'URL values measured: 372',
  'Countries: 98 records',
  'Racecourses: 36 records',
  'Sources: 171 records',
  'Restricted public text matches: 0',
  'Static racecourse placeholder values: 36',
  'Generated schedule placeholder values: 5',
  'scripts/check-v1-data-audit.mjs',
  '.github/workflows/v1-data-audit.yml',
  'V1-MOBILE-QA-01',
]) expect(doc.includes(marker), `v1 data audit documentation marker is missing: ${marker}`);

const workflow = read(WORKFLOW_PATH);
for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run validate:data',
  'npm run build',
  'node scripts/check-seo-qa-release.mjs',
  'node scripts/check-v1-scope-freeze.mjs',
  'node scripts/check-country-page-id-inventory-01-12-reconciled.mjs',
  'node scripts/check-v1-data-audit.mjs',
  'git status --porcelain',
]) expect(workflow.includes(marker), `v1 data audit workflow marker is missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) {
  expect(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `v1 data audit workflow contains forbidden marker: ${forbidden}`);
}

console.log('V1_DATA_AUDIT: pass');
console.log(`AUDITED_JSON_FILES: ${contract.input_inventory.audited_json_files}`);
console.log(`COUNTRIES: ${contract.merged_collections.countries.records}`);
console.log(`COUNTRY_PROFILES: ${contract.merged_collections.country_profiles.records}`);
console.log(`RACECOURSES: ${contract.merged_collections.racecourses.records}`);
console.log(`SOURCES: ${contract.merged_collections.sources.records}`);
console.log(`URL_VALUES: ${contract.input_inventory.url_values}`);
console.log(`PLACEHOLDER_VALUES: ${contract.input_inventory.placeholder_values}`);
console.log('RESTRICTED_PUBLIC_TEXT_MATCHES: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: V1-MOBILE-QA-01');
