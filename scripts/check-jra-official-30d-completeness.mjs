import assert from 'node:assert/strict';
import {
  discoverJraOfficial30dWithCompleteness,
  jraCalendarJsonUrl,
  parseJraCalendarMonthJson,
} from './timetable/jra-official-30d-discovery.mjs';

const programme = (venue = '中山') => `<!doctype html><html><body>
<div>第1回 ${venue} 第1日</div>
<div>1 レース 10 時 00 分 1200（芝） テスト競走</div>
</body></html>`;

const septemberCalendar = [{
  month: '9',
  data: [
    { date: '12', day: '土曜', info: [{ race: [{ name: '4回中山' }] }] },
    { date: '13', day: '日曜', info: [{ race: [] }] },
  ],
}];

assert.equal(jraCalendarJsonUrl('2026-09-12'), 'https://www.jra.go.jp/keiba/common/calendar/json/202609.json');
const parsed = parseJraCalendarMonthJson(septemberCalendar, {
  year: 2026,
  month: 9,
  allowedDates: ['2026-09-12', '2026-09-13'],
  sourceUrl: jraCalendarJsonUrl('2026-09-12'),
});
assert.equal(parsed.structural_valid, true);
assert.deepEqual(parsed.racing_dates, ['2026-09-12']);
assert.deepEqual(parsed.meetings.map((row) => row.meeting_id), ['jra-nakayama-racecourse-2026-09-12']);

const complete = await discoverJraOfficial30dWithCompleteness({
  dates: ['2026-09-12', '2026-09-13'],
  delayMs: 0,
  fetchImpl: async (url) => url.endsWith('.json')
    ? new Response(JSON.stringify(septemberCalendar), { status: 200 })
    : new Response(programme(), { status: 200 }),
});
assert.equal(complete.meetings.length, 1);
assert.equal(complete.meetings[0].meeting_id, 'jra-nakayama-racecourse-2026-09-12');
assert.equal(complete.meetings[0].programme_rows.length, 1);
assert.equal(complete.completeness.completeness, 'complete');
assert.equal(complete.completeness.pending_count, 0);
assert.equal(complete.completeness.failure_count, 0);
assert.equal(complete.completeness.programme_not_published_count, 0);
assert.deepEqual(complete.completeness.successful_programme_dates, ['2026-09-12']);

const programmeUnavailable = await discoverJraOfficial30dWithCompleteness({
  dates: ['2026-09-12', '2026-09-13'],
  delayMs: 0,
  fetchImpl: async (url) => url.endsWith('.json')
    ? new Response(JSON.stringify(septemberCalendar), { status: 200 })
    : new Response('', { status: 403 }),
});
assert.equal(programmeUnavailable.meetings.length, 1);
assert.equal(programmeUnavailable.completeness.completeness, 'complete');
assert.equal(programmeUnavailable.completeness.failure_count, 0);
assert.equal(programmeUnavailable.completeness.programme_not_published_count, 1);
assert.deepEqual(programmeUnavailable.completeness.programme_not_published_dates, ['2026-09-12']);

const emptyCalendar = [{
  month: '9',
  data: [
    { date: '14', day: '月曜', info: [{ race: [] }] },
    { date: '15', day: '火曜', info: [{ race: [] }] },
    { date: '16', day: '水曜', info: [{ race: [] }] },
  ],
}];
const emptyWindow = await discoverJraOfficial30dWithCompleteness({
  dates: ['2026-09-14', '2026-09-15', '2026-09-16'],
  delayMs: 0,
  fetchImpl: async (url) => {
    assert.ok(url.endsWith('202609.json'), `unexpected programme fetch in empty window: ${url}`);
    return new Response(JSON.stringify(emptyCalendar), { status: 200 });
  },
});
assert.deepEqual(emptyWindow.meetings, []);
assert.equal(emptyWindow.completeness.completeness, 'complete');
assert.equal(emptyWindow.completeness.failure_count, 0);
assert.equal(emptyWindow.completeness.parsed_meeting_count, 0);
assert.deepEqual(emptyWindow.completeness.programme_source_urls, []);

const octoberCalendar = [{
  month: '10',
  data: [{ date: '3', day: '土曜', info: [{ race: [{ name: '4回東京' }, { name: '4回京都' }] }] }],
}];
const partial = await discoverJraOfficial30dWithCompleteness({
  dates: ['2026-09-12', '2026-10-03'],
  delayMs: 0,
  fetchImpl: async (url) => {
    if (url.endsWith('202609.json')) return new Response(JSON.stringify(septemberCalendar), { status: 200 });
    if (url.endsWith('202610.json')) return new Response(JSON.stringify([{ month: '10', data: 'broken' }]), { status: 200 });
    return new Response(programme(), { status: 200 });
  },
});
assert.equal(partial.completeness.completeness, 'partial');
assert.equal(partial.completeness.failure_count, 1);
assert.equal(partial.meetings.length, 1);

const validOctober = parseJraCalendarMonthJson(octoberCalendar, {
  year: 2026,
  month: 10,
  allowedDates: ['2026-10-03'],
  sourceUrl: jraCalendarJsonUrl('2026-10-03'),
});
assert.equal(validOctober.structural_valid, true);
assert.deepEqual(validOctober.meetings.map((row) => row.meeting_id), [
  'jra-tokyo-racecourse-2026-10-03',
  'jra-kyoto-racecourse-2026-10-03',
]);

await assert.rejects(
  () => discoverJraOfficial30dWithCompleteness({
    dates: ['2026-09-12'],
    delayMs: 0,
    fetchImpl: async () => new Response(JSON.stringify([{ month: '9', data: 'broken' }]), { status: 200 }),
  }),
  /calendar JSON discovery incomplete/,
);

console.log('JRA_OFFICIAL_30D_COMPLETENESS: pass');
