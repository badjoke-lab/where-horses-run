import assert from 'node:assert/strict';
import { discoverNarConfirmedNonRunning } from './timetable/nar-non-running-discovery.mjs';

function response(url, body, status = 200) {
  const bytes = Buffer.from(body, 'utf8');
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

const pages = new Map([
  ['https://www.keiba.go.jp/jranet/topics/2025/index.html', `
    <html><body>
      <a href="/jranet/topics/2025/n000111.html">金沢競馬の開催取り止めについて(8/26・9/2)</a>
      <a href="/jranet/topics/2025/n000108.html">門別競馬の開催取り止めについて(7/30)</a>
      <a href="/jranet/topics/2025/n072801.html">金沢競馬第4競走および第5競走の取り止めについて(7/28)</a>
      <a href="/jranet/topics/2025/n999999.html">地方競馬のお知らせ</a>
    </body></html>
  `],
  ['https://www.keiba.go.jp/jranet/topics/2025/n000111.html', `
    <html><body><h1>金沢競馬の開催取り止めについて(8/26・9/2)</h1>
    <p>金沢競馬は8月26日および9月2日の開催を取り止めます。</p></body></html>
  `],
  ['https://www.keiba.go.jp/jranet/topics/2025/n000108.html', `
    <html><body><h1>門別競馬の開催取り止めについて(7/30)</h1>
    <p>門別競馬は7月30日の開催を取り止めます。</p></body></html>
  `],
]);

const fetchImpl = async (url) => pages.has(url) ? response(url, pages.get(url)) : response(url, '', 404);
const result = await discoverNarConfirmedNonRunning({
  dates: ['2025-08-26','2025-09-02','2025-09-03'],
  fetchImpl,
  checkedAt: '2026-09-22T00:00:00Z',
});

assert.deepEqual(result.records.map((row) => row.meeting_id), [
  'nar-kanazawa-racecourse-2025-08-26',
  'nar-kanazawa-racecourse-2025-09-02',
]);
const ok = result.diagnostics.find((row) => row.status === 'success');
assert.equal(ok?.candidate_link_count, 2, 'race-only and unrelated topics must not become article candidates');
assert.equal(ok?.fetched_article_count, 2);

const failing = await discoverNarConfirmedNonRunning({
  dates: ['2025-08-26'],
  fetchImpl: async (url) => response(url, '', 503),
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(failing.records, []);
assert.equal(failing.diagnostics.every((row) => row.status === 'index_fetch_failed'), true,
  'NAR topic index failure must fail closed without inventing cancellation');

console.log('NAR_NON_RUNNING_DISCOVERY: pass');
