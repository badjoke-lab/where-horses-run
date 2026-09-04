import assert from 'node:assert/strict';
import {
  discoverTokaiOfficial30d,
  selectTokaiVerifiedMeetings,
  TOKAI_OFFICIAL_PDF_SHA256,
  TOKAI_OFFICIAL_PDF_URL,
  TOKAI_VERIFIED_WINDOW,
} from './timetable/tokai-official-30d-discovery.mjs';

assert.equal(TOKAI_OFFICIAL_PDF_URL, 'https://www.kasamatsu-keiba.com/resources/pdfs/news/2026/1768888484_abd42430844a7f06de8d.pdf');
assert.equal(TOKAI_OFFICIAL_PDF_SHA256, '1cefd5c92bc170f56acb1883219f795233a38a698b7919cd42836cc2dfb21e56');
assert.deepEqual(TOKAI_VERIFIED_WINDOW, { start: '2026-09-01', end: '2026-10-03' });

const dates = [
  '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-14', '2026-09-18',
  '2026-09-22', '2026-09-25', '2026-09-29', '2026-09-30',
  '2026-10-01', '2026-10-02', '2026-10-03',
];
const selected = selectTokaiVerifiedMeetings(dates, TOKAI_OFFICIAL_PDF_URL);
assert.deepEqual(selected.map((row) => row.meeting_id), [
  'nar-nagoya-racecourse-2026-09-04',
  'nar-kasamatsu-racecourse-2026-09-08',
  'nar-kasamatsu-racecourse-2026-09-11',
  'nar-nagoya-racecourse-2026-09-14',
  'nar-nagoya-racecourse-2026-09-18',
  'nar-kasamatsu-racecourse-2026-09-22',
  'nar-kasamatsu-racecourse-2026-09-25',
  'nar-nagoya-racecourse-2026-09-29',
  'nar-nagoya-racecourse-2026-09-30',
  'nar-nagoya-racecourse-2026-10-01',
  'nar-nagoya-racecourse-2026-10-02',
]);
assert.equal(selected.find((row) => row.racecourse_id === 'nagoya-racecourse')?.venue_code, '24');
assert.equal(selected.find((row) => row.racecourse_id === 'kasamatsu-racecourse')?.venue_code, '23');
assert.ok(selected.every((row) => row.source_id === 'tokai-region-joint-official-calendar'));
assert.ok(!selected.some((row) => row.date === '2026-10-03'));

const fakeBytes = new TextEncoder().encode('not-the-pinned-official-pdf');
const badFetch = async (url) => ({
  ok: true,
  status: 200,
  url,
  arrayBuffer: async () => fakeBytes.buffer,
});
const bad = await discoverTokaiOfficial30d({ dates: ['2026-09-04'], fetchImpl: badFetch });
assert.equal(bad.completeness.completeness, 'failed');
assert.equal(bad.completeness.failure_count, 1);
assert.match(bad.completeness.failures[0].reason, /PDF hash changed/);
assert.equal(bad.meetings.length, 0);

const outside = await discoverTokaiOfficial30d({ dates: ['2026-10-04'], fetchImpl: badFetch });
assert.equal(outside.completeness.completeness, 'failed');
assert.ok(outside.completeness.failures.some((row) => /outside_verified_transcription_window/.test(row.reason)));

console.log('TOKAI_OFFICIAL_30D: pass');
