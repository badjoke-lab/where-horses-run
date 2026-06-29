import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4321';
const outputDir = path.join(process.cwd(), 'artifacts/rendered-preview-53-60');
fs.mkdirSync(outputDir, { recursive: true });

const slugs = ['cyprus', 'panama', 'kuwait', 'kenya', 'pakistan', 'ecuador', 'venezuela', 'belgium'];
const representatives = new Set(['cyprus', 'kuwait', 'venezuela', 'belgium']);
const viewports = [
  { id: 'desktop', width: 1440, height: 1200 },
  { id: 'pixel-7', width: 412, height: 915 },
];
const errors = [];
const pages = [];
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    for (const slug of slugs) {
      for (const locale of ['en', 'ja']) {
        const route = locale === 'ja' ? `/ja/countries/${slug}/` : `/countries/${slug}/`;
        const page = await context.newPage();
        const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
        const status = response?.status() ?? 0;
        if (status !== 200) errors.push(`${viewport.id} ${locale} ${slug}: HTTP ${status}`);
        const result = await page.evaluate(({ locale }) => {
          const root = document.documentElement;
          const h1 = document.querySelectorAll('h1').length;
          const text = document.body.innerText;
          const externalOfficialLinks = [...document.querySelectorAll('a[href^="http"]')].filter((link) => !link.href.includes('whr.badjoke-lab.com')).length;
          const forbiddenHeaders = [...document.querySelectorAll('th')].map((node) => node.textContent?.trim() ?? '').filter((value) => ['Start time', '開始時刻', 'Timezone', 'タイムゾーン'].includes(value));
          const fontFamily = getComputedStyle(document.body).fontFamily;
          return {
            h1,
            overflow: root.scrollWidth - root.clientWidth,
            embeddedMedia: document.querySelectorAll('iframe, video').length,
            externalOfficialLinks,
            forbiddenHeaders,
            fontFamily,
            hasLanguageSwitch: locale === 'ja' ? Boolean(document.querySelector('a[href^="/countries/"]')) : Boolean(document.querySelector('a[href^="/ja/countries/"]')),
            hasEmptyStateSafeguard: locale === 'ja' ? text.includes('これは、この国で開催がないことを意味しません。') : text.includes('This does not mean there is no racing in this country.'),
          };
        }, { locale });
        if (result.h1 !== 1) errors.push(`${viewport.id} ${locale} ${slug}: h1=${result.h1}`);
        if (result.overflow > 1) errors.push(`${viewport.id} ${locale} ${slug}: horizontal overflow=${result.overflow}px`);
        if (result.embeddedMedia !== 0) errors.push(`${viewport.id} ${locale} ${slug}: embedded media present`);
        if (result.externalOfficialLinks < 1) errors.push(`${viewport.id} ${locale} ${slug}: official external link missing`);
        if (result.forbiddenHeaders.length) errors.push(`${viewport.id} ${locale} ${slug}: forbidden C-level headers ${result.forbiddenHeaders.join(',')}`);
        if (!result.hasLanguageSwitch) errors.push(`${viewport.id} ${locale} ${slug}: language switch missing`);
        if (!result.hasEmptyStateSafeguard) errors.push(`${viewport.id} ${locale} ${slug}: empty-state safeguard missing`);
        if (!result.fontFamily) errors.push(`${viewport.id} ${locale} ${slug}: computed font family missing`);
        if (representatives.has(slug)) {
          await page.screenshot({ path: path.join(outputDir, `${slug}-${locale}-${viewport.id}.png`), fullPage: true });
        }
        pages.push({ slug, locale, viewport: viewport.id, status, ...result });
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const report = {
  checked_at: new Date().toISOString(),
  base_url: baseUrl,
  routes: 16,
  viewport_checks: pages.length,
  representative_screenshots: 16,
  viewports,
  representatives: [...representatives],
  errors,
  pages,
};
fs.writeFileSync(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('RENDERED_PREVIEW_53_60_VALID');
console.log('ROUTES: 8 EN + 8 JA');
console.log('VIEWPORT_CHECKS: 32');
console.log('SCREENSHOTS: 16');
