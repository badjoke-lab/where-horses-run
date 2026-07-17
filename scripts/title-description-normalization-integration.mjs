import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';

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

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function readAttribute(html, tagPattern, name, file) {
  const tag = html.match(tagPattern)?.[0];
  const value = tag?.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1];
  if (!value) throw new Error(`Missing ${name} in ${file}`);
  return decodeHtml(value);
}

function readText(html, pattern, label, file) {
  const value = html.match(pattern)?.[1];
  if (!value) throw new Error(`Missing ${label} in ${file}`);
  return stripTags(value);
}

function replaceTitle(html, title, file) {
  const matches = [...html.matchAll(/<title>[\s\S]*?<\/title>/gi)];
  if (matches.length !== 1) throw new Error(`Expected one title in ${file}, found ${matches.length}`);
  return html.replace(matches[0][0], `<title>${escapeHtml(title)}</title>`);
}

function replaceMetaContent(html, selector, value, file) {
  const tags = [...html.matchAll(/<meta\s+[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => selector(tag));
  if (tags.length !== 1) throw new Error(`Expected one matching meta tag in ${file}, found ${tags.length}`);
  const tag = tags[0];
  const replacement = tag.replace(/content="[^"]*"/i, `content="${escapeHtml(value)}"`);
  return html.replace(tag, replacement);
}

function updateJsonLd(html, title, description, canonicalUrl, file) {
  return html.replace(
    /<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/gi,
    (full, attributes, body) => {
      let data;
      try {
        data = JSON.parse(body);
      } catch (error) {
        throw new Error(`Invalid JSON-LD in ${file}: ${error.message}`);
      }
      const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
      let changed = false;
      for (const node of graph) {
        if (node?.['@id'] === `${canonicalUrl}#webpage` && ['WebPage', 'CollectionPage'].includes(node['@type'])) {
          node.name = title;
          node.description = description;
          changed = true;
        }
      }
      if (!changed) return full;
      const json = JSON.stringify(data).replace(/</g, '\\u003c');
      return `<script${attributes}>${json}</script>`;
    },
  );
}

function updatePageMetadata(page, title, description) {
  let html = page.html;
  html = replaceTitle(html, title, page.relative);
  html = replaceMetaContent(html, (tag) => /name="description"/i.test(tag), description, page.relative);
  html = replaceMetaContent(html, (tag) => /property="og:title"/i.test(tag), title, page.relative);
  html = replaceMetaContent(html, (tag) => /property="og:description"/i.test(tag), description, page.relative);
  html = replaceMetaContent(html, (tag) => /name="twitter:title"/i.test(tag), title, page.relative);
  html = replaceMetaContent(html, (tag) => /name="twitter:description"/i.test(tag), description, page.relative);
  html = updateJsonLd(html, title, description, page.canonicalUrl, page.relative);
  return html;
}

function parsePage(outputDirectory, file) {
  return fs.readFile(file, 'utf8').then((html) => {
    const relative = path.relative(outputDirectory, file).split(path.sep).join('/');
    const canonicalUrl = readAttribute(
      html,
      /<link\s+[^>]*rel="canonical"[^>]*>|<link\s+[^>]*href="[^"]+"[^>]*rel="canonical"[^>]*>/i,
      'href',
      relative,
    );
    const canonical = new URL(canonicalUrl);
    if (canonical.origin !== SITE_ORIGIN || canonical.search || canonical.hash) {
      throw new Error(`Invalid canonical URL in ${relative}: ${canonicalUrl}`);
    }
    const lang = readAttribute(html, /<html\s+[^>]*>/i, 'lang', relative);
    const title = readText(html, /<title>([\s\S]*?)<\/title>/i, 'title', relative);
    const description = readAttribute(
      html,
      /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i,
      'content',
      relative,
    );
    return { file, relative, html, canonicalUrl, pathname: canonical.pathname, lang, title, description };
  });
}

function meetingMetadata(page) {
  const match = page.pathname.match(/^\/(ja\/)?timetable\/meetings\/[^/]+\/$/);
  if (!match) return null;
  const racecourseName = readText(page.html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'meeting heading', page.relative);
  const pageKind = readText(page.html, /<p[^>]*class="eyebrow"[^>]*>([\s\S]*?)<\/p>/i, 'meeting page kind', page.relative);
  const date = page.html.match(/<p[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/p>/)?.[1];
  if (!date) throw new Error(`Missing meeting date in ${page.relative}`);
  if (page.lang === 'ja') {
    return {
      title: `${racecourseName} — ${date} ${pageKind} | 競馬どこ？`,
      description: `${date}の${racecourseName}開催について、公式ソースへのリンクと公開ポリシーで制御されたタイムテーブル情報を表示する開催詳細ページです。`,
    };
  }
  return {
    title: `${racecourseName} — ${date} ${pageKind} | Where Horses Run`,
    description: `Official-source based ${pageKind.toLowerCase()} for ${racecourseName} on ${date}, with public-policy-controlled timetable information and the official source link.`,
  };
}

function countryAreaName(page) {
  if (!/^\/(?:ja\/)?countries\/[^/]+\/$/.test(page.pathname)) return null;
  const heading = readText(page.html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'country heading', page.relative);
  const suffix = page.lang === 'ja' ? 'の競馬カレンダー・競馬場ガイド' : ' Horse Racing Calendar & Racecourses';
  if (!heading.endsWith(suffix)) throw new Error(`Country heading suffix differs in ${page.relative}: ${heading}`);
  return heading.slice(0, -suffix.length).trim();
}

export default function titleDescriptionNormalizationIntegration() {
  return {
    name: 'where-horses-run-title-description-normalization',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const files = (await walk(outputDirectory)).filter((file) => file.endsWith('.html') && path.basename(file) !== '404.html');
        const pages = await Promise.all(files.map((file) => parsePage(outputDirectory, file)));
        if (pages.length !== 767) throw new Error(`Title-description scope differs: ${pages.length} public pages`);

        const descriptionGroups = new Map();
        for (const page of pages) {
          const key = `${page.lang}\u0000${page.description}`;
          if (!descriptionGroups.has(key)) descriptionGroups.set(key, []);
          descriptionGroups.get(key).push(page);
        }
        const duplicatedCountryDescriptions = new Set();
        for (const group of descriptionGroups.values()) {
          if (group.length > 1 && group.every((page) => countryAreaName(page) !== null)) {
            group.forEach((page) => duplicatedCountryDescriptions.add(page.canonicalUrl));
          }
        }

        let meetingPages = 0;
        let countryDescriptionPages = 0;
        let changedPages = 0;
        for (const page of pages) {
          const meeting = meetingMetadata(page);
          let nextTitle = page.title;
          let nextDescription = page.description;
          if (meeting) {
            meetingPages += 1;
            nextTitle = meeting.title;
            nextDescription = meeting.description;
          } else if (duplicatedCountryDescriptions.has(page.canonicalUrl)) {
            countryDescriptionPages += 1;
            nextDescription = `${countryAreaName(page)} — ${page.description}`;
          }
          if (nextTitle !== page.title || nextDescription !== page.description) {
            const updated = updatePageMetadata(page, nextTitle, nextDescription);
            await fs.writeFile(page.file, updated, 'utf8');
            changedPages += 1;
          }
        }

        if (meetingPages !== 158) throw new Error(`Meeting metadata scope differs: ${meetingPages}`);
        if (countryDescriptionPages !== 4) throw new Error(`Country duplicate-description scope differs: ${countryDescriptionPages}`);
        logger.info(`Normalized titles and descriptions for ${meetingPages} meeting pages and ${countryDescriptionPages} country pages.`);
        logger.info(`Changed ${changedPages} rendered pages while preserving all other page metadata.`);
      },
    },
  };
}
