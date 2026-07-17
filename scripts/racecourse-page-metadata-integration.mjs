import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const MARKER = 'collection-place-v1';
const PLACEHOLDERS = new Set(['Not listed yet', '未掲載', 'Location pending', '所在地未掲載']);

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

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function extractStrongParagraph(html, label, file) {
  const escaped = escapePattern(label);
  const pattern = new RegExp(`<p>\\s*<strong>\\s*${escaped}\\s*<\\/strong>\\s*([\\s\\S]*?)<\\/p>`, 'i');
  return extractText(html, pattern, label, file);
}

function extractStrongParagraphHref(html, label, file) {
  const escaped = escapePattern(label);
  const pattern = new RegExp(`<p>\\s*<strong>\\s*${escaped}\\s*<\\/strong>\\s*<a\\s+[^>]*href="([^"]+)"`, 'i');
  const value = html.match(pattern)?.[1];
  if (!value) throw new Error(`Missing visible ${label} link in ${file}`);
  return decodeHtml(value);
}

function parseRoute(outputDirectory, file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join('/');
  const match = relative.match(/^(ja\/)?tracks\/([^/]+)\/index\.html$/);
  if (!match) return null;
  return {
    locale: match[1] ? 'ja' : 'en',
    slug: match[2],
    relative,
  };
}

function visibleAddress(value) {
  const parts = value.split('/').map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 && parts.some((part) => !PLACEHOLDERS.has(part)) ? value : null;
}

function localNameFromHero(summary) {
  if (!summary.includes(' · ')) return null;
  const value = summary.split(' · ', 1)[0].trim();
  return value || null;
}

async function parsePage(outputDirectory, file, route) {
  const html = await fs.readFile(file, 'utf8');
  if (html.includes(`data-racecourse-page-metadata="${MARKER}"`)) {
    throw new Error(`Racecourse metadata marker already exists in ${route.relative}`);
  }
  if (!html.includes('data-structured-data-baseline="website-webpage-v1"')) {
    throw new Error(`Structured-data baseline missing in ${route.relative}`);
  }

  const canonicalUrl = extractAttribute(
    html,
    /<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i,
    'href',
    route.relative,
  );
  const canonical = new URL(canonicalUrl);
  const expectedPath = route.locale === 'ja' ? `/ja/tracks/${route.slug}/` : `/tracks/${route.slug}/`;
  if (canonical.origin !== SITE_ORIGIN || canonical.pathname !== expectedPath || canonical.search || canonical.hash) {
    throw new Error(`Invalid racecourse canonical in ${route.relative}: ${canonicalUrl}`);
  }

  const lang = extractAttribute(html, /<html\s+[^>]*>/i, 'lang', route.relative);
  if (lang !== route.locale) throw new Error(`Racecourse language differs in ${route.relative}: ${lang}`);
  const title = extractText(html, /<title>([\s\S]*?)<\/title>/i, 'title', route.relative);
  const description = extractAttribute(
    html,
    /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i,
    'content',
    route.relative,
  );
  const name = extractText(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'racecourse heading', route.relative);
  const heroSummary = extractText(html, /<p[^>]*class="hero__summary"[^>]*>([\s\S]*?)<\/p>/i, 'racecourse hero summary', route.relative);
  const localName = localNameFromHero(heroSummary);
  const countryLabel = route.locale === 'ja' ? '国:' : 'Country:';
  const locationLabel = route.locale === 'ja' ? '都市 / 地域:' : 'City / region:';
  const countryHref = extractStrongParagraphHref(html, countryLabel, route.relative);
  const countryName = extractStrongParagraph(html, countryLabel, route.relative);
  const addressText = visibleAddress(extractStrongParagraph(html, locationLabel, route.relative));

  const expectedCountryPattern = route.locale === 'ja'
    ? /^\/ja\/countries\/[^/]+\/$/
    : /^\/countries\/[^/]+\/$/;
  if (!expectedCountryPattern.test(countryHref)) {
    throw new Error(`Racecourse country link differs in ${route.relative}: ${countryHref}`);
  }

  return {
    ...route,
    file,
    html,
    canonicalUrl,
    title,
    description,
    name,
    localName,
    countryHref,
    countryName,
    addressText,
  };
}

function uniqueNames(values, currentName) {
  return [...new Set(values.map((value) => value?.trim()).filter((value) => value && value !== currentName))];
}

function buildMetadata(page, counterpart) {
  const webpageId = `${page.canonicalUrl}#webpage`;
  const placeId = `${page.canonicalUrl}#place`;
  const countryUrl = new URL(page.countryHref, SITE_ORIGIN).toString();
  const countryAreaId = `${countryUrl}#administrative-area`;
  const alternateName = uniqueNames([counterpart.name, page.localName], page.name);
  const collectionPageNode = {
    '@type': 'CollectionPage',
    '@id': webpageId,
    url: page.canonicalUrl,
    name: page.title,
    description: page.description,
    inLanguage: page.locale,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': placeId },
    mainEntity: { '@id': placeId },
  };
  const placeNode = {
    '@type': 'Place',
    '@id': placeId,
    url: page.canonicalUrl,
    name: page.name,
    ...(alternateName.length ? { alternateName } : {}),
    ...(page.addressText ? { address: page.addressText } : {}),
    containedInPlace: {
      '@id': countryAreaId,
      name: page.countryName,
    },
    mainEntityOfPage: { '@id': webpageId },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [collectionPageNode, placeNode],
  };
}

function serialize(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function racecoursePageMetadataIntegration() {
  return {
    name: 'where-horses-run-racecourse-page-metadata',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const files = await walk(outputDirectory);
        const routes = files
          .filter((file) => file.endsWith('.html'))
          .map((file) => ({ file, route: parseRoute(outputDirectory, file) }))
          .filter((entry) => entry.route);
        const pages = await Promise.all(routes.map(({ file, route }) => parsePage(outputDirectory, file, route)));
        const bySlug = new Map();
        for (const page of pages) {
          if (!bySlug.has(page.slug)) bySlug.set(page.slug, new Map());
          const locales = bySlug.get(page.slug);
          if (locales.has(page.locale)) throw new Error(`Duplicate ${page.locale} racecourse page for ${page.slug}`);
          locales.set(page.locale, page);
        }

        if (bySlug.size !== 36 || pages.length !== 72) {
          throw new Error(`Racecourse metadata scope differs: ${bySlug.size} slugs / ${pages.length} pages`);
        }

        let injected = 0;
        let addressCount = 0;
        for (const [slug, locales] of [...bySlug.entries()].sort(([left], [right]) => left.localeCompare(right, 'en'))) {
          const english = locales.get('en');
          const japanese = locales.get('ja');
          if (!english || !japanese || locales.size !== 2) {
            throw new Error(`Racecourse metadata requires one English and one Japanese page for ${slug}`);
          }
          for (const [page, counterpart] of [[english, japanese], [japanese, english]]) {
            const json = serialize(buildMetadata(page, counterpart));
            const script = `    <script type="application/ld+json" data-racecourse-page-metadata="${MARKER}">${json}</script>\n`;
            if (!page.html.includes('</head>')) throw new Error(`Closing head tag missing in ${page.relative}`);
            await fs.writeFile(page.file, page.html.replace('</head>', `${script}</head>`), 'utf8');
            injected += 1;
            if (page.addressText) addressCount += 1;
          }
        }

        logger.info(`Injected racecourse metadata into ${injected} bilingual detail pages.`);
        logger.info(`Linked ${injected} venue pages to visible country or region identities; ${addressCount} pages include visible address text.`);
      },
    },
  };
}
