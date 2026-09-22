import assert from 'node:assert/strict';
import { discoverTjkConfirmedNonRunning } from './timetable/tjk-non-running-discovery.mjs';

const result = await discoverTjkConfirmedNonRunning({
  meetingDates: ['2026-03-21'],
  newsStartDate: '2026-03-21',
  newsEndDateInclusive: '2026-03-21',
  subjects: ['ertelendi'],
  checkedAt: new Date().toISOString(),
});

console.log(JSON.stringify(result, null, 2));

assert.equal(result.diagnostics.some((row) => row.status === 'success'), true,
  'official TJK Haberler query route must be fetchable');
assert.equal(result.records.some((row) => row.meeting_id === 'tjk-adana-racecourse-2026-03-21'), true,
  'official historical TJK query must rediscover the reviewed 2026-03-21 Adana postponement');
assert.equal(result.records.some((row) => row.date === '2026-03-23'), false,
  'replacement date must not be emitted as the non-running meeting');

console.log('TJK_NON_RUNNING_LIVE_ROUTE: pass');
