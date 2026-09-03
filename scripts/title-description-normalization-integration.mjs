import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ORIGIN = 'https://whr.badjoke-lab.com';
const PROJECT_NAME = 'where-horses-run-title-description-normalization';

function cleanText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readText(html, pattern, label, relative) {
  const value = html.match(pattern)?.[1];
  if (!value) throw new Error(`Missing ${label} in ${relative}`);
  return cleanText(value);
}

function readAttribute(html, pattern, attribute, relative) {
  const tag = html.match(pattern)?.[0];
  if (!tag) throw new Error(`Missing ${attribute} tag in ${relative}`);
  const value = tag.match(new RegExp(`${attribute}="([^"]*)"`, 'i'))?.[1];
  if (value === undefined) throw new Error(`Missing ${attribute} attribute in ${relative}`);
  return cleanText(value);
}

function replaceTitle(html, title) {
  const escaped = escapeHtml(title);
  if (!/<title>[\s\S]*?<\/title>/i.test(html)) throw new Error('Missing title tag while normalizing metadata.');
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escaped}</title>`);
}

function replaceDescription(html, description) {
  const escaped = escapeHtml(description);
  const pattern = /<meta\s+[^>]*name="description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="description"[^>]*>/i;
  if (!pattern.test(html)) throw new Error('Missing meta description while normalizing metadata.');
  return html.replace(pattern, `<meta name="description" content="${escaped}">`);
}

function replaceOgTitle(html, title) {
  const escaped = escapeHtml(title);
  const pattern = /<meta\s+[^>]*property="og:title"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*property="og:title"[^>]*>/i;
  if (!pattern.test(html)) throw new Error('Missing og:title while normalizing metadata.');
  return html.replace(pattern, `<meta property="og:title" content="${escaped}">`);
}

function replaceOgDescription(html, description) {
  const escaped = escapeHtml(description);
  const pattern = /<meta\s+[^>]*property="og:description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*property="og:description"[^>]*>/i;
  if (!pattern.test(html)) throw new Error('Missing og:description while normalizing metadata.');
  return html.replace(pattern, `<meta property="og:description" content="${escaped}">`);
}

function replaceTwitterTitle(html, title) {
  const escaped = escapeHtml(title);
  const pattern = /<meta\s+[^>]*name="twitter:title"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="twitter:title"[^>]*>/i;
  if (!pattern.test(html)) throw new Error('Missing twitter:title while normalizing metadata.');
  return html.replace(pattern, `<meta name="twitter:title" content="${escaped}">`);
}

function replaceTwitterDescription(html, description) {
  const escaped = escapeHtml(description);
  const pattern = /<meta\s+[^>]*name="twitter:description"[^>]*>|<meta\s+[^>]*content="[^"]*"[^>]*name="twitter:description"[^>]*>/i;
  if (!pattern.test(html)) throw new Error('Missing twitter:description while normalizing metadata.');
  return html.replace(pattern, `<meta name="twitter:description" content="${escaped}">`);
}

async function collectHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(target);
    return entry.isFile() && entry.name.endsWith('.html') ? [target] : [];
  }));
  return nested.flat();
}

async function readPage(file, outputDirectory) {
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
  const date = page.html.match(/<span[^>]*data-meeting-projected-date[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/span>/i)?.[1]
    ?? page.html.match(/<p[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/p>/)?.[1];
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

function countryMetadata(page) {
  const areaName = countryAreaName(page);
  if (!areaName) return null;
  if (page.lang === 'ja') {
    return {
      title: `${areaName}の競馬カレンダー・競馬場ガイド | 競馬どこ？`,
      description: `${areaName}の競馬開催、競馬場、主催団体、公式情報源を確認できます。`,
    };
  }
  return {
    title: `${areaName} Horse Racing Calendar & Racecourses | Where Horses Run`,
    description: `Explore horse racing meetings, racecourses, authorities, and official sources in ${areaName}.`,
  };
}

function racecourseName(page) {
  if (!/^\/(?:ja\/)?tracks\/[^/]+\/$/.test(page.pathname)) return null;
  return readText(page.html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'racecourse heading', page.relative);
}

function racecourseMetadata(page) {
  const name = racecourseName(page);
  if (!name) return null;
  if (page.lang === 'ja') {
    return {
      title: `${name} — 開催情報・公式ソース | 競馬どこ？`,
      description: `${name}の開催情報、所在地、主催団体、公式情報源を確認できます。`,
    };
  }
  return {
    title: `${name} — Racing Calendar & Official Source | Where Horses Run`,
    description: `Explore meetings, location, authority, and official racing sources for ${name}.`,
  };
}

function glossaryMetadata(page) {
  if (!/^\/(?:ja\/)?glossary\/[^/]+\/$/.test(page.pathname)) return null;
  const term = readText(page.html, /<h1[^>]*id="page-title"[^>]*>([\s\S]*?)<\/h1>/i, 'glossary heading', page.relative);
  if (page.lang === 'ja') {
    return {
      title: `${term} — 競馬用語集 | 競馬どこ？`,
      description: `${term}の意味と関連する競馬用語を確認できます。`,
    };
  }
  return {
    title: `${term} — Horse Racing Glossary | Where Horses Run`,
    description: `Learn what ${term} means and explore related horse racing terms.`,
  };
}

function defaultMetadata(page) {
  if (page.pathname === '/') return {
    title: 'Where Horses Run — Global Horse Racing Calendar & Racecourses',
    description: 'Find horse racing meetings, racecourses, racing types, and official sources around the world.',
  };
  if (page.pathname === '/ja/') return {
    title: '競馬どこ？ — 世界の競馬開催・競馬場を探す',
    description: '世界の競馬開催、競馬場、競馬種別、公式情報源を探せます。',
  };
  return null;
}

function desiredMetadata(page) {
  return meetingMetadata(page)
    ?? countryMetadata(page)
    ?? racecourseMetadata(page)
    ?? glossaryMetadata(page)
    ?? defaultMetadata(page);
}

function normalizePage(page, metadata) {
  let html = page.html;
  html = replaceTitle(html, metadata.title);
  html = replaceDescription(html, metadata.description);
  html = replaceOgTitle(html, metadata.title);
  html = replaceOgDescription(html, metadata.description);
  html = replaceTwitterTitle(html, metadata.title);
  html = replaceTwitterDescription(html, metadata.description);
  return html;
}

export default function titleDescriptionNormalizationIntegration() {
  return {
    name: PROJECT_NAME,
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const outputDirectory = dir.pathname;
        const files = await collectHtmlFiles(outputDirectory);
        let normalizedCount = 0;
        for (const file of files) {
          const page = await readPage(file, outputDirectory);
          const metadata = desiredMetadata(page);
          if (!metadata) continue;
          const normalized = normalizePage(page, metadata);
          if (normalized !== page.html) await fs.writeFile(file, normalized);
          normalizedCount += 1;
        }
        console.log(`[${PROJECT_NAME}] Normalized title/description metadata for ${normalizedCount} HTML pages.`);
      },
    },
  };
}
