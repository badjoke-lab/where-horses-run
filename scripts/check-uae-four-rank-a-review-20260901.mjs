import fs from 'node:fs';

const unit = JSON.parse(fs.readFileSync('data/candidates/uae-four-rank-a-review-20260901.json', 'utf8'));
const expectedIds = [
  'era-abu-dhabi-turf-club-2026-04-04',
  'era-abu-dhabi-turf-club-2026-04-11',
  'era-al-ain-racecourse-2026-04-03',
  'era-al-ain-racecourse-2026-04-10',
].sort();
if (unit.schema_version !== 'uae-four-rank-a-review-unit-v1') throw new Error('review unit schema differs');
if (unit.review_status !== 'pending' || unit.promotion_status !== 'not_started') throw new Error('review unit escaped pending boundary');
if (unit.source?.workflow_run_id !== 33488095481 || unit.source?.artifact_id !== 9792598245) throw new Error('review source identity differs');
if (unit.source?.candidate_sha256 !== 'eda7fd10ee5ac1ea0f571c5814958bc4641ac25a30a1c1c7703ffb8789c84f51') throw new Error('candidate hash differs');
if (unit.source?.manifest_sha256 !== 'b4bd443550357ee0dba8000de294e8b1ab1f0827538dd68293a1b631b7fa867a') throw new Error('manifest hash differs');
if (unit.source?.coverage_claim !== 'source_window_complete' || unit.source?.source_error_count !== 0) throw new Error('source closure differs');
const ids = (unit.meetings ?? []).map((row) => row.meeting_id).sort();
if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) throw new Error(`meeting identities differ: ${JSON.stringify(ids)}`);
if (!unit.meetings.every((row) => row.capability_rank === 'A' && row.race_count >= 2 && /^\d{2}:\d{2}$/.test(row.first_race_time_local) && /^\d{2}:\d{2}$/.test(row.last_race_time_local))) throw new Error('Rank A meeting summary differs');
if (unit.excluded?.length !== 1 || unit.excluded[0].meeting_id !== 'era-meydan-racecourse-2026-04-01') throw new Error('Meydan exclusion differs');
if (unit.publication_boundary?.canonical_write !== false || unit.publication_boundary?.public_write !== false || unit.publication_boundary?.requires_explicit_review !== true) throw new Error('publication boundary differs');
console.log('UAE exact four Rank A review unit OK');
