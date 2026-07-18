import fs from 'node:fs';

const RELEASE_PATH = 'data/static/seo-qa-release-v1.json';
const AUDIT_PATH = 'data/audits/seo-qa-release-v1.json';
const DOC_PATH = 'docs/seo/seo-qa-release.md';
const WORKFLOW_PATH = '.github/workflows/seo-qa-release.yml';
const UX_RELEASE_PATH = 'data/static/ux-polish-release-v1.json';
const UX_AUDIT_PATH = 'data/audits/ux-polish-release-v1.json';

const units = [
  {
    unit: 'SITEMAP-ROBOTS-01',
    contract: 'data/static/sitemap-robots-contract-v1.json',
    audit: 'data/audits/sitemap-robots-v1.json',
    checker: 'scripts/check-sitemap-robots.mjs',
  },
  {
    unit: 'STRUCTURED-DATA-BASELINE-01',
    contract: 'data/static/structured-data-baseline-contract-v1.json',
    audit: 'data/audits/structured-data-baseline-v1.json',
    checker: 'scripts/check-structured-data-baseline.mjs',
  },
  {
    unit: 'COUNTRY-PAGE-METADATA-01',
    contract: 'data/static/country-page-metadata-contract-v1.json',
    audit: 'data/audits/country-page-metadata-v1.json',
    checker: 'scripts/check-country-page-metadata.mjs',
  },
  {
    unit: 'RACECOURSE-PAGE-METADATA-01',
    contract: 'data/static/racecourse-page-metadata-contract-v1.json',
    audit: 'data/audits/racecourse-page-metadata-v1.json',
    checker: 'scripts/check-racecourse-page-metadata.mjs',
  },
  {
    unit: 'GLOSSARY-PAGE-METADATA-01',
    contract: 'data/static/glossary-page-metadata-contract-v1.json',
    audit: 'data/audits/glossary-page-metadata-v1.json',
    checker: 'scripts/check-glossary-page-metadata.mjs',
  },
  {
    unit: 'CANONICAL-HREFLANG-REVIEW-01',
    contract: 'data/static/canonical-hreflang-review-contract-v1.json',
    audit: 'data/audits/canonical-hreflang-review-v1.json',
    checker: 'scripts/check-canonical-hreflang-review.mjs',
  },
  {
    unit: 'OPEN-GRAPH-SOCIAL-CARDS-01',
    contract: 'data/static/open-graph-social-cards-contract-v1.json',
    audit: 'data/audits/open-graph-social-cards-v1.json',
    checker: 'scripts/check-open-graph-social-cards.mjs',
  },
  {
    unit: 'TITLE-DESCRIPTION-NORMALIZATION-01',
    contract: 'data/static/title-description-normalization-contract-v1.json',
    audit: 'data/audits/title-description-normalization-v1.json',
    checker: 'scripts/check-title-description-normalization.mjs',
  },
  {
    unit: 'FAQ-CONTENT-PAGES-01',
    contract: 'data/static/faq-content-pages-contract-v1.json',
    audit: 'data/audits/faq-content-pages-v1.json',
    checker: 'scripts/check-faq-content-pages.mjs',
  },
  {
    unit: 'METHODS-DATA-POLICY-01',
    contract: 'data/static/methods-data-policy-contract-v1.json',
    audit: 'data/audits/methods-data-policy-v1.json',
    checker: 'scripts/check-methods-data-policy.mjs',
  },
];

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const requiredFiles = [
  RELEASE_PATH,
  AUDIT_PATH,
  DOC_PATH,
  WORKFLOW_PATH,
  UX_RELEASE_PATH,
  UX_AUDIT_PATH,
  ...units.flatMap((entry) => [entry.contract, entry.audit, entry.checker]),
];
for (const file of requiredFiles) expect(fs.existsSync(file), `Required release file is missing: ${file}`);

const release = json(RELEASE_PATH);
const audit = json(AUDIT_PATH);
const uxRelease = json(UX_RELEASE_PATH);
const uxAudit = json(UX_AUDIT_PATH);
const contracts = Object.fromEntries(units.map((entry) => [entry.unit, json(entry.contract)]));
const audits = Object.fromEntries(units.map((entry) => [entry.unit, json(entry.audit)]));

const completedUnits = [
  ...units.map((entry) => entry.unit),
  'SEO-QA-RELEASE-01',
];

expect(release.schema_version === 'seo-qa-release-v1', 'SEO release schema differs');
expect(release.release_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'SEO release ID differs');
expect(release.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'SEO release Work ID differs');
expect(release.implementation_unit === 'SEO-QA-RELEASE-01', 'SEO release implementation unit differs');
expect(release.status === 'release_ready', 'SEO release status differs');
expect(release.reviewed_at === '2026-07-18', 'SEO release review date differs');
expect(exact(release.completed_units, completedUnits), 'SEO release completed units differ');
expect(release.scope.completed_units === completedUnits.length, 'SEO release completed-unit count differs');
expect(release.scope.underlying_units === units.length, 'SEO release underlying-unit count differs');
expect(release.scope.phase_11_checkers === units.length + 1, 'SEO release checker count differs');
expect(release.scope.predecessor_release_checkers === 1, 'SEO predecessor checker count differs');
expect(release.previous_implementation_unit === 'METHODS-DATA-POLICY-01', 'SEO release previous unit differs');
expect(release.next_implementation_unit === 'V1-SCOPE-FREEZE-01', 'SEO release next unit differs');

expect(exact(release.checker_contract, {
  phase_10_ux_release_preserved: true,
  all_underlying_phase_11_checkers_required: true,
  aggregate_release_checker_required: true,
  single_complete_static_build_required: true,
  repository_clean_proof_required: true,
  read_only_permissions_required: true,
  scheduled_execution_allowed: false,
  deployment_execution_allowed: false,
}), 'SEO release checker contract differs');
expect(Object.values(release.release_contract).every((value) => value === true || value === false), 'SEO release behavior values are invalid');
expect(release.release_contract.temporary_discovery_workflows_allowed === false, 'Temporary discovery workflows must remain disallowed');
expect(release.release_contract.unresolved_checker_failures_allowed === false, 'Unresolved checker failures must remain disallowed');
expect(Object.values(release.privacy_boundary).every((value) => value === false), 'SEO release privacy boundary differs');
expect(Object.values(release.automation_boundary).every((value) => value === false), 'SEO release automation boundary differs');
for (const [key, value] of Object.entries(release.public_boundary)) {
  const allowed = ['official_source_priority_allowed', 'reviewed_public_metadata_allowed', 'bilingual_public_content_allowed', 'public_scope_and_limitations_allowed'].includes(key);
  expect(value === allowed, `SEO release public boundary differs: ${key}`);
}

expect(audit.schema_version === 'seo-qa-release-audit-v1', 'SEO release audit schema differs');
expect(audit.release_id === release.release_id, 'SEO release audit ID differs');
expect(audit.work_id === release.work_id, 'SEO release audit Work ID differs');
expect(audit.implementation_unit === release.implementation_unit, 'SEO release audit unit differs');
expect(audit.status === release.status && audit.reviewed_at === release.reviewed_at, 'SEO release audit status or date differs');
for (const [key, value] of Object.entries(release.scope)) {
  expect(audit.verified[key] === value, `SEO release audit scope differs: ${key}`);
}
for (const key of [
  'temporary_discovery_workflows',
  'missing_contracts',
  'missing_audits',
  'missing_checkers',
  'identity_errors',
  'scope_alignment_errors',
  'underlying_audit_errors',
  'public_boundary_errors',
  'privacy_boundary_errors',
  'automation_boundary_errors',
  'workflow_errors',
  'contract_errors',
  'output_errors',
]) expect(audit.verified[key] === 0, `SEO release audit error count differs: ${key}`);
expect(Object.values(audit.behavior).every((value) => value === true), 'SEO release audit behavior differs');
expect(exact(audit.public_boundary, release.public_boundary), 'SEO release audit public boundary differs');
expect(exact(audit.privacy_boundary, release.privacy_boundary), 'SEO release audit privacy boundary differs');
expect(exact(audit.automation_boundary, release.automation_boundary), 'SEO release audit automation boundary differs');
expect(audit.previous_implementation_unit === release.previous_implementation_unit, 'SEO release audit previous unit differs');
expect(audit.next_implementation_unit === release.next_implementation_unit, 'SEO release audit next unit differs');

expect(uxRelease.release_id === 'WHR-UX-DISCOVERY-V1', 'Phase 10 predecessor release ID differs');
expect(uxRelease.implementation_unit === 'UX-POLISH-RELEASE-01' && uxRelease.status === 'release_ready', 'Phase 10 predecessor release status differs');
expect(uxAudit.release_id === uxRelease.release_id && uxAudit.status === 'release_ready', 'Phase 10 predecessor audit differs');

for (const entry of units) {
  const contract = contracts[entry.unit];
  const unitAudit = audits[entry.unit];
  expect(contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1', `${entry.unit}: contract Work ID differs`);
  expect(contract.implementation_unit === entry.unit, `${entry.unit}: contract unit differs`);
  expect(contract.status === 'complete', `${entry.unit}: contract is not complete`);
  expect(unitAudit.work_id === contract.work_id, `${entry.unit}: audit Work ID differs`);
  expect(unitAudit.implementation_unit === contract.implementation_unit, `${entry.unit}: audit unit differs`);
  expect(unitAudit.status === 'complete', `${entry.unit}: audit is not complete`);
}

const scope = release.scope;
const sitemap = contracts['SITEMAP-ROBOTS-01'].scope;
const baseline = contracts['STRUCTURED-DATA-BASELINE-01'].scope;
const country = contracts['COUNTRY-PAGE-METADATA-01'].scope;
const racecourse = contracts['RACECOURSE-PAGE-METADATA-01'].scope;
const glossary = contracts['GLOSSARY-PAGE-METADATA-01'].scope;
const canonical = contracts['CANONICAL-HREFLANG-REVIEW-01'].scope;
const social = contracts['OPEN-GRAPH-SOCIAL-CARDS-01'].scope;
const title = contracts['TITLE-DESCRIPTION-NORMALIZATION-01'].scope;
const faq = contracts['FAQ-CONTENT-PAGES-01'].scope;
const methods = contracts['METHODS-DATA-POLICY-01'].scope;

for (const [label, actual, expected] of [
  ['sitemap URLs', sitemap.sitemap_urls, scope.sitemap_urls],
  ['sitemap English URLs', sitemap.english_urls, scope.english_pages],
  ['sitemap Japanese URLs', sitemap.japanese_urls, scope.japanese_pages],
  ['baseline public pages', baseline.public_pages, scope.public_pages],
  ['baseline scripts', baseline.json_ld_scripts, scope.baseline_json_ld_scripts],
  ['baseline WebSite nodes', baseline.website_nodes, scope.website_nodes],
  ['baseline WebPage nodes', baseline.webpage_nodes, scope.webpage_nodes],
  ['country metadata routes', country.bilingual_detail_routes, scope.country_metadata_routes],
  ['racecourse metadata routes', racecourse.bilingual_detail_routes, scope.racecourse_metadata_routes],
  ['glossary metadata routes', glossary.bilingual_detail_routes, scope.glossary_metadata_routes],
  ['canonical public pages', canonical.public_pages, scope.public_pages],
  ['canonical links', canonical.canonical_links, scope.canonical_links],
  ['paired pages', canonical.paired_pages, scope.paired_pages],
  ['bilingual clusters', canonical.bilingual_clusters, scope.bilingual_clusters],
  ['unpaired pages', canonical.unpaired_pages, scope.unpaired_pages],
  ['hreflang links', canonical.hreflang_links, scope.hreflang_links],
  ['social public pages', social.public_pages, scope.public_pages],
  ['social paired pages', social.paired_pages, scope.paired_pages],
  ['social images', social.generated_images, scope.social_card_images],
  ['title public pages', title.public_pages, scope.public_pages],
  ['title English pages', title.english_pages, scope.english_pages],
  ['title Japanese pages', title.japanese_pages, scope.japanese_pages],
  ['FAQ pages', faq.faq_pages, scope.faq_pages],
  ['FAQ visible questions', faq.visible_questions, scope.faq_visible_questions],
  ['FAQ structured questions', faq.structured_questions, scope.faq_structured_questions],
  ['Methods pages', methods.methods_pages, scope.methods_pages],
  ['Methods sections', methods.visible_sections, scope.methods_visible_sections],
  ['Methods paragraphs', methods.visible_paragraphs, scope.methods_visible_paragraphs],
]) expect(actual === expected, `Cross-contract scope differs: ${label} (${actual} !== ${expected})`);

for (const [label, actual] of [
  ['sitemap public pages', sitemap.sitemap_urls],
  ['baseline public pages', baseline.public_pages],
  ['canonical public pages', canonical.public_pages],
  ['social public pages', social.public_pages],
  ['title public pages', title.public_pages],
  ['FAQ public pages', faq.public_pages],
  ['Methods public pages', methods.public_pages],
]) expect(actual === scope.public_pages, `Complete public inventory differs: ${label}`);

const temporaryWorkflows = fs.readdirSync('.github/workflows').filter((name) => /^temporary-.*\.ya?ml$/i.test(name));
expect(temporaryWorkflows.length === 0, `Temporary workflows remain: ${temporaryWorkflows.join(', ')}`);

const doc = read(DOC_PATH);
for (const marker of [
  'SEO-QA-RELEASE-01',
  'WHR-SEO-PUBLIC-CONTENT-V1',
  'Public pages: 771',
  'English pages: 387',
  'Japanese pages: 384',
  'Hreflang links: 2,304',
  'Country metadata routes: 196',
  'Racecourse metadata routes: 72',
  'Glossary metadata routes: 96',
  'FAQ visible questions: 24',
  'Methods visible sections: 18',
  'scripts/check-seo-qa-release.mjs',
  '.github/workflows/seo-qa-release.yml',
  'V1-SCOPE-FREEZE-01',
]) expect(doc.includes(marker), `SEO release documentation marker is missing: ${marker}`);

const workflow = read(WORKFLOW_PATH);
for (const marker of [
  'permissions:',
  'contents: read',
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  ...units.map((entry) => `node ${entry.checker}`),
  'node scripts/check-seo-qa-release.mjs',
  'git status --porcelain',
]) expect(workflow.includes(marker), `SEO release workflow marker is missing: ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare', 'deploy']) {
  expect(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `SEO release workflow contains forbidden marker: ${forbidden}`);
}

console.log('SEO_QA_RELEASE: pass');
console.log(`RELEASE_ID: ${release.release_id}`);
console.log(`COMPLETED_UNITS: ${release.scope.completed_units}`);
console.log(`PUBLIC_PAGES: ${release.scope.public_pages}`);
console.log(`ENGLISH_PAGES: ${release.scope.english_pages}`);
console.log(`JAPANESE_PAGES: ${release.scope.japanese_pages}`);
console.log(`BILINGUAL_CLUSTERS: ${release.scope.bilingual_clusters}`);
console.log(`HREFLANG_LINKS: ${release.scope.hreflang_links}`);
console.log('TEMPORARY_DISCOVERY_WORKFLOWS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: V1-SCOPE-FREEZE-01');
