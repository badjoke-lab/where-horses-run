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
const packagePath = 'package.json';

for (const requiredPath of [
  contractPath,
  auditPath,
  configPath,
  integrationPath,
  publicRobotsPath,
  docPath,
  workflowPath,
  packagePath,
]) {
  if (!fs.existsSync(filePath(requiredPath))) fail(`required file missing: ${requiredPath}`);
}

const contract = parse(contractPath);
const audit = parse(auditPath);
const expectedScope = {
  sitemap_urls: 767,
  english_urls: 385,
  japanese_urls: 382,
  route_families: 15,
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
};
const expectedRobots = [
  'User-agent: *',
  'Allow: /',
  '',
  'Sitemap: https://whr.badjoke-lab.com/sitemap.xml',
  '',
].join('\n');

if (contract.schema_version !== 'sitemap-robots-contract-v1') fail('sitemap contract schema differs');
if (contract.work_id !== 'WHR-SEO-PUBLIC-CONTENT-V1') fail('sitemap Work ID differs');
if (contract.implementation_unit !== 'SITEMAP-ROBOTS-01') fail('sitemap implementation unit differs');
if (contract.status !== 'complete') fail('sitemap contract status differs');
if (contract.reviewed_at !== '2026-07-17') fail('sitemap review date differs');
if (contract.site_origin !== SITE_ORIGIN) fail('sitemap site origin differs');
if (!exact(contract.scope, expectedScope)) fail('sitemap scope differs');
if (!exact(contract.detail_route_counts, expectedDetailCounts)) fail('sitemap detail-route counts differ');
if (!exact(contract.generation_contract, {
  astro_build_done_hook_required: true,
  rendered_html_is_source_of_truth: true,
  canonical_link_is_url_source: true,
  manual_sitemap_source_allowed: false,
  external_sitemap_dependency_required: false,
  rendered_404_excluded: true,
  noindex_html_excluded: true,
  same_origin_required: true,
  https_required: true,
  query_parameters_allowed: false,
  fragments_allowed: false,
  trailing_slash_required: true,
  duplicate_urls_allowed: false,
  deterministic_path_sort_required: true,
  empty_sitemap_allowed: false,
})) fail('sitemap generation contract differs');
if (!exact(contract.robots_contract, {
  path: '/robots.txt',
  user_agent: '*',
  allow: '/',
  sitemap: 'https://whr.badjoke-lab.com/sitemap.xml',
  disallow_directives: 0,
})) fail('robots contract differs');
if (!exact(contract.output_contract, {
  sitemap_path: 'dist/sitemap.xml',
  robots_path: 'dist/robots.txt',
  sitemap_xml_namespace: 'http://www.sitemaps.org/schemas/sitemap/0.9',
  sitemap_encoding: 'UTF-8',
})) fail('sitemap output contract differs');
for (const [key, value] of Object.entries(contract.public_boundary ?? {})) {
  const expected = ['public_canonical_routes_allowed', 'public_sitemap_allowed', 'public_robots_allowed'].includes(key);
  if (value !== expected) fail(`sitemap public boundary differs: ${key}`);
}
for (const value of Object.values(contract.privacy_boundary ?? {})) if (value !== false) fail('sitemap privacy boundary differs');
for (const value of Object.values(contract.automation_boundary ?? {})) if (value !== false) fail('sitemap automation boundary differs');
if (contract.previous_implementation_unit !== 'UX-POLISH-RELEASE-01') fail('previous sitemap unit differs');
if (contract.next_implementation_unit !== 'STRUCTURED-DATA-BASELINE-01') fail('next sitemap unit differs');

if (audit.schema_version !== 'sitemap-robots-audit-v1') fail('sitemap audit schema differs');
if (audit.work_id !== contract.work_id || audit.implementation_unit !== contract.implementation_unit || audit.reviewed_at !== contract.reviewed_at) fail('sitemap audit identity differs');
if (audit.status !== 'complete') fail('sitemap audit status differs');
if (!exact(audit.verified, {
  sitemap_urls: 767,
  english_urls: 385,
  japanese_urls: 382,
  route_families: 15,
  duplicate_urls: 0,
  non_https_urls: 0,
  wrong_origin_urls: 0,
  query_or_fragment_urls: 0,
  urls_without_trailing_slash: 0,
  missing_rendered_html_canonicals: 0,
  sitemap_urls_without_rendered_canonicals: 0,
  rendered_canonicals_missing_from_sitemap: 0,
  rendered_404_urls: 0,
  noindex_urls: 0,
  manual_public_sitemap_files: 0,
  external_sitemap_dependencies: 0,
  robots_disallow_directives: 0,
  robots_sitemap_directive_errors: 0,
  temporary_discovery_workflows: 0,
  contract_errors: 0,
  output_errors: 0,
})) fail('sitemap audit measurements differ');
for (const value of Object.values(audit.behavior ?? {})) if (value !== true) fail('sitemap audit behavior differs');
if (!exact(audit.public_boundary, contract.public_boundary) || !exact(audit.privacy_boundary, contract.privacy_boundary) || !exact(audit.automation_boundary, contract.automation_boundary)) fail('sitemap audit boundaries differ');
if (audit.previous_implementation_unit !== contract.previous_implementation_unit || audit.next_implementation_unit !== contract.next_implementation_unit) fail('sitemap audit roadmap differs');

const config = read(configPath);
for (const marker of [
  "import sitemapRobotsIntegration from './scripts/sitemap-robots-integration.mjs'",
  "site: 'https://whr.badjoke-lab.com'",
  "trailingSlash: 'always'",
  'integrations: [sitemapRobotsIntegration()]',
]) if (!config.includes(marker)) fail(`Astro sitemap configuration missing ${marker}`);

const integration = read(integrationPath);
for (const marker of [
  "const SITE_ORIGIN = 'https://whr.badjoke-lab.com'",
  "name: 'where-horses-run-sitemap-robots'",
  "'astro:build:done'",
  "path.basename(file) !== '404.html'",
  'hasNoIndex(html)',
  'extractCanonical(html',
  'url.origin !== SITE_ORIGIN',
  'url.search || url.hash',
  'new Set()',
  '.sort(compareUrls)',
  "path.join(outputDirectory, 'sitemap.xml')",
  "path.join(outputDirectory, 'robots.txt')",
  'Sitemap: ${SITE_ORIGIN}/sitemap.xml',
]) if (!integration.includes(marker)) fail(`sitemap integration missing ${marker}`);
for (const forbidden of ['fetch(', 'axios', '@astrojs/sitemap', 'contents: write', 'wrangler', 'cloudflare']) {
  if (integration.toLowerCase().includes(forbidden.toLowerCase())) fail(`sitemap integration contains forbidden marker ${forbidden}`);
}

const packageJson = parse(packagePath);
const dependencyNames = [...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})];
if (dependencyNames.some((name) => name.includes('sitemap'))) fail(`external sitemap dependency found ${dependencyNames.filter((name) => name.includes('sitemap')).join(', ')}`);
if (fs.existsSync(filePath(publicSitemapPath))) fail('manual public sitemap remains');
if (fs.existsSync(filePath(temporaryWorkflowPath))) fail('temporary sitemap discovery workflow remains');
if (read(publicRobotsPath) !== expectedRobots) fail('committed public robots content differs');

const doc = read(docPath);
for (const marker of [
  'SITEMAP-ROBOTS-01',
  '767 public canonical URLs',
  'English URLs: 385',
  'Japanese URLs: 382',
  'Countries: 198',
  'Sources: 198',
  'Meeting details: 158',
  'Glossary: 100',
  'Racecourses: 74',
  'Racing types: 18',
  'Country detail routes: 196',
  'Source-country routes: 196',
  'Glossary term routes: 96',
  'scripts/check-sitemap-robots.mjs',
  '.github/workflows/sitemap-robots.yml',
  'STRUCTURED-DATA-BASELINE-01',
]) if (!doc.includes(marker)) fail(`sitemap documentation missing ${marker}`);

const workflow = read(workflowPath);
for (const marker of [
  'npm install --package-lock=false',
  'npm run build',
  'node scripts/check-ux-polish-release.mjs',
  'node scripts/check-sitemap-robots.mjs',
  'git status --porcelain',
]) if (!workflow.includes(marker)) fail(`sitemap workflow missing ${marker}`);
for (const forbidden of ['schedule:', 'cron:', 'contents: write', 'pull-requests: write', 'wrangler', 'cloudflare']) {
  if (workflow.toLowerCase().includes(forbidden.toLowerCase())) fail(`sitemap workflow contains forbidden marker ${forbidden}`);
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function canonicalFromHtml(html, relativeFile) {
  const match = html.match(/<link\s+[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>|<link\s+[^>]*href="([^"]+)"[^>]*rel="canonical"[^>]*>/i);
  const value = match?.slice(1).find(Boolean);
  if (!value) {
    fail(`rendered HTML canonical missing: ${relativeFile}`);
    return null;
  }
  return value;
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

function countPath(paths, pattern) {
  return paths.filter((value) => pattern.test(value)).length;
}

if (!fs.existsSync(filePath('dist'))) fail('dist is missing; run npm run build first');
const sitemapPath = filePath('dist/sitemap.xml');
const robotsPath = filePath('dist/robots.txt');
if (!fs.existsSync(sitemapPath)) fail('generated sitemap is missing');
if (!fs.existsSync(robotsPath)) fail('generated robots is missing');

let expectedUrls = [];
let noIndexCount = 0;
if (fs.existsSync(filePath('dist'))) {
  const htmlFiles = walk(filePath('dist')).filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const relative = path.relative(filePath('dist'), file);
    if (path.basename(file) === '404.html') continue;
    const html = fs.readFileSync(file, 'utf8');
    if (hasNoIndex(html)) {
      noIndexCount += 1;
      continue;
    }
    const canonical = canonicalFromHtml(html, relative);
    if (canonical) expectedUrls.push(canonical);
  }
}
expectedUrls = [...new Set(expectedUrls)].sort(compareUrls);

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')) fail('sitemap XML declaration differs');
  if (!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) fail('sitemap namespace differs');
  if (!sitemap.endsWith('</urlset>\n')) fail('sitemap closing structure differs');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const duplicateUrls = sitemapUrls.length - new Set(sitemapUrls).size;
  if (duplicateUrls !== 0) fail(`duplicate sitemap URLs ${duplicateUrls}`);
  if (!exact(sitemapUrls, expectedUrls)) fail('generated sitemap URLs do not exactly match rendered canonical URLs');
  if (sitemapUrls.length !== 767) fail(`sitemap URL count differs ${sitemapUrls.length}`);
  if (!exact(sitemapUrls, [...sitemapUrls].sort(compareUrls))) fail('sitemap URL order differs');

  const parsedUrls = sitemapUrls.map((value) => new URL(value));
  const paths = parsedUrls.map((url) => url.pathname);
  if (parsedUrls.some((url) => url.protocol !== 'https:')) fail('non-HTTPS sitemap URL found');
  if (parsedUrls.some((url) => url.origin !== SITE_ORIGIN)) fail('foreign-origin sitemap URL found');
  if (parsedUrls.some((url) => url.search || url.hash)) fail('query or fragment found in sitemap URL');
  if (paths.some((value) => value !== '/' && !value.endsWith('/'))) fail('sitemap URL without trailing slash found');
  if (paths.includes('/404/') || paths.includes('/404.html')) fail('rendered 404 found in sitemap');

  const normalizedFamilies = paths.map((value) => value.startsWith('/ja/') ? value.slice(3) : value);
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
  };
  if (!exact(detailCounts, expectedDetailCounts)) fail(`rendered sitemap detail counts differ ${JSON.stringify(detailCounts)}`);
}

if (noIndexCount !== 0) fail(`current noindex rendered HTML count differs ${noIndexCount}`);
if (fs.existsSync(robotsPath) && fs.readFileSync(robotsPath, 'utf8') !== expectedRobots) fail('generated robots content differs');
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  const disallowCount = (robots.match(/^Disallow:/gm) ?? []).length;
  if (disallowCount !== 0) fail(`robots Disallow directive count differs ${disallowCount}`);
  if ((robots.match(/^Sitemap:/gm) ?? []).length !== 1) fail('robots Sitemap directive count differs');
}

if (errors.length) {
  console.error(`SITEMAP_ROBOTS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('SITEMAP_ROBOTS: pass');
console.log('SITEMAP_URLS: 767');
console.log('ENGLISH_URLS: 385');
console.log('JAPANESE_URLS: 382');
console.log('COUNTRY_DETAIL_ROUTES: 196');
console.log('SOURCE_COUNTRY_ROUTES: 196');
console.log('MEETING_DETAIL_ROUTES: 158');
console.log('TEMPORARY_DISCOVERY_WORKFLOWS: 0');
console.log('NEXT_IMPLEMENTATION_UNIT: STRUCTURED-DATA-BASELINE-01');
