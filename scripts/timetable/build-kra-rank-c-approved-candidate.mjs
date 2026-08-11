import fs from 'node:fs';
import path from 'node:path';
import { loadKraRankCCandidate } from './kra-calendar-plan-adapter.mjs';

const root = process.cwd();
const reviewPath = 'data/candidates/kra-2026-08-07-through-2026-09-06-rank-c-review-v1.json';
const outputPath = 'data/candidates/kra-2026-08-07-through-2026-09-06-rank-c-approved.json';
const checkOnly = process.argv.includes('--check');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
function compact(record) {
  return {
    meeting_id: record.meeting_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    capability_rank: record.capability_rank,
  };
}

const pendingCandidate = loadKraRankCCandidate();
const review = readJson(reviewPath);

assert(review.schema_version === 'kra-rank-c-promotion-review-v1', 'unexpected KRA promotion review schema');
assert(review.work_id === 'WHR-CAL-SOUTH-KOREA-KRA', 'unexpected KRA Work ID');
assert(review.implementation_unit === 'KRA-RANK-C-PROMOTION-REVIEW-01', 'unexpected KRA implementation unit');
assert(review.review?.status === 'approved', 'KRA promotion review is not approved');
assert(typeof review.review?.reviewer === 'string' && review.review.reviewer.trim(), 'KRA promotion reviewer is required');
assert(!Number.isNaN(Date.parse(review.review?.reviewed_at)), 'KRA reviewed_at must be a valid date-time');
assert(review.review?.promotion_target === 'canonical-timetable-v0', 'KRA promotion target differs');
assert(Date.parse(pendingCandidate.generated_at) <= Date.parse(review.review.reviewed_at), 'KRA approval predates the reviewed source candidate');
assert(review.meeting_count === 32 && pendingCandidate.records.length === 32, 'KRA reviewed meeting count must remain 32');
assert(review.candidate_window?.start_date === pendingCandidate.candidate_window.start_date, 'KRA candidate start differs');
assert(review.candidate_window?.end_date_exclusive === pendingCandidate.candidate_window.end_date_exclusive, 'KRA candidate end differs');
assert(review.candidate_window?.timezone === pendingCandidate.candidate_window.timezone, 'KRA candidate timezone differs');

const pendingCompact = pendingCandidate.records.map(compact);
assert(JSON.stringify(review.records) === JSON.stringify(pendingCompact), 'KRA approval manifest must exactly match the deterministic Rank C candidate set');
assert(pendingCandidate.records.every((record) => record.capability_rank === 'C'), 'KRA approved bundle may contain Rank C only');
assert(pendingCandidate.records.every((record) => record.first_race_time_local === null && record.last_race_time_local === null && record.timetable_rows.length === 0), 'KRA Rank C records must contain no timetable detail');

const records = pendingCandidate.records.map((record) => ({
  ...record,
  review_status: 'approved',
  notes: 'Human-approved KRA Rank C meeting identity. Publication remains limited to meeting date, racecourse identity, and reviewed official source trace.',
}));

const output = {
  ...pendingCandidate,
  records,
  review: {
    status: 'approved',
    reviewed_at: review.review.reviewed_at,
    reviewer: review.review.reviewer,
    promotion_target: review.review.promotion_target,
  },
};

const content = serialize(output);
const absoluteOutput = path.join(root, outputPath);
if (checkOnly) {
  assert(fs.existsSync(absoluteOutput), `missing generated approved candidate: ${outputPath}`);
  assert(fs.readFileSync(absoluteOutput, 'utf8') === content, `generated approved candidate is stale: ${outputPath}`);
  console.log(`KRA_RANK_C_APPROVED_CANDIDATE: pass records=${records.length}`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
fs.writeFileSync(absoluteOutput, content);
console.log(`KRA_RANK_C_APPROVED_CANDIDATE: wrote records=${records.length}`);
