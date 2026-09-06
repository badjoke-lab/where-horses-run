import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';

const aPlusRows = [
  { label: 'Race 1', post_time_local: '12:00', race_name: 'Opening', distance_m: 1200, surface: 'Dirt', course_label: 'Right-handed' },
  { label: 'Race 2', post_time_local: '12:30', race_name: 'Feature', distance_m: 1600, surface: 'Turf', course_label: 'Right-handed' },
];

assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A', timetable_rows: aPlusRows }),
  'A+',
  'collector-declared A must not cap complete A+ evidence',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', timetable_rows: aPlusRows.map(({ race_name, distance_m, surface, course_label, ...row }) => row) }),
  'A',
  'collector-declared A+ must not promote time-only rows above A',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', first_race_time_local: '12:00', last_race_time_local: '18:00', timetable_rows: [] }),
  'B+',
  'first and last time evidence must derive B+',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', first_race_time_local: '12:00', timetable_rows: [] }),
  'B',
  'first-time-only evidence must derive B',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', timetable_rows: [] }),
  'C',
  'meeting-only evidence must derive C',
);

const policies = JSON.parse(fs.readFileSync('src/data/publicationDisplayPolicies.json', 'utf8'));
for (const authorityId of ['hkjc', 'emirates-racing-authority', 'korea-racing-authority', 'turkiye-jokey-kulubu']) {
  const policy = policies.policies.find((row) => (row.match?.authority_ids ?? []).includes(authorityId));
  assert.ok(policy, `missing public policy for ${authorityId}`);
  assert.equal(policy.max_public_rank, 'A+', `${authorityId} must not retain a fixed public cap below A+`);
  assert.equal(policy.a_plus_fields?.show_race_name, true, `${authorityId} A+ must expose race name`);
  assert.equal(policy.a_plus_fields?.show_distance, true, `${authorityId} A+ must expose distance`);
  assert.equal(policy.a_plus_fields?.show_surface, true, `${authorityId} A+ must expose surface`);
  assert.equal(policy.a_plus_fields?.show_course, true, `${authorityId} A+ must expose course`);
}

const applySource = fs.readFileSync('scripts/timetable/apply-official-rolling-observations.mjs', 'utf8');
assert.match(applySource, /deriveBestAvailableRank\(record, record\?\.timetable_rows \?\? \[\]\)/, 'non-Japan apply layer must derive rank from evidence');
assert.doesNotMatch(applySource, /return record\.capability_rank \?\? record\.candidate_rank/, 'non-Japan apply layer must not trust collector rank as canonical rank');

const tjkSource = fs.readFileSync('scripts/timetable/run-tjk-current-best-available.mjs', 'utf8');
assert.doesNotMatch(tjkSource, /publication_ceiling:\s*'A'/, 'TJK must not retain a fixed public A ceiling');
assert.doesNotMatch(tjkSource, /capability_rank:\s*'A'/, 'TJK must not hard-code A for discovered schedules');
assert.match(tjkSource, /deriveBestAvailableRank/, 'TJK collector must derive its diagnostic rank from evidence');

console.log('NON_JAPAN_BEST_AVAILABLE_RANK: pass');
