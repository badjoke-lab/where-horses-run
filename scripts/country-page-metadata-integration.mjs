import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const MARKER = 'collection-administrative-area-v1';
const SUPPORT_REGISTRY_URL = new URL('../data/static/calendar-public-country-support-v1.json', import.meta.url);

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

function parseCountryRoute(outputDirectory, file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join('/');
  const match = relative.match(/^(ja\/)?countries\/([^/]+)\/index\.html$/);
  if (!match) return null;
  return {
    locale: match[1] ? 'ja' : 'en',
    slug: match[2],
    relative,
  };
}

function parsePage(file, route) {
  return fs.readFile(file, 'utf8').then((html) => {
    if (html.includes(`data-country-page-metadata="${MARKER}"`)) {
      throw new Error(`Country metadata marker already exists in ${route.relative}`);
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
    if (canonical.origin !== SITE_ORIGIN || canonical.search || canonical.hash) {
      throw new Error(`Invalid canonical URL in ${route.relative}: ${canonicalUrl}`);
    }
    const expectedPath = route.locale === 'ja'
      ? `/ja/countries/${route.slug}/`
      : `/countries/${route.slug}/`;
    if (canonical.pathname !== expectedPath) {
      throw new Error(`Country canonical path differs in ${route.relative}: ${canonical.pathname}`);
    }

    const lang = extractAttribute(html, /<html\s+[^>]*>/i, 'lang', route.relative);
    if (lang !== route.locale) throw new Error(`Country page language differs in ${route.relative}: ${lang}`);

    const title = extractText(html, /<title>([\s\S]*?)<\/title>/i, 'title', route.relative);
    const description = extractAttribute(
      html,
      /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i,
      'content',
      route.relative,
    );
    const heading = extractText(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'country page heading', route.relative);
    const name = heading.trim();
    if (!name) throw new Error(`Country name is empty in ${route.relative}`);

    return {
      ...route,
      file,
      html,
      canonicalUrl,
      title,
      description,
      name,
    };
  });
}

function uniqueNames(values, currentName) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value && value !== currentName))];
}

function buildMetadata(page, counterpart) {
  const areaId = `${page.canonicalUrl}#administrative-area`;
  const webpageId = `${page.canonicalUrl}#webpage`;
  const alternateName = uniqueNames([counterpart.name], page.name);
  const administrativeAreaNode = {
    '@type': 'AdministrativeArea',
    '@id': areaId,
    url: page.canonicalUrl,
    name: page.name,
    ...(alternateName.length ? { alternateName } : {}),
    mainEntityOfPage: { '@id': webpageId },
  };
  const collectionPageNode = {
    '@type': 'CollectionPage',
    '@id': webpageId,
    url: page.canonicalUrl,
    name: page.title,
    description: page.description,
    inLanguage: page.locale,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': areaId },
    mainEntity: { '@id': areaId },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [collectionPageNode, administrativeAreaNode],
  };
}

function serialize(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

async function getExpectedPublicCountryCount() {
  const registry = JSON.parse(await fs.readFile(SUPPORT_REGISTRY_URL, 'utf8'));
  if (!Array.isArray(registry?.countries)) {
    throw new Error('Calendar public country support registry has no countries array');
  }
  const supported = registry.countries.filter((record) => record?.calendar_supported === true);
  if (!supported.length) {
    throw new Error('Calendar public country support registry has no supported countries');
  }
  return supported.length;
}

export default function countryPageMetadataIntegration() {
  return {
    name: 'where-horses-run-country-page-metadata',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const files = await walk(outputDirectory);
        const routes = files
          .filter((file) => file.endsWith('.html'))
          .map((file) => ({ file, route: parseCountryRoute(outputDirectory, file) }))
          .filter((entry) => entry.route);

        const pages = await Promise.all(routes.map(({ file, route }) => parsePage(file, route)));
        const bySlug = new Map();
        for (const page of pages) {
          if (!bySlug.has(page.slug)) bySlug.set(page.slug, new Map());
          const locales = bySlug.get(page.slug);
          if (locales.has(page.locale)) throw new Error(`Duplicate ${page.locale} country page for ${page.slug}`);
          locales.set(page.locale, page);
        }

        const expectedCountryCount = await getExpectedPublicCountryCount();
        const expectedPageCount = expectedCountryCount * 2;
        if (bySlug.size !== expectedCountryCount || pages.length !== expectedPageCount) {
          throw new Error(
            `Country metadata scope differs from Calendar public support: ${bySlug.size} slugs / ${pages.length} pages; expected ${expectedCountryCount} slugs / ${expectedPageCount} pages`,
          );
        }

        let injected = 0;
        for (const [slug, locales] of [...bySlug.entries()].sort(([left], [right]) => left.localeCompare(right, 'en'))) {
          const english = locales.get('en');
          const japanese = locales.get('ja');
          if (!english || !japanese || locales.size !== 2) {
            throw new Error(`Country metadata requires one English and one Japanese page for ${slug}`);
          }
          for (const [page, counterpart] of [[english, japanese], [japanese, english]]) {
            const json = serialize(buildMetadata(page, counterpart));
            const script = `    <script type="application/ld+json" data-country-page-metadata="${MARKER}">${json}</script>\n`;
            if (!page.html.includes('</head>')) throw new Error(`Closing head tag missing in ${page.relative}`);
            const updated = page.html.replace('</head>', `${script}</head>`);
            await fs.writeFile(page.file, updated, 'utf8');
            injected += 1;
          }
        }

        logger.info(`Injected country-page metadata into ${injected} bilingual detail pages.`);
        logger.info(`Validated ${bySlug.size} Calendar-supported country or region pairs with visible names.`);
      },
    },
  };
}
