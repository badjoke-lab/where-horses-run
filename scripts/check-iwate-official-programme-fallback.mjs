import assert from 'node:assert/strict';
import {
  decodeIwateProgrammeTextItems,
  fetchIwateOfficialProgrammeTiming,
  IWATE_OFFICIAL_PROGRAM_INDEX_URL,
  parseIwateProgrammeArticleLinks,
  parseIwateProgrammePdfLinks,
} from './timetable/iwate-official-programme-fallback.mjs';

const indexFixture = `
<html><body>
<a href="/news/260831d">令和8年度 第8回盛岡競馬概定番組（10月4日～10月13日）</a>
<a href="/news/260902d">令和8年度 第5回水沢競馬改定番組（9月6日～9月15日）</a>
<a href="/news/260804d">令和8年度 第5回水沢競馬概定番組（9月6日～9月15日）</a>
<a href="https://example.com/news/evil">令和8年度 第5回水沢競馬改定番組（9月6日～9月15日）</a>
</body></html>`;

assert.deepEqual(parseIwateProgrammeArticleLinks(indexFixture, '2026-09-13', '水沢'), [
  'https://www.iwatekeiba.or.jp/news/260902d',
  'https://www.iwatekeiba.or.jp/news/260804d',
]);
assert.deepEqual(parseIwateProgrammeArticleLinks(indexFixture, '2026-09-16', '水沢'), []);
assert.deepEqual(parseIwateProgrammeArticleLinks(indexFixture, '2026-09-13', '盛岡'), []);

const articleFixture = `
<html><body>
<a href="https://www.iwatekeiba.or.jp/dir/wp-content/uploads/2026/09/26-12-05mizusawa_kaitei.jpg"></a>
<a href="/dir/wp-content/uploads/2026/09/26-12-05mizusawa_kaitei.pdf">●PDFファイル</a>
<a href="https://example.com/evil.pdf">PDFファイル</a>
</body></html>`;
assert.deepEqual(parseIwateProgrammePdfLinks(articleFixture, 'https://www.iwatekeiba.or.jp/news/260902d'), [
  'https://www.iwatekeiba.or.jp/dir/wp-content/uploads/2026/09/26-12-05mizusawa_kaitei.pdf',
]);

const item = (str, x = 500, y = 100) => ({ str, x, y });
const pdfFixture = [
  item('令和8年度 第5回 水沢競馬 改定番組', 100, 600),
  item('４.発走時刻', 480, 212),
  item('9月6日', 530, 213),
  item('11:10 11:45 12:25 13:00 13:35 14:10 14:45 15:25 16:00 16:35 17:10', 566, 201),
  item('12:00 12:35 13:15 13:50 14:25 15:00 15:35 16:15 16:50 17:25 18:00', 566, 190),
  item('9月7日・8日', 523, 172),
  item('10:55 11:30 12:05 12:40 13:15 13:50 14:25 15:00 15:35 16:15 16:50 17:25', 566, 160),
  item('11:45 12:20 12:55 13:30 14:05 14:40 15:15 15:50 16:25 17:05 17:40 18:15', 566, 149),
  item('9月13日', 528, 131),
  item('10:40 11:15 11:50 12:25 12:55 13:30 14:00 14:35 15:15 16:00 16:40 17:15', 566, 120),
  item('11:30 12:05 12:40 13:15 13:45 14:20 14:50 15:25 16:05 16:50 17:30 18:05', 566, 108),
  item('9月14日', 528, 90),
  item('10:50 11:25 12:00 12:35 13:10 13:45 14:20 14:55 15:30 16:05 16:40 17:15', 566, 79),
  item('11:40 12:15 12:50 13:25 14:00 14:35 15:10 15:45 16:20 16:55 17:30 18:05', 566, 67),
  item('9月15日', 528, 49),
  item('10:40 11:15 11:50 12:25 13:00 13:35 14:10 14:45 15:20 15:55 16:35 17:10', 566, 38),
  item('11:30 12:05 12:40 13:15 13:50 14:25 15:00 15:35 16:10 16:45 17:25 18:00', 566, 27),
];

const decoded = decodeIwateProgrammeTextItems(pdfFixture, 2026, '水沢');
assert.deepEqual(decoded.get('2026-09-06'), { first_race_time_local: '12:00', last_race_time_local: '18:00' });
assert.deepEqual(decoded.get('2026-09-07'), { first_race_time_local: '11:45', last_race_time_local: '18:15' });
assert.deepEqual(decoded.get('2026-09-08'), { first_race_time_local: '11:45', last_race_time_local: '18:15' });
assert.deepEqual(decoded.get('2026-09-13'), { first_race_time_local: '11:30', last_race_time_local: '18:05' });
assert.deepEqual(decoded.get('2026-09-14'), { first_race_time_local: '11:40', last_race_time_local: '18:05' });
assert.deepEqual(decoded.get('2026-09-15'), { first_race_time_local: '11:30', last_race_time_local: '18:00' });

assert.throws(
  () => decodeIwateProgrammeTextItems(pdfFixture.filter((row) => !row.str.startsWith('11:30 12:05 12:40 13:15 13:45')), 2026, '水沢'),
  /timing-row count changed/,
);
assert.throws(() => decodeIwateProgrammeTextItems(pdfFixture, 2026, '盛岡'), /venue marker missing/);
assert.throws(() => decodeIwateProgrammeTextItems(pdfFixture.filter((row) => !row.str.includes('発走時刻')), 2026, '水沢'), /start-time marker missing/);

const articleUrl = 'https://www.iwatekeiba.or.jp/news/260902d';
const pdfUrl = 'https://www.iwatekeiba.or.jp/dir/wp-content/uploads/2026/09/26-12-05mizusawa_kaitei.pdf';
const fetchIndexFixture = `<a href="/news/260902d">令和8年度 第5回水沢競馬改定番組（9月6日～9月15日）</a>`;
const fetchArticleFixture = `<a href="${pdfUrl}">●PDFファイル</a>`;
const programmeRows = new Map([
  ['2026-09-13', { first_race_time_local: '11:30', last_race_time_local: '18:05' }],
  ['2026-09-14', { first_race_time_local: '11:40', last_race_time_local: '18:05' }],
  ['2026-09-15', { first_race_time_local: '11:30', last_race_time_local: '18:00' }],
]);

function makeResponse(url, body, contentType) {
  const bytes = body instanceof Uint8Array ? body : new TextEncoder().encode(String(body));
  return {
    ok: true,
    status: 200,
    url,
    headers: { get: (name) => name.toLowerCase() === 'content-type' ? contentType : null },
    text: async () => new TextDecoder().decode(bytes),
    arrayBuffer: async () => bytes.slice().buffer,
  };
}

function makeFetch(counter) {
  return async (url) => {
    const key = String(url);
    counter.set(key, (counter.get(key) ?? 0) + 1);
    if (key === IWATE_OFFICIAL_PROGRAM_INDEX_URL) return makeResponse(key, fetchIndexFixture, 'text/html; charset=UTF-8');
    if (key === articleUrl) return makeResponse(key, fetchArticleFixture, 'text/html; charset=UTF-8');
    if (key === pdfUrl) return makeResponse(key, new Uint8Array([0x25, 0x50, 0x44, 0x46]), 'application/pdf');
    throw new Error(`unexpected fetch: ${key}`);
  };
}

const fetchCounts = new Map();
const cachedFetch = makeFetch(fetchCounts);
let parseCalls = 0;
const cachedParser = async (_bytes, year, venue) => {
  parseCalls += 1;
  assert.equal(year, 2026);
  assert.equal(venue, '水沢');
  return programmeRows;
};

for (const date of ['2026-09-13', '2026-09-14', '2026-09-15']) {
  const result = await fetchIwateOfficialProgrammeTiming(
    { date, venue_code: '11', racecourse_id: 'mizusawa-racecourse' },
    { fetchImpl: cachedFetch, parsePdfImpl: cachedParser },
  );
  assert.equal(result?.meeting?.first_race_time_local, programmeRows.get(date).first_race_time_local);
  assert.equal(result?.meeting?.last_race_time_local, programmeRows.get(date).last_race_time_local);
}
assert.equal(fetchCounts.get(IWATE_OFFICIAL_PROGRAM_INDEX_URL), 1);
assert.equal(fetchCounts.get(articleUrl), 1);
assert.equal(fetchCounts.get(pdfUrl), 1);
assert.equal(parseCalls, 1);

const retryCounts = new Map();
const retryFetch = makeFetch(retryCounts);
let retryParseCalls = 0;
const retryParser = async () => {
  retryParseCalls += 1;
  if (retryParseCalls === 1) throw new Error('transient parser failure');
  return programmeRows;
};
const retryMeeting = { date: '2026-09-13', venue_code: '11', racecourse_id: 'mizusawa-racecourse' };
assert.equal(await fetchIwateOfficialProgrammeTiming(retryMeeting, { fetchImpl: retryFetch, parsePdfImpl: retryParser }), null);
const retried = await fetchIwateOfficialProgrammeTiming(retryMeeting, { fetchImpl: retryFetch, parsePdfImpl: retryParser });
assert.equal(retried?.meeting?.first_race_time_local, '11:30');
assert.equal(retryCounts.get(IWATE_OFFICIAL_PROGRAM_INDEX_URL), 1);
assert.equal(retryCounts.get(articleUrl), 1);
assert.equal(retryCounts.get(pdfUrl), 2);
assert.equal(retryParseCalls, 2);

console.log('IWATE_OFFICIAL_PROGRAMME_FALLBACK: pass');
