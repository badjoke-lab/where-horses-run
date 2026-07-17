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
const MARKER = 'collection-administrative-area-v1';

const contractPath = 'data/static/country-page-metadata-contract-v1.json';
const auditPath = 'data/audits/country-page-metadata-v1.json';
const configPath = 'astro.config.mjs';
const integrationPath = 'scripts/country-page-metadata-integration.mjs';
const docPath = 'docs/seo/country-page-metadata.md';
const workflowPath = '.github/workflows/country-page-metadata.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-country-page-metadata-discovery.yml';

for (const requiredPath of [contractPath, auditPath, configPath, integrationPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedScope = {
  area_entities: 98,
  locales: 2,
  bilingual_detail_routes: 196,
  english_detail_routes: 98,
  japanese_detail_routes: 98,
  json_ld_scripts: 196,
  graph_nodes: 392,
  collection_page_nodes: 196,
  administrative_area_nodes: 196,
  baseline_links: 196,
  visible_review_dates: 196,
  alternate_name_arrays: 196,
  schema_types: 2,
};
const expectedVerified = {
  area_entities: 98,
  pages: 196,
  english_pages: 98,
  japanese_pages: 98,
  json_ld_scripts: 196,
  valid_json_scripts: 196,
  collection_page_nodes: 196,
  administrative_area_nodes: 196,
  baseline_links: 196,
  canonical_mismatches: 0,
  page_field_mismatches: 0,
  area_name_mismatches: 0,
  missing_alternate_names: 0,
  missing_review_dates: 0,
  unexpected_types: 0,
  country_type_claims: 0,
  same_as_claims: 0,
  unsafe_less_than_characters: 0,
  duplicate_locale_routes: 0,
  missing_locale_pairs: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  output_errors: 0,
};
const expectedPublicBoundary = {
  visible_page_metadata_allowed: true,
  public_area_identity_allowed: true,
  public_review_date_allowed: true,
  unverified_country_classification_allowed: false,
  official_source_same_as_allowed: false,
  organization_claim_allowed: false,
  event_claim_allowed: false,
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

if (contract.schema_version !== 'country-page-metadata-contract-v1') fail('country metadata contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('country metadata Work ID differs');
if (contract.implementation_unit !== 'COUNTRY-PAGE-METADATA-01') fail('country metadata implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-17') fail('country metadata release state differs');
if (!exact(contract.scope, expectedScope)) fail('country metadata scope differs');
if (!exact(contract.route_contract, {
  english_pattern: '/countries/{slug}/',
  japanese_pattern: '/ja/countries/{slug}/',
  directory_routes_included: false,
  one_english_and_one_japanese_route_per_slug: true,
  same_origin_required: true,
  query_parameters_allowed: false,
  fragments_allowed: false,
  trailing_slash_required: true,
})) fail('country metadata route contract differs');
if (!exact(contract.collection_page_contract, {
  type: 'CollectionPage',
  id_pattern: '{canonical-url}#webpage',
  url_source: 'rendered-canonical',
  name_source: 'rendered-title',
  description_source: 'rendered-meta-description',
  language_source: 'rendered-html-lang',
  review_date_source: 'visible-profile-reviewed-field',
  website_relation: WEBSITE_ID,
  about_pattern: '{canonical-url}#administrative-area',
  main_entity_pattern: '{canonical-url}#administrative-area',
})) fail('CollectionPage contract differs');
if (!exact(contract.administrative_area_contract, {
  type: 'AdministrativeArea',
  id_pattern: '{canonical-url}#administrative-area',
  url_source: 'rendered-canonical',
  name_source: 'visible-page-heading',
  alternate_name_sources: ['paired-locale-visible-page-heading', 'visible-local-name-field'],
  main_entity_of_page_pattern: '{canonical-url}#webpage',
  country_type_claim_allowed: false,
  same_as_claim_allowed: false,
  sovereignty_claim_allowed: false,
})) fail('AdministrativeArea contract differs');
if (!exact(contract.serialization_contract, {
  context: 'https://schema.org',
  format: 'JSON-LD',
  script_type: 'application/ld+json',
  script_marker: 'data-country-page-metadata',
  script_marker_value: MARKER,
  scripts_per_detail_page: 1,
  graph_nodes_per_script: 2,
  less_than_characters_escaped: true,
  valid_json_required: true,
})) fail('country metadata serialization contract differs');
if (!exact(contract.public_boundary, expectedPublicBoundary)) fail('country metadata public boundary differs');
if (!exact(contract.privacy_boundary, expectedPrivacyBoundary)) fail('country metadata privacy boundary differs');
if (!exact(contract.automation_boundary, expectedAutomationBoundary)) fail('country metadata automation boundary differs');
if (contract.previous_implementation_unit !== 'STRUCTURED-DATA-BASELINE-01' || contract.next_implementation_unit !== 'RACECOURSE-PAGE-METADATA-01') fail('country metadata roadmap differs');

if (audit.schema_version !== 'country-page-metadata-audit-v1') fail('country metadata audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('country metadata audit identity differs');
if (audit.status !== 'complete' || !exact(audit.verified, expectedVerified)) fail('country metadata audit measurements differ');
if (!Object.values(audit.behavior ?? {}).every((value) => value === true)) fail('country metadata audit behavior differs');
if (!exact(audit.public_boundary, expectedPublicBoundary) || !exact(audit.privacy_boundary, expectedPrivacyBoundary) || !exact(audit.automation_boundary, expectedAutomationBoundary)) fail('country metadata audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('country metadata audit roadmap differs');

const config = read(configPath);
for (const marker of [
  "import countryPageMetadataIntegration from './scripts/country-page-metadata-integration.mjs'",
  'sitemapRobotsIntegration()',
  'countryPageMetadataIntegration()',
]) if (!config.includes(marker)) fail(`Astro config missing ${marker}`);
if (config.indexOf('sitemapRobotsIntegration()') > config.indexOf('countryPageMetadataIntegration()')) fail('country metadata integration must run after sitemap integration registration');

const integration = read(integrationPath);
for (const marker of [
  "const MARKER = 'collection-administrative-area-v1'",
  "'@type': 'CollectionPage'",
  "'@type': 'AdministrativeArea'",
  '#administrative-area',
  'mainEntityOfPage',
  'lastReviewed',
  'about:',
  'mainEntity:',
  'JSON.stringify(data)',
  '.replace(/</g,',
  'bySlug.size !== 98',
  'pages.length !== 196',
  'data-country-page-metadata',
  'data-structured-data-baseline="website-webpage-v1"',
]) if (!integration.includes(marker)) fail(`country metadata integration missing ${marker}`);
for (const forbidden of [
  "'@type': 'Country'",
  'sameAs',
  "'@type': 'Organization'",
  "'@type': 'Event'",
  "'@type': 'SportsEvent'",
  'fetch(',
  'localStorage',
  'sessionStorage',
  'document.cookie',
]) if (integration.includes(forbidden)) fail(`country metadata integration contains forbidden marker ${forbidden}`);
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary country metadata discovery workflow remains');

const doc = read(docPath);
for (const marker of [
  'COUNTRY-PAGE-METADATA-01',
  '98 English and Japanese country or region detail pairs',
  '`AdministrativeArea`',
  '196 detail pages in total',
  'data-country-page-metadata="collection-administrative-area-v1"',
  'Graph nodes: 392',
  '`Country` type claims',
  '`sameAs` claims',
  'scripts/check-country-page-metadata.mjs',
  '.github/workflows/country-page-metadata.yml',
  'RACECOURSE-PAGE-METADATA-01',
]) if (!doc.includes(marker)) fail(`country metadata documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-sitemap-robots.mjs',
  'node scripts/check-structured-data-baseline.mjs',
  'node scripts/check-country-detail-profile-runtime.mjs',
  'node scripts/check-country-page-programme.mjs',
  'node scripts/check-country-page-metadata.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`country metadata workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`country metadata workflow contains forbidden marker ${forbidden}`);
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

function definition(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text(html, new RegExp(`<dt[^>]*>\\s*${escaped}\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, 'i'));
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
const routeFiles = fs.existsSync(filePath('dist'))
  ? walk(filePath('dist')).filter((file) => /(?:^|[\\/])countries[\\/][^\\/]+[\\/]index\.html$/.test(file))
  : [];
const pages = [];
const bySlug = new Map();

for (const absolute of routeFiles) {
  const relative = path.relative(filePath('dist'), absolute).split(path.sep).join('/');
  const route = relative.match(/^(ja\/)?countries\/([^/]+)\/index\.html$/);
  if (!route) continue;
  const locale = route[1] ? 'ja' : 'en';
  const slug = route[2];
  const html = fs.readFileSync(absolute, 'utf8');
  const canonical = attribute(html, /<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i, 'href');
  const lang = attribute(html, /<html\s+[^>]*>/i, 'lang');
  const pageTitle = text(html, /<title>([\s\S]*?)<\/title>/i);
  const description = attribute(html, /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i, 'content');
  const heading = text(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i);
  const suffix = locale === 'ja' ? 'の競馬カレンダー・競馬場ガイド' : ' Horse Racing Calendar & Racecourses';
  const areaName = heading?.endsWith(suffix) ? heading.slice(0, -suffix.length).trim() : null;
  const localName = definition(html, locale === 'ja' ? '現地名' : 'Local name');
  const lastReviewed = definition(html, locale === 'ja' ? 'プロフィール確認日' : 'Profile reviewed');
  const page = { absolute, relative, locale, slug, html, canonical, lang, pageTitle, description, heading, areaName, localName, lastReviewed };
  pages.push(page);
  if (!bySlug.has(slug)) bySlug.set(slug, new Map());
  const locales = bySlug.get(slug);
  if (locales.has(locale)) fail(`${slug}: duplicate ${locale} route`);
  locales.set(locale, page);
}

if (pages.length !== 196) fail(`country metadata rendered route count differs ${pages.length}`);
if (bySlug.size !== 98) fail(`country metadata slug count differs ${bySlug.size}`);
if (pages.filter((page) => page.locale === 'en').length !== 98) fail('English country metadata route count differs');
if (pages.filter((page) => page.locale === 'ja').length !== 98) fail('Japanese country metadata route count differs');

let scriptCount = 0;
let collectionCount = 0;
let areaCount = 0;
let baselineLinkCount = 0;

for (const [slug, locales] of bySlug) {
  const english = locales.get('en');
  const japanese = locales.get('ja');
  if (!english || !japanese || locales.size !== 2) {
    fail(`${slug}: bilingual country metadata pair is incomplete`);
    continue;
  }
  for (const [page, counterpart] of [[english, japanese], [japanese, english]]) {
    const expectedPath = page.locale === 'ja' ? `/ja/countries/${slug}/` : `/countries/${slug}/`;
    if (!page.canonical) fail(`${page.relative}: canonical missing`);
    else {
      const canonicalUrl = new URL(page.canonical);
      if (canonicalUrl.origin !== SITE_ORIGIN || canonicalUrl.pathname !== expectedPath || canonicalUrl.search || canonicalUrl.hash) fail(`${page.relative}: canonical differs ${page.canonical}`);
    }
    if (page.lang !== page.locale) fail(`${page.relative}: rendered language differs ${page.lang}`);
    if (!page.pageTitle || !page.description || !page.areaName || !page.localName) fail(`${page.relative}: visible metadata field missing`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(page.lastReviewed ?? '')) fail(`${page.relative}: visible review date differs ${page.lastReviewed}`);
    if (!page.html.includes('data-structured-data-baseline="website-webpage-v1"')) fail(`${page.relative}: structured-data baseline missing`);

    const scripts = [...page.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*data-country-page-metadata="collection-administrative-area-v1"[^>]*>([\s\S]*?)<\/script>/g)];
    scriptCount += scripts.length;
    if (scripts.length !== 1) {
      fail(`${page.relative}: country metadata script count differs ${scripts.length}`);
      continue;
    }
    if (scripts[0][1].includes('<')) fail(`${page.relative}: unsafe less-than character in country metadata JSON-LD`);

    let data;
    try {
      data = JSON.parse(scripts[0][1]);
    } catch (error) {
      fail(`${page.relative}: invalid country metadata JSON-LD ${error.message}`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org') fail(`${page.relative}: country metadata context differs`);
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
    if (graph.length !== 2) fail(`${page.relative}: country metadata graph length differs ${graph.length}`);
    const types = graph.map((node) => node['@type']).sort();
    if (!exact(types, ['AdministrativeArea', 'CollectionPage'])) fail(`${page.relative}: country metadata types differ ${JSON.stringify(types)}`);
    if (graph.some((node) => node['@type'] === 'Country')) fail(`${page.relative}: unsupported Country type claim`);
    if (graph.some((node) => Object.hasOwn(node, 'sameAs'))) fail(`${page.relative}: unsupported sameAs claim`);
    if (graph.some((node) => ['Organization', 'Person', 'Event', 'SportsEvent'].includes(node['@type']))) fail(`${page.relative}: unsupported identity or event type`);

    const collection = graph.find((node) => node['@type'] === 'CollectionPage');
    const area = graph.find((node) => node['@type'] === 'AdministrativeArea');
    if (collection) collectionCount += 1;
    if (area) areaCount += 1;
    const webpageId = `${page.canonical}#webpage`;
    const areaId = `${page.canonical}#administrative-area`;
    const alternateName = uniqueNames([counterpart.areaName, page.localName], page.areaName);
    if (!exact(collection, {
      '@type': 'CollectionPage',
      '@id': webpageId,
      url: page.canonical,
      name: page.pageTitle,
      description: page.description,
      inLanguage: page.locale,
      isPartOf: { '@id': WEBSITE_ID },
      lastReviewed: page.lastReviewed,
      about: { '@id': areaId },
      mainEntity: { '@id': areaId },
    })) fail(`${page.relative}: CollectionPage node differs`);
    if (!exact(area, {
      '@type': 'AdministrativeArea',
      '@id': areaId,
      url: page.canonical,
      name: page.areaName,
      alternateName,
      mainEntityOfPage: { '@id': webpageId },
    })) fail(`${page.relative}: AdministrativeArea node differs`);
    if (collection?.['@id'] === webpageId && area?.mainEntityOfPage?.['@id'] === webpageId) baselineLinkCount += 1;
  }
}

if (scriptCount !== 196) fail(`country metadata script total differs ${scriptCount}`);
if (collectionCount !== 196) fail(`CollectionPage node total differs ${collectionCount}`);
if (areaCount !== 196) fail(`AdministrativeArea node total differs ${areaCount}`);
if (baselineLinkCount !== 196) fail(`country metadata baseline link total differs ${baselineLinkCount}`);

if (errors.length) {
  console.error(`COUNTRY_PAGE_METADATA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('COUNTRY_PAGE_METADATA: pass');
console.log('AREA_ENTITIES: 98');
console.log('BILINGUAL_DETAIL_ROUTES: 196');
console.log('COLLECTION_PAGE_NODES: 196');
console.log('ADMINISTRATIVE_AREA_NODES: 196');
console.log('COUNTRY_TYPE_CLAIMS: 0');
console.log('SAME_AS_CLAIMS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: RACECOURSE-PAGE-METADATA-01');
