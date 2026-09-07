#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const BASE_URL = String(process.env.WHR_SCREENSHOT_BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUTPUT_ROOT = path.join(ROOT, 'artifacts', 'representative-visual-audit');
const DEVICES = {
  desktop: {
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
  },
  mobile: {
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  },
};

const routeFile = (route) => {
  const pathname = route.split('?')[0];
  if (pathname === '/') return path.join(ROOT, 'dist', 'index.html');
  return path.join(ROOT, 'dist', pathname.replace(/^\/+|\/+$/g, ''), 'index.html');
};

const routeExists = async (route) => {
  try {
    await fs.access(routeFile(route));
    return true;
  } catch {
    return false;
  }
};

const firstRacecourseRoute = async (localePrefix = '') => {
  const root = path.join(ROOT, 'dist', ...(localePrefix ? [localePrefix] : []), 'tracks');
  const preferred = ['tokyo-racecourse', 'tokyo'];
  for (const slug of preferred) {
    try {
      await fs.access(path.join(root, slug, 'index.html'));
      return `/${localePrefix ? `${localePrefix}/` : ''}tracks/${slug}/`;
    } catch {
      // Fall through to discovered static route.
    }
  }

  let entries = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return null;
  }
  const slugs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  for (const slug of slugs) {
    try {
      await fs.access(path.join(root, slug, 'index.html'));
      return `/${localePrefix ? `${localePrefix}/` : ''}tracks/${slug}/`;
    } catch {
      // Continue.
    }
  }
  return null;
};

const safeKey = (value) => value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();

const visiblePageMetrics = async (page) => page.evaluate(() => {
  const visible = (element) => {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };

  const root = document.documentElement;
  const sameOriginBrokenImages = [...document.images]
    .filter((image) => image.complete && image.naturalWidth === 0)
    .map((image) => image.getAttribute('src') || '')
    .filter((src) => {
      try {
        return src && new URL(src, location.href).origin === location.origin;
      } catch {
        return true;
      }
    });

  const underlinedLinks = [...document.querySelectorAll('a[href]')]
    .filter(visible)
    .filter((anchor) => getComputedStyle(anchor).textDecorationLine.includes('underline'))
    .map((anchor) => ({
      href: anchor.getAttribute('href'),
      text: (anchor.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
    }))
    .slice(0, 50);

  const mobileBottom = document.querySelector('.mobile-bottom-nav');
  const desktopNav = document.querySelector('.desktop-primary-nav');
  const siteBrand = document.querySelector('.site-brand');
  const calendarController = document.querySelector('[data-calendar-view-controller]');
  const racecourseMap = document.querySelector('[data-racecourse-location-section] [data-racecourse-map]');
  const directions = document.querySelector('[data-racecourse-location-section] .racecourse-location-section__directions');

  return {
    title: document.title,
    h1Count: document.querySelectorAll('h1').length,
    mainCount: document.querySelectorAll('main').length,
    horizontalOverflowPx: Math.max(0, root.scrollWidth - root.clientWidth),
    sameOriginBrokenImages,
    underlinedLinks,
    siteBrandBackgroundImage: siteBrand instanceof HTMLElement ? getComputedStyle(siteBrand).backgroundImage : null,
    mobileBottomVisible: visible(mobileBottom),
    mobileBottomDirectLinks: mobileBottom ? mobileBottom.querySelectorAll(':scope > a').length : 0,
    mobileMorePresent: Boolean(mobileBottom?.querySelector('.mobile-bottom-more')),
    desktopPrimaryVisible: visible(desktopNav),
    desktopPrimaryLinks: desktopNav ? desktopNav.querySelectorAll('a[href]').length : 0,
    calendarView: calendarController instanceof HTMLElement ? calendarController.dataset.calendarView || null : null,
    racecourseMapState: racecourseMap instanceof HTMLElement ? racecourseMap.dataset.mapState || null : null,
    directionsPresent: directions instanceof HTMLAnchorElement,
  };
});

const main = async () => {
  const racecourseRoute = await firstRacecourseRoute('');
  const jaRacecourseRoute = await firstRacecourseRoute('ja');
  if (!racecourseRoute) throw new Error('No built racecourse detail route was found');

  const routes = [
    { key: 'home', route: '/', required: true },
    { key: 'today', route: '/?range=today', required: true },
    { key: 'calendar-list', route: '/calendar/?view=list', required: true, expectedCalendarView: 'list' },
    { key: 'calendar-month', route: '/calendar/?view=month', required: true, expectedCalendarView: 'month' },
    { key: 'calendar-map', route: '/calendar/?view=map', required: true, expectedCalendarView: 'map', mapHeavy: true },
    { key: 'countries', route: '/countries/', required: true },
    { key: 'country-japan', route: '/countries/japan/', required: true },
    { key: 'racecourse-detail', route: racecourseRoute, required: true, mapHeavy: true, racecourseDetail: true },
    { key: 'ja-home', route: '/ja/', required: true },
    { key: 'ja-calendar-map', route: '/ja/calendar/?view=map', required: true, expectedCalendarView: 'map', mapHeavy: true },
    ...(jaRacecourseRoute ? [{ key: 'ja-racecourse-detail', route: jaRacecourseRoute, required: false, mapHeavy: true, racecourseDetail: true }] : []),
  ];

  for (const entry of routes) {
    if (entry.route.includes('?')) continue;
    const exists = await routeExists(entry.route);
    if (!exists && entry.required) throw new Error(`Required representative route is not present in dist: ${entry.route}`);
  }

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
  const records = [];
  const failures = [];

  try {
    for (const [deviceName, device] of Object.entries(DEVICES)) {
      const context = await browser.newContext({
        viewport: device.viewport,
        deviceScaleFactor: 1,
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
        reducedMotion: 'reduce',
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const viewportDir = path.join(OUTPUT_ROOT, deviceName, 'viewport');
      const fullDir = path.join(OUTPUT_ROOT, deviceName, 'full');
      await fs.mkdir(viewportDir, { recursive: true });
      await fs.mkdir(fullDir, { recursive: true });

      for (const entry of routes) {
        const url = `${BASE_URL}${entry.route}`;
        const key = safeKey(entry.key);
        try {
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
          if (!response || !response.ok()) throw new Error(`HTTP ${response?.status() ?? 'no response'}`);
          await page.evaluate(() => document.fonts?.ready);
          await page.waitForTimeout(entry.mapHeavy ? 2500 : 500);

          const metrics = await visiblePageMetrics(page);
          if (metrics.h1Count !== 1) throw new Error(`expected exactly one h1, got ${metrics.h1Count}`);
          if (metrics.mainCount !== 1) throw new Error(`expected exactly one main, got ${metrics.mainCount}`);
          if (metrics.horizontalOverflowPx > 2) throw new Error(`horizontal overflow ${metrics.horizontalOverflowPx}px`);
          if (metrics.sameOriginBrokenImages.length) throw new Error(`broken same-origin images: ${metrics.sameOriginBrokenImages.join(', ')}`);
          if (metrics.underlinedLinks.length) throw new Error(`visible underlined links remain: ${JSON.stringify(metrics.underlinedLinks.slice(0, 5))}`);
          if (!metrics.siteBrandBackgroundImage || metrics.siteBrandBackgroundImage === 'none') throw new Error('site brand mark background is missing');
          if (deviceName === 'mobile') {
            if (!metrics.mobileBottomVisible) throw new Error('mobile bottom navigation is not visible');
            if (metrics.mobileBottomDirectLinks !== 4 || !metrics.mobileMorePresent) {
              throw new Error(`mobile navigation contract mismatch: links=${metrics.mobileBottomDirectLinks}, more=${metrics.mobileMorePresent}`);
            }
          } else if (!metrics.desktopPrimaryVisible || metrics.desktopPrimaryLinks !== 4) {
            throw new Error(`desktop primary navigation contract mismatch: visible=${metrics.desktopPrimaryVisible}, links=${metrics.desktopPrimaryLinks}`);
          }
          if (entry.expectedCalendarView && metrics.calendarView !== entry.expectedCalendarView) {
            throw new Error(`calendar view mismatch: expected ${entry.expectedCalendarView}, got ${metrics.calendarView}`);
          }
          if (entry.racecourseDetail && !metrics.directionsPresent) throw new Error('racecourse detail Directions action is missing');
          if (entry.racecourseDetail && metrics.racecourseMapState === 'failed') throw new Error('racecourse detail map failed to initialize');

          const viewportFile = path.join(viewportDir, `${key}.png`);
          const fullFile = path.join(fullDir, `${key}.png`);
          await page.screenshot({ path: viewportFile, fullPage: false });
          await page.screenshot({ path: fullFile, fullPage: true });

          records.push({ device: deviceName, key: entry.key, route: entry.route, url, metrics });
          console.log(`[visual:${deviceName}] captured ${entry.key} ${entry.route}`);
        } catch (error) {
          failures.push({ device: deviceName, key: entry.key, route: entry.route, url, error: error.message });
          console.error(`[visual:${deviceName}] failed ${entry.key}: ${error.message}`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const manifest = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    devices: DEVICES,
    expected_capture_count: routes.length * Object.keys(DEVICES).length,
    captured_count: records.length,
    failed_count: failures.length,
    routes: routes.map(({ key, route, required }) => ({ key, route, required })),
    records,
    failures,
  };
  await fs.writeFile(path.join(OUTPUT_ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const rows = routes.map((entry) => {
    const key = safeKey(entry.key);
    return `<section><h2>${entry.key}</h2><p><code>${entry.route}</code></p><div class="grid"><figure><figcaption>Desktop viewport</figcaption><img src="desktop/viewport/${key}.png" loading="lazy"></figure><figure><figcaption>Mobile viewport</figcaption><img src="mobile/viewport/${key}.png" loading="lazy"></figure><figure><figcaption>Desktop full page</figcaption><img src="desktop/full/${key}.png" loading="lazy"></figure><figure><figcaption>Mobile full page</figcaption><img src="mobile/full/${key}.png" loading="lazy"></figure></div></section>`;
  }).join('\n');
  const indexHtml = `<!doctype html><meta charset="utf-8"><title>Where Horses Run representative visual audit</title><style>body{font-family:system-ui;margin:24px;color:#142033}section{border-top:1px solid #d6dce3;padding:24px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}figure{margin:0}figcaption{font-weight:700;margin-bottom:8px}img{display:block;max-width:100%;height:auto;border:1px solid #d6dce3;background:#fff}@media(max-width:800px){.grid{grid-template-columns:1fr}}</style><h1>Where Horses Run representative visual audit</h1><p>Desktop 1440×900 and mobile 393×852. Viewport and full-page captures.</p>${rows}`;
  await fs.writeFile(path.join(OUTPUT_ROOT, 'index.html'), indexHtml);

  console.log(JSON.stringify({ captured: records.length, failed: failures.length, output: path.relative(ROOT, OUTPUT_ROOT) }));
  if (failures.length) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
