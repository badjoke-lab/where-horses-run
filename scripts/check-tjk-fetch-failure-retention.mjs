import assert from 'node:assert/strict';
import fs from 'node:fs';
import { discoverAnnualFixtures, extractAnnualFixtures, SIMPLE_ANNUAL_PAGE_URL } from './timetable/tjk-annual-fixture-discovery.mjs';

const source = fs.readFileSync('scripts/timetable/run-tjk-current-best-available.mjs', 'utf8');
assert.match(source, /try \{\s*annual = await retry\(\(\) => discoverAnnualFixtures/, 'annual discovery must be guarded and retried');
assert.match(source, /attempts: 3/, 'annual discovery must retry transient failures');
assert.match(source, /\['10', \{ racecourse_id: 'antalya-racecourse'/, 'all official domestic TJK venue ids must be mapped, including Antalya');
assert.match(source, /status: 'network_error'/, 'annual fetch failure must use acquisition metadata network_error');
assert.match(source, /fixtures: \[\]/, 'failed discovery must emit no replacement observations');
assert.match(source, /error_code: error\?\.name === 'TimeoutError' \? 'timeout' : 'fetch_error'/, 'timeout must be explicit');
assert.doesNotMatch(source, /process\.exit\(1\)/, 'TJK source failure must not terminate the unified refresh');
const fallbackCalls = [];
const fallbackFetch = async (url) => {
  fallbackCalls.push(url);
  if (url.includes('/Query/Data/YillikYarisProgramiCoklu')) {
    const error = new Error('simulated broad annual timeout');
    error.name = 'TimeoutError';
    throw error;
  }
  if (url.includes('/Query/Page/YillikYarisProgrami?')) {
    const href26 = '/TR/YarisSever/Info/Page/GunlukYarisProgrami?QueryParameter_Tarih=26%2F09%2F2026&SehirAdi=Ankara&SehirId=5';
    const href27 = '/TR/YarisSever/Info/Page/GunlukYarisProgrami?QueryParameter_Tarih=27%2F09%2F2026&SehirAdi=%C4%B0stanbul&SehirId=3';
    return { ok:true,status:200,text:async()=>`<a href="${href26}">Ankara</a><a href="${href27}">İstanbul</a>` };
  }
  throw new Error('daily fallback should not be reached when simple annual page succeeds');
};
const fallback = await discoverAnnualFixtures({
  startDate: '2026-09-26',
  endDateExclusive: '2026-09-28',
  fetchImpl: fallbackFetch,
});
assert.equal(fallback.fixtures.length, 2, 'simple annual page fallback must preserve the requested date window');
assert.equal(fallback.schedule_source_id, 'tjk-annual-programme-simple-page-fallback');
assert.equal(fallback.pages[0]?.status, 'fetch_failed');
assert.equal(fallback.pages.filter((page) => page.status === 'simple_page_ok').length, 1);
assert.equal(fallback.fixtures[0].date, '2026-09-26');
assert.equal(fallback.fixtures[1].date, '2026-09-27');
assert.match(fallbackCalls[1], /\/Query\/Page\/YillikYarisProgrami\?/, 'first fallback must use the simple official annual Page route');

const partialFallback = await discoverAnnualFixtures({
  startDate: '2026-09-26',
  endDateExclusive: '2026-09-28',
  fetchImpl: async (url) => {
    if (url.includes('/Query/Data/YillikYarisProgramiCoklu')) {
      const error = new Error('simulated broad annual timeout');
      error.name = 'TimeoutError';
      throw error;
    }
    if (url.includes('/Query/Page/YillikYarisProgrami?')) {
      const error = new Error('simulated simple page timeout');
      error.name = 'TimeoutError';
      throw error;
    }
    const parsed = new URL(url);
    const date = parsed.searchParams.get('QueryParameter_Tarih_Start');
    if (date === '26/09/2026') {
      const error = new Error('simulated daily fallback timeout');
      error.name = 'TimeoutError';
      throw error;
    }
    const href = `/TR/YarisSever/Info/Page/GunlukYarisProgrami?QueryParameter_Tarih=${encodeURIComponent(date)}&SehirAdi=Ankara&SehirId=5`;
    return { ok: true, status: 200, text: async () => `<a href="${href}">Ankara</a>` };
  },
});
assert.equal(partialFallback.fixtures.length, 1, 'one failed fallback day must not discard other recovered dates');
assert.equal(partialFallback.fixtures[0].date, '2026-09-27');
assert.equal(partialFallback.pages.filter((page) => page.status === 'fallback_page_failed').length, 1);
assert.equal(partialFallback.pages.filter((page) => page.status === 'fallback_page_ok').length, 1);

let activeFallbacks = 0;
let maxActiveFallbacks = 0;
const concurrentFallback = await discoverAnnualFixtures({
  startDate: '2026-09-26',
  endDateExclusive: '2026-10-04',
  fetchImpl: async (url) => {
    if (url.includes('/Query/Data/YillikYarisProgramiCoklu')) {
      const error = new Error('simulated broad annual timeout');
      error.name = 'TimeoutError';
      throw error;
    }
    if (url.includes('/Query/Page/YillikYarisProgrami?')) {
      const error = new Error('simulated simple page timeout');
      error.name = 'TimeoutError';
      throw error;
    }
    activeFallbacks += 1;
    maxActiveFallbacks = Math.max(maxActiveFallbacks, activeFallbacks);
    await new Promise((resolve) => setTimeout(resolve, 15));
    activeFallbacks -= 1;
    const parsed = new URL(url);
    const date = parsed.searchParams.get('QueryParameter_Tarih_Start');
    const href = `/TR/YarisSever/Info/Page/GunlukYarisProgrami?QueryParameter_Tarih=${encodeURIComponent(date)}&SehirAdi=Ankara&SehirId=5`;
    return { ok: true, status: 200, text: async () => `<a href="${href}">Ankara</a>` };
  },
});
assert.equal(concurrentFallback.fixtures.length, 8);
assert.equal(maxActiveFallbacks, 4, 'TJK daily fallback must use bounded concurrency instead of 30 serial timeout windows');
assert.ok(maxActiveFallbacks <= 4, 'TJK fallback concurrency must remain bounded');

if (process.env.GITHUB_ACTIONS === 'true') {
  const response = await fetch(SIMPLE_ANNUAL_PAGE_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
    signal: AbortSignal.timeout(12_000),
  });
  assert.equal(response.ok, true, `live simple TJK annual page must be reachable from GitHub Actions: HTTP ${response.status}`);
  const html = await response.text();
  const liveFixtures = extractAnnualFixtures(html, {
    startDate: '2026-09-27',
    endDateExclusive: '2026-10-27',
  });
  assert.ok(liveFixtures.length > 0, 'live simple TJK annual page must expose current-window domestic fixtures');
  console.log('TJK_SIMPLE_ANNUAL_LIVE:', JSON.stringify({
    url: SIMPLE_ANNUAL_PAGE_URL,
    fixtures: liveFixtures.length,
    first: liveFixtures[0]?.date ?? null,
    last: liveFixtures.at(-1)?.date ?? null,
  }));
}

console.log('TJK_FETCH_FAILURE_RETENTION: pass');
