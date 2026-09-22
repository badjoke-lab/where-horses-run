import assert from 'node:assert/strict';
import { discoverTjkConfirmedNonRunning } from './timetable/tjk-non-running-discovery.mjs';
import { parseTjkConfirmedNonRunningHtml } from './timetable/tjk-non-running-evidence.mjs';

const current = await discoverTjkConfirmedNonRunning({
  meetingDates: ['2026-09-22'],
  checkedAt: new Date().toISOString(),
});
console.log(JSON.stringify(current, null, 2));
assert.equal(current.diagnostics.some((row) => row.status === 'success'), true,
  'official current TJK Haberler route must be fetchable from GitHub Actions');

const sourceUrl = 'https://www.tjk.org/TR/YarisSever/News/Data/52094';
const response = await fetch(sourceUrl, {
  redirect: 'follow',
  headers: {
    accept: 'text/html,application/xhtml+xml',
    'accept-language': 'tr-TR,tr;q=0.9,en;q=0.6',
    'user-agent': 'WhereHorsesRun-source-verification/1.0',
  },
  signal: AbortSignal.timeout(20_000),
});
assert.equal(response.ok, true, 'reviewed TJK historical article body must be fetchable');
const finalUrl = new URL(response.url || sourceUrl);
assert.equal(finalUrl.hostname, 'www.tjk.org');
const rows = parseTjkConfirmedNonRunningHtml(await response.text(), {
  sourceUrl: finalUrl.href,
  checkedAt: new Date().toISOString(),
});
console.log(JSON.stringify(rows, null, 2));
assert.equal(rows.some((row) => row.meeting_id === 'tjk-adana-racecourse-2026-03-21'), true,
  'official TJK article body must prove the original Adana meeting as non-running');
assert.equal(rows.some((row) => row.date === '2026-03-23'), false,
  'replacement date must not be emitted as the non-running meeting');

console.log('TJK_NON_RUNNING_LIVE_ROUTE: pass');
