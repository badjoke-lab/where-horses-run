import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { discoverAnnualFixtures } from './timetable/tjk-annual-fixture-discovery.mjs';
import {
  TJK_STATIC_CALENDAR_URL,
  identifyTjkMonth,
  identifyTjkVenueCode,
} from './timetable/tjk-static-calendar-core.mjs';

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

const partialFallback = await discoverAnnualFixtures({
  startDate: '2026-09-26',
  endDateExclusive: '2026-09-28',
  fetchImpl: async (url) => {
    if (url.includes('/Query/Data/YillikYarisProgramiCoklu')) {
      const error = new Error('simulated broad annual timeout');
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
  const url=TJK_STATIC_CALENDAR_URL;
  const response=await fetch(url,{signal:AbortSignal.timeout(12_000),headers:{'user-agent':'WhereHorsesRun-source-verification/1.0'}});
  assert.equal(response.ok,true,`TJK static calendar must be reachable: HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  assert.equal(String.fromCharCode(...bytes.slice(0,4)),'%PDF');
  const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
  assert.equal(pdf.numPages,1);
  const page=await pdf.getPage(1);
  const text=await page.getTextContent();
  const months=new Set(['Ocak','Şubat','Subat','Mart','Nisan','Mayıs','Mayis','Haziran','Temmuz','Ağustos','Agustos','Eylül','Eylul','Ekim','Kasım','Kasim','Aralık','Aralik']);
  const codes=/^(ADA|ANK|ANT|BUR|DYB|ELZ|İST|IST|İZM|IZM|KOC|URF)$/;
  const monthItems=[];
  const codeItems=[];
  for(const item of text.items){
    if(!('str' in item)) continue;
    const value=String(item.str??'').trim();
    const point={v:value,x:Number(item.transform?.[4]??0),y:Number(item.transform?.[5]??0)};
    if(identifyTjkMonth(value)) monthItems.push({...point,month:identifyTjkMonth(value)});
    if(identifyTjkVenueCode(value)) codeItems.push({...point,code:identifyTjkVenueCode(value)});
  }
  monthItems.sort((a,b)=>b.y-a.y||a.x-b.x);
  codeItems.sort((a,b)=>b.y-a.y||a.x-b.x);
  console.log('TJK_STATIC_CALENDAR_LAYOUT:',JSON.stringify({
    url,
    months:monthItems,
    code_count:codeItems.length,
    code_sample:codeItems.slice(-80),
  }));
}

console.log('TJK_FETCH_FAILURE_RETENTION: pass');
