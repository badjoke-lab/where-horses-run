import fs from 'node:fs';
import crypto from 'node:crypto';

const input = process.env.WHR_UAE_REVIEW_ARTIFACT;
const output = process.env.WHR_UAE_REVIEW_OUTPUT ?? 'data/candidates/uae-four-rank-a-approved-20260901.json';
if (!input) throw new Error('WHR_UAE_REVIEW_ARTIFACT is required');

const source = JSON.parse(fs.readFileSync(input, 'utf8'));
const expectedIds = [
  'era-abu-dhabi-turf-club-2026-04-04',
  'era-abu-dhabi-turf-club-2026-04-11',
  'era-al-ain-racecourse-2026-04-03',
  'era-al-ain-racecourse-2026-04-10',
].sort();
const exact = (value) => crypto.createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
const expectedCandidateSha = 'eda7fd10ee5ac1ea0f571c5814958bc4641ac25a30a1c1c7703ffb8789c84f51';
if (exact(source) !== expectedCandidateSha) throw new Error('UAE review candidate SHA-256 differs from exact reviewed artifact');
if (source.schema_version !== 'timetable-candidate-v1') throw new Error('candidate schema differs');
if (source.review?.status !== 'needs_review') throw new Error('source candidate is not awaiting review');
if (source.records?.length !== 4) throw new Error(`expected four UAE records, got ${source.records?.length}`);
const ids = source.records.map((row) => row.meeting_id).sort();
if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) throw new Error(`UAE identity set differs: ${JSON.stringify(ids)}`);
for (const record of source.records) {
  if (record.capability_rank !== 'A') throw new Error(`${record.meeting_id} is not Rank A`);
  if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length < 2) throw new Error(`${record.meeting_id} has incomplete timetable rows`);
  if (!record.timetable_rows.every((row, index) => row.label === `Race ${index + 1}` && /^\d{2}:\d{2}$/.test(row.post_time_local))) throw new Error(`${record.meeting_id} Race 1-N/post-time boundary differs`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['horse_name','jockey','trainer','odds','payout','result','prediction','raw_html','stream_url']) {
    if (serialized.includes(forbidden)) throw new Error(`${record.meeting_id} contains forbidden field ${forbidden}`);
  }
}
const approved = {
  ...source,
  review: {
    status: 'approved',
    reviewed_at: '2026-09-01T08:39:11Z',
    reviewer: 'bounded-review-pr',
    summary: 'Exact four-record UAE ERA Rank A review unit approved by merge of its bounded review PR. Evidence identity is pinned by candidate SHA-256.',
    promotion_target: 'canonical-timetable-v0',
  },
  records: source.records.map((record) => ({ ...record, review_status: 'approved' })),
};
fs.mkdirSync(new URL('../..', import.meta.url).pathname, { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(approved, null, 2)}\n`);
console.log(JSON.stringify({ output, source_candidate_sha256: expectedCandidateSha, meeting_ids: expectedIds, records: 4 }, null, 2));
