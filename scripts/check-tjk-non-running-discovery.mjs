import assert from 'node:assert/strict';
import { discoverTjkConfirmedNonRunning } from './timetable/tjk-non-running-discovery.mjs';

function response(url, body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    async text() { return body; },
  };
}

const fetchImpl = async (url) => {
  const parsed = new URL(url);
  if (parsed.pathname === '/TR/YarisSever/Query/Page/Haberler') {
    assert.equal(parsed.searchParams.get('QueryParameter_InTurkish'), '1');
    assert.equal(parsed.searchParams.get('QueryParameter_IsYarisSever'), '1');
    return response(url, `
      <html><body>
        <a href="/TR/YarisSever/News/Page/52094">Adana Yarışları 23 Mart Pazartesi gününe ertelendi</a>
        <a href="/TR/YarisSever/News/Page/88888">Güney Afrika yarışları iptal edildi</a>
        <a href="/TR/YarisSever/News/Page/99901">İstanbul yarışları 3. koşu iptal edildi</a>
      </body></html>
    `);
  }
  if (parsed.pathname === '/TR/YarisSever/News/Data/52094') {
    return response(url, `
      <html><body>
        <div>Tarih:21.03.2026 13:22:00</div>
        <h1>Adana Yarışları 23 Mart Pazartesi gününe ertelendi</h1>
        <p>21 Mart Cumartesi günü Adana Hipodromunda yapılması planlanan tüm koşuların, olumsuz hava şartları nedeniyle 23 Mart Pazartesi gününe ertelenmesine karar verilmiştir.</p>
      </body></html>
    `);
  }
  if (parsed.pathname === '/TR/YarisSever/News/Data/99901') {
    return response(url, `
      <html><body>
        <div>Tarih:21.03.2026 10:00:00</div>
        <h1>İstanbul yarışları 3. koşu iptal edildi</h1>
        <p>21 Mart günü İstanbul yarışlarında 3. koşu iptal edilmiştir.</p>
      </body></html>
    `);
  }
  return response(url, '', 404);
};

const result = await discoverTjkConfirmedNonRunning({
  meetingDates: ['2026-03-21', '2026-03-23'],
  fetchImpl,
  checkedAt: '2026-09-22T00:00:00Z',
});

assert.deepEqual(result.records.map((row) => row.meeting_id), [
  'tjk-adana-racecourse-2026-03-21',
]);
assert.equal(result.records.some((row) => row.date === '2026-03-23'), false,
  'replacement date must remain an independently acquired meeting');
assert.equal(result.diagnostics.some((row) => row.status === 'success'), true);
assert.equal(result.diagnostics.some((row) => row.source_url.includes('88888')), false,
  'foreign cancellations must be rejected before article acquisition');
assert.equal(result.discovery_scope, 'current_latest_news_positive_evidence_subset');

const failed = await discoverTjkConfirmedNonRunning({
  meetingDates: ['2026-03-21'],
  fetchImpl: async (url) => response(url, '', 503),
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(failed.records, []);
assert.equal(failed.diagnostics.every((row) => row.status === 'query_fetch_failed'), true,
  'TJK news acquisition failure must fail closed without inventing cancellation');

console.log('TJK_NON_RUNNING_DISCOVERY: pass');
