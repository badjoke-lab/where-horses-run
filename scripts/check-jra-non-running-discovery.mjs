import assert from 'node:assert/strict';
import { discoverJraConfirmedNonRunning } from './timetable/jra-non-running-discovery.mjs';

function response(url, body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    async text() { return body; },
  };
}
const pages = new Map([
  ['https://www.jra.go.jp/news/202602/', `
    <html><body>
      <a href="/news/202602/020802.html">本日【2月8日（日曜）】の東京競馬および京都競馬は開催を中止します</a>
      <a href="/news/202602/020803.html">開催競馬場・今日の出来事、明日・明後日の取消・変更等（2月8日（日曜））</a>
      <a href="/news/202602/020899.html">競走馬登録抹消</a>
    </body></html>
  `],
  ['https://www.jra.go.jp/news/202602/020802.html', `
    <html><body><p>本日【2月8日（日曜）】の東京競馬および京都競馬は、雪のため、開催を中止します。</p></body></html>
  `],
  ['https://www.jra.go.jp/news/202602/020803.html', `
    <html><body>
      <h3>第1回東京第4日（2月8日（日曜））</h3>
      <p>本日の第1回東京競馬第4日は、積雪の影響により、開催を中止いたします。</p>
    </body></html>
  `],
  ['https://www.jra.go.jp/news/202601/', '<html><body></body></html>'],
]);
const fetchImpl = async (url) => {
  if (!pages.has(url)) return response(url, '', 404);
  return response(url, pages.get(url));
};
const dates = ['2026-02-08', '2026-02-09', '2026-02-10'];
const result = await discoverJraConfirmedNonRunning({
  dates,
  fetchImpl,
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.deepEqual(result.records.map((row) => row.meeting_id), [
  'jra-kyoto-racecourse-2026-02-08',
  'jra-tokyo-racecourse-2026-02-08',
]);
assert.equal(result.diagnostics.some((row) => row.status === 'success' && row.confirmed_non_running_count >= 2), true);

const failing = await discoverJraConfirmedNonRunning({
  dates,
  fetchImpl: async (url) => response(url, '', 503),
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.deepEqual(failing.records, []);
assert.equal(failing.diagnostics.every((row) => row.status === 'index_fetch_failed'), true,
  'negative-evidence fetch failure must fail closed without inventing cancellation');

console.log('JRA_NON_RUNNING_DISCOVERY: pass');
