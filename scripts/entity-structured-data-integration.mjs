import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const BREADCRUMB_MARKER = 'entity-breadcrumb-v1';
const MEETING_EVENT_MARKER = 'sports-event-v1';

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
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
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function extractAttribute(html, tagPattern, name, file) {
  const tag = html.match(tagPattern)?.[0];
  const value = tag?.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1];
  if (!value) throw new Error(`Missing ${name} in ${file}`);
  return decodeHtml(value);
}

function extractText(html, pattern, label, file) {
  const value = html.match(pattern)?.[1];
  if (!value) throw new Error(`Missing ${label} in ${file}`);
  return stripTags(value);
}

function parseRoute(outputDirectory, file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join('/');
  const match = relative.match(/^(ja\/)?(countries|tracks|timetable\/meetings)\/([^/]+)\/index\.html$/);
  if (!match) return null;
  return {
    locale: match[1] ? 'ja' : 'en',
    kind: match[2] === 'countries' ? 'country' : match[2] === 'tracks' ? 'racecourse' : 'meeting',
    slug: match[3],
    relative,
  };
}

function serialize(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function canonicalFor(html, relative) {
  const href = extractAttribute(
    html,
    /<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i,
    'href',
    relative,
  );
  const url = new URL(href);
  if (url.origin !== SITE_ORIGIN || url.search || url.hash) throw new Error(`Invalid canonical in ${relative}: ${href}`);
  return url.toString();
}

function breadcrumbName(route, html) {
  const h1 = extractText(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'page title heading', route.relative);
  if (route.kind === 'country') {
    const suffix = route.locale === 'ja' ? 'の競馬カレンダー・競馬場ガイド' : ' Horse Racing Calendar & Racecourses';
    return h1.endsWith(suffix) ? h1.slice(0, -suffix.length).trim() : h1;
  }
  if (route.kind === 'meeting') {
    const date = extractText(
      html,
      /<span[^>]*data-meeting-projected-date[^>]*>([\s\S]*?)<\/span>/i,
      'meeting date',
      route.relative,
    );
    return route.locale === 'ja' ? `${h1} — ${date} 開催` : `${h1} — ${date} meeting`;
  }
  return h1;
}

function buildBreadcrumb(route, canonicalUrl, currentName) {
  const prefix = route.locale === 'ja' ? '/ja' : '';
  const labels = route.locale === 'ja'
    ? { home: 'ホーム', country: '国・地域', racecourse: '競馬場', meeting: 'カレンダー' }
    : { home: 'Home', country: 'Countries & regions', racecourse: 'Racecourses', meeting: 'Calendar' };
  const parentPath = route.kind === 'country'
    ? `${prefix}/countries/`
    : route.kind === 'racecourse'
      ? `${prefix}/tracks/`
      : `${prefix}/calendar/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: labels.home,
        item: `${SITE_ORIGIN}${prefix || ''}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels[route.kind],
        item: `${SITE_ORIGIN}${parentPath}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: currentName,
        item: canonicalUrl,
      },
    ],
  };
}

function parseLocalDateTime(dateValue, timeValue, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue) || !timeZone) return null;

  try {
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hour, minute] = timeValue.split(':').map(Number);
    const targetNaive = Date.UTC(year, month - 1, day, hour, minute, 0);
    let instant = targetNaive;
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const partsFor = (value) => Object.fromEntries(
      formatter.formatToParts(new Date(value))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = partsFor(instant);
      const renderedNaive = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
      const correction = targetNaive - renderedNaive;
      instant += correction;
      if (correction === 0) break;
    }

    const roundTrip = partsFor(instant);
    if (
      roundTrip.year !== year
      || roundTrip.month !== month
      || roundTrip.day !== day
      || roundTrip.hour !== hour
      || roundTrip.minute !== minute
    ) return null;

    const offsetMinutes = Math.round((targetNaive - instant) / 60000);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absolute = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absolute / 60)).padStart(2, '0');
    const offsetRemainder = String(absolute % 60).padStart(2, '0');
    return `${dateValue}T${timeValue}:00${sign}${offsetHours}:${offsetRemainder}`;
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}

function buildMeetingEvent(route, canonicalUrl, html) {
  const racecourseName = extractText(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'meeting racecourse', route.relative);
  const date = extractText(
    html,
    /<span[^>]*data-meeting-projected-date[^>]*>([\s\S]*?)<\/span>/i,
    'meeting date',
    route.relative,
  );
  const timezoneMatch = html.match(/<p>\s*(?:Venue timezone|開催地タイムゾーン):\s*([^<]+)<\/p>/i);
  const timezone = timezoneMatch ? stripTags(timezoneMatch[1]) : null;
  if (!timezone) throw new Error(`Missing visible venue timezone in ${route.relative}`);

  const trackHref = extractAttribute(
    html,
    /<h1[^>]*id="page-title"[^>]*>\s*<a\s+[^>]*href="[^"]+"[^>]*>/i,
    'href',
    route.relative,
  );
  const trackUrl = new URL(trackHref, SITE_ORIGIN).toString();
  const timeTags = [...html.matchAll(/<time\s+[^>]*data-meeting-source-time="([^"]+)"[^>]*>/gi)]
    .map((match) => match[1])
    .filter((value) => /^\d{2}:\d{2}$/.test(value));
  const firstTime = timeTags[0] ?? null;
  const lastTime = timeTags.at(-1) ?? null;
  const startDate = firstTime ? parseLocalDateTime(date, firstTime, timezone) ?? date : date;
  const endDate = lastTime ? parseLocalDateTime(date, lastTime, timezone) ?? undefined : undefined;
  const eventName = route.locale === 'ja' ? `${racecourseName} — ${date} 開催` : `${racecourseName} — ${date} meeting`;

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    '@id': `${canonicalUrl}#event`,
    identifier: route.slug,
    url: canonicalUrl,
    name: eventName,
    startDate,
    ...(endDate ? { endDate } : {}),
    location: {
      '@type': 'Place',
      '@id': `${trackUrl}#place`,
      name: racecourseName,
      url: trackUrl,
    },
    mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
  };
}

export default function entityStructuredDataIntegration() {
  return {
    name: 'where-horses-run-entity-structured-data',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const files = await walk(outputDirectory);
        const routes = files
          .filter((file) => file.endsWith('.html'))
          .map((file) => ({ file, route: parseRoute(outputDirectory, file) }))
          .filter((entry) => entry.route);

        let breadcrumbCount = 0;
        let meetingEventCount = 0;
        for (const { file, route } of routes) {
          let html = await fs.readFile(file, 'utf8');
          if (html.includes(`data-breadcrumb-metadata="${BREADCRUMB_MARKER}"`)) {
            throw new Error(`Breadcrumb metadata marker already exists in ${route.relative}`);
          }
          const canonicalUrl = canonicalFor(html, route.relative);
          const currentName = breadcrumbName(route, html);
          const breadcrumb = serialize(buildBreadcrumb(route, canonicalUrl, currentName));
          let scripts = `    <script type="application/ld+json" data-breadcrumb-metadata="${BREADCRUMB_MARKER}">${breadcrumb}</script>\n`;
          breadcrumbCount += 1;

          if (route.kind === 'meeting') {
            if (html.includes(`data-meeting-event-metadata="${MEETING_EVENT_MARKER}"`)) {
              throw new Error(`Meeting event metadata marker already exists in ${route.relative}`);
            }
            const event = serialize(buildMeetingEvent(route, canonicalUrl, html));
            scripts += `    <script type="application/ld+json" data-meeting-event-metadata="${MEETING_EVENT_MARKER}">${event}</script>\n`;
            meetingEventCount += 1;
          }

          if (!html.includes('</head>')) throw new Error(`Closing head tag missing in ${route.relative}`);
          html = html.replace('</head>', `${scripts}</head>`);
          await fs.writeFile(file, html, 'utf8');
        }

        logger.info(`Injected BreadcrumbList metadata into ${breadcrumbCount} country, racecourse, and meeting detail pages.`);
        logger.info(`Injected source-bound SportsEvent metadata into ${meetingEventCount} bilingual meeting detail pages.`);
      },
    },
  };
}