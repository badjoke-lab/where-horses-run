import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const outputDir = process.env.VISUAL_AUDIT_OUTPUT || 'artifacts/representative-visual-audit';
const evidencePath = path.join(outputDir, 'calendar-all-stream-links.json');

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = { generated_at: new Date().toISOString(), base_url: baseUrl, pages: [], failures: [] };

const inspect = async (page, pathname, lang) => {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(750);

  const result = await page.evaluate(() => {
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    return [...document.querySelectorAll('[data-calendar-meeting-row]')]
      .filter((row) => row instanceof HTMLElement)
      .flatMap((row) => [...row.querySelectorAll('[data-stream-media]')]
        .filter((stream) => stream instanceof HTMLElement)
        .map((stream) => {
          const link = stream.querySelector('[data-live-link]');
          if (!(link instanceof HTMLAnchorElement)) return null;
          const style = getComputedStyle(link);
          return {
            meeting_id: row.dataset.meetingId || '',
            date: row.dataset.sourceDate || row.dataset.date || '',
            racecourse: row.dataset.racecourse || '',
            row_stream_state: row.dataset.streamState || 'unknown',
            stream_state: stream.dataset.streamState || 'known',
            detector_id: stream.dataset.streamDetectorId || '',
            text: normalize(link.textContent),
            href: link.href,
            default_href: link.dataset.liveDefaultHref || '',
            default_label: link.dataset.liveDefaultLabel || '',
            active_label: link.dataset.liveActiveLabel || '',
            background: style.backgroundColor,
            color: style.color,
          };
        })
        .filter(Boolean));
  });

  const failures = [];
  for (const item of result) {
    const live = item.stream_state === 'live';
    const transparent = item.background === 'rgba(0, 0, 0, 0)' || item.background === 'transparent';
    if (!live && !transparent) {
      failures.push(`${item.meeting_id}: non-live stream link has background ${item.background}`);
    }
    if (item.default_href && item.href !== item.default_href) {
      failures.push(`${item.meeting_id}: stream href diverged from reviewed landing URL`);
    }
    const expected = live ? item.active_label : item.default_label;
    if (expected && item.text !== expected) {
      failures.push(`${item.meeting_id}: stream label ${JSON.stringify(item.text)} expected ${JSON.stringify(expected)}`);
    }
  }

  const entry = { pathname, lang, checked_links: result.length, links: result, failures };
  evidence.pages.push(entry);
  evidence.failures.push(...failures.map((message) => `${pathname}: ${message}`));
};

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await inspect(page, '/calendar/?view=list', 'en');
  await inspect(page, '/ja/calendar/?view=list', 'ja');
  await context.close();
} finally {
  await browser.close();
}

await fs.writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(`Calendar all-stream-link evidence: ${evidencePath}`);
if (evidence.failures.length) {
  evidence.failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exitCode = 1;
} else {
  console.log('CALENDAR_ALL_STREAM_LINKS_VISUAL: pass');
}
