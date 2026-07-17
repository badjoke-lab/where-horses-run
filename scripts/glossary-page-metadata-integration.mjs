import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const MARKER = 'collection-defined-term-v1';

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

function extractAliases(html) {
  const section = html.match(/<section[^>]*aria-labelledby="aliases-heading"[^>]*>([\s\S]*?)<\/section>/i)?.[1];
  if (!section) return [];
  return [...section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
}

function parseRoute(outputDirectory, file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join('/');
  const match = relative.match(/^(ja\/)?glossary\/([^/]+)\/index\.html$/);
  if (!match || match[2] === 'relationships') return null;
  return {
    locale: match[1] ? 'ja' : 'en',
    slug: match[2],
    relative,
  };
}

async function parsePage(outputDirectory, file, route) {
  const html = await fs.readFile(file, 'utf8');
  if (html.includes(`data-glossary-page-metadata="${MARKER}"`)) {
    throw new Error(`Glossary metadata marker already exists in ${route.relative}`);
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
  const expectedPath = route.locale === 'ja' ? `/ja/glossary/${route.slug}/` : `/glossary/${route.slug}/`;
  if (canonical.origin !== SITE_ORIGIN || canonical.pathname !== expectedPath || canonical.search || canonical.hash) {
    throw new Error(`Invalid glossary canonical in ${route.relative}: ${canonicalUrl}`);
  }

  const lang = extractAttribute(html, /<html\s+[^>]*>/i, 'lang', route.relative);
  if (lang !== route.locale) throw new Error(`Glossary language differs in ${route.relative}: ${lang}`);
  const title = extractText(html, /<title>([\s\S]*?)<\/title>/i, 'title', route.relative);
  const description = extractAttribute(
    html,
    /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i,
    'content',
    route.relative,
  );
  const name = extractText(html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'glossary heading', route.relative);
  const summary = extractText(html, /<p[^>]*class="hero__summary"[^>]*>([\s\S]*?)<\/p>/i, 'glossary summary', route.relative);
  const lastReviewed = extractAttribute(html, /<time\s+[^>]*datetime="[^"]+"[^>]*>/i, 'datetime', route.relative);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastReviewed)) {
    throw new Error(`Glossary review date is not ISO YYYY-MM-DD in ${route.relative}: ${lastReviewed}`);
  }
  const aliases = extractAliases(html);

  return {
    ...route,
    file,
    html,
    canonicalUrl,
    title,
    description,
    name,
    summary,
    lastReviewed,
    aliases,
  };
}

function uniqueNames(values, currentName) {
  return [...new Set(values.map((value) => value?.trim()).filter((value) => value && value !== currentName))];
}

function buildMetadata(page, counterpart) {
  const webpageId = `${page.canonicalUrl}#webpage`;
  const termId = `${page.canonicalUrl}#defined-term`;
  const termSetUrl = page.locale === 'ja' ? `${SITE_ORIGIN}/ja/glossary/` : `${SITE_ORIGIN}/glossary/`;
  const alternateName = uniqueNames(
    [counterpart.name, ...page.aliases, ...counterpart.aliases],
    page.name,
  );
  const collectionPageNode = {
    '@type': 'CollectionPage',
    '@id': webpageId,
    url: page.canonicalUrl,
    name: page.title,
    description: page.description,
    inLanguage: page.locale,
    isPartOf: { '@id': WEBSITE_ID },
    lastReviewed: page.lastReviewed,
    about: { '@id': termId },
    mainEntity: { '@id': termId },
  };
  const definedTermNode = {
    '@type': 'DefinedTerm',
    '@id': termId,
    url: page.canonicalUrl,
    name: page.name,
    description: page.summary,
    ...(alternateName.length ? { alternateName } : {}),
    inDefinedTermSet: { '@id': `${termSetUrl}#defined-term-set` },
    mainEntityOfPage: { '@id': webpageId },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [collectionPageNode, definedTermNode],
  };
}

function serialize(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function glossaryPageMetadataIntegration() {
  return {
    name: 'where-horses-run-glossary-page-metadata',
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
          if (locales.has(page.locale)) throw new Error(`Duplicate ${page.locale} glossary page for ${page.slug}`);
          locales.set(page.locale, page);
        }

        if (bySlug.size !== 48 || pages.length !== 96) {
          throw new Error(`Glossary metadata scope differs: ${bySlug.size} slugs / ${pages.length} pages`);
        }

        let injected = 0;
        let alternateNameCount = 0;
        for (const [slug, locales] of [...bySlug.entries()].sort(([left], [right]) => left.localeCompare(right, 'en'))) {
          const english = locales.get('en');
          const japanese = locales.get('ja');
          if (!english || !japanese || locales.size !== 2) {
            throw new Error(`Glossary metadata requires one English and one Japanese page for ${slug}`);
          }
          for (const [page, counterpart] of [[english, japanese], [japanese, english]]) {
            const metadata = buildMetadata(page, counterpart);
            const term = metadata['@graph'].find((node) => node['@type'] === 'DefinedTerm');
            alternateNameCount += Array.isArray(term?.alternateName) ? term.alternateName.length : 0;
            const json = serialize(metadata);
            const script = `    <script type="application/ld+json" data-glossary-page-metadata="${MARKER}">${json}</script>\n`;
            if (!page.html.includes('</head>')) throw new Error(`Closing head tag missing in ${page.relative}`);
            await fs.writeFile(page.file, page.html.replace('</head>', `${script}</head>`), 'utf8');
            injected += 1;
          }
        }

        logger.info(`Injected glossary metadata into ${injected} bilingual term pages.`);
        logger.info(`Validated ${bySlug.size} glossary pairs and ${alternateNameCount} deduplicated alternate-name values.`);
      },
    },
  };
}
