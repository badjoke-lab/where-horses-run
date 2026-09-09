import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const outputDirectory = path.resolve(process.argv[2] ?? 'dist');

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&');
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function parseRoute(file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join('/');
  const match = relative.match(/^(ja\/)?(countries|tracks|timetable\/meetings)\/([^/]+)\/index\.html$/);
  if (!match) return null;
  return {
    relative,
    locale: match[1] ? 'ja' : 'en',
    kind: match[2] === 'countries' ? 'country' : match[2] === 'tracks' ? 'racecourse' : 'meeting',
    slug: match[3],
  };
}

function extractCanonical(html, relative) {
  const tag = html.match(/<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i)?.[0];
  const href = tag?.match(/href="([^"]+)"/i)?.[1];
  if (!href) throw new Error(`Missing canonical in ${relative}`);
  return decodeHtml(href);
}

function extractJsonLd(html, marker, relative) {
  const pattern = new RegExp(`<script[^>]*${marker}="[^"]+"[^>]*>([\\s\\S]*?)<\\/script>`, 'gi');
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) throw new Error(`${relative}: expected exactly one ${marker} script, found ${matches.length}`);
  return JSON.parse(matches[0][1]);
}

function assertUrl(value, label) {
  const url = new URL(value);
  if (url.origin !== SITE_ORIGIN || url.search || url.hash) throw new Error(`${label}: invalid WHR URL ${value}`);
}

function expectedParent(route) {
  const prefix = route.locale === 'ja' ? '/ja' : '';
  if (route.kind === 'country') return `${SITE_ORIGIN}${prefix}/countries/`;
  if (route.kind === 'racecourse') return `${SITE_ORIGIN}${prefix}/tracks/`;
  return `${SITE_ORIGIN}${prefix}/calendar/`;
}

const files = (await walk(outputDirectory)).filter((file) => file.endsWith('.html'));
const routes = files.map((file) => ({ file, route: parseRoute(file) })).filter((entry) => entry.route);
if (!routes.length) throw new Error('No entity detail pages found in rendered output.');

let breadcrumbs = 0;
let events = 0;
for (const { file, route } of routes) {
  const html = await fs.readFile(file, 'utf8');
  const canonical = extractCanonical(html, route.relative);
  assertUrl(canonical, route.relative);

  const breadcrumb = extractJsonLd(html, 'data-breadcrumb-metadata', route.relative);
  if (breadcrumb['@context'] !== 'https://schema.org' || breadcrumb['@type'] !== 'BreadcrumbList') {
    throw new Error(`${route.relative}: invalid BreadcrumbList type/context`);
  }
  if (!Array.isArray(breadcrumb.itemListElement) || breadcrumb.itemListElement.length !== 3) {
    throw new Error(`${route.relative}: breadcrumb must contain exactly three ListItem entries`);
  }
  for (let index = 0; index < 3; index += 1) {
    const item = breadcrumb.itemListElement[index];
    if (item?.['@type'] !== 'ListItem' || item?.position !== index + 1 || typeof item?.name !== 'string' || !item.name.trim()) {
      throw new Error(`${route.relative}: invalid breadcrumb item at position ${index + 1}`);
    }
    assertUrl(item.item, `${route.relative} breadcrumb position ${index + 1}`);
  }
  const expectedHome = route.locale === 'ja' ? `${SITE_ORIGIN}/ja/` : `${SITE_ORIGIN}/`;
  if (breadcrumb.itemListElement[0].item !== expectedHome) throw new Error(`${route.relative}: breadcrumb home mismatch`);
  if (breadcrumb.itemListElement[1].item !== expectedParent(route)) throw new Error(`${route.relative}: breadcrumb parent mismatch`);
  if (breadcrumb.itemListElement[2].item !== canonical) throw new Error(`${route.relative}: breadcrumb leaf must equal canonical`);
  breadcrumbs += 1;

  const eventMarkerCount = (html.match(/data-meeting-event-metadata=/g) ?? []).length;
  if (route.kind !== 'meeting') {
    if (eventMarkerCount !== 0) throw new Error(`${route.relative}: non-meeting page contains meeting event metadata`);
    continue;
  }

  const event = extractJsonLd(html, 'data-meeting-event-metadata', route.relative);
  const allowedEventKeys = new Set(['@context', '@type', '@id', 'identifier', 'url', 'name', 'startDate', 'endDate', 'location', 'mainEntityOfPage']);
  for (const key of Object.keys(event)) {
    if (!allowedEventKeys.has(key)) throw new Error(`${route.relative}: unsupported meeting event key ${key}`);
  }
  if (event['@context'] !== 'https://schema.org' || event['@type'] !== 'SportsEvent') {
    throw new Error(`${route.relative}: meeting metadata must be schema.org SportsEvent`);
  }
  if (event.identifier !== route.slug) throw new Error(`${route.relative}: SportsEvent identifier mismatch`);
  if (event.url !== canonical || event['@id'] !== `${canonical}#event`) throw new Error(`${route.relative}: SportsEvent identity mismatch`);
  if (event.mainEntityOfPage?.['@id'] !== `${canonical}#webpage`) throw new Error(`${route.relative}: SportsEvent mainEntityOfPage mismatch`);

  const h1 = html.match(/<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const date = html.match(/<span[^>]*data-meeting-projected-date[^>]*>([\s\S]*?)<\/span>/i)?.[1];
  if (!h1 || !date) throw new Error(`${route.relative}: meeting visible identity/date missing`);
  const racecourseName = stripTags(h1);
  const meetingDate = stripTags(date);
  if (!event.name.includes(racecourseName) || !event.name.includes(meetingDate)) {
    throw new Error(`${route.relative}: SportsEvent name is not grounded in visible venue/date`);
  }
  if (!String(event.startDate).startsWith(meetingDate)) throw new Error(`${route.relative}: SportsEvent startDate does not match visible meeting date`);
  if (event.endDate && !String(event.endDate).startsWith(meetingDate)) throw new Error(`${route.relative}: SportsEvent endDate does not match visible meeting date`);

  const sourceTimes = [...html.matchAll(/<time\s+[^>]*data-meeting-source-time="([^"]+)"[^>]*>/gi)].map((match) => match[1]);
  if (sourceTimes.length) {
    if (!String(event.startDate).includes(`T${sourceTimes[0]}:00`)) {
      throw new Error(`${route.relative}: SportsEvent startDate does not match first visible source time`);
    }
    if (!String(event.startDate).match(/[+-]\d{2}:\d{2}$/)) {
      throw new Error(`${route.relative}: SportsEvent startDate with a known time must carry a UTC offset`);
    }
    const last = sourceTimes.at(-1);
    if (!event.endDate || !String(event.endDate).includes(`T${last}:00`) || !String(event.endDate).match(/[+-]\d{2}:\d{2}$/)) {
      throw new Error(`${route.relative}: SportsEvent endDate must match last visible source time with a UTC offset`);
    }
  }

  const trackHref = html.match(/<h1[^>]*id="page-title"[^>]*>\s*<a\s+[^>]*href="([^"]+)"/i)?.[1];
  if (!trackHref) throw new Error(`${route.relative}: visible racecourse link missing`);
  const expectedTrackUrl = new URL(decodeHtml(trackHref), SITE_ORIGIN).toString();
  if (event.location?.['@type'] !== 'Place' || event.location?.name !== racecourseName || event.location?.url !== expectedTrackUrl) {
    throw new Error(`${route.relative}: SportsEvent Place is not grounded in visible racecourse identity`);
  }
  if (event.location?.['@id'] !== `${expectedTrackUrl}#place`) throw new Error(`${route.relative}: SportsEvent Place @id mismatch`);
  const allowedLocationKeys = new Set(['@type', '@id', 'name', 'url']);
  for (const key of Object.keys(event.location ?? {})) {
    if (!allowedLocationKeys.has(key)) throw new Error(`${route.relative}: unsupported event location key ${key}`);
  }
  events += 1;
}

console.log(`Entity structured-data check passed: ${breadcrumbs} BreadcrumbList pages, ${events} SportsEvent meeting pages.`);
