import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const publicUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const viewports = [320, 375, 720];
const port = 4173;

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function fileForRequest(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const candidate = clean === ''
    ? path.join(dist, 'index.html')
    : clean.endsWith('/')
      ? path.join(dist, clean, 'index.html')
      : path.join(dist, clean);
  const normalized = path.normalize(candidate);
  if (!normalized.startsWith(dist)) return null;
  if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) return normalized;
  const withIndex = path.join(normalized, 'index.html');
  return fs.existsSync(withIndex) ? withIndex : null;
}

const server = http.createServer((request, response) => {
  const file = fileForRequest(request.url ?? '/');
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentTypes.get(path.extname(file).toLowerCase()) ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

function chromeExecutable() {
  for (const name of ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser']) {
    const found = spawnSync('bash', ['-lc', `command -v ${name}`], { encoding: 'utf8' });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  }
  throw new Error('No Chrome or Chromium executable found on the runner');
}

class CdpPipe {
  constructor(executable) {
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = [];
    this.buffer = '';
    this.child = spawn(executable, [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--remote-debugging-pipe',
      '--user-data-dir=/tmp/whr-v1-mobile-qa-chrome',
      'about:blank',
    ], { stdio: ['ignore', 'ignore', 'inherit', 'pipe', 'pipe'] });
    this.writer = this.child.stdio[3];
    this.reader = this.child.stdio[4];
    this.reader.setEncoding('utf8');
    this.reader.on('data', (chunk) => this.consume(chunk));
    this.child.on('exit', (code, signal) => {
      const error = new Error(`Chrome exited unexpectedly: code=${code} signal=${signal}`);
      for (const { reject } of this.pending.values()) reject(error);
      this.pending.clear();
    });
  }

  consume(chunk) {
    this.buffer += chunk;
    while (this.buffer.includes('\0')) {
      const index = this.buffer.indexOf('\0');
      const raw = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + 1);
      if (!raw) continue;
      const message = JSON.parse(raw);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) continue;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result ?? {});
        continue;
      }
      this.eventWaiters = this.eventWaiters.filter((waiter) => {
        if (waiter.method !== message.method || (waiter.sessionId && waiter.sessionId !== message.sessionId)) return true;
        clearTimeout(waiter.timer);
        waiter.resolve(message.params ?? {});
        return false;
      });
    }
  }

  send(method, params = {}, sessionId = undefined, timeoutMs = 15000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method}: timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, method });
      this.writer.write(`${JSON.stringify(payload)}\0`);
    });
  }

  waitEvent(method, sessionId, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const waiter = { method, sessionId, resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        this.eventWaiters = this.eventWaiters.filter((item) => item !== waiter);
        reject(new Error(`${method}: event timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.eventWaiters.push(waiter);
    });
  }

  async close() {
    try { await this.send('Browser.close', {}, undefined, 3000); } catch {}
    if (!this.child.killed) this.child.kill('SIGKILL');
  }
}

const browser = new CdpPipe(chromeExecutable());
const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
await browser.send('Page.enable', {}, sessionId);
await browser.send('Runtime.enable', {}, sessionId);
await browser.send('Network.enable', {}, sessionId);
await browser.send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);

const evaluation = String.raw`(() => {
  const root = document.documentElement;
  const body = document.body;
  const viewportWidth = root.clientWidth;
  const scrollWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  };
  const describe = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || '',
      className: typeof element.className === 'string' ? element.className.slice(0, 160) : '',
      text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      left: Math.round(rect.left * 10) / 10,
      right: Math.round(rect.right * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      overflowX: getComputedStyle(element).overflowX,
      whiteSpace: getComputedStyle(element).whiteSpace,
    };
  };
  const elements = [...document.body.querySelectorAll('*')].filter(visible);
  const viewportOffenders = elements
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > viewportWidth + 1 || rect.left < -1;
    })
    .map(describe)
    .sort((left, right) => right.right - left.right)
    .slice(0, 20);
  const uncontainedScroll = elements
    .filter((element) => {
      const style = getComputedStyle(element);
      return element.scrollWidth > element.clientWidth + 1 && style.overflowX === 'visible' && style.whiteSpace !== 'normal';
    })
    .map(describe)
    .slice(0, 20);
  const targetSelector = 'nav a, summary, button, input:not([type="hidden"]), select, textarea, [role="button"], a.card-link, a.button';
  const targets = [...document.querySelectorAll(targetSelector)].filter(visible);
  const smallTargets = targets
    .map(describe)
    .filter((item) => item.width < 44 || item.height < 44)
    .slice(0, 30);
  const images = [...document.images].filter(visible);
  const oversizedImages = images.map(describe).filter((item) => item.right > viewportWidth + 1 || item.width > viewportWidth + 1);
  const tables = [...document.querySelectorAll('table')].filter(visible);
  const overflowingTables = tables.map(describe).filter((item) => item.right > viewportWidth + 1);
  const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
  return {
    title: document.title,
    lang: root.lang,
    viewportWidth,
    scrollWidth,
    horizontalOverflowPx: Math.max(0, scrollWidth - viewportWidth),
    viewportMeta,
    viewportOffenders,
    uncontainedScroll,
    interactiveTargets: targets.length,
    smallTargets,
    images: images.length,
    oversizedImages,
    tables: tables.length,
    overflowingTables,
    preElements: document.querySelectorAll('pre').length,
    codeElements: document.querySelectorAll('code').length,
    forms: document.querySelectorAll('form').length,
  };
})()`;

const results = [];
const failures = [];
try {
  for (const width of viewports) {
    await browser.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: width,
      screenHeight: 900,
      positionX: 0,
      positionY: 0,
      dontSetVisibleSize: false,
    }, sessionId);
    for (const [index, publicUrl] of publicUrls.entries()) {
      const pathname = new URL(publicUrl).pathname;
      const localUrl = `http://127.0.0.1:${port}${pathname}`;
      try {
        const loaded = browser.waitEvent('Page.loadEventFired', sessionId, 20000);
        await browser.send('Page.navigate', { url: localUrl }, sessionId, 20000);
        await loaded;
        const evaluated = await browser.send('Runtime.evaluate', {
          expression: evaluation,
          returnByValue: true,
          awaitPromise: true,
        }, sessionId, 20000);
        results.push({ publicUrl, pathname, width, ...evaluated.result.value });
      } catch (error) {
        failures.push({ publicUrl, pathname, width, error: error.message });
      }
      if ((index + 1) % 100 === 0) console.error(`viewport ${width}: ${index + 1}/${publicUrls.length}`);
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const overflowResults = results.filter((item) => item.horizontalOverflowPx > 1);
const smallTargetResults = results.filter((item) => item.smallTargets.length > 0);
const viewportMetaErrors = results.filter((item) => !/width=device-width/i.test(item.viewportMeta));
const oversizedImageResults = results.filter((item) => item.oversizedImages.length > 0);
const overflowingTableResults = results.filter((item) => item.overflowingTables.length > 0);
const uncontainedScrollResults = results.filter((item) => item.uncontainedScroll.length > 0);

const report = {
  schemaVersion: 'v1-mobile-qa-discovery-v1',
  generatedAt: new Date().toISOString(),
  browserExecutable: chromeExecutable(),
  publicPages: publicUrls.length,
  viewports,
  pageViewportChecks: results.length,
  failedPageLoads: failures.length,
  horizontalOverflowChecks: overflowResults.length,
  pagesWithSmallTargets: smallTargetResults.length,
  smallTargetInstances: smallTargetResults.reduce((sum, item) => sum + item.smallTargets.length, 0),
  viewportMetaErrors: viewportMetaErrors.length,
  oversizedImageChecks: oversizedImageResults.length,
  overflowingTableChecks: overflowingTableResults.length,
  uncontainedScrollChecks: uncontainedScrollResults.length,
  pagesContainingTables: new Set(results.filter((item) => item.tables > 0).map((item) => item.publicUrl)).size,
  pagesContainingPre: new Set(results.filter((item) => item.preElements > 0).map((item) => item.publicUrl)).size,
  pagesContainingCode: new Set(results.filter((item) => item.codeElements > 0).map((item) => item.publicUrl)).size,
  pagesContainingForms: new Set(results.filter((item) => item.forms > 0).map((item) => item.publicUrl)).size,
  failures,
  horizontalOverflow: overflowResults.slice(0, 100),
  smallTargets: smallTargetResults.slice(0, 100),
  viewportMetaErrorsDetail: viewportMetaErrors.slice(0, 100),
  oversizedImages: oversizedImageResults.slice(0, 100),
  overflowingTables: overflowingTableResults.slice(0, 100),
  uncontainedScroll: uncontainedScrollResults.slice(0, 100),
};

fs.writeFileSync('v1-mobile-qa-discovery.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  schemaVersion: report.schemaVersion,
  publicPages: report.publicPages,
  viewports: report.viewports,
  pageViewportChecks: report.pageViewportChecks,
  failedPageLoads: report.failedPageLoads,
  horizontalOverflowChecks: report.horizontalOverflowChecks,
  pagesWithSmallTargets: report.pagesWithSmallTargets,
  smallTargetInstances: report.smallTargetInstances,
  viewportMetaErrors: report.viewportMetaErrors,
  oversizedImageChecks: report.oversizedImageChecks,
  overflowingTableChecks: report.overflowingTableChecks,
  uncontainedScrollChecks: report.uncontainedScrollChecks,
  pagesContainingTables: report.pagesContainingTables,
  pagesContainingPre: report.pagesContainingPre,
  pagesContainingCode: report.pagesContainingCode,
  pagesContainingForms: report.pagesContainingForms,
}, null, 2));
