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

function extractCanonical(html, file) {
  const match = html.match(/<link\s+[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>|<link\s+[^>]*href="([^"]+)"[^>]*rel="canonical"[^>]*>/i);
  const value = match?.slice(1).find(Boolean);
  if (!value) throw new Error(`Missing canonical URL in rendered HTML: ${file}`);
  const url = new URL(value);
  if (url.origin !== SITE_ORIGIN) throw new Error(`Unexpected canonical origin in ${file}: ${url.origin}`);
  if (url.search || url.hash) throw new Error(`Canonical URL contains query or fragment in ${file}: ${value}`);
  return url;
}

function hasNoIndex(html) {
  return /<meta\s+[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"[^>]*>|<meta\s+[^>]*content="[^"]*noindex[^"]*"[^>]*name="robots"[^>]*>/i.test(html);
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function compareUrls(left, right) {
  const leftUrl = new URL(left);
  const rightUrl = new URL(right);
  if (leftUrl.pathname === '/') return rightUrl.pathname === '/' ? 0 : -1;
  if (rightUrl.pathname === '/') return 1;
  return leftUrl.pathname.localeCompare(rightUrl.pathname, 'en');
}

export default function sitemapRobotsIntegration() {
  return {
    name: 'where-horses-run-sitemap-robots',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const files = await walk(outputDirectory);
        const htmlFiles = files.filter((file) => file.endsWith('.html') && path.basename(file) !== '404.html');
        const canonicalUrls = new Set();
        let noIndexFiles = 0;

        for (const file of htmlFiles) {
          const html = await fs.readFile(file, 'utf8');
          if (hasNoIndex(html)) {
            noIndexFiles += 1;
            continue;
          }
          canonicalUrls.add(extractCanonical(html, path.relative(outputDirectory, file)).toString());
        }

        const urls = [...canonicalUrls].sort(compareUrls);
        if (!urls.length) throw new Error('Sitemap generation found no canonical public HTML URLs.');

        const sitemap = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
          '</urlset>',
          '',
        ].join('\n');
        const robots = [
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
          '',
        ].join('\n');

        await fs.writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap, 'utf8');
        await fs.writeFile(path.join(outputDirectory, 'robots.txt'), robots, 'utf8');

        logger.info(`Generated sitemap.xml with ${urls.length} canonical URLs.`);
        logger.info(`Excluded ${noIndexFiles} noindex HTML files and the rendered 404 page.`);
      },
    },
  };
}
