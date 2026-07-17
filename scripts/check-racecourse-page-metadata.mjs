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
const MARKER = 'collection-place-v1';
const PLACEHOLDERS = new Set(['Not listed yet', '未掲載', 'Location pending', '所在地未掲載']);

const contractPath = 'data/static/racecourse-page-metadata-contract-v1.json';
const auditPath = 'data/audits/racecourse-page-metadata-v1.json';
const configPath = 'astro.config.mjs';
const integrationPath = 'scripts/racecourse-page-metadata-integration.mjs';
const docPath = 'docs/seo/racecourse-page-metadata.md';
const workflowPath = '.github/workflows/racecourse-page-metadata.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-racecourse-page-metadata-discovery.yml';

for (const requiredPath of [contractPath, auditPath, configPath, integrationPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedScope = {
  racecourse_entities: 36,
  locales: 2,
  bilingual_detail_routes: 72,
  english_detail_routes: 36,
  japanese_detail_routes: 36,
  json_ld_scripts: 72,
  graph_nodes: 144,
  collection_page_nodes: 72,
  place_nodes: 72,
  baseline_links: 72,
  country_area_links: 72,
  visible_address_values: 72,
  alternate_name_arrays: 72,
  schema_types: 2,
};
const expectedVerified = {
  racecourse_entities: 36,
  pages: 72,
  english_pages: 36,
  japanese_pages: 36,
  json_ld_scripts: 72,
  valid_json_scripts: 72,
  collection_page_nodes: 72,
  place_nodes: 72,
  baseline_links: 72,
  country_area_links: 72,
  address_values: 72,
  canonical_mismatches: 0,
  page_field_mismatches: 0,
  place_name_mismatches: 0,
  missing_alternate_names: 0,
  unexpected_types: 0,
  sports_activity_location_claims: 0,
  same_as_claims: 0,
  owner_or_operator_claims: 0,
  event_claims: 0,
  unsafe_less_than_characters: 0,
  duplicate_locale_routes: 0,
  missing_locale_pairs: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  output_errors: 0,
};
const expectedPublicBoundary = {
  visible_page_metadata_allowed: true,
  public_place_identity_allowed: true,
  visible_location_text_allowed: true,
  country_area_relationship_allowed: true,
  sports_business_classification_allowed: false,
  official_source_same_as_allowed: false,
  operator_identity_claim_allowed: false,
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

if (contract.schema_version !== 'racecourse-page-metadata-contract-v1') fail('racecourse metadata contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('racecourse metadata Work ID differs');
if (contract.implementation_unit !== 'RACECOURSE-PAGE-METADATA-01') fail('racecourse metadata implementation unit differs');
if (contract.status !== 'complete' || contract.reviewed_at !== '2026-07-17') fail('racecourse metadata release state differs');
if (!exact(contract.scope, expectedScope)) fail('racecourse metadata scope differs');
if (!exact(contract.route_contract, {
  english_pattern: '/tracks/{slug}/',
  japanese_pattern: '/ja/tracks/{slug}/',
  directory_routes_included: false,
  one_english_and_one_japanese_route_per_slug: true,
  same_origin_required: true,
  query_parameters_allowed: false,
  fragments_allowed: false,
  trailing_slash_required: true,
})) fail('racecourse metadata route contract differs');
if (!exact(contract.collection_page_contract, {
  type: 'CollectionPage',
  id_pattern: '{canonical-url}#webpage',
  url_source: 'rendered-canonical',
  name_source: 'rendered-title',
  description_source: 'rendered-meta-description',
  language_source: 'rendered-html-lang',
  website_relation: WEBSITE_ID,
  about_pattern: '{canonical-url}#place',
  main_entity_pattern: '{canonical-url}#place',
})) fail('racecourse CollectionPage contract differs');
if (!exact(contract.place_contract, {
  type: 'Place',
  id_pattern: '{canonical-url}#place',
  url_source: 'rendered-canonical',
  name_source: 'visible-page-heading',
  alternate_name_sources: ['paired-locale-visible-page-heading', 'visible-local-name-in-hero'],
  address_source: 'visible-city-region-field',
  contained_in_place_id_source: 'visible-country-page-link',
  contained_in_place_name_source: 'visible-country-link-text',
  main_entity_of_page_pattern: '{canonical-url}#webpage',
  sports_activity_location_claim_allowed: false,
  same_as_claim_allowed: false,
  owner_or_operator_claim_allowed: false,
  event_claim_allowed: false,
})) fail('racecourse Place contract differs');
if (!exact(contract.serialization_contract, {
  context: 'https://schema.org',
  format: 'JSON-LD',
  script_type: 'application/ld+json',
  script_marker: 'data-racecourse-page-metadata',
  script_marker_value: MARKER,
  scripts_per_detail_page: 1,
  graph_nodes_per_script: 2,
  less_than_characters_escaped: true,
  valid_json_required: true,
})) fail('racecourse metadata serialization contract differs');
if (!exact(contract.public_boundary, expectedPublicBoundary)) fail('racecourse metadata public boundary differs');
if (!exact(contract.privacy_boundary, expectedPrivacyBoundary)) fail('racecourse metadata privacy boundary differs');
if (!exact(contract.automation_boundary, expectedAutomationBoundary)) fail('racecourse metadata automation boundary differs');
if (contract.previous_implementation_unit !== 'COUNTRY-PAGE-METADATA-01' || contract.next_implementation_unit !== 'GLOSSARY-PAGE-METADATA-01') fail('racecourse metadata roadmap differs');

if (audit.schema_version !== 'racecourse-page-metadata-audit-v1') fail('racecourse metadata audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('racecourse metadata audit identity differs');
if (audit.status !== 'complete' || !exact(audit.verified, expectedVerified)) fail('racecourse metadata audit measurements differ');
if (!Object.values(audit.behavior ?? {}).every((value) => value === true)) fail('racecourse metadata audit behavior differs');
if (!exact(audit.public_boundary, expectedPublicBoundary) || !exact(audit.privacy_boundary, expectedPrivacyBoundary) || !exact(audit.automation_boundary, expectedAutomationBoundary)) fail('racecourse metadata audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('racecourse metadata audit roadmap differs');

const config = read(configPath);
for (const marker of [
  "import racecoursePageMetadataIntegration from './scripts/racecourse-page-metadata-integration.mjs'",
  'sitemapRobotsIntegration()',
  'countryPageMetadataIntegration()',
  'racecoursePageMetadataIntegration()',
]) if (!config.includes(marker)) fail(`Astro config missing ${marker}`);
if (config.indexOf('sitemapRobotsIntegration()') > config.indexOf('countryPageMetadataIntegration()')) fail('country metadata integration order differs');
if (config.indexOf('countryPageMetadataIntegration()') > config.indexOf('racecoursePageMetadataIntegration()')) fail('racecourse metadata integration order differs');

const integration = read(integrationPath);
for (const marker of [
  "const MARKER = 'collection-place-v1'",
  "'@type': 'CollectionPage'",
  "'@type': 'Place'",
  '#place',
  'containedInPlace',
  '#administrative-area',
  'mainEntityOfPage',
  'address:',
  'about:',
  'mainEntity:',
  'JSON.stringify(data)',
  '.replace(/</g,',
  'bySlug.size !== 36',
  'pages.length !== 72',
  'data-racecourse-page-metadata',
  'data-structured-data-baseline="website-webpage-v1"',
]) if (!integration.includes(marker)) fail(`racecourse metadata integration missing ${marker}`);
for (const forbidden of [
  "'@type': 'SportsActivityLocation'",
  'sameAs',
  "'@type': 'Organization'",
  "'@type': 'Event'",
  "'@type': 'SportsEvent'",
  'owner:',
  'operator:',
  'fetch(',
  'localStorage',
  'sessionStorage',
  'document.cookie',
]) if (integration.includes(forbidden)) fail(`racecourse metadata integration contains forbidden marker ${forbidden}`);
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary racecourse metadata discovery workflow remains');

const doc = read(docPath);
for (const marker of [
  'RACECOURSE-PAGE-METADATA-01',
  'All 36 English and Japanese racecourse detail pairs',
  '`Place`',
  '72 detail pages in total',
  'data-racecourse-page-metadata="collection-place-v1"',
  'Graph nodes: 144',
  '`SportsActivityLocation` claims',
  '`sameAs` claims',
  'scripts/check-racecourse-page-metadata.mjs',
  '.github/workflows/racecourse-page-metadata.yml',
  'GLOSSARY-PAGE-METADATA-01',
]) if (!doc.includes(marker)) fail(`racecourse metadata documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-sitemap-robots.mjs',
  'node scripts/check-structured-data-baseline.mjs',
  'node scripts/check-country-page-metadata.mjs',
  'node scripts/check-racecourse-page-bilingual-qa.mjs',
  'node scripts/check-racecourse-page-identity-reconciliation.mjs',
  'node scripts/check-racecourse-page-public-timetable-connection.mjs',
  'node scripts/check-racecourse-page-profile-evidence.mjs',
  'node scripts/check-racecourse-page-link-architecture.mjs',
  'node scripts/check-racecourse-page-metadata.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`racecourse metadata workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`racecourse metadata workflow contains forbidden marker ${forbidden}`);
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

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function strongParagraph(html, label) {
  const escaped = escapePattern(label);
  return text(html, new RegExp(`<p>\\s*<strong>\\s*${escaped}\\s*<\\/strong>\\s*([\\s\\S]*?)<\\/p>`, 'i'));
}

function strongParagraphHref(html, label) {
  const escaped = escapePattern(label);
  const value = html.match(new RegExp(`<p>\\s*<strong>\\s*${escaped}\\s*<\\/strong>\\s*<a\\s+[^>]*href="([^"]+)"`, 'i'))?.[1];
  return value ? decodeHtml(value) : null;
}

function visibleAddress(value) {
  if (!value) return null;
  const parts = value.split('/').map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 && parts.some((part) => !PLACEHOLDERS.has(part)) ? value : null;
}

function localNameFromHero(summary) {
  if (!summary?.includes(' · ')) return null;
  const value = summary.split(' · ', 1)[0].trim();
  return value || null;
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
  ? walk(filePath('dist')).filter((file) => /(?:^|[\\/])tracks[\\/][^\\/]+[\\/]index\.html$/.test(file))
  : [];
const pages = [];
const bySlug = new Map();

for (const absolute of routeFiles) {
  const relative = path.relative(filePath('dist'), absolute).split(path.sep).join('/');
  const route = relative.match(/^(ja\/)?tracks\/([^/]+)\/index\.html$/);
  if (!route) continue;
  const locale = route[1] ? 'ja' : 'en';
  const slug = route[2];
  const html = fs.readFileSync(absolute, 'utf8');
  const canonical = attribute(html, /<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i, 'href');
  const lang = attribute(html, /<html\s+[^>]*>/i, 'lang');
  const pageTitle = text(html, /<title>([\s\S]*?)<\/title>/i);
  const description = attribute(html, /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i, 'content');
  const placeName = text(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i);
  const heroSummary = text(html, /<p[^>]*class="hero__summary"[^>]*>([\s\S]*?)<\/p>/i);
  const localName = localNameFromHero(heroSummary);
  const countryLabel = locale === 'ja' ? '国:' : 'Country:';
  const locationLabel = locale === 'ja' ? '都市 / 地域:' : 'City / region:';
  const countryHref = strongParagraphHref(html, countryLabel);
  const countryName = strongParagraph(html, countryLabel);
  const addressText = visibleAddress(strongParagraph(html, locationLabel));
  const page = { absolute, relative, locale, slug, html, canonical, lang, pageTitle, description, placeName, localName, countryHref, countryName, addressText };
  pages.push(page);
  if (!bySlug.has(slug)) bySlug.set(slug, new Map());
  const locales = bySlug.get(slug);
  if (locales.has(locale)) fail(`${slug}: duplicate ${locale} route`);
  locales.set(locale, page);
}

if (pages.length !== 72) fail(`racecourse metadata rendered route count differs ${pages.length}`);
if (bySlug.size !== 36) fail(`racecourse metadata slug count differs ${bySlug.size}`);
if (pages.filter((page) => page.locale === 'en').length !== 36) fail('English racecourse metadata route count differs');
if (pages.filter((page) => page.locale === 'ja').length !== 36) fail('Japanese racecourse metadata route count differs');

let scriptCount = 0;
let collectionCount = 0;
let placeCount = 0;
let baselineLinkCount = 0;
let countryAreaLinkCount = 0;
let addressCount = 0;

for (const [slug, locales] of bySlug) {
  const english = locales.get('en');
  const japanese = locales.get('ja');
  if (!english || !japanese || locales.size !== 2) {
    fail(`${slug}: bilingual racecourse metadata pair is incomplete`);
    continue;
  }
  for (const [page, counterpart] of [[english, japanese], [japanese, english]]) {
    const expectedPath = page.locale === 'ja' ? `/ja/tracks/${slug}/` : `/tracks/${slug}/`;
    if (!page.canonical) fail(`${page.relative}: canonical missing`);
    else {
      const canonicalUrl = new URL(page.canonical);
      if (canonicalUrl.origin !== SITE_ORIGIN || canonicalUrl.pathname !== expectedPath || canonicalUrl.search || canonicalUrl.hash) fail(`${page.relative}: canonical differs ${page.canonical}`);
    }
    if (page.lang !== page.locale) fail(`${page.relative}: rendered language differs ${page.lang}`);
    if (!page.pageTitle || !page.description || !page.placeName || !page.countryHref || !page.countryName || !page.addressText) fail(`${page.relative}: visible metadata field missing`);
    const expectedCountryPattern = page.locale === 'ja' ? /^\/ja\/countries\/[^/]+\/$/ : /^\/countries\/[^/]+\/$/;
    if (!expectedCountryPattern.test(page.countryHref ?? '')) fail(`${page.relative}: visible country link differs ${page.countryHref}`);
    if (!page.html.includes('data-structured-data-baseline="website-webpage-v1"')) fail(`${page.relative}: structured-data baseline missing`);

    const scripts = [...page.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*data-racecourse-page-metadata="collection-place-v1"[^>]*>([\s\S]*?)<\/script>/g)];
    scriptCount += scripts.length;
    if (scripts.length !== 1) {
      fail(`${page.relative}: racecourse metadata script count differs ${scripts.length}`);
      continue;
    }
    if (scripts[0][1].includes('<')) fail(`${page.relative}: unsafe less-than character in racecourse metadata JSON-LD`);

    let data;
    try {
      data = JSON.parse(scripts[0][1]);
    } catch (error) {
      fail(`${page.relative}: invalid racecourse metadata JSON-LD ${error.message}`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org') fail(`${page.relative}: racecourse metadata context differs`);
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
    if (graph.length !== 2) fail(`${page.relative}: racecourse metadata graph length differs ${graph.length}`);
    const types = graph.map((node) => node['@type']).sort();
    if (!exact(types, ['CollectionPage', 'Place'])) fail(`${page.relative}: racecourse metadata types differ ${JSON.stringify(types)}`);
    if (graph.some((node) => node['@type'] === 'SportsActivityLocation')) fail(`${page.relative}: unsupported SportsActivityLocation claim`);
    if (graph.some((node) => Object.hasOwn(node, 'sameAs'))) fail(`${page.relative}: unsupported sameAs claim`);
    if (graph.some((node) => ['Organization', 'Person', 'Event', 'SportsEvent'].includes(node['@type']))) fail(`${page.relative}: unsupported identity or event type`);
    if (graph.some((node) => Object.hasOwn(node, 'owner') || Object.hasOwn(node, 'operator'))) fail(`${page.relative}: unsupported owner or operator claim`);

    const collection = graph.find((node) => node['@type'] === 'CollectionPage');
    const place = graph.find((node) => node['@type'] === 'Place');
    if (collection) collectionCount += 1;
    if (place) placeCount += 1;
    const webpageId = `${page.canonical}#webpage`;
    const placeId = `${page.canonical}#place`;
    const countryUrl = new URL(page.countryHref, SITE_ORIGIN).toString();
    const countryAreaId = `${countryUrl}#administrative-area`;
    const alternateName = uniqueNames([counterpart.placeName, page.localName], page.placeName);
    if (!exact(collection, {
      '@type': 'CollectionPage',
      '@id': webpageId,
      url: page.canonical,
      name: page.pageTitle,
      description: page.description,
      inLanguage: page.locale,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': placeId },
      mainEntity: { '@id': placeId },
    })) fail(`${page.relative}: CollectionPage node differs`);
    if (!exact(place, {
      '@type': 'Place',
      '@id': placeId,
      url: page.canonical,
      name: page.placeName,
      alternateName,
      address: page.addressText,
      containedInPlace: { '@id': countryAreaId, name: page.countryName },
      mainEntityOfPage: { '@id': webpageId },
    })) fail(`${page.relative}: Place node differs`);
    if (collection?.['@id'] === webpageId && place?.mainEntityOfPage?.['@id'] === webpageId) baselineLinkCount += 1;
    if (place?.containedInPlace?.['@id'] === countryAreaId) countryAreaLinkCount += 1;
    if (typeof place?.address === 'string' && place.address.length > 0) addressCount += 1;
  }
}

if (scriptCount !== 72) fail(`racecourse metadata script total differs ${scriptCount}`);
if (collectionCount !== 72) fail(`racecourse CollectionPage node total differs ${collectionCount}`);
if (placeCount !== 72) fail(`racecourse Place node total differs ${placeCount}`);
if (baselineLinkCount !== 72) fail(`racecourse metadata baseline link total differs ${baselineLinkCount}`);
if (countryAreaLinkCount !== 72) fail(`racecourse country-area link total differs ${countryAreaLinkCount}`);
if (addressCount !== 72) fail(`racecourse address total differs ${addressCount}`);

if (errors.length) {
  console.error(`RACECOURSE_PAGE_METADATA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('RACECOURSE_PAGE_METADATA: pass');
console.log('RACECOURSE_ENTITIES: 36');
console.log('BILINGUAL_DETAIL_ROUTES: 72');
console.log('COLLECTION_PAGE_NODES: 72');
console.log('PLACE_NODES: 72');
console.log('COUNTRY_AREA_LINKS: 72');
console.log('ADDRESS_VALUES: 72');
console.log('SPORTS_ACTIVITY_LOCATION_CLAIMS: 0');
console.log('SAME_AS_CLAIMS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-PAGE-METADATA-01');
