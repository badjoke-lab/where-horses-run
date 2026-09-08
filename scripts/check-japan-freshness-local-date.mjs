import assert from 'node:assert/strict';
import {
  japanLocalDateFromInstant,
  runJapanZeroBased30d,
} from './timetable/japan-zero-based-30d-core.mjs';

assert.equal(japanLocalDateFromInstant('2026-09-07T14:59:59.999Z'), '2026-09-07');
assert.equal(japanLocalDateFromInstant('2026-09-07T15:00:00.000Z'), '2026-09-08');
assert.equal(japanLocalDateFromInstant('2026-09-07T22:04:06.727Z'), '2026-09-08');
assert.throws(() => japanLocalDateFromInstant('not-a-date'), /invalid Japan freshness instant/);

const meeting = {
  meeting_id: 'nar-kawasaki-racecourse-2026-09-08',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: 'kawasaki-racecourse',
  date: '2026-09-08',
  source_id: 'nar-test',
  source_label: 'NAR test source',
  official_source_url: 'https://example.invalid/official',
};

const adapters = {
  jra: {
    discover: async () => [],
    inspect: async () => { throw new Error('unexpected JRA inspect'); },
  },
  'nar-standard': {
    discover: async () => [meeting],
    inspect: async () => ({ status: 'ok', meeting: { ...meeting, timetable_rows: [] } }),
  },
  banei: {
    discover: async () => [],
    inspect: async () => { throw new Error('unexpected Banei inspect'); },
  },
};

const checkedAt = '2026-09-07T22:04:06.727Z';
const success = await runJapanZeroBased30d({
  executionDate: '2026-09-08',
  adapters,
  attempts: 1,
  retryDelayMs: 0,
  checkedAt,
  loadExisting: () => ({ canonical: [], public: [], details: [], publicDetails: [] }),
});

const canonical = success.canonical.find((row) => row.meeting_id === meeting.meeting_id);
const publicMeeting = success.public.find((row) => row.meeting_id === meeting.meeting_id);
assert.equal(canonical?.freshness?.last_checked_date, '2026-09-08');
assert.equal(canonical?.freshness?.generated_at, checkedAt);
assert.equal(publicMeeting?.last_checked_date, '2026-09-08');

const previousCanonical = {
  ...canonical,
  freshness: {
    ...canonical.freshness,
    last_checked_date: '2026-09-06',
    generated_at: '2026-09-06T01:00:00.000Z',
  },
};
const previousPublic = {
  ...publicMeeting,
  last_checked_date: '2026-09-06',
};
const failedAdapters = {
  ...adapters,
  'nar-standard': {
    discover: async () => [meeting],
    inspect: async () => ({ status: 'acquisition_failed', reason: 'test failure' }),
  },
};
const failed = await runJapanZeroBased30d({
  executionDate: '2026-09-08',
  adapters: failedAdapters,
  attempts: 1,
  retryDelayMs: 0,
  checkedAt,
  loadExisting: () => ({
    canonical: [previousCanonical],
    public: [previousPublic],
    details: [],
    publicDetails: [],
  }),
});
const failedCanonical = failed.canonical.find((row) => row.meeting_id === meeting.meeting_id);
assert.equal(failedCanonical?.freshness?.last_checked_date, '2026-09-06');
assert.equal(failedCanonical?.freshness?.generated_at, '2026-09-06T01:00:00.000Z');
assert.equal(failed.reconciliations[0]?.outcome, 'acquisition_failed');

console.log('Japan freshness local-date regression: ok');
