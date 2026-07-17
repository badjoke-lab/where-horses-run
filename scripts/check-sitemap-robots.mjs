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

const contractPath = 'data/static/sitemap-robots-contract-v1.json';
const auditPath = 'data/audits/sitemap-robots-v1.json';
const configPath = 'astro.config.mjs';
const integrationPath = 'scripts/sitemap-robots-integration.mjs';
const publicRobotsPath = 'public/robots.txt';
const publicSitemapPath = 'public/sitemap.xml';
const docPath = 'docs/seo/sitemap-robots.md';
const workflowPath = '.github/workflows/sitemap-robots.yml';
const temporaryWorkflowPath = '.github/workflows/temporary-sitemap-robots-discovery.yml';

for (const required of [contractPath, auditPath, configPath, integrationPath, publicRobotsPath, docPath, workflowPath]) {
  if (!fs.existsSync(filePath(required))) fail(`required file missing: ${required}`);
}

const expectedScope = {
  sitemap_urls: 769,
  english_urls: 386,
  japanese_urls: 383,
  route_families: 16,
  country_routes: 198,
  source_routes: 198,
  meeting_detail_routes: 158,
  glossary_routes: 100,
  racecourse_routes: 74,
  racing_type_routes: 18,
  major_country_routes: 5,
  root_routes: 2,
  about_routes: 2,
  archive_routes: 2,
  calendar_routes: 2,
  disclaimer_routes: 2,
  faq_routes: 2,
  search_routes: 2,
  today_routes: 2,
  tomorrow_routes: 2,
};

const expectedDetailCounts = {
  country_detail_routes: 196,
  source_country_routes: 196,
  meeting_detail_routes: 158,
  glossary_term_routes: 96,
  glossary_relationship_routes: 2,
  racecourse_detail_routes: 72,
  racing_type_detail_routes: 16,
  faq_content_routes: 2,
};

const expectedRobots = [
  'User-agent: *',
  'Allow: /',
  '',
  'Sitemap: https://whr.badjoke-lab.com/sitemap.xml',
  '',
].join('\n');

const contract = fs.existsSync(filePath(contractPath)) ? parse(contractPath) : {};
const audit = fs.existsSync(filePath(auditPath)) ? parse(auditPath) : {};
if (contract.schema_version !== 'sitemap-robots-contract-v1') fail('sitemap contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('sitemap Work ID differs');
if (contract.implementation_unit !== 'SITEMAP-ROBOTS-01') fail('sitemap implementation unit differs');
if (contract.status !== 'complete') fail('sitemap contract status differs');
if (contract.reviewed_at !== '2026-07-18') fail('sitemap review date differs');
if (contract.scope_updated_by !== 'FAQ-CONTENT-PAGES-01') fail('sitemap scope update marker differs');
if (contract.site_origin !== SITE_ORIGIN) fail('sitemap site origin differs');
if (!exact(contract.scope, expectedScope)) fail('sitemap scope differs');
if (!exact(contract.detail_route_counts, expectedDetailCounts)) fail('sitemap detail-route counts differ');
if (contract.generation_contract?.rendered_html_is_source_of_truth !== true) fail('rendered HTML source contract differs');
if (contract.generation_contract?.canonical_link_is_url_source !== true) fail('canonical source contract differs');
if (contract.generation_contract?.manual_sitemap_source_allowed !== false) fail('manual sitemap boundary differs');
if (contract.generation_contract?.duplicate_urls_allowed !== false) fail('duplicate URL boundary differs');
if (contract.robots_contract?.sitemap !== `${SITE_ORIGIN}/sitemap.xml`) fail('robots sitemap contract differs');
if (Object.values(contract.privacy_boundary ?? {}).some((value) => value !== false)) fail('sitemap privacy boundary differs');
if (Object.values(contract.automation_boundary ?? {}).some((value) => value !== false)) fail('sitemap automation boundary differs');

if (audit.schema_version !== 'sitemap-robots-audit-v1') fail('sitemap audit schema differs');
if (audit.status !== 'complete') fail('sitemap audit status differs');
if (audit.reviewed_at !== contract.reviewed_at || audit.scope_updated_by !== contract.scope_updated_by) fail('sitemap audit scope identity differs');
for (const [key, value] of Object.entries({ sitemap_urls: 769, english_urls: 386, japanese_urls: 383, route_families: 16, faq_routes: 2 })) {
  if (audit.verified?.[key] !== value) fail(`sitemap audit ${key} differs`);
}
for (const key of ['duplicate_urls', 'non_https_urls', 'wrong_origin_urls', 'query_or_fragment_urls', 'urls_without_trailing_slash', 'contract_errors', 'output_errors']) {
  if (audit.verified?.[key] !== 0) fail(`sitemap audit ${key} differs`);
}

const config = fs.existsSync(filePath(configPath)) ? read(configPath) : '';
for (const marker of [
  "import sitemapRobotsIntegration from './scripts/sitemap-robots-integration.mjs'",
  "site: 'https://whr.badjoke-lab.com'",
  "trailingSlash: 'always'",
  'integrations: [sitemapRobotsIntegration()]',
]) if (!config.includes(marker)) fail(`Astro sitemap configuration missing ${marker}`);

const integration = fs.existsSync(filePath(integrationPath)) ? read(integrationPath) : '';
for (const marker of [
  "const SITE_ORIGIN = 'https://whr.badjoke-lab.com'",
  "name: 'where-horses-run-sitemap-robots'",
  "'astro:build:done'",
  'hasNoIndex(html)',
  'extractCanonical(html',
  '.sort(compareUrls)',
  "path.join(outputDirectory, 'sitemap.xml')",
  "path.join(outputDirectory, 'robots.txt')",
]) if (!integration.includes(marker)) fail(`sitemap integration missing ${marker}`);
for (const forbidden of ['fetch(', 'axios', '@astrojs/sitemap', 'contents: write', 'wrangler', 'cloudflare']) {
  if (integration.toLowerCase().includes(forbidden.toLowerCase())) fail(`sitemap integration contains forbidden marker ${forbidden}`);
}

if (fs.existsSync(filePath(publicSitemapPath))) fail('manual public sitemap remains');
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary sitemap discovery workflow remains');
if (fs.existsSync(filePath(publicRobotsPath)) && read(publicRobotsPath) !== expectedRobots) fail('committed public robots content differs');

const doc = fs.existsSync(filePath(docPath)) ? read(docPath) : '';
for (const marker of ['SITEMAP-ROBOTS-01', '769 public canonical URLs', 'English URLs: 386', 'Japanese URLs: 383', 'FAQ routes: 2']) {
  if (!doc.includes(marker)) fail(`sitemap documentation missing ${marker}`);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function canonicalFromHtml(html, relativeFile) {
  const tags = [...html.matchAll(/<link\s+[^>]*>/gi)].map((match) => match[0]);
  const canonicalTags = tags.filter((tag) => /rel="canonical"/i.test(tag));
  if (canonicalTags.length !== 1) {
    fail(`rendered HTML canonical count differs: ${relativeFile} (${canonicalTags.length})`);
    return null;
  }
  const value = canonicalTags[0].match(/href="([^"]+)"/i)?.[1];
  if (!value) fail(`rendered HTML canonical missing href: ${relativeFile}`);
  return value ?? null;
}

function hasNoIndex(html) {
  return /<meta\s+[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"[^>]*>|<meta\s+[^>]*content="[^"]*noindex[^"]*"[^>]*name="robots"[^>]*>/i.test(html);
}

function compareUrls(left, right) {
  const leftPath = new URL(left).pathname;
  const rightPath = new URL(right).pathname;
  if (leftPath === '/') return rightPath === '/' ? 0 : -1;
  if (rightPath === '/') return 1;
  return leftPath.localeCompare(rightPath, 'en');
}

const countPath = (paths, pattern) => paths.filter((value) => pattern.test(value)).length;
const distPath = filePath('dist');
if (!fs.existsSync(distPath)) fail('dist is missing; run npm run build first');
const expectedUrls = [];
let noIndexCount = 0;
if (fs.existsSync(distPath)) {
  for (const file of walk(distPath).filter((entry) => entry.endsWith('.html'))) {
    if (path.basename(file) === '404.html') continue;
    const html = fs.readFileSync(file, 'utf8');
    if (hasNoIndex(html)) {
      noIndexCount += 1;
      continue;
    }
    const canonical = canonicalFromHtml(html, path.relative(distPath, file));
    if (!canonical) continue;
    let url;
    try { url = new URL(canonical); }
    catch { fail(`invalid canonical URL ${canonical}`); continue; }
    if (url.protocol !== 'https:' || url.origin !== SITE_ORIGIN || url.search || url.hash) fail(`invalid public canonical ${canonical}`);
    if (url.pathname !== '/' && !url.pathname.endsWith('/')) fail(`canonical lacks trailing slash ${canonical}`);
    expectedUrls.push(canonical);
  }
}
const uniqueExpectedUrls = [...new Set(expectedUrls)].sort(compareUrls);
if (expectedUrls.length !== uniqueExpectedUrls.length) fail('rendered canonical URLs contain duplicates');
if (noIndexCount !== 0) fail(`current noindex rendered HTML count differs ${noIndexCount}`);

const sitemapPath = filePath('dist/sitemap.xml');
const robotsPath = filePath('dist/robots.txt');
if (!fs.existsSync(sitemapPath)) fail('generated sitemap is missing');
if (!fs.existsSync(robotsPath)) fail('generated robots is missing');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (!exact(sitemapUrls, uniqueExpectedUrls)) fail('generated sitemap URLs do not exactly match rendered canonical URLs');
  if (sitemapUrls.length !== 769) fail(`sitemap URL count differs ${sitemapUrls.length}`);
  if (sitemapUrls.length !== new Set(sitemapUrls).size) fail('duplicate sitemap URLs found');
  if (!exact(sitemapUrls, [...sitemapUrls].sort(compareUrls))) fail('sitemap URL order differs');
  const parsed = sitemapUrls.map((value) => new URL(value));
  const paths = parsed.map((url) => url.pathname);
  const normalizedFamilies = paths.map((value) => value === '/ja/' ? '/' : value.replace(/^\/ja\//, '/'));
  const routeFamilyCounts = {
    sitemap_urls: paths.length,
    english_urls: paths.filter((value) => !value.startsWith('/ja/')).length,
    japanese_urls: paths.filter((value) => value.startsWith('/ja/')).length,
    route_families: new Set(normalizedFamilies.map((value) => value === '/' ? '(root)' : value.split('/').filter(Boolean)[0])).size,
    country_routes: countPath(paths, /^\/(?:ja\/)?countries\//),
    source_routes: countPath(paths, /^\/(?:ja\/)?sources\//),
    meeting_detail_routes: countPath(paths, /^\/(?:ja\/)?timetable\/meetings\/[^/]+\/$/),
    glossary_routes: countPath(paths, /^\/(?:ja\/)?glossary\//),
    racecourse_routes: countPath(paths, /^\/(?:ja\/)?tracks\//),
    racing_type_routes: countPath(paths, /^\/(?:ja\/)?types\//),
    major_country_routes: countPath(paths, /^\/(?:ja\/)?major-countries\//),
    root_routes: countPath(paths, /^\/(?:ja\/)?$/),
    about_routes: countPath(paths, /^\/(?:ja\/)?about\/$/),
    archive_routes: countPath(paths, /^\/(?:ja\/)?archive\/$/),
    calendar_routes: countPath(paths, /^\/(?:ja\/)?calendar\/$/),
    disclaimer_routes: countPath(paths, /^\/(?:ja\/)?disclaimer\/$/),
    faq_routes: countPath(paths, /^\/(?:ja\/)?faq\/$/),
    search_routes: countPath(paths, /^\/(?:ja\/)?search\/$/),
    today_routes: countPath(paths, /^\/(?:ja\/)?today\/$/),
    tomorrow_routes: countPath(paths, /^\/(?:ja\/)?tomorrow\/$/),
  };
  if (!exact(routeFamilyCounts, expectedScope)) fail(`rendered sitemap family counts differ ${JSON.stringify(routeFamilyCounts)}`);
  const detailCounts = {
    country_detail_routes: countPath(paths, /^\/(?:ja\/)?countries\/[^/]+\/$/),
    source_country_routes: countPath(paths, /^\/(?:ja\/)?sources\/[^/]+\/$/),
    meeting_detail_routes: countPath(paths, /^\/(?:ja\/)?timetable\/meetings\/[^/]+\/$/),
    glossary_term_routes: countPath(paths, /^\/(?:ja\/)?glossary\/(?!relationships\/)[^/]+\/$/),
    glossary_relationship_routes: countPath(paths, /^\/(?:ja\/)?glossary\/relationships\/$/),
    racecourse_detail_routes: countPath(paths, /^\/(?:ja\/)?tracks\/[^/]+\/$/),
    racing_type_detail_routes: countPath(paths, /^\/(?:ja\/)?types\/[^/]+\/$/),
    faq_content_routes: countPath(paths, /^\/(?:ja\/)?faq\/$/),
  };
  if (!exact(detailCounts, expectedDetailCounts)) fail(`rendered sitemap detail counts differ ${JSON.stringify(detailCounts)}`);
}
if (fs.existsSync(robotsPath) && fs.readFileSync(robotsPath, 'utf8') !== expectedRobots) fail('generated robots content differs');

if (errors.length) {
  console.error(`SITEMAP_ROBOTS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('SITEMAP_ROBOTS: pass');
console.log('SITEMAP_URLS: 769');
console.log('ENGLISH_URLS: 386');
console.log('JAPANESE_URLS: 383');
console.log('FAQ_ROUTES: 2');
console.log('TEMPORARY_DISCOVERY_WORKFLOWS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: STRUCTURED-DATA-BASELINE-01');
