import assert from 'node:assert/strict';
import { discoverBaneiConfirmedNonRunning } from './timetable/banei-non-running-discovery.mjs';

function response(url, body, status = 200) {
  return { ok: status >= 200 && status < 300, status, url, async text() { return body; } };
}
const fetchImpl = async (url) => {
  const parsed = new URL(url);
  if (parsed.pathname === '/tp_list.php') {
    const page = Number(parsed.searchParams.get('no') ?? '0');
    if (page === 0) {
      return response(url, `
        <html><body>
          <a href="?no=1&wt=mon&wv=${parsed.searchParams.get('wv')}">2</a>
          <a href="/tp_detail.php?id=10155">12月15日（月）開催取り止めについて</a>
          <a href="/tp_detail.php?id=9199">8/29 佐賀競馬開催取り止めに伴う場外発売の中止</a>
        </body></html>
      `);
    }
    return response(url, `
      <html><body>
        <a href="/tp_detail.php?id=10153">12月14日（日）第5競走以降の競走取り止めについて</a>
      </body></html>
    `);
  }
  if (parsed.pathname === '/tp_detail.php' && parsed.searchParams.get('id') === '10155') {
    return response(url, `
      <html><body><div>2025-12-15</div>
      <h1>12月15日（月）開催取り止めについて</h1>
      <p>本日12月15日（月）、積雪の影響のため開催取り止めとなりました。</p></body></html>
    `);
  }
  if (parsed.pathname === '/tp_detail.php' && parsed.searchParams.get('id') === '9199') {
    return response(url, `
      <html><body><div>2024-08-29</div>
      <h1>8/29 佐賀競馬開催取り止めに伴う場外発売の中止</h1>
      <p>8月29日の佐賀競馬は開催を取り止めます。</p></body></html>
    `);
  }
  if (parsed.pathname === '/tp_detail.php' && parsed.searchParams.get('id') === '10153') {
    return response(url, `
      <html><body><div>2025-12-14</div>
      <h1>12月14日（日）第5競走以降の競走取り止めについて</h1>
      <p>ばんえい十勝では本日12月14日（日）の第5競走以降を取り止めます。</p></body></html>
    `);
  }
  return response(url, '', 404);
};

const result = await discoverBaneiConfirmedNonRunning({
  dates: ['2025-12-14', '2025-12-15', '2025-12-16'],
  fetchImpl,
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.deepEqual(result.records.map((row) => row.meeting_id), [
  'banei-obihiro-racecourse-2025-12-15',
]);
assert.equal(result.diagnostics.some((row) => row.status === 'success' && row.archive_page_count === 2), true);

const failing = await discoverBaneiConfirmedNonRunning({
  dates: ['2025-12-15'],
  fetchImpl: async (url) => response(url, '', 503),
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.deepEqual(failing.records, []);
assert.equal(failing.diagnostics.every((row) => row.status === 'archive_fetch_failed'), true,
  'Banei TOPICS failure must fail closed without inventing cancellation');

console.log('BANEI_NON_RUNNING_DISCOVERY: pass');
