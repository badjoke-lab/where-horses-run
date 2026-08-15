import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ENTRY_URL,
  collectCandidateBatch,
  discoverFromIndexHtml,
} from '../../scripts/timetable/tjk-current-future-candidates.mjs';
import { validateArtifact } from '../../scripts/check-tjk-current-future-candidates.mjs';

const NOW = new Date('2026-08-14T09:00:00Z');
const TODAY = '2026-08-14';
const FUTURE_PAGE = 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami?Era=tomorrow&QueryParameter_Tarih=15%2F08%2F2026';

const entryHtml = `
<a href="/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?Era=today&amp;QueryParameter_Tarih=14%2F08%2F2026&amp;SehirAdi=Ankara&amp;SehirId=5">Ankara (50. Y.G.)</a>
<a href="/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?Era=today&amp;QueryParameter_Tarih=14%2F08%2F2026&amp;SehirAdi=Delaware%20Park&amp;SehirId=90">Delaware Park ABD (YD 4)</a>
<a href="/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?Era=yesterday&amp;QueryParameter_Tarih=13%2F08%2F2026&amp;SehirAdi=Kocaeli&amp;SehirId=9">Kocaeli (25. Y.G.)</a>
<a href="/TR/Kurumsal/Info/Sehir/GunlukYarisProgrami?Era=today&amp;QueryParameter_Tarih=14%2F08%2F2026&amp;SehirAdi=Ankara&amp;SehirId=5">Wrong section</a>
<a href="https://evil.example/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?QueryParameter_Tarih=14%2F08%2F2026&amp;SehirAdi=Ankara&amp;SehirId=5">Ankara clone</a>
<a href="${FUTURE_PAGE.replaceAll('&', '&amp;')}">15.08.2026</a>
<a href="https://www.tjk.org/TR/Kurumsal/Info/Page/GunlukYarisProgrami?QueryParameter_Tarih=16%2F08%2F2026">Wrong future section</a>`;

const futureHtml = `
<a href="/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?Era=tomorrow&amp;QueryParameter_Tarih=15%2F08%2F2026&amp;SehirAdi=%C4%B0stanbul&amp;SehirId=3">İstanbul (50. Y.G.)</a>`;

function fakeFetch(url) {
  const body = url === ENTRY_URL ? entryHtml : url === FUTURE_PAGE ? futureHtml : null;
  assert.notEqual(body, null, `unexpected fetch ${url}`);
  return Promise.resolve({ ok: true, status: 200, text: async () => body });
}

test('discovers only non-past domestic page-discovered TJK YarisSever venue details', () => {
  const discovered = discoverFromIndexHtml(entryHtml, ENTRY_URL, TODAY);
  assert.equal(discovered.candidates.length, 1);
  assert.equal(discovered.candidates[0].racecourse, 'Ankara');
  assert.equal(discovered.candidates[0].date, TODAY);
  assert.equal(discovered.candidates[0].provenance.discovery_method, 'official_page_discovered_venue_detail');
  assert.deepEqual(discovered.futureIndexUrls, [FUTURE_PAGE]);
});

test('collects current and fetchable future YarisSever programme pages without synthesizing URLs', async () => {
  const artifact = await collectCandidateBatch({ fetchImpl: fakeFetch, now: NOW });
  assert.equal(artifact.entry_url, 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami');
  assert.equal(artifact.candidates.length, 2);
  assert.deepEqual(artifact.candidates.map((candidate) => [candidate.date, candidate.racecourse]), [
    ['2026-08-14', 'Ankara'],
    ['2026-08-15', 'İstanbul'],
  ]);
  assert.equal(artifact.discovery.index_pages_fetched, 2);
  assert.equal(artifact.raw_body_retained, false);
  assert.equal(validateArtifact(artifact, { today: TODAY }).ok, true);
});

test('validator fails closed for route drift, provenance, host, past date, duplicate, publication and retained payload violations', async () => {
  const artifact = await collectCandidateBatch({ fetchImpl: fakeFetch, now: NOW });

  const cases = [
    (copy) => { copy.entry_url = copy.entry_url.replace('/YarisSever/', '/Kurumsal/'); },
    (copy) => { copy.candidates[0].provenance.discovered_from = copy.candidates[0].provenance.discovered_from.replace('/YarisSever/', '/Kurumsal/'); },
    (copy) => { copy.candidates[0].provenance.discovered_href = '/guessed'; },
    (copy) => { copy.candidates[0].source_url = copy.candidates[0].source_url.replace('/YarisSever/', '/Kurumsal/'); },
    (copy) => { copy.candidates[0].source_url = copy.candidates[0].source_url.replace('www.tjk.org', 'example.com'); },
    (copy) => { copy.candidates[0].date = '2026-08-13'; },
    (copy) => { copy.candidates.push(structuredClone(copy.candidates[0])); },
    (copy) => { copy.disposition.public_write = true; },
    (copy) => { copy.raw_body = '<html>not allowed</html>'; },
  ];

  for (const mutate of cases) {
    const copy = structuredClone(artifact);
    mutate(copy);
    assert.throws(() => validateArtifact(copy, { today: TODAY }));
  }
});

test('collector rejects a non-current section as its entrypoint', async () => {
  await assert.rejects(
    collectCandidateBatch({
      fetchImpl: fakeFetch,
      now: NOW,
      entryUrl: 'https://www.tjk.org/TR/Kurumsal/Info/Page/GunlukYarisProgrami',
    }),
    /current TJK YarisSever programme landing/,
  );
});
