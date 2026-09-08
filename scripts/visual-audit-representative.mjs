import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/representative-visual-audit';

const pages = [
  { id: 'home', path: '/', kind: 'home' },
  { id: 'today', path: '/?range=today', kind: 'home' },
  { id: 'calendar-list', path: '/calendar/?view=list', kind: 'calendar', view: 'list' },
  { id: 'calendar-next-day', path: '/calendar/?view=list', kind: 'calendar', view: 'list', dateOffset: 1 },
  { id: 'calendar-month', path: '/calendar/?view=month', kind: 'calendar', view: 'month' },
  { id: 'calendar-map', path: '/calendar/?view=map', kind: 'calendar', view: 'map' },
  { id: 'calendar-ja', path: '/ja/calendar/?view=list', kind: 'calendar', view: 'list', lang: 'ja' },
  { id: 'racecourses', path: '/tracks/', kind: 'racecourse-directory' },
  { id: 'racecourses-ja', path: '/ja/tracks/', kind: 'racecourse-directory', lang: 'ja' },
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

const waitForShell = async (page) => {
  await page.waitForFunction(() => {
    const header = document.querySelector('[data-mobile-navigation]');
    if (!header) return false;
    return header.getAttribute('data-mobile-navigation-links') === '5';
  }, null, { timeout: 7000 }).catch(() => {});
};

const selectRelativeCalendarDate = async (page, offset) => {
  if (!Number.isInteger(offset) || offset === 0) return;
  await page.evaluate((delta) => {
    const select = document.querySelector('[data-filter-date]');
    if (!(select instanceof HTMLSelectElement) || select.options.length === 0) return;
    const nextIndex = Math.min(select.options.length - 1, Math.max(0, select.selectedIndex + delta));
    if (nextIndex === select.selectedIndex) return;
    select.selectedIndex = nextIndex;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, offset);
  await page.waitForTimeout(300);
};

const inspectPage = async (page, spec, viewport) => {
  const result = await page.evaluate(({ expectedDesktopNav, expectedMobileNav, view, mobile, lang, kind }) => {
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

    if (lang !== 'ja') {
      if (mobile) {
        if (JSON.stringify(mobileNav) !== JSON.stringify(expectedMobileNav)) {
          failures.push(`mobile nav mismatch: ${JSON.stringify(mobileNav)}`);
        }
      } else if (JSON.stringify(desktopNav) !== JSON.stringify(expectedDesktopNav)) {
        failures.push(`desktop nav mismatch: ${JSON.stringify(desktopNav)}`);
      }
    }

    const bottomNav = document.querySelector('.mobile-bottom-nav');
    let mobileContentBottom = window.innerHeight;
    if (mobile && bottomNav instanceof HTMLElement) {
      const navRect = bottomNav.getBoundingClientRect();
      mobileContentBottom = navRect.top;
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
      const mapPanel = document.querySelector('[data-calendar-map-panel]');
      checks.calendar_month_visible = visible(month);
      checks.calendar_list_visible = visible(list);
      checks.calendar_map_visible = visible(mapPanel);
      if (view === 'month' && !visible(month)) failures.push('month panel is not visible');
      if (view === 'list' && !visible(list)) failures.push('list panel is not visible');
      if (view === 'map' && !visible(mapPanel)) failures.push('map panel is not visible');

      const selectedDate = document.querySelector('[data-filter-date]');
      checks.calendar_selected_date = selectedDate instanceof HTMLSelectElement ? selectedDate.value : '';

      if (view === 'list') {
        const visibleRows = [...document.querySelectorAll('[data-calendar-meeting-row]')]
          .filter((row) => row instanceof HTMLElement && visible(row));
        checks.calendar_visible_meeting_rows = visibleRows.length;
        if (mobile && visibleRows.length > 0) {
          const rowInFirstViewport = visibleRows.some((row) => {
            const rect = row.getBoundingClientRect();
            return rect.bottom > 0 && rect.top < mobileContentBottom;
          });
          checks.calendar_row_in_first_mobile_viewport = rowInFirstViewport;
          if (!rowInFirstViewport) failures.push('calendar mobile List has meetings but no meeting row in the first viewport');
        }

        const coloredNonLiveLinks = visibleRows.flatMap((row) => {
          if (row.dataset.streamState === 'live') return [];
          const link = row.querySelector('[data-live-link]');
          if (!(link instanceof HTMLElement) || !visible(link)) return [];
          const background = getComputedStyle(link).backgroundColor;
          return background === 'rgba(0, 0, 0, 0)' || background === 'transparent'
            ? []
            : [`${normalize(row.dataset.racecourse)}:${row.dataset.streamState || 'unset'}:${background}`];
        });
        checks.calendar_colored_non_live_stream_links = coloredNonLiveLinks;
        if (coloredNonLiveLinks.length) failures.push(`non-live stream links have status color: ${coloredNonLiveLinks.join(' | ')}`);
      }
    }

    if (kind === 'racecourse-directory') {
      const query = document.querySelector('[data-racecourse-filter-query]');
      const resultRows = [...document.querySelectorAll('[data-racecourse-record]')].filter(visible);
      const toggle = document.querySelector('[data-racecourse-filter-toggle]');
      const filterFields = document.querySelector('[data-racecourse-filter-fields]');
      checks.racecourse_search_visible = visible(query);
      checks.racecourse_visible_results = resultRows.length;
      checks.racecourse_filter_toggle_visible = visible(toggle);
      checks.racecourse_filter_fields_visible = visible(filterFields);
      if (!visible(query)) failures.push('Racecourses search is not visible');
      if (resultRows.length === 0) failures.push('Racecourses has no visible result rows');
      if (mobile && resultRows.length > 0) {
        const first = resultRows[0].getBoundingClientRect();
        const inFirstViewport = first.bottom > 0 && first.top < mobileContentBottom;
        checks.racecourse_result_in_first_mobile_viewport = inFirstViewport;
        if (!inFirstViewport) failures.push('Racecourses mobile first viewport does not reach an actual result');
        if (!visible(toggle)) failures.push('Racecourses mobile filter toggle is not visible');
        if (visible(filterFields)) failures.push('Racecourses mobile filter fields must start collapsed');
      }
      if (!mobile && !visible(filterFields)) failures.push('Racecourses desktop filter fields are not visible');
    }

    return { checks, failures };
  }, {
    expectedDesktopNav,
    expectedMobileNav,
    view: spec.view || null,
    mobile: viewport.mobile,
    lang: spec.lang || 'en',
    kind: spec.kind,
  });

  return result;
};

const exerciseRacecourseDirectory = async (page, spec, viewport) => {
  const failures = [];
  const checks = {};
  const query = spec.lang === 'ja' ? '東京' : 'Tokyo';

  if (viewport.mobile) {
    await page.click('[data-racecourse-filter-toggle]');
    const filterOpened = await page.isVisible('[data-racecourse-filter-fields]');
    checks.mobile_filter_toggle_opens = filterOpened;
    if (!filterOpened) failures.push('mobile Racecourses filter toggle did not open filters');
  }

  await page.fill('[data-racecourse-filter-query]', query);
  await page.waitForTimeout(80);
  const queryState = await page.evaluate(() => ({
    visible: [...document.querySelectorAll('[data-racecourse-record]')].filter((record) => record instanceof HTMLElement && !record.hidden).length,
    q: new URLSearchParams(location.search).get('q'),
  }));
  checks.alias_query_visible_results = queryState.visible;
  checks.alias_query_url = queryState.q;
  if (queryState.visible < 1) failures.push(`Racecourses reviewed alias query ${query} returned no result`);
  if (queryState.q !== query) failures.push('Racecourses search query did not persist to URL state');

  await page.click('[data-racecourse-filter-reset]');
  await page.waitForTimeout(50);

  for (const [selector, parameter, label] of [
    ['[data-racecourse-filter-country]', 'country', 'country'],
    ['[data-racecourse-filter-authority]', 'authority', 'authority'],
    ['[data-racecourse-filter-racing-type]', 'racing_type', 'racing type'],
  ]) {
    const optionCount = await page.locator(`${selector} option`).count();
    if (optionCount <= 1) continue;
    const value = await page.locator(`${selector} option`).nth(1).getAttribute('value');
    if (!value) continue;
    await page.selectOption(selector, value);
    await page.waitForTimeout(50);
    const state = await page.evaluate((param) => ({
      visible: [...document.querySelectorAll('[data-racecourse-record]')].filter((record) => record instanceof HTMLElement && !record.hidden).length,
      value: new URLSearchParams(location.search).get(param),
    }), parameter);
    checks[`${label.replace(/\s+/g, '_')}_filter_visible_results`] = state.visible;
    if (state.visible < 1) failures.push(`Racecourses ${label} filter returned no result`);
    if (state.value !== value) failures.push(`Racecourses ${label} filter did not persist to URL state`);
    await page.click('[data-racecourse-filter-reset]');
    await page.waitForTimeout(50);
  }

  if (viewport.mobile) {
    await page.click('[data-racecourse-filter-toggle]');
    const filterClosed = !(await page.isVisible('[data-racecourse-filter-fields]'));
    checks.mobile_filter_toggle_closes = filterClosed;
    if (!filterClosed) failures.push('mobile Racecourses filter toggle did not close filters');
  }

  return { checks, failures };
};

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();

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
        await selectRelativeCalendarDate(page, spec.dateOffset || 0);

        const inspected = await inspectPage(page, spec, viewport);
        entry.checks = inspected.checks;
        entry.failures.push(...inspected.failures);

        if (spec.kind === 'racecourse-directory') {
          const exercised = await exerciseRacecourseDirectory(page, spec, viewport);
          entry.checks = { ...entry.checks, ...exercised.checks };
          entry.failures.push(...exercised.failures);
        }

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
