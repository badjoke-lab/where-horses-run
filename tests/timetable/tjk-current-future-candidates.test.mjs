import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ENTRY_URL,
  collectCandidateBatch,
  detectRaceSchedule,
  discoverFromIndexHtml,
} from '../../scripts/timetable/tjk-current-future-candidates.mjs';
import { validateArtifact } from '../../scripts/check-tjk-current-future-candidates.mjs';

const NOW = new Date('2026-08-14T09:00:00Z');
const TODAY = '2026-08-14';
const FUTURE_PAGE = 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami?Era=tomorrow&QueryParameter_Tarih=15%2F08%2F2026';
const ANKARA_DETAIL = 'https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?Era=today&QueryParameter_Tarih=14%2F08%2F2026&SehirAdi=Ankara&SehirId=5';
const ISTANBUL_DETAIL = 'https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami?Era=tomorrow&QueryParameter_Tarih=15%2F08%2F2026&SehirAdi=%C4%B0stanbul&SehirId=3';

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

const ankaraDetailHtml = '<main>1. Koşu: 14:00 2. Koşu: 14:30 3. Koşu: 15:00</main>';
const istanbulDetailHtml = '<main>Programme announced; post times pending.</main>';

function fakeFetch(url) {
  const body = url === ENTRY_URL ? entryHtml
    : url === FUTURE_PAGE ? futureHtml
      : url === ANKARA_DETAIL ? ankaraDetailHtml
        : url === ISTANBUL_DETAIL ? istanbulDetailHtml
          : null;
  assert.notEqual(body, null, `unexpected fetch ${url}`);
  return Promise.resolve({ ok: true, status: 200, text: async () => body });
}

test('discovers only non-past domestic page-discovered TJK YarisSever venue details', () => {
  const discovered = discoverFromIndexHtml(entryHtml, ENTRY_URL, TODAY);
  assert.equal(discovered.candidates.length, 1);
  assert.equal(discovered.candidates[0].racecourse, 'Ankara');
  assert.equal(discovered.candidates[0].date, TODAY);
  assert.equal(discovered.candidates[0].capability_rank, 'C');
  assert.equal(discovered.candidates[0].publication_ceiling, 'A');
  assert.equal(discovered.candidates[0].provenance.discovery_method, 'official_page_discovered_venue_detail');
  assert.deepEqual(discovered.futureIndexUrls, [FUTURE_PAGE]);
});

test('detects only contiguous conflict-free Race 1-N post times', () => {
  assert.deepEqual(detectRaceSchedule(ankaraDetailHtml).schedule, [
    { race_number: 1, post_time_local: '14:00' },
    { race_number: 2, post_time_local: '14:30' },
    { race_number: 3, post_time_local: '15:00' },
  ]);
  assert.deepEqual(detectRaceSchedule('<p>1. Koşu: 14:00 3. Koşu: 15:00</p>').schedule, []);
  assert.deepEqual(detectRaceSchedule('<p>1. Koşu: 14:00 1. Koşu: 14:05</p>').schedule, []);
});

test('collects current/future candidates at C or A best-available without requiring A', async () => {
  const artifact = await collectCandidateBatch({ fetchImpl: fakeFetch, now: NOW });
  assert.equal(artifact.entry_url, ENTRY_URL);
  assert.equal(artifact.candidates.length, 2);
  assert.deepEqual(artifact.candidates.map((candidate) => [candidate.date, candidate.racecourse, candidate.capability_rank]), [
    ['2026-08-14', 'Ankara', 'A'],
    ['2026-08-15', 'İstanbul', 'C'],
  ]);
  assert.equal(artifact.candidates[0].first_race_time_local, '14:00');
  assert.equal(artifact.candidates[0].last_race_time_local, '15:00');
  assert.equal(artifact.candidates[0].timetable_rows.length, 3);
  assert.equal(artifact.candidates[1].first_race_time_local, null);
  assert.deepEqual(artifact.candidates[1].timetable_rows, []);
  assert.deepEqual(artifact.discovery.rank_counts, { C: 1, A: 1 });
  assert.equal(artifact.discovery.detail_pages_attempted, 2);
  assert.equal(artifact.raw_body_retained, false);
  assert.equal(validateArtifact(artifact, { today: TODAY }).ok, true);
});

test('detail source failure degrades only that meeting to C instead of failing discovery', async () => {
  const fetchWithDetailFailure = async (url) => {
    if (url === ISTANBUL_DETAIL) return { ok: false, status: 503, text: async () => '<html>not retained</html>' };
    return fakeFetch(url);
  };
  const artifact = await collectCandidateBatch({ fetchImpl: fetchWithDetailFailure, now: NOW });
  const istanbul = artifact.candidates.find((candidate) => candidate.racecourse === 'İstanbul');
  assert.equal(istanbul.capability_rank, 'C');
  assert.equal(istanbul.detail_observation.status, 'source_error');
  assert.equal(validateArtifact(artifact, { today: TODAY }).ok, true);
});

test('validator fails closed for route drift, provenance, host, rank/detail mismatch, duplicate, publication and retained payload violations', async () => {
  const artifact = await collectCandidateBatch({ fetchImpl: fakeFetch, now: NOW });

  const cases = [
    (copy) => { copy.entry_url = copy.entry_url.replace('/YarisSever/', '/Kurumsal/'); },
    (copy) => { copy.candidates[0].provenance.discovered_from = copy.candidates[0].provenance.discovered_from.replace('/YarisSever/', '/Kurumsal/'); },
    (copy) => { copy.candidates[0].provenance.discovered_href = '/guessed'; },
    (copy) => { copy.candidates[0].source_url = copy.candidates[0].source_url.replace('/YarisSever/', '/Kurumsal/'); },
    (copy) => { copy.candidates[0].source_url = copy.candidates[0].source_url.replace('www.tjk.org', 'example.com'); },
    (copy) => { copy.candidates[0].date = '2026-08-13'; },
    (copy) => { copy.candidates[0].capability_rank = 'A+'; },
    (copy) => { copy.candidates[0].timetable_rows = []; },
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
