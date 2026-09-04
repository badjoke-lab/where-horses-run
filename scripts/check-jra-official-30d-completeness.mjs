import assert from 'node:assert/strict';
import { discoverJraOfficial30dWithCompleteness } from './timetable/jra-official-30d-discovery.mjs';

const programme = (venue = '中山') => `<!doctype html><html><body>
<div>第1回 ${venue} 第1日</div>
<div>1 レース 10 時 00 分 1200（芝） テスト競走</div>
</body></html>`;

const partial = await discoverJraOfficial30dWithCompleteness({
  dates: ['2026-09-12', '2026-09-13'],
  delayMs: 0,
  fetchImpl: async (url) => url.includes('0912.html')
    ? new Response(programme(), { status: 200 })
    : new Response('', { status: 403 }),
});
assert.equal(partial.meetings.length, 1);
assert.equal(partial.meetings[0].meeting_id, 'jra-nakayama-racecourse-2026-09-12');
assert.equal(partial.completeness.completeness, 'partial');
assert.equal(partial.completeness.pending_count, 1);
assert.deepEqual(partial.completeness.not_published_dates, ['2026-09-13']);

const complete = await discoverJraOfficial30dWithCompleteness({
  dates: ['2026-09-12', '2026-09-13'],
  delayMs: 0,
  fetchImpl: async () => new Response(programme(), { status: 200 }),
});
assert.equal(complete.meetings.length, 2);
assert.equal(complete.completeness.completeness, 'complete');
assert.equal(complete.completeness.pending_count, 0);

await assert.rejects(
  () => discoverJraOfficial30dWithCompleteness({
    dates: ['2026-09-12', '2026-09-13'],
    delayMs: 0,
    fetchImpl: async () => new Response('', { status: 404 }),
  }),
  /refusing to treat blanket 403\/404 responses as an empty schedule/,
);

console.log('JRA_OFFICIAL_30D_COMPLETENESS: pass');
