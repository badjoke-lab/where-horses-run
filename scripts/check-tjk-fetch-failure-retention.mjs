import assert from 'node:assert/strict';
import fs from 'node:fs';
import { discoverAnnualFixtures } from './timetable/tjk-annual-fixture-discovery.mjs';

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
  const parsed = new URL(url);
  const date = parsed.searchParams.get('QueryParameter_Tarih_Start');
  const [day, month, year] = date.split('/');
  const href = `/TR/YarisSever/Info/Page/GunlukYarisProgrami?QueryParameter_Tarih=${encodeURIComponent(date)}&SehirAdi=Ankara&SehirId=5`;
  return {
    ok: true,
    status: 200,
    text: async () => `<a href="${href}">Ankara</a>`,
  };
};
const fallback = await discoverAnnualFixtures({
  startDate: '2026-09-26',
  endDateExclusive: '2026-09-28',
  fetchImpl: fallbackFetch,
});
assert.equal(fallback.fixtures.length, 2, 'daily annual page fallback must preserve the requested date window');
assert.equal(fallback.schedule_source_id, 'tjk-annual-programme-page-fallback', 'fallback source id must be explicit');
assert.equal(fallback.pages[0]?.status, 'fetch_failed', 'primary annual Data failure must be recorded before fallback');
assert.equal(fallback.pages.filter((page) => page.status === 'fallback_page_ok').length, 2, 'fallback must fetch one bounded annual page per day');
assert.equal(fallback.fixtures[0].date, '2026-09-26');
assert.equal(fallback.fixtures[1].date, '2026-09-27');
assert.match(fallbackCalls[1], /\/Query\/Page\/YillikYarisProgramiCoklu/, 'fallback must use the official annual Page route');

console.log('TJK_FETCH_FAILURE_RETENTION: pass');
