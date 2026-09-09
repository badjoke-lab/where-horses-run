import fs from 'node:fs/promises';

const sitemapPath = process.argv[2] ?? 'dist/sitemap.xml';
const xml = await fs.readFile(sitemapPath, 'utf8');
const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)]
  .map((match) => ({ url: match[1], lastmod: match[2] ?? null }));

if (!entries.length) throw new Error(`No sitemap URL entries found in ${sitemapPath}`);
const dated = entries.filter((entry) => entry.lastmod);
if (!dated.length) throw new Error('Sitemap contains no lastmod values.');

const today = new Date().toISOString().slice(0, 10);
for (const entry of dated) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod)) {
    throw new Error(`Sitemap lastmod must be date-only ISO YYYY-MM-DD: ${entry.url} -> ${entry.lastmod}`);
  }
  const parsed = new Date(`${entry.lastmod}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== entry.lastmod) {
    throw new Error(`Sitemap lastmod is not a real date: ${entry.url} -> ${entry.lastmod}`);
  }
  if (entry.lastmod > today) throw new Error(`Sitemap lastmod is in the future: ${entry.url} -> ${entry.lastmod}`);
}

const datedValues = new Set(dated.map((entry) => entry.lastmod));
if (dated.length > 10 && datedValues.size === 1) {
  throw new Error(`All ${dated.length} dated sitemap URLs share ${[...datedValues][0]}; build-time blanket lastmod is not allowed.`);
}

const byUrl = new Map(entries.map((entry) => [entry.url, entry]));
for (const entry of dated) {
  const url = new URL(entry.url);
  if (!url.pathname.startsWith('/ja/')) continue;
  const counterpartUrl = `${url.origin}${url.pathname.slice(3)}`;
  const counterpart = byUrl.get(counterpartUrl);
  if (counterpart?.lastmod && counterpart.lastmod !== entry.lastmod) {
    throw new Error(`Bilingual entity lastmod mismatch: ${entry.url}=${entry.lastmod}, ${counterpartUrl}=${counterpart.lastmod}`);
  }
}

console.log(`Sitemap freshness check passed: ${entries.length} URLs, ${dated.length} source-backed lastmod values, ${datedValues.size} distinct dates.`);
