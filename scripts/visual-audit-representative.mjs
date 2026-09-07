import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/representative-visual-audit';

const pages = [
  { id: 'home', path: '/', kind: 'home' },
  { id: 'today', path: '/?range=today', kind: 'home' },
  { id: 'calendar-list', path: '/calendar/?view=list', kind: 'calendar', view: 'list' },
  { id: 'calendar-month', path: '/calendar/?view=month', kind: 'calendar', view: 'month' },
  { id: 'calendar-map', path: '/calendar/?view=map', kind: 'calendar', view: 'map' },
  { id: 'countries', path: '/countries/', kind: 'countries' },
  { id: 'country-japan', path: '/countries/japan/', kind: 'country' },
  { id: 'racecourse-tokyo', path: '/tracks/tokyo-racecourse/', kind: 'racecourse' },
];

const viewports = [
  { id: 'desktop', width: 1440, height: 900, mobile: false },
  { id: 'mobile', width: 393, height: 852, mobile: true },
];

const expectedDesktopNav = ['Today', 'Calendar', 'Countries', 'Racecourses'];
const expectedMobileNav = ['Home', 'Today', 'Calendar', 'Countries', 'More'];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const manifest = {
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  viewports,
  pages: [],
  failures: [],
};

const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const waitForShell = async (page) => {
  await page.waitForFunction(() => {
    const header = document.querySelector('[data-mobile-navigation]');
    if (!header) return false;
    return header.getAttribute('data-mobile-navigation-links') === '5';
  }, null, { timeout: 7000 }).catch(() => {});
};

const inspectPage = async (page, spec, viewport) => {
  const result = await page.evaluate(({ expectedDesktopNav, expectedMobileNav, view, mobile }) => {
    const visible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && !element.hidden && rect.width > 0 && rect.height > 0;
    };

    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const failures = [];
    const checks = {};

    const overflow = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0,
    ) - window.innerWidth;
    checks.horizontal_overflow_px = overflow;
    if (overflow > 2) failures.push(`horizontal overflow ${overflow}px`);

    const brokenSameOriginImages = [...document.images]
      .filter((img) => {
        try { return new URL(img.currentSrc || img.src, location.href).origin === location.origin; }
        catch { return false; }
      })
      .filter((img) => !img.complete || img.naturalWidth < 1)
      .map((img) => img.getAttribute('src') || img.currentSrc || '(unknown)');
    checks.broken_same_origin_images = brokenSameOriginImages;
    if (brokenSameOriginImages.length) failures.push(`broken same-origin images: ${brokenSameOriginImages.join(', ')}`);

    const underlinedLinks = [...document.querySelectorAll('a[href]')]
      .filter(visible)
      .filter((anchor) => getComputedStyle(anchor).textDecorationLine.includes('underline'))
      .map((anchor) => normalize(anchor.textContent).slice(0, 80));
    checks.underlined_visible_links = underlinedLinks;
    if (underlinedLinks.length) failures.push(`visible link underlines remain: ${underlinedLinks.slice(0, 8).join(' | ')}`);

    const desktopNav = [...document.querySelectorAll('.desktop-primary-nav a')]
      .filter(visible)
      .map((anchor) => normalize(anchor.textContent));
    const mobileNav = [
      ...[...document.querySelectorAll('.mobile-bottom-nav > a')].map((anchor) => normalize(anchor.textContent)),
      ...[...document.querySelectorAll('.mobile-bottom-more > summary')].map((summary) => normalize(summary.textContent)),
    ];
    checks.desktop_primary_nav = desktopNav;
    checks.mobile_bottom_nav = mobileNav;

    if (mobile) {
      if (JSON.stringify(mobileNav) !== JSON.stringify(expectedMobileNav)) {
        failures.push(`mobile nav mismatch: ${JSON.stringify(mobileNav)}`);
      }
    } else if (JSON.stringify(desktopNav) !== JSON.stringify(expectedDesktopNav)) {
      failures.push(`desktop nav mismatch: ${JSON.stringify(desktopNav)}`);
    }

    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (mobile && bottomNav instanceof HTMLElement) {
      const navRect = bottomNav.getBoundingClientRect();
      checks.mobile_bottom_nav_top = Math.round(navRect.top);
      if (!visible(bottomNav)) failures.push('mobile bottom nav is not visible');
      if (navRect.bottom > window.innerHeight + 2) failures.push('mobile bottom nav extends below viewport');
    }

    if (view) {
      const controller = document.querySelector('[data-calendar-view-controller]');
      const currentView = controller instanceof HTMLElement ? controller.dataset.calendarView : null;
      checks.calendar_view = currentView;
      if (currentView !== view) failures.push(`calendar view expected ${view}, got ${currentView}`);

      const month = document.querySelector('[data-calendar-month-view]');
      const list = document.querySelector('[data-calendar-list-view]');
      const map = document.querySelector('[data-calendar-meeting-map], [data-calendar-view-map-panel], .calendar-meeting-map');
      checks.calendar_month_visible = visible(month);
      checks.calendar_list_visible = visible(list);
      checks.calendar_map_visible = visible(map);
      if (view === 'month' && !visible(month)) failures.push('month panel is not visible');
      if (view === 'list' && !visible(list)) failures.push('list panel is not visible');
    }

    return { checks, failures };
  }, { expectedDesktopNav, expectedMobileNav, view: spec.view || null, mobile: viewport.mobile });

  return result;
};

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();

    // External map tiles/media must not determine whether the UI audit passes.
    page.on('pageerror', (error) => console.warn(`[pageerror] ${error.message}`));

    for (const spec of pages) {
      const url = `${baseUrl}${spec.path}`;
      const entry = {
        id: spec.id,
        kind: spec.kind,
        viewport: viewport.id,
        width: viewport.width,
        height: viewport.height,
        path: spec.path,
        url,
        screenshot: `${viewport.id}-${spec.id}.png`,
        checks: {},
        failures: [],
      };

      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response || !response.ok()) {
          entry.failures.push(`navigation failed: ${response ? response.status() : 'no response'}`);
        }

        await waitForShell(page);
        await page.waitForTimeout(spec.kind === 'calendar' || spec.kind === 'home' ? 1600 : 800);

        const inspected = await inspectPage(page, spec, viewport);
        entry.checks = inspected.checks;
        entry.failures.push(...inspected.failures);

        await page.screenshot({
          path: path.join(outputDir, entry.screenshot),
          fullPage: false,
          animations: 'disabled',
        });
      } catch (error) {
        entry.failures.push(error instanceof Error ? error.message : String(error));
        try {
          await page.screenshot({
            path: path.join(outputDir, entry.screenshot),
            fullPage: false,
            animations: 'disabled',
          });
        } catch {}
      }

      if (entry.failures.length) {
        manifest.failures.push({ id: entry.id, viewport: viewport.id, failures: entry.failures });
      }
      manifest.pages.push(entry);
      console.log(`${entry.failures.length ? 'FAIL' : 'PASS'} ${viewport.id} ${spec.id}`);
      entry.failures.forEach((failure) => console.log(`  - ${failure}`));
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(outputDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(`Visual audit evidence: ${outputDir}`);
if (manifest.failures.length) {
  console.error(`${manifest.failures.length} representative page/viewport checks failed.`);
  process.exitCode = 1;
}
