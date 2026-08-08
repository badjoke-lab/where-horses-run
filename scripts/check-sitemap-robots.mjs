import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const CONTRACT = 'data/static/sitemap-robots-contract-v1.json';
const AUDIT = 'data/audits/sitemap-robots-v1.json';
const CONFIG = 'astro.config.mjs';
const INTEGRATION = 'scripts/sitemap-robots-integration.mjs';
const DOC = 'docs/seo/sitemap-robots.md';
const WORKFLOW = '.github/workflows/sitemap-robots.yml';
const TEMPORARY = '.github/workflows/temporary-sitemap-robots-discovery.yml';
const DIST = 'dist';

const at = (file) => path.join(ROOT, file);
const read = (file) => fs.readFileSync(at(file), 'utf8');
const json = (file) => JSON.parse(read(file));
const exact = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [CONTRACT, AUDIT, CONFIG, INTEGRATION, DOC, WORKFLOW]) expect(fs.existsSync(at(file)), `Missing ${file}`);
expect(!fs.existsSync(at(TEMPORARY)), 'Temporary sitemap discovery workflow remains');
expect(!fs.existsSync(at('public/sitemap.xml')), 'Manual public sitemap remains');

const contract = json(CONTRACT);
const audit = json(AUDIT);
expect(contract.schema_version === 'sitemap-robots-contract-v1', 'Sitemap contract schema differs');
expect(contract.status === 'complete', 'Sitemap contract is not complete');
expect(contract.site_origin === SITE_ORIGIN, 'Sitemap site origin differs');
expect(contract.scope_updated_by === 'METHODS-DATA-POLICY-01', 'Sitemap scope update marker differs');
expect(audit.schema_version === 'sitemap-robots-audit-v1' && audit.status === 'complete', 'Sitemap audit identity differs');
expect(audit.scope_updated_by === contract.scope_updated_by, 'Sitemap audit scope marker differs');
for (const key of ['sitemap_urls', 'english_urls', 'japanese_urls', 'route_families', 'faq_routes', 'methods_routes']) {
  expect(audit.verified[key] === contract.scope[key], `Historical sitemap audit ${key} differs`);
}
for (const key of ['duplicate_urls', 'non_https_urls', 'wrong_origin_urls', 'query_or_fragment_urls', 'urls_without_trailing_slash', 'missing_rendered_html_canonicals', 'sitemap_urls_without_rendered_canonicals', 'rendered_canonicals_missing_from_sitemap', 'rendered_404_urls', 'noindex_urls', 'robots_disallow_directives', 'robots_sitemap_directive_errors', 'contract_errors', 'output_errors']) {
  expect(audit.verified[key] === 0, `Sitemap audit ${key} differs`);
}
expect(Object.values(contract.privacy_boundary).every((value) => value === false), 'Sitemap privacy boundary differs');
expect(Object.values(contract.automation_boundary).every((value) => value === false), 'Sitemap automation boundary differs');

const config = read(CONFIG);
for (const marker of ["import sitemapRobotsIntegration from './scripts/sitemap-robots-integration.mjs'", "site: 'https://whr.badjoke-lab.com'", "trailingSlash: 'always'", 'integrations: [sitemapRobotsIntegration()]']) expect(config.includes(marker), `Astro sitemap marker missing: ${marker}`);
const integration = read(INTEGRATION);
for (const marker of ["name: 'where-horses-run-sitemap-robots'", "'astro:build:done'", 'hasNoIndex(html)', 'extractCanonical(html', '.sort(compareUrls)', "path.join(outputDirectory, 'sitemap.xml')", "path.join(outputDirectory, 'robots.txt')"]) expect(integration.includes(marker), `Sitemap integration marker missing: ${marker}`);
for (const forbidden of ['fetch(', 'axios', '@astrojs/sitemap', 'contents: write', 'wrangler']) expect(!integration.toLowerCase().includes(forbidden.toLowerCase()), `Sitemap integration contains forbidden marker ${forbidden}`);
const doc = read(DOC);
for (const marker of ['SITEMAP-ROBOTS-01', `${contract.scope.sitemap_urls} public canonical URLs`, `English URLs: ${contract.scope.english_urls}`, `Japanese URLs: ${contract.scope.japanese_urls}`, 'Methods routes: 2']) expect(doc.includes(marker), `Sitemap documentation marker missing: ${marker}`);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function decode(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}

function canonicalFromHtml(html, relative) {
  const tags = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => match[0]).filter((tag) => /rel="canonical"/i.test(tag));
  expect(tags.length === 1, `${relative}: canonical count differs ${tags.length}`);
  const href = tags[0].match(/href="([^"]+)"/i)?.[1];
  expect(href, `${relative}: canonical href is missing`);
  return decode(href);
}

function hasNoIndex(html) {
  return /<meta\s+[^>]*(?:name="robots"[^>]*content="[^"]*noindex|content="[^"]*noindex[^"]*"[^>]*name="robots")[^>]*>/i.test(html);
}

function compareUrls(left, right) {
  const a = new URL(left).pathname;
  const b = new URL(right).pathname;
  if (a === '/') return b === '/' ? 0 : -1;
  if (b === '/') return 1;
  return a.localeCompare(b, 'en');
}

const distPath = at(DIST);
expect(fs.existsSync(distPath), 'dist is missing; run npm run build first');
const renderedUrls = [];
let noIndexPages = 0;
for (const file of walk(distPath).filter((item) => item.endsWith('.html'))) {
  if (path.basename(file) === '404.html') continue;
  const html = fs.readFileSync(file, 'utf8');
  if (hasNoIndex(html)) { noIndexPages += 1; continue; }
  const canonical = canonicalFromHtml(html, path.relative(distPath, file));
  const url = new URL(canonical);
  expect(url.protocol === 'https:' && url.origin === SITE_ORIGIN, `${canonical}: origin or protocol differs`);
  expect(!url.search && !url.hash, `${canonical}: query or fragment is present`);
  expect(url.pathname === '/' || url.pathname.endsWith('/'), `${canonical}: trailing slash is missing`);
  renderedUrls.push(canonical);
}
expect(noIndexPages === 0, `Current noindex page count differs ${noIndexPages}`);
const uniqueRendered = [...new Set(renderedUrls)].sort(compareUrls);
expect(uniqueRendered.length === renderedUrls.length, 'Rendered canonical URLs contain duplicates');

const sitemapPath = at('dist/sitemap.xml');
const robotsPath = at('dist/robots.txt');
expect(fs.existsSync(sitemapPath), 'Generated sitemap is missing');
expect(fs.existsSync(robotsPath), 'Generated robots.txt is missing');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
expect(exact(sitemapUrls, uniqueRendered), 'Sitemap URLs differ from rendered canonical set');
expect(sitemapUrls.length >= contract.scope.sitemap_urls, `Sitemap URL count regressed ${sitemapUrls.length}`);
expect(exact(sitemapUrls, [...sitemapUrls].sort(compareUrls)), 'Sitemap URL order differs');

const paths = sitemapUrls.map((value) => new URL(value).pathname);
const count = (pattern) => paths.filter((value) => pattern.test(value)).length;
const normalized = paths.map((value) => value === '/ja/' ? '/' : value.replace(/^\/ja\//, '/'));
const actualScope = {
  sitemap_urls: paths.length,
  english_urls: paths.filter((value) => !value.startsWith('/ja/')).length,
  japanese_urls: paths.filter((value) => value.startsWith('/ja/')).length,
  route_families: new Set(normalized.map((value) => value === '/' ? '(root)' : value.split('/').filter(Boolean)[0])).size,
  country_routes: count(/^\/(?:ja\/)?countries\//),
  source_routes: count(/^\/(?:ja\/)?sources\//),
  meeting_detail_routes: count(/^\/(?:ja\/)?timetable\/meetings\/[^/]+\/$/),
  glossary_routes: count(/^\/(?:ja\/)?glossary\//),
  racecourse_routes: count(/^\/(?:ja\/)?tracks\//),
  racing_type_routes: count(/^\/(?:ja\/)?types\//),
  major_country_routes: count(/^\/(?:ja\/)?major-countries\//),
  root_routes: count(/^\/(?:ja\/)?$/),
  about_routes: count(/^\/(?:ja\/)?about\/$/),
  archive_routes: count(/^\/(?:ja\/)?archive\/$/),
  calendar_routes: count(/^\/(?:ja\/)?calendar\/$/),
  disclaimer_routes: count(/^\/(?:ja\/)?disclaimer\/$/),
  faq_routes: count(/^\/(?:ja\/)?faq\/$/),
  methods_routes: count(/^\/(?:ja\/)?methods\/$/),
  search_routes: count(/^\/(?:ja\/)?search\/$/),
  today_routes: count(/^\/(?:ja\/)?today\/$/),
  tomorrow_routes: count(/^\/(?:ja\/)?tomorrow\/$/),
};
const actualDetails = {
  country_detail_routes: count(/^\/(?:ja\/)?countries\/[^/]+\/$/),
  source_country_routes: count(/^\/(?:ja\/)?sources\/[^/]+\/$/),
  meeting_detail_routes: count(/^\/(?:ja\/)?timetable\/meetings\/[^/]+\/$/),
  glossary_term_routes: count(/^\/(?:ja\/)?glossary\/(?!relationships\/)[^/]+\/$/),
  glossary_relationship_routes: count(/^\/(?:ja\/)?glossary\/relationships\/$/),
  racecourse_detail_routes: count(/^\/(?:ja\/)?tracks\/[^/]+\/$/),
  racing_type_detail_routes: count(/^\/(?:ja\/)?types\/[^/]+\/$/),
  faq_content_routes: count(/^\/(?:ja\/)?faq\/$/),
  methods_content_routes: count(/^\/(?:ja\/)?methods\/$/),
};

// The reviewed July contract/audit remains the historical baseline. Current route
// growth is allowed only when it is explained by additional bilingual racecourse
// detail pages; every other route family must remain on the reviewed contract.
const racecourseDetailDelta = actualDetails.racecourse_detail_routes - contract.detail_route_counts.racecourse_detail_routes;
expect(racecourseDetailDelta >= 0, `Racecourse detail route count regressed ${actualDetails.racecourse_detail_routes}`);
expect(racecourseDetailDelta % 2 === 0, `Racecourse detail route growth must be bilingual ${racecourseDetailDelta}`);
const perLanguageRacecourseDelta = racecourseDetailDelta / 2;
const expectedCurrentScope = {
  ...contract.scope,
  sitemap_urls: contract.scope.sitemap_urls + racecourseDetailDelta,
  english_urls: contract.scope.english_urls + perLanguageRacecourseDelta,
  japanese_urls: contract.scope.japanese_urls + perLanguageRacecourseDelta,
  racecourse_routes: contract.scope.racecourse_routes + racecourseDetailDelta,
};
const expectedCurrentDetails = {
  ...contract.detail_route_counts,
  racecourse_detail_routes: contract.detail_route_counts.racecourse_detail_routes + racecourseDetailDelta,
};
expect(exact(actualScope, expectedCurrentScope), `Rendered sitemap scope differs ${JSON.stringify(actualScope)}`);
expect(exact(actualDetails, expectedCurrentDetails), `Rendered sitemap detail counts differ ${JSON.stringify(actualDetails)}`);

const expectedRobots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
expect(fs.readFileSync(robotsPath, 'utf8') === expectedRobots, 'Generated robots.txt differs');
expect(fs.existsSync(at('public/robots.txt')) && read('public/robots.txt') === expectedRobots, 'Committed public robots.txt differs');

console.log('SITEMAP_ROBOTS: pass');
console.log(`HISTORICAL_SITEMAP_URLS: ${contract.scope.sitemap_urls}`);
console.log(`CURRENT_SITEMAP_URLS: ${actualScope.sitemap_urls}`);
console.log(`CURRENT_ENGLISH_URLS: ${actualScope.english_urls}`);
console.log(`CURRENT_JAPANESE_URLS: ${actualScope.japanese_urls}`);
console.log(`CURRENT_RACECOURSE_DETAIL_ROUTES: ${actualDetails.racecourse_detail_routes}`);
console.log('METHODS_ROUTES: 2');