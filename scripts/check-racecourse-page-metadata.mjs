import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const MARKER = 'collection-place-v1';
const HISTORICAL_RACECOURSES = 36;
const HISTORICAL_ROUTES = 72;
const CONTRACT = 'data/static/racecourse-page-metadata-contract-v1.json';
const AUDIT = 'data/audits/racecourse-page-metadata-v1.json';
const CONFIG = 'astro.config.mjs';
const INTEGRATION = 'scripts/racecourse-page-metadata-integration.mjs';
const DOC = 'docs/seo/racecourse-page-metadata.md';
const WORKFLOW = '.github/workflows/racecourse-page-metadata.yml';
const TEMPORARY = '.github/workflows/temporary-racecourse-page-metadata-discovery.yml';
const RACECOURSE_DATA_FILES = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];
const PLACEHOLDERS = new Set(['Not listed yet', '未掲載', 'Location pending', '所在地未掲載']);

const filePath = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(filePath(file), 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [CONTRACT, AUDIT, CONFIG, INTEGRATION, DOC, WORKFLOW, ...RACECOURSE_DATA_FILES]) {
  expect(fs.existsSync(filePath(file)), `required file missing: ${file}`);
}
expect(!fs.existsSync(filePath(TEMPORARY)), 'temporary racecourse metadata discovery workflow remains');

const contract = json(CONTRACT);
const audit = json(AUDIT);
expect(contract.schema_version === 'racecourse-page-metadata-contract-v1', 'racecourse metadata contract schema differs');
expect(contract.work_id === 'WHR-SEO-PUBLIC-CONTENT-V1', 'racecourse metadata Work ID differs');
expect(contract.implementation_unit === 'RACECOURSE-PAGE-METADATA-01', 'racecourse metadata implementation unit differs');
expect(contract.status === 'complete' && contract.reviewed_at === '2026-07-17', 'racecourse metadata historical release state differs');
expect(contract.scope.racecourse_entities === HISTORICAL_RACECOURSES, 'historical racecourse entity baseline differs');
expect(contract.scope.bilingual_detail_routes === HISTORICAL_ROUTES, 'historical racecourse route baseline differs');
expect(contract.scope.english_detail_routes === HISTORICAL_RACECOURSES && contract.scope.japanese_detail_routes === HISTORICAL_RACECOURSES, 'historical locale route baseline differs');
expect(contract.scope.json_ld_scripts === HISTORICAL_ROUTES && contract.scope.graph_nodes === HISTORICAL_ROUTES * 2, 'historical metadata-node baseline differs');
expect(contract.route_contract?.english_pattern === '/tracks/{slug}/' && contract.route_contract?.japanese_pattern === '/ja/tracks/{slug}/', 'racecourse metadata route contract differs');
expect(contract.route_contract?.one_english_and_one_japanese_route_per_slug === true && contract.route_contract?.trailing_slash_required === true, 'racecourse metadata locale route contract differs');
expect(contract.collection_page_contract?.type === 'CollectionPage' && contract.place_contract?.type === 'Place', 'racecourse metadata schema contract differs');
expect(contract.serialization_contract?.script_marker_value === MARKER && contract.serialization_contract?.scripts_per_detail_page === 1 && contract.serialization_contract?.graph_nodes_per_script === 2, 'racecourse metadata serialization contract differs');
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const allowed = ['visible_page_metadata_allowed', 'public_place_identity_allowed', 'visible_location_text_allowed', 'country_area_relationship_allowed'].includes(key);
  expect(value === allowed, `racecourse metadata public boundary differs: ${key}`);
}
expect(Object.values(contract.privacy_boundary ?? {}).every((value) => value === false), 'racecourse metadata privacy boundary differs');
expect(Object.values(contract.automation_boundary ?? {}).every((value) => value === false), 'racecourse metadata automation boundary differs');
expect(contract.previous_implementation_unit === 'COUNTRY-PAGE-METADATA-01' && contract.next_implementation_unit === 'GLOSSARY-PAGE-METADATA-01', 'racecourse metadata roadmap differs');

expect(audit.schema_version === 'racecourse-page-metadata-audit-v1', 'racecourse metadata audit schema differs');
expect(audit.work_id === contract.work_id && audit.implementation_unit === contract.implementation_unit, 'racecourse metadata audit identity differs');
expect(audit.status === 'complete' && audit.reviewed_at === '2026-07-17', 'racecourse metadata audit state differs');
expect(audit.verified?.racecourse_entities === HISTORICAL_RACECOURSES && audit.verified?.pages === HISTORICAL_ROUTES, 'historical racecourse metadata audit baseline differs');
for (const key of ['canonical_mismatches','page_field_mismatches','place_name_mismatches','missing_alternate_names','unexpected_types','sports_activity_location_claims','same_as_claims','owner_or_operator_claims','event_claims','unsafe_less_than_characters','duplicate_locale_routes','missing_locale_pairs','temporary_discovery_workflows','contract_errors','output_errors']) {
  expect(audit.verified?.[key] === 0, `historical racecourse metadata audit error differs: ${key}`);
}
expect(Object.values(audit.behavior ?? {}).every((value) => value === true), 'racecourse metadata audit behavior differs');
expect(exact(audit.public_boundary, contract.public_boundary) && exact(audit.privacy_boundary, contract.privacy_boundary) && exact(audit.automation_boundary, contract.automation_boundary), 'racecourse metadata audit boundaries differ');

const registryRecords = RACECOURSE_DATA_FILES.flatMap((file) => {
  const records = json(file);
  expect(Array.isArray(records), `racecourse registry must be an array: ${file}`);
  return records.map((record) => ({ ...record, __file: file }));
});
const registryIds = registryRecords.map((record) => record.id);
const registrySlugs = registryRecords.map((record) => record.slug);
expect(registryRecords.length >= HISTORICAL_RACECOURSES, `current racecourse registry shrank below historical baseline: ${registryRecords.length}`);
expect(new Set(registryIds).size === registryIds.length, 'current racecourse registry contains duplicate IDs');
expect(new Set(registrySlugs).size === registrySlugs.length, 'current racecourse registry contains duplicate slugs');
for (const record of registryRecords) {
  expect(record.id && record.slug && record.id === record.slug, `racecourse registry id/slug differs in ${record.__file}: ${record.id} / ${record.slug}`);
}
const expectedSlugs = new Set(registrySlugs);
const expectedRoutes = expectedSlugs.size * 2;

const config = read(CONFIG);
for (const marker of [
  "import racecoursePageMetadataIntegration from './scripts/racecourse-page-metadata-integration.mjs'",
  'sitemapRobotsIntegration()', 'countryPageMetadataIntegration()', 'racecoursePageMetadataIntegration()',
]) expect(config.includes(marker), `Astro config missing ${marker}`);
expect(config.indexOf('sitemapRobotsIntegration()') < config.indexOf('countryPageMetadataIntegration()'), 'country metadata integration order differs');
expect(config.indexOf('countryPageMetadataIntegration()') < config.indexOf('racecoursePageMetadataIntegration()'), 'racecourse metadata integration order differs');

const integration = read(INTEGRATION);
for (const marker of [
  "const MARKER = 'collection-place-v1'", 'RACECOURSE_DATA_FILES', 'loadExpectedRacecourseSlugs',
  "'@type': 'CollectionPage'", "'@type': 'Place'", '#place', 'containedInPlace', '#administrative-area',
  'mainEntityOfPage', 'JSON.stringify(data)', '.replace(/</g,', 'pages.length !== expectedSlugs.size * 2',
  'data-racecourse-page-metadata', 'data-structured-data-baseline=\"website-webpage-v1\"',
]) expect(integration.includes(marker), `racecourse metadata integration missing ${marker}`);
for (const forbidden of ["'@type': 'SportsActivityLocation'", 'sameAs', "'@type': 'Organization'", "'@type': 'Event'", "'@type': 'SportsEvent'", 'owner:', 'operator:', 'fetch(', 'localStorage', 'sessionStorage', 'document.cookie']) {
  expect(!integration.includes(forbidden), `racecourse metadata integration contains forbidden marker ${forbidden}`);
}

const doc = read(DOC);
for (const marker of ['RACECOURSE-PAGE-METADATA-01', 'All 36 English and Japanese racecourse detail pairs', '`Place`', '72 detail pages in total', 'data-racecourse-page-metadata="collection-place-v1"', 'Graph nodes: 144', '`SportsActivityLocation` claims', '`sameAs` claims', 'scripts/check-racecourse-page-metadata.mjs', '.github/workflows/racecourse-page-metadata.yml', 'GLOSSARY-PAGE-METADATA-01']) {
  expect(doc.includes(marker), `racecourse metadata historical documentation missing ${marker}`);
}
const workflow = read(WORKFLOW);
for (const marker of ['npm install --package-lock=false', 'npm run build', 'node scripts/check-ux-polish-release.mjs', 'node scripts/check-sitemap-robots.mjs', 'node scripts/check-structured-data-baseline.mjs', 'node scripts/check-country-page-metadata.mjs', 'node scripts/check-racecourse-page-bilingual-qa.mjs', 'node scripts/check-racecourse-page-identity-reconciliation.mjs', 'node scripts/check-racecourse-page-public-timetable-connection.mjs', 'node scripts/check-racecourse-page-profile-evidence.mjs', 'node scripts/check-racecourse-page-link-architecture.mjs', 'node scripts/check-racecourse-page-metadata.mjs', 'git status --porcelain']) {
  expect(workflow.includes(marker), `racecourse metadata workflow missing ${marker}`);
}
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) expect(!workflow.toLowerCase().includes(forbidden.toLowerCase()), `racecourse metadata workflow contains forbidden marker ${forbidden}`);

function decodeHtml(value) {
  return value.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}
const strip = (value) => decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]));
const visibleAddress = (value) => {
  if (!value) return null;
  const parts = value.split('/').map((part) => part.trim()).filter(Boolean);
  return parts.some((part) => !PLACEHOLDERS.has(part)) ? value : null;
};
const uniqueNames = (values, current) => [...new Set(values.map((value) => value?.trim()).filter((value) => value && value !== current))];
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}
function paragraph(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<p>\\s*<strong>\\s*${escaped}\\s*<\\/strong>\\s*([\\s\\S]*?)<\\/p>`, 'i'))?.[1];
  return match ? strip(match) : null;
}
function paragraphHref(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<p>\\s*<strong>\\s*${escaped}\\s*<\\/strong>\\s*<a\\s+[^>]*href="([^"]+)"`, 'i'))?.[1] ?? null;
}

expect(fs.existsSync(filePath('dist')), 'dist is missing; run npm run build first');
const routeFiles = walk(filePath('dist')).filter((file) => /(?:^|[\\/])tracks[\\/][^\\/]+[\\/]index\.html$/.test(file));
const pages = [];
const bySlug = new Map();
for (const absolute of routeFiles) {
  const relative = path.relative(filePath('dist'), absolute).split(path.sep).join('/');
  const route = relative.match(/^(ja\/)?tracks\/([^/]+)\/index\.html$/);
  if (!route) continue;
  const locale = route[1] ? 'ja' : 'en';
  const slug = route[2];
  const html = fs.readFileSync(absolute, 'utf8');
  const canonicalTag = html.match(/<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i)?.[0] ?? '';
  const canonical = attrs(canonicalTag).href ?? null;
  const lang = html.match(/<html\s+[^>]*lang="([^"]+)"/i)?.[1] ?? null;
  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const descriptionTag = html.match(/<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i)?.[0] ?? '';
  const description = attrs(descriptionTag).content ?? null;
  const name = strip(html.match(/<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  const heroSummary = strip(html.match(/<p[^>]*class="hero__summary"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');
  const localName = heroSummary.includes(' · ') ? heroSummary.split(' · ', 1)[0].trim() : null;
  const countryLabel = locale === 'ja' ? '国:' : 'Country:';
  const locationLabel = locale === 'ja' ? '都市 / 地域:' : 'City / region:';
  const page = { relative, locale, slug, html, canonical, lang, title, description, name, localName, countryHref: paragraphHref(html, countryLabel), countryName: paragraph(html, countryLabel), address: visibleAddress(paragraph(html, locationLabel)) };
  pages.push(page);
  if (!bySlug.has(slug)) bySlug.set(slug, new Map());
  const locales = bySlug.get(slug);
  expect(!locales.has(locale), `${slug}: duplicate ${locale} route`);
  locales.set(locale, page);
}

expect(pages.length === expectedRoutes, `racecourse metadata rendered route count differs ${pages.length} !== ${expectedRoutes}`);
expect(bySlug.size === expectedSlugs.size, `racecourse metadata slug count differs ${bySlug.size} !== ${expectedSlugs.size}`);
const renderedSlugs = new Set(bySlug.keys());
expect([...expectedSlugs].every((slug) => renderedSlugs.has(slug)) && [...renderedSlugs].every((slug) => expectedSlugs.has(slug)), 'racecourse metadata rendered registry set differs');
expect(pages.filter((page) => page.locale === 'en').length === expectedSlugs.size, 'English racecourse metadata route count differs');
expect(pages.filter((page) => page.locale === 'ja').length === expectedSlugs.size, 'Japanese racecourse metadata route count differs');

let scripts = 0;
let collectionPages = 0;
let places = 0;
let countryLinks = 0;
let addresses = 0;
for (const [slug, locales] of bySlug) {
  const english = locales.get('en');
  const japanese = locales.get('ja');
  expect(english && japanese && locales.size === 2, `${slug}: bilingual racecourse metadata pair is incomplete`);
  for (const [page, counterpart] of [[english, japanese], [japanese, english]]) {
    const expectedPath = page.locale === 'ja' ? `/ja/tracks/${slug}/` : `/tracks/${slug}/`;
    expect(page.canonical, `${page.relative}: canonical missing`);
    const canonicalUrl = new URL(page.canonical);
    expect(canonicalUrl.origin === SITE_ORIGIN && canonicalUrl.pathname === expectedPath && !canonicalUrl.search && !canonicalUrl.hash, `${page.relative}: canonical differs ${page.canonical}`);
    expect(page.lang === page.locale && page.title && page.description && page.name && page.countryHref && page.countryName, `${page.relative}: visible metadata field missing`);
    const countryPattern = page.locale === 'ja' ? /^\/ja\/countries\/[^/]+\/$/ : /^\/countries\/[^/]+\/$/;
    expect(countryPattern.test(page.countryHref), `${page.relative}: visible country link differs ${page.countryHref}`);
    expect(page.html.includes('data-structured-data-baseline="website-webpage-v1"'), `${page.relative}: structured-data baseline missing`);
    const matches = [...page.html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*data-racecourse-page-metadata="collection-place-v1"[^>]*>([\s\S]*?)<\/script>/g)];
    expect(matches.length === 1, `${page.relative}: racecourse metadata script count differs ${matches.length}`);
    scripts += 1;
    expect(!matches[0][1].includes('<'), `${page.relative}: unsafe less-than in racecourse metadata JSON-LD`);
    const data = JSON.parse(matches[0][1]);
    expect(data['@context'] === 'https://schema.org' && Array.isArray(data['@graph']) && data['@graph'].length === 2, `${page.relative}: metadata graph differs`);
    const collection = data['@graph'].find((node) => node['@type'] === 'CollectionPage');
    const place = data['@graph'].find((node) => node['@type'] === 'Place');
    expect(collection && place && data['@graph'].every((node) => ['CollectionPage', 'Place'].includes(node['@type'])), `${page.relative}: unsupported metadata type`);
    expect(!Object.hasOwn(place, 'sameAs') && !Object.hasOwn(place, 'owner') && !Object.hasOwn(place, 'operator'), `${page.relative}: unsupported place identity claim`);
    const webpageId = `${page.canonical}#webpage`;
    const placeId = `${page.canonical}#place`;
    const countryUrl = new URL(page.countryHref, SITE_ORIGIN).toString();
    const countryAreaId = `${countryUrl}#administrative-area`;
    const alternateName = uniqueNames([counterpart.name, page.localName], page.name);
    expect(exact(collection, { '@type': 'CollectionPage', '@id': webpageId, url: page.canonical, name: page.title, description: page.description, inLanguage: page.locale, isPartOf: { '@id': WEBSITE_ID }, about: { '@id': placeId }, mainEntity: { '@id': placeId } }), `${page.relative}: CollectionPage node differs`);
    const expectedPlace = { '@type': 'Place', '@id': placeId, url: page.canonical, name: page.name, ...(alternateName.length ? { alternateName } : {}), ...(page.address ? { address: page.address } : {}), containedInPlace: { '@id': countryAreaId, name: page.countryName }, mainEntityOfPage: { '@id': webpageId } };
    expect(exact(place, expectedPlace), `${page.relative}: Place node differs`);
    collectionPages += 1;
    places += 1;
    if (place.containedInPlace?.['@id'] === countryAreaId) countryLinks += 1;
    if (typeof place.address === 'string' && place.address.length > 0) addresses += 1;
  }
}

expect(scripts === expectedRoutes && collectionPages === expectedRoutes && places === expectedRoutes && countryLinks === expectedRoutes, 'current racecourse metadata totals differ');
expect(addresses >= HISTORICAL_ROUTES && addresses <= expectedRoutes, `current racecourse address coverage regressed or exceeds route scope: ${addresses}`);

console.log('RACECOURSE_PAGE_METADATA: pass');
console.log(`HISTORICAL_RACECOURSE_ENTITIES: ${HISTORICAL_RACECOURSES}`);
console.log(`CURRENT_RACECOURSE_ENTITIES: ${expectedSlugs.size}`);
console.log(`CURRENT_BILINGUAL_DETAIL_ROUTES: ${expectedRoutes}`);
console.log(`CURRENT_ADDRESS_VALUES: ${addresses}`);
console.log('SPORTS_ACTIVITY_LOCATION_CLAIMS: 0');
console.log('SAME_AS_CLAIMS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: GLOSSARY-PAGE-METADATA-01');
