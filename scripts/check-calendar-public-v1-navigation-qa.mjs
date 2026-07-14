import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distRoot = path.join(root, 'dist');
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));
const audit = parse('data/audits/calendar-public-v1-navigation-qa-v1.json');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeRoute = (value) => {
  const pathname = value.split('#')[0].split('?')[0];
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
};

function listHtml(directory, result = []) {
  if (!existsSync(directory)) return result;
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) listHtml(full, result);
    else if (entry === 'index.html') result.push(full);
  }
  return result;
}

function routeFromHtml(file) {
  const relative = path.relative(distRoot, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  return `/${relative.slice(0, -'index.html'.length)}`;
}

function tags(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? [];
}

function hasTagWithAttrs(html, tagName, attrs) {
  return tags(html, tagName).some((tag) => Object.entries(attrs).every(([name, value]) =>
    new RegExp(`\\b${escapeRegExp(name)}=["']${escapeRegExp(value)}["']`, 'i').test(tag)
  ));
}

function hasAnchor(html, href, label) {
  const escapedHref = escapeRegExp(href);
  const escapedLabel = escapeRegExp(label);
  return new RegExp(`<a\\b[^>]*href=["']${escapedHref}["'][^>]*>\\s*${escapedLabel}\\s*</a>`, 'i').test(html);
}

if (audit.schema_version !== 'calendar-public-v1-navigation-qa-v1') fail('navigation QA schema differs');
if (audit.work_id !== 'WHR-CAL-PUBLIC-V1') fail('navigation QA Work ID differs');
if (audit.implementation_unit !== 'PUBLIC-V1-NAVIGATION-QA-01') fail('navigation QA implementation unit differs');
if (audit.status !== 'active') fail('navigation QA must remain active');
if (audit.site_origin !== 'https://whr.badjoke-lab.com') fail('navigation QA site origin differs');
if (!Array.isArray(audit.static_route_pairs) || audit.static_route_pairs.length < 10) fail('static route pair set is incomplete');
if (!Array.isArray(audit.dynamic_route_families) || audit.dynamic_route_families.length < 6) fail('dynamic route family set is incomplete');
if (new Set(audit.static_route_pairs.map((pair) => pair.id)).size !== audit.static_route_pairs.length) fail('static route pair IDs must be unique');
if (new Set(audit.dynamic_route_families.map((family) => family.id)).size !== audit.dynamic_route_families.length) fail('dynamic route family IDs must be unique');
for (const value of Object.values(audit.boundaries ?? {})) if (value !== false) fail('navigation QA must not enable mutation or deployment boundaries');

const baseLayout = read('src/layouts/BaseLayout.astro');
for (const marker of [
  'bilingualPathPatterns',
  'hasBilingualCounterpart',
  'inferredAlternateHref',
  'major-countries\\/current-timetable',
  'hreflang="x-default"',
]) {
  if (!baseLayout.includes(marker)) fail(`BaseLayout missing bilingual marker ${marker}`);
}

const timetableList = read('src/components/TimetableMeetingList.astro');
for (const marker of ['localizedDetailPath', "lang === 'ja' ? `/ja${detailPath}` : detailPath"]) {
  if (!timetableList.includes(marker)) fail(`TimetableMeetingList missing localization marker ${marker}`);
}

const jaCurrentTimetablePath = 'src/pages/ja/major-countries/current-timetable.astro';
if (!existsSync(path.join(root, jaCurrentTimetablePath))) fail('Japanese current timetable source route is missing');
else {
  const source = read(jaCurrentTimetablePath);
  for (const marker of [
    'lang="ja"',
    'canonicalPath="/ja/major-countries/current-timetable/"',
    'alternatePath="/major-countries/current-timetable/"',
    '<TimetableMeetingList',
  ]) if (!source.includes(marker)) fail(`Japanese current timetable missing ${marker}`);
}

if (!existsSync(distRoot)) fail('dist is missing; run npm run build before navigation QA');
const htmlFiles = listHtml(distRoot);
const routeFiles = new Map(htmlFiles.map((file) => [routeFromHtml(file), file]));
const auditedRoutes = new Set();

function readRoute(route) {
  const file = routeFiles.get(route);
  if (!file) {
    fail(`missing rendered route ${route}`);
    return '';
  }
  auditedRoutes.add(route);
  return readFileSync(file, 'utf8');
}

function assertPair(id, enRoute, jaRoute) {
  const en = readRoute(enRoute);
  const ja = readRoute(jaRoute);
  if (!en || !ja) return;

  const origin = audit.site_origin;
  if (!hasTagWithAttrs(en, 'html', { lang: 'en' })) fail(`${id}: English html lang differs`);
  if (!hasTagWithAttrs(ja, 'html', { lang: 'ja' })) fail(`${id}: Japanese html lang differs`);

  if (!hasTagWithAttrs(en, 'link', { rel: 'canonical', href: `${origin}${enRoute}` })) fail(`${id}: English canonical differs`);
  if (!hasTagWithAttrs(ja, 'link', { rel: 'canonical', href: `${origin}${jaRoute}` })) fail(`${id}: Japanese canonical differs`);
  if (!hasTagWithAttrs(en, 'link', { rel: 'alternate', hreflang: 'ja', href: `${origin}${jaRoute}` })) fail(`${id}: English-to-Japanese alternate differs`);
  if (!hasTagWithAttrs(ja, 'link', { rel: 'alternate', hreflang: 'en', href: `${origin}${enRoute}` })) fail(`${id}: Japanese-to-English alternate differs`);
  if (!hasTagWithAttrs(en, 'link', { rel: 'alternate', hreflang: 'x-default', href: `${origin}${enRoute}` })) fail(`${id}: English x-default differs`);
  if (!hasTagWithAttrs(ja, 'link', { rel: 'alternate', hreflang: 'x-default', href: `${origin}${enRoute}` })) fail(`${id}: Japanese x-default differs`);

  if (!hasAnchor(en, jaRoute, '日本語')) fail(`${id}: English language switch does not target ${jaRoute}`);
  if (!hasAnchor(ja, enRoute, 'English')) fail(`${id}: Japanese language switch does not target ${enRoute}`);
}

for (const pair of audit.static_route_pairs) assertPair(pair.id, pair.en, pair.ja);

for (const family of audit.dynamic_route_families) {
  const englishRoutes = [...routeFiles.keys()].filter((route) => route.startsWith(family.en_prefix) && route !== family.en_prefix);
  const japaneseRoutes = [...routeFiles.keys()].filter((route) => route.startsWith(family.ja_prefix) && route !== family.ja_prefix);
  if (englishRoutes.length === 0) fail(`${family.id}: no rendered English dynamic routes`);
  if (japaneseRoutes.length === 0) fail(`${family.id}: no rendered Japanese dynamic routes`);

  for (const enRoute of englishRoutes) {
    const suffix = enRoute.slice(family.en_prefix.length);
    const jaRoute = `${family.ja_prefix}${suffix}`;
    assertPair(`${family.id}:${suffix}`, enRoute, jaRoute);
  }
  for (const jaRoute of japaneseRoutes) {
    const suffix = jaRoute.slice(family.ja_prefix.length);
    const enRoute = `${family.en_prefix}${suffix}`;
    if (!routeFiles.has(enRoute)) fail(`${family.id}: orphan Japanese route ${jaRoute}`);
  }
}

for (const route of [...auditedRoutes].filter((value) => value.startsWith('/timetable/meetings/'))) {
  const html = readRoute(route);
  for (const href of audit.meeting_detail_back_links.en) {
    const escaped = escapeRegExp(href);
    if (!new RegExp(`<a\\b[^>]*href=["']${escaped}["']`, 'i').test(html)) fail(`${route} missing back link ${href}`);
  }
}
for (const route of [...auditedRoutes].filter((value) => value.startsWith('/ja/timetable/meetings/'))) {
  const html = readRoute(route);
  for (const href of audit.meeting_detail_back_links.ja) {
    const escaped = escapeRegExp(href);
    if (!new RegExp(`<a\\b[^>]*href=["']${escaped}["']`, 'i').test(html)) fail(`${route} missing back link ${href}`);
  }
}

const internalOrigin = `${audit.site_origin}/`;
for (const route of auditedRoutes) {
  const html = readRoute(route);
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const href of hrefs) {
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('//')) continue;
    let internal = href;
    if (/^https?:\/\//i.test(internal)) {
      if (!internal.startsWith(internalOrigin)) continue;
      internal = internal.slice(audit.site_origin.length);
    }
    if (!internal.startsWith('/')) continue;
    const pathname = internal.split('#')[0].split('?')[0];
    if (/\.[a-z0-9]+$/i.test(pathname) || pathname.startsWith('/_astro/')) continue;
    const target = normalizeRoute(pathname);
    if (!routeFiles.has(target)) fail(`${route} links to missing internal route ${target}`);
  }
}

if (errors.length) {
  console.error(`CALENDAR_PUBLIC_V1_NAVIGATION_QA: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_PUBLIC_V1_NAVIGATION_QA: pass static_pairs=${audit.static_route_pairs.length} dynamic_families=${audit.dynamic_route_families.length} audited_routes=${auditedRoutes.size}`);
console.log(`RENDERED_ROUTES: ${routeFiles.size}`);
console.log('BROKEN_INTERNAL_LINKS: 0');
console.log('BILINGUAL_ORPHAN_ROUTES: 0');
console.log('MEETING_DETAIL_LANGUAGE_SWITCH: paired');
console.log('JAPANESE_CURRENT_TIMETABLE_ROUTE: rendered');
console.log('PUBLIC_DATA_WRITES: false');
