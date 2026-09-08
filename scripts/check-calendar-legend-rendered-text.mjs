import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/representative-visual-audit';
const reportPath = path.join(outputDir, 'calendar-legend-rendered-text.json');

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { generated_at: new Date().toISOString(), base_url: baseUrl, scenarios: [], failures: [] };

const inspectLegend = async (page, id) => {
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-racecourse-map]');
    return root instanceof HTMLElement && root.dataset.mapState === 'ready';
  }, null, { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(500);

  const snapshot = await page.evaluate(() => {
    const cleanContent = (value) => {
      const text = String(value || '').trim();
      if (!text || text === 'none' || text === 'normal' || text === '""' || text === "''") return '';
      return text;
    };
    const visible = (node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none';
    const items = [...document.querySelectorAll('[data-map-legend-state]')].filter(visible);
    return items.map((item) => {
      const en = item.querySelector('.racecourse-map__legend-label--en');
      const ja = item.querySelector('.racecourse-map__legend-label--ja');
      const label = document.documentElement.lang === 'ja' ? ja : en;
      const nodes = [item, ...item.querySelectorAll('*')].filter((node) => node instanceof HTMLElement);
      const generated = nodes.flatMap((node) => ['::before', '::after'].map((pseudo) => ({
        node: node.className || node.tagName,
        pseudo,
        content: cleanContent(getComputedStyle(node, pseudo).content),
      }))).filter((entry) => entry.content);
      return {
        state: item.dataset.mapLegendState || '',
        itemText: item.innerText.replace(/\s+/g, ' ').trim(),
        labelText: label?.textContent?.replace(/\s+/g, ' ').trim() || '',
        generated,
      };
    });
  });

  const failures = [];
  for (const item of snapshot) {
    if (item.itemText !== item.labelText) {
      failures.push(`${id} ${item.state}: legend item DOM text differs from canonical label (${item.itemText} vs ${item.labelText})`);
    }
    if (item.generated.length) {
      failures.push(`${id} ${item.state}: generated pseudo-content is forbidden: ${JSON.stringify(item.generated)}`);
    }
    const combined = `${item.itemText} ${item.generated.map((entry) => entry.content).join(' ')}`;
    if (/racing today/i.test(combined) || /開催前・本日開催/.test(combined)) {
      failures.push(`${id} ${item.state}: legacy combined state copy remains visible/generated`);
    }
  }
  report.scenarios.push({ id, snapshot, failures });
  if (failures.length) report.failures.push({ id, failures });
};

try {
  for (const lang of ['en', 'ja']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}${lang === 'ja' ? '/ja/?range=today' : '/?range=today'}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await inspectLegend(page, `today-${lang}`);
    await page.close();

    const calendar = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await calendar.goto(`${baseUrl}${lang === 'ja' ? '/ja/calendar/?view=map' : '/calendar/?view=map'}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await inspectLegend(calendar, `calendar-today-${lang}`);
    await calendar.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
if (report.failures.length) {
  report.failures.forEach((entry) => entry.failures.forEach((failure) => console.error(failure)));
  process.exitCode = 1;
} else {
  console.log('CALENDAR_LEGEND_RENDERED_TEXT: pass');
  console.log('GENERATED_LEGEND_COPY: prohibited');
}
