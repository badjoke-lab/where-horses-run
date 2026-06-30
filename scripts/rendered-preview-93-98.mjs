import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = path.join(process.cwd(), 'artifacts/rendered-preview-93-98');
fs.mkdirSync(outputDir, { recursive: true });
const slugs = ['nicaragua','el-salvador','tanzania','singapore','macau','greece'];
const representatives = new Set(['nicaragua','singapore','greece']);
const archiveSlugs = new Set(['singapore','macau','greece']);
const viewports = [{ id: 'desktop', width: 1440, height: 1200 }, { id: 'pixel-7', width: 412, height: 915 }];
const errors = [];
const pages = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    for (const slug of slugs) {
      for (const locale of ['en','ja']) {
        const route = locale === 'ja' ? `/ja/countries/${slug}/` : `/countries/${slug}/`;
        const page = await context.newPage();
        const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
        const status = response?.status() ?? 0;
        const result = await page.evaluate(({ locale, archive }) => {
          const root = document.documentElement;
          const text = document.body.innerText;
          const forbidden = ['Start time','開始時刻','Timezone','タイムゾーン'];
          const externalLinks = [...document.querySelectorAll('a[href^="http"]')].filter((link) => !link.href.includes('whr.badjoke-lab.com')).length;
          const forbiddenHeaders = [...document.querySelectorAll('th')].map((node) => node.textContent?.trim() ?? '').filter((value) => forbidden.includes(value));
          const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
          const hreflang = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((node) => node.getAttribute('hreflang'));
          const languageSwitch = locale === 'ja' ? Boolean(document.querySelector('a[href^="/countries/"]')) : Boolean(document.querySelector('a[href^="/ja/countries/"]'));
          const emptyState = locale === 'ja' ? text.includes('これは、この国で開催がないことを意味しません。') : text.includes('This does not mean there is no racing in this country.');
          const archiveBoundary = !archive || text.includes('2024');
          return { lang: root.lang, h1: document.querySelectorAll('h1').length, overflow: root.scrollWidth - root.clientWidth, media: document.querySelectorAll('iframe, video').length, externalLinks, forbiddenHeaders, canonical, hreflang, languageSwitch, emptyState, archiveBoundary, fontFamily: getComputedStyle(document.body).fontFamily };
        }, { locale, archive: archiveSlugs.has(slug) });
        if (status !== 200) errors.push(`${viewport.id} ${locale} ${slug}: HTTP ${status}`);
        if (result.lang !== locale) errors.push(`${viewport.id} ${locale} ${slug}: html lang=${result.lang}`);
        if (result.h1 !== 1) errors.push(`${viewport.id} ${locale} ${slug}: h1=${result.h1}`);
        if (result.overflow > 1) errors.push(`${viewport.id} ${locale} ${slug}: overflow=${result.overflow}px`);
        if (result.media !== 0) errors.push(`${viewport.id} ${locale} ${slug}: embedded media present`);
        if (result.externalLinks < 1) errors.push(`${viewport.id} ${locale} ${slug}: official link missing`);
        if (result.forbiddenHeaders.length) errors.push(`${viewport.id} ${locale} ${slug}: forbidden C headers ${result.forbiddenHeaders.join(',')}`);
        if (!result.canonical) errors.push(`${viewport.id} ${locale} ${slug}: canonical missing`);
        if (!result.hreflang.includes('en') || !result.hreflang.includes('ja')) errors.push(`${viewport.id} ${locale} ${slug}: hreflang missing`);
        if (!result.languageSwitch) errors.push(`${viewport.id} ${locale} ${slug}: language switch missing`);
        if (!result.emptyState) errors.push(`${viewport.id} ${locale} ${slug}: empty-state safeguard missing`);
        if (!result.archiveBoundary) errors.push(`${viewport.id} ${locale} ${slug}: archive boundary missing`);
        if (!result.fontFamily) errors.push(`${viewport.id} ${locale} ${slug}: font missing`);
        if (representatives.has(slug)) await page.screenshot({ path: path.join(outputDir, `${slug}-${locale}-${viewport.id}.png`), fullPage: true });
        pages.push({ slug, locale, viewport: viewport.id, status, ...result });
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
const report = { checked_at: new Date().toISOString(), base_url: baseUrl, routes: 12, viewport_checks: pages.length, representative_screenshots: 12, viewports, representatives: [...representatives], errors, pages };
fs.writeFileSync(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) { errors.forEach((error) => console.error(`ERROR: ${error}`)); process.exit(1); }
console.log('RENDERED_PREVIEW_93_98_VALID routes=12 viewport_checks=24 screenshots=12 errors=0');
