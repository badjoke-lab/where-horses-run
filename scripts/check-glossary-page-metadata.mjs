import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const MARKER = 'collection-defined-term-v1';

const contractPath = 'data/static/glossary-page-metadata-contract-v1.json';
const auditPath = 'data/audits/glossary-page-metadata-v1.json';
const configPath = 'astro.config.mjs';
const integrationPath = 'scripts/glossary-page-metadata-integration.mjs';
const docPath = 'docs/seo/glossary-page-metadata.md';
const workflowPath = '.github/workflows/glossary-page-metadata.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-glossary-page-metadata-discovery.yml';

for (const requiredPath of [contractPath, auditPath, configPath, integrationPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedScope = {
  term_entities: 48,
  locales: 2,
  bilingual_detail_routes: 96,
  english_detail_routes: 48,
  japanese_detail_routes: 48,
  relationship_routes_excluded: 2,
  directory_routes_excluded: 2,
  json_ld_scripts: 96,
  graph_nodes: 192,
  collection_page_nodes: 96,
  defined_term_nodes: 96,
  baseline_links: 96,
  term_set_links: 96,
  visible_review_dates: 96,
  alternate_name_arrays: 96,
  alternate_name_values: 260,
  schema_types: 2,
};
const expectedVerified = {
  term_entities: 48,
  pages: 96,
  english_pages: 48,
  japanese_pages: 48,
  relationship_pages: 2,
  relationship_metadata_scripts: 0,
  json_ld_scripts: 96,
  valid_json_scripts: 96,
  collection_page_nodes: 96,
  defined_term_nodes: 96,
  baseline_links: 96,
  term_set_links: 96,
  review_dates: 96,
  alternate_name_arrays: 96,
  alternate_name_values: 260,
  canonical_mismatches: 0,
  page_field_mismatches: 0,
  term_name_mismatches: 0,
  summary_mismatches: 0,
  missing_alternate_names: 0,
  unexpected_types: 0,
  same_as_claims: 0,
  term_code_claims: 0,
  unsafe_less_than_characters: 0,
  duplicate_locale_routes: 0,
  missing_locale_pairs: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  output_errors: 0,
};
const expectedPublicBoundary = {
  visible_page_metadata_allowed: true,
  public_defined_term_identity_allowed: true,
  visible_summary_allowed: true,
  visible_aliases_allowed: true,
  visible_review_date_allowed: true,
  term_set_relationship_allowed: true,
  same_as_claim_allowed: false,
  term_code_inference_allowed: false,
  synonym_inference_from_related_terms_allowed: false,
  participant_dataset_claim_allowed: false,
  betting_or_prediction_claim_allowed: false,
};
const expectedPrivacyBoundary = {
  visitor_identifiers_enabled: false,
  interaction_logging_enabled: false,
  cookies_enabled: false,
  client_storage_enabled: false,
  analytics_added: false,
};
const expectedAutomationBoundary = {
  external_schema_service_enabled: false,
  automatic_entity_inference_enabled: false,
  automatic_content_generation_enabled: false,
  automatic_publication_enabled: false,
  deployment_enabled: false,
};

if (contract.schema_version !== 'glossary-page-metadata-contract-v1') fail('glossary metadata contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('glossary metadata Work ID differs');
if (contract.implementation_unit !== 'GLOSSARY-PAGE-METADATA-01') fail('glossary metadata implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-17') fail('glossary metadata release state differs');
if (!exact(contract.scope, expectedScope)) fail('glossary metadata scope differs');
if (!exact(contract.route_contract, {
  english_pattern: '/glossary/{slug}/',
  japanese_pattern: '/ja/glossary/{slug}/',
  directory_routes_included: false,
  relationship_routes_included: false,
  one_english_and_one_japanese_route_per_slug: true,
  same_origin_required: true,
  query_parameters_allowed: false,
  fragments_allowed: false,
  trailing_slash_required: true,
})) fail('glossary metadata route contract differs');
if (!exact(contract.collection_page_contract, {
  type: 'CollectionPage',
  id_pattern: '{canonical-url}#webpage',
  url_source: 'rendered-canonical',
  name_source: 'rendered-title',
  description_source: 'rendered-meta-description',
  language_source: 'rendered-html-lang',
  review_date_source: 'visible-last-reviewed-time',
  website_relation: WEBSITE_ID,
  about_pattern: '{canonical-url}#defined-term',
  main_entity_pattern: '{canonical-url}#defined-term',
})) fail('glossary CollectionPage contract differs');
if (!exact(contract.defined_term_contract, {
  type: 'DefinedTerm',
  id_pattern: '{canonical-url}#defined-term',
  url_source: 'rendered-canonical',
  name_source: 'visible-page-heading',
  description_source: 'visible-hero-summary',
  alternate_name_sources: ['paired-locale-visible-page-heading', 'visible-aliases-from-both-locales'],
  english_term_set_id: `${SITE_ORIGIN}/glossary/#defined-term-set`,
  japanese_term_set_id: `${SITE_ORIGIN}/ja/glossary/#defined-term-set`,
  main_entity_of_page_pattern: '{canonical-url}#webpage',
  term_code_claim_allowed: false,
  same_as_claim_allowed: false,
  relationship_equivalence_claim_allowed: false,
})) fail('DefinedTerm contract differs');
if (!exact(contract.serialization_contract, {
  context: 'https://schema.org',
  format: 'JSON-LD',
  script_type: 'application/ld+json',
  script_marker: 'data-glossary-page-metadata',
  script_marker_value: MARKER,
  scripts_per_detail_page: 1,
  graph_nodes_per_script: 2,
  less_than_characters_escaped: true,
  valid_json_required: true,
})) fail('glossary metadata serialization contract differs');
if (!exact(contract.public_boundary, expectedPublicBoundary)) fail('glossary metadata public boundary differs');
if (!exact(contract.privacy_boundary, expectedPrivacyBoundary)) fail('glossary metadata privacy boundary differs');
if (!exact(contract.automation_boundary, expectedAutomationBoundary)) fail('glossary metadata automation boundary differs');
if (contract.previous_implementation_unit !== 'RACECOURSE-PAGE-METADATA-01' || contract.next_implementation_unit !== 'CANONICAL-HREFLANG-REVIEW-01') fail('glossary metadata roadmap differs');

if (audit.schema_version !== 'glossary-page-metadata-audit-v1') fail('glossary metadata audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('glossary metadata audit identity differs');
if (audit.status !== 'complete' || !exact(audit.verified, expectedVerified)) fail('glossary metadata audit measurements differ');
if (!Object.values(audit.behavior ?? {}).every((value) => value === true)) fail('glossary metadata audit behavior differs');
if (!exact(audit.public_boundary, expectedPublicBoundary) || !exact(audit.privacy_boundary, expectedPrivacyBoundary) || !exact(audit.automation_boundary, expectedAutomationBoundary)) fail('glossary metadata audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('glossary metadata audit roadmap differs');

const config = read(configPath);
for (const marker of [
  "import glossaryPageMetadataIntegration from './scripts/glossary-page-metadata-integration.mjs'",
  'sitemapRobotsIntegration()',
  'countryPageMetadataIntegration()',
  'racecoursePageMetadataIntegration()',
  'glossaryPageMetadataIntegration()',
]) if (!config.includes(marker)) fail(`Astro config missing ${marker}`);
if (config.indexOf('sitemapRobotsIntegration()') > config.indexOf('countryPageMetadataIntegration()')) fail('country metadata integration order differs');
if (config.indexOf('countryPageMetadataIntegration()') > config.indexOf('racecoursePageMetadataIntegration()')) fail('racecourse metadata integration order differs');
if (config.indexOf('racecoursePageMetadataIntegration()') > config.indexOf('glossaryPageMetadataIntegration()')) fail('glossary metadata integration order differs');

const integration = read(integrationPath);
for (const marker of [
  "const MARKER = 'collection-defined-term-v1'",
  "'@type': 'CollectionPage'",
  "'@type': 'DefinedTerm'",
  '#defined-term',
  '#defined-term-set',
  'inDefinedTermSet',
  'mainEntityOfPage',
  'lastReviewed',
  'about:',
  'mainEntity:',
  'JSON.stringify(data)',
  '.replace(/</g,',
  'bySlug.size !== 48',
  'pages.length !== 96',
  "match[2] === 'relationships'",
  'data-glossary-page-metadata',
  'data-structured-data-baseline="website-webpage-v1"',
]) if (!integration.includes(marker)) fail(`glossary metadata integration missing ${marker}`);
for (const forbidden of [
  'sameAs',
  'termCode',
  "'@type': 'Organization'",
  "'@type': 'Event'",
  "'@type': 'SportsEvent'",
  'fetch(',
  'localStorage',
  'sessionStorage',
  'document.cookie',
]) if (integration.includes(forbidden)) fail(`glossary metadata integration contains forbidden marker ${forbidden}`);
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary glossary metadata discovery workflow remains');

const doc = read(docPath);
for (const marker of [
  'GLOSSARY-PAGE-METADATA-01',
  'All 48 English and Japanese glossary term pairs',
  '`DefinedTerm`',
  '96 detail pages in total',
  'data-glossary-page-metadata="collection-defined-term-v1"',
  'Graph nodes: 192',
  'Alternate-name values: 260',
  '`sameAs` claims',
  'inferred `termCode` claims',
  'Relationship pages excluded: 2',
  'scripts/check-glossary-page-metadata.mjs',
  '.github/workflows/glossary-page-metadata.yml',
  'CANONICAL-HREFLANG-REVIEW-01',
]) if (!doc.includes(marker)) fail(`glossary metadata documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-sitemap-robots.mjs',
  'node scripts/check-structured-data-baseline.mjs',
  'node scripts/check-country-page-metadata.mjs',
  'node scripts/check-racecourse-page-metadata.mjs',
  'node scripts/check-glossary-qa-release.mjs',
  'node scripts/check-glossary-search-improvement.mjs',
  'node scripts/check-glossary-page-metadata.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`glossary metadata workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`glossary metadata workflow contains forbidden marker ${forbidden}`);
}

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function attribute(html, tagPattern, name) {
  const tag = html.match(tagPattern)?.[0];
  const value = tag?.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1];
  return value ? decodeHtml(value) : null;
}

function text(html, pattern) {
  const value = html.match(pattern)?.[1];
  return value ? stripTags(value) : null;
}

function aliases(html) {
  const section = html.match(/<section[^>]*aria-labelledby="aliases-heading"[^>]*>([\s\S]*?)<\/section>/i)?.[1];
  if (!section) return [];
  return [...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => stripTags(match[1])).filter(Boolean);
}

function uniqueNames(values, currentName) {
  return [...new Set(values.map((value) => value?.trim()).filter((value) => value && value !== currentName))];
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
const allGlossaryFiles = fs.existsSync(filePath('dist'))
  ? walk(filePath('dist')).filter((file) => /(?:^|[\\/])glossary[\\/][^\\/]+[\\/]index\.html$/.test(file))
  : [];
const relationshipFiles = allGlossaryFiles.filter((file) => /[\\/]glossary[\\/]relationships[\\/]index\.html$/.test(file));
const routeFiles = allGlossaryFiles.filter((file) => !/[\\/]glossary[\\/]relationships[\\/]index\.html$/.test(file));
const pages = [];
const bySlug = new Map();

if (relationshipFiles.length !== 2) fail(`glossary relationship route count differs ${relationshipFiles.length}`);
for (const file of relationshipFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('data-glossary-page-metadata=')) fail(`${path.relative(filePath('dist'), file)}: glossary term metadata must not appear on relationship page`);
}

for (const absolute of routeFiles) {
  const relative = path.relative(filePath('dist'), absolute).split(path.sep).join('/');
  const route = relative.match(/^(ja\/)?glossary\/([^/]+)\/index\.html$/);
  if (!route) continue;
  const locale = route[1] ? 'ja' : 'en';
  const slug = route[2];
  const html = fs.readFileSync(absolute, 'utf8');
  const canonical = attribute(html, /<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i, 'href');
  const lang = attribute(html, /<html\s+[^>]*>/i, 'lang');
  const pageTitle = text(html, /<title>([\s\S]*?)<\/title>/i);
  const description = attribute(html, /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i, 'content');
  const termName = text(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i);
  const summary = text(html, /<p[^>]*class="hero__summary"[^>]*>([\s\S]*?)<\/p>/i);
  const lastReviewed = attribute(html, /<time\s+[^>]*datetime="[^"]+"[^>]*>/i, 'datetime');
  const page = { absolute, relative, locale, slug, html, canonical, lang, pageTitle, description, termName, summary, lastReviewed, aliases: aliases(html) };
  pages.push(page);
  if (!bySlug.has(slug)) bySlug.set(slug, new Map());
  const locales = bySlug.get(slug);
  if (locales.has(locale)) fail(`${slug}: duplicate ${locale} route`);
  locales.set(locale, page);
}

if (pages.length !== 96) fail(`glossary metadata rendered route count differs ${pages.length}`);
if (bySlug.size !== 48) fail(`glossary metadata slug count differs ${bySlug.size}`);
if (pages.filter((page) => page.locale === 'en').length !== 48) fail('English glossary metadata route count differs');
if (pages.filter((page) => page.locale === 'ja').length !== 48) fail('Japanese glossary metadata route count differs');

let scriptCount = 0;
let collectionCount = 0;
let termCount = 0;
let baselineLinkCount = 0;
let termSetLinkCount = 0;
let reviewDateCount = 0;
let alternateNameArrayCount = 0;
let alternateNameValueCount = 0;

for (const [slug, locales] of bySlug) {
  const english = locales.get('en');
  const japanese = locales.get('ja');
  if (!english || !japanese || locales.size !== 2) {
    fail(`${slug}: bilingual glossary metadata pair is incomplete`);
    continue;
  }
  for (const [page, counterpart] of [[english, japanese], [japanese, english]]) {
    const expectedPath = page.locale === 'ja' ? `/ja/glossary/${slug}/` : `/glossary/${slug}/`;
    if (!page.canonical) fail(`${page.relative}: canonical missing`);
    else {
      const canonicalUrl = new URL(page.canonical);
      if (canonicalUrl.origin !== SITE_ORIGIN || canonicalUrl.pathname !== expectedPath || canonicalUrl.search || canonicalUrl.hash) fail(`${page.relative}: canonical differs ${page.canonical}`);
    }
    if (page.lang !== page.locale) fail(`${page.relative}: rendered language differs ${page.lang}`);
    if (!page.pageTitle || !page.description || !page.termName || !page.summary) fail(`${page.relative}: visible metadata field missing`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(page.lastReviewed ?? '')) fail(`${page.relative}: visible review date differs ${page.lastReviewed}`);
    if (!page.html.includes('data-structured-data-baseline="website-webpage-v1"')) fail(`${page.relative}: structured-data baseline missing`);

    const scripts = [...page.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*data-glossary-page-metadata="collection-defined-term-v1"[^>]*>([\s\S]*?)<\/script>/g)];
    scriptCount += scripts.length;
    if (scripts.length !== 1) {
      fail(`${page.relative}: glossary metadata script count differs ${scripts.length}`);
      continue;
    }
    if (scripts[0][1].includes('<')) fail(`${page.relative}: unsafe less-than character in glossary metadata JSON-LD`);

    let data;
    try {
      data = JSON.parse(scripts[0][1]);
    } catch (error) {
      fail(`${page.relative}: invalid glossary metadata JSON-LD ${error.message}`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org') fail(`${page.relative}: glossary metadata context differs`);
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
    if (graph.length !== 2) fail(`${page.relative}: glossary metadata graph length differs ${graph.length}`);
    const types = graph.map((node) => node['@type']).sort();
    if (!exact(types, ['CollectionPage', 'DefinedTerm'])) fail(`${page.relative}: glossary metadata types differ ${JSON.stringify(types)}`);
    if (graph.some((node) => Object.hasOwn(node, 'sameAs'))) fail(`${page.relative}: unsupported sameAs claim`);
    if (graph.some((node) => Object.hasOwn(node, 'termCode'))) fail(`${page.relative}: unsupported termCode claim`);
    if (graph.some((node) => ['Organization', 'Person', 'Event', 'SportsEvent'].includes(node['@type']))) fail(`${page.relative}: unsupported identity or event type`);

    const collection = graph.find((node) => node['@type'] === 'CollectionPage');
    const term = graph.find((node) => node['@type'] === 'DefinedTerm');
    if (collection) collectionCount += 1;
    if (term) termCount += 1;
    const webpageId = `${page.canonical}#webpage`;
    const termId = `${page.canonical}#defined-term`;
    const termSetId = page.locale === 'ja' ? `${SITE_ORIGIN}/ja/glossary/#defined-term-set` : `${SITE_ORIGIN}/glossary/#defined-term-set`;
    const alternateName = uniqueNames([counterpart.termName, ...page.aliases, ...counterpart.aliases], page.termName);
    if (!exact(collection, {
      '@type': 'CollectionPage',
      '@id': webpageId,
      url: page.canonical,
      name: page.pageTitle,
      description: page.description,
      inLanguage: page.locale,
      isPartOf: { '@id': WEBSITE_ID },
      lastReviewed: page.lastReviewed,
      about: { '@id': termId },
      mainEntity: { '@id': termId },
    })) fail(`${page.relative}: CollectionPage node differs`);
    if (!exact(term, {
      '@type': 'DefinedTerm',
      '@id': termId,
      url: page.canonical,
      name: page.termName,
      description: page.summary,
      alternateName,
      inDefinedTermSet: { '@id': termSetId },
      mainEntityOfPage: { '@id': webpageId },
    })) fail(`${page.relative}: DefinedTerm node differs`);
    if (collection?.['@id'] === webpageId && term?.mainEntityOfPage?.['@id'] === webpageId) baselineLinkCount += 1;
    if (term?.inDefinedTermSet?.['@id'] === termSetId) termSetLinkCount += 1;
    if (collection?.lastReviewed === page.lastReviewed) reviewDateCount += 1;
    if (Array.isArray(term?.alternateName)) {
      alternateNameArrayCount += 1;
      alternateNameValueCount += term.alternateName.length;
    }
  }
}

if (scriptCount !== 96) fail(`glossary metadata script total differs ${scriptCount}`);
if (collectionCount !== 96) fail(`glossary CollectionPage node total differs ${collectionCount}`);
if (termCount !== 96) fail(`DefinedTerm node total differs ${termCount}`);
if (baselineLinkCount !== 96) fail(`glossary metadata baseline link total differs ${baselineLinkCount}`);
if (termSetLinkCount !== 96) fail(`glossary term-set link total differs ${termSetLinkCount}`);
if (reviewDateCount !== 96) fail(`glossary review-date total differs ${reviewDateCount}`);
if (alternateNameArrayCount !== 96) fail(`glossary alternate-name array total differs ${alternateNameArrayCount}`);
if (alternateNameValueCount !== 260) fail(`glossary alternate-name value total differs ${alternateNameValueCount}`);

if (errors.length) {
  console.error(`GLOSSARY_PAGE_METADATA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('GLOSSARY_PAGE_METADATA: pass');
console.log('TERM_ENTITIES: 48');
console.log('BILINGUAL_DETAIL_ROUTES: 96');
console.log('COLLECTION_PAGE_NODES: 96');
console.log('DEFINED_TERM_NODES: 96');
console.log('ALTERNATE_NAME_VALUES: 260');
console.log('RELATIONSHIP_METADATA_SCRIPTS: 0');
console.log('SAME_AS_CLAIMS: 0');
console.log('TERM_CODE_CLAIMS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: CANONICAL-HREFLANG-REVIEW-01');
