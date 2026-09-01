import fs from 'node:fs';

const path = 'data/candidates/tjk-current-2026-09-01-promotion-review-v1.json';
const value = JSON.parse(fs.readFileSync(path, 'utf8'));
const fail = (message) => { throw new Error(`[TJK 2026-09-01 review] ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };

assert(value.schema_version === 'tjk-current-promotion-review-v1', 'schema differs');
assert(value.source_run?.run_id === 33471775307, 'source run differs');
assert(value.source_run?.head_sha === 'bdf32f1a408844ecef67e55cea7fcce5e14a8e68', 'source head differs');
assert(value.source_run?.artifact_id === 9786772486, 'artifact differs');
assert(value.source_run?.artifact_digest === 'sha256:990b0265c6b9b97876113e9a1e380d0da27ca08b44eb977a27683b7350433792', 'artifact digest differs');
assert(value.source_run?.candidate_sha256 === '69bee8a5469979c6a3e1d5dc5a90bce2b8e4935a9124f39d7e82c7f15e6ab5c6', 'candidate digest differs');
assert(value.meeting_count === 2 && value.race_count === 16, 'scope must remain 2 meetings / 16 races');
assert(value.technical_capability_rank === 'A+' && value.candidate_rank === 'A' && value.public_ceiling === 'A', 'rank boundary differs');
assert(value.identity_review?.existing_public_identity_found === true, 'reviewed public identity must already exist');
assert(value.identity_review?.registration_required_for_promotion === false, 'new identity registration must remain disabled');
assert(value.review?.status === 'pending', 'review must remain pending in review-only PR');
assert(value.review?.reviewed_at === null && value.review?.reviewer === null, 'pending review must not claim a reviewer');
assert(value.review?.approval_effect === 'none_until_explicit_human_review', 'pending approval effect differs');
assert(value.publication_boundary?.canonical_written === false, 'canonical must remain unwritten');
assert(value.publication_boundary?.public_projection_written === false, 'public projection must remain unwritten');
assert(value.publication_boundary?.automatic_approval === false && value.publication_boundary?.automatic_merge === false && value.publication_boundary?.deployment_performed === false, 'automation boundary differs');

const expected = new Map([
  ['5', { label: 'Ankara', racecourse: 'ankara-racecourse', meeting: 'tjk-ankara-racecourse-2026-09-01', first: '14:30', last: '18:00' }],
  ['9', { label: 'Kocaeli', racecourse: 'kocaeli-racecourse', meeting: 'tjk-kocaeli-racecourse-2026-09-01', first: '17:45', last: '21:30' }],
]);
assert(Array.isArray(value.records) && value.records.length === 2, 'record scope differs');
for (const record of value.records) {
  const exp = expected.get(String(record.source_venue_id));
  assert(exp, `unexpected venue ${record.source_venue_id}`);
  assert(record.source_venue_label === exp.label, `venue label differs for ${record.source_venue_id}`);
  assert(record.public_racecourse_id === exp.racecourse, `racecourse binding differs for ${record.source_venue_id}`);
  assert(record.canonical_meeting_id === exp.meeting, `canonical meeting differs for ${record.source_venue_id}`);
  assert(record.date === '2026-09-01' && record.candidate_rank === 'A', `date/rank differs for ${record.source_venue_id}`);
  assert(record.race_count === 8 && record.race_schedule?.length === 8, `race count differs for ${record.source_venue_id}`);
  assert(record.first_race_time_local === exp.first && record.last_race_time_local === exp.last, `first/last time differs for ${record.source_venue_id}`);
  record.race_schedule.forEach((row, index) => assert(row.race_number === index + 1 && /^\d{2}:\d{2}$/.test(row.post_time_local), `non-contiguous race schedule for ${record.source_venue_id}`));
  const forbidden = ['runner', 'horse', 'jockey', 'trainer', 'odds', 'result', 'payout', 'prediction', 'raw_html'];
  const raw = JSON.stringify(record).toLowerCase();
  for (const token of forbidden) assert(!raw.includes(`\"${token}`), `forbidden field present: ${token}`);
}

console.log('TJK_2026_09_01_PROMOTION_REVIEW: pass pending meetings=2 races=16 rank=A');
