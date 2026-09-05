import assert from 'node:assert/strict';
import { deriveJapanBestAvailableRank, runJapanZeroBased30d } from './timetable/japan-zero-based-30d-core.mjs';

const aPlusRows = [1, 2].map((number) => ({
  label: `Race ${number}`,
  post_time_local: number === 1 ? '10:00' : '16:00',
  race_name: `Race ${number} title`,
  distance_m: 1200,
  surface: 'Dirt',
  course_label: 'Outer',
}));

assert.equal(deriveJapanBestAvailableRank({ capability_rank: 'A' }, aPlusRows), 'A+');
assert.equal(deriveJapanBestAvailableRank({ capability_rank: 'A+' }, aPlusRows.map(({ race_name, distance_m, surface, course_label, ...row }) => row)), 'A');
assert.equal(deriveJapanBestAvailableRank({ first_race_time_local: '10:00', last_race_time_local: '16:00' }, []), 'B+');
assert.equal(deriveJapanBestAvailableRank({ first_race_time_local: '10:00' }, []), 'B');
assert.equal(deriveJapanBestAvailableRank({}, []), 'C');

const meeting = {
  meeting_id: 'nar-generic-course-2026-09-08',
  date: '2026-09-08',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: 'generic-course',
  official_source_url: 'https://official.example/racecard',
};

const adapters = {
  jra: { discover: async () => [], inspect: async () => { throw new Error('unexpected'); } },
  'nar-standard': {
    discover: async () => [meeting],
    inspect: async (value) => ({
      status: 'ok',
      meeting: {
        ...value,
        capability_rank: 'A',
        timetable_rows: aPlusRows,
      },
    }),
  },
  banei: { discover: async () => [], inspect: async () => { throw new Error('unexpected'); } },
};

const result = await runJapanZeroBased30d({
  executionDate: '2026-09-05',
  adapters,
  retryDelayMs: 0,
  checkedAt: '2026-09-05T00:00:00.000Z',
});

const canonical = result.canonical.find((row) => row.meeting_id === meeting.meeting_id);
const publicMeeting = result.public.find((row) => row.meeting_id === meeting.meeting_id);
const publicDetail = result.publicDetails.find((row) => row.meeting_id === meeting.meeting_id);
assert.equal(canonical.capability_rank, 'A+', 'adapter-declared A must not cap complete A+ evidence');
assert.equal(publicMeeting.capability_rank, 'A+');
assert.equal(publicMeeting.effective_public_rank, 'A+');
assert.equal(publicDetail.effective_public_rank, 'A+');
assert.equal(publicDetail.timetable_rows[0].race_name, 'Race 1 title');

console.log('JAPAN_BEST_AVAILABLE_RANK: pass');
