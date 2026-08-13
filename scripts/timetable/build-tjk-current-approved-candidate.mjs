import fs from 'node:fs';
import path from 'node:path';
import { loadTjkCurrentBoundedCandidate } from './tjk-current-bounded-adapter.mjs';

const root = process.cwd();
const reviewPath = 'data/candidates/tjk-current-2026-08-11-promotion-review-v1.json';
const identityReviewPath = 'data/static/tjk-2026-08-11-reviewed-public-timetable-identities-v1.json';
const outputPath = 'data/candidates/tjk-current-2026-08-11-approved.json';
const checkOnly = process.argv.includes('--check');

function assert(condition, message) { if (!condition) throw new Error(message); }
function readJson(relativePath) { return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')); }
function serialize(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function normalizeDateTime(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value; }

const pending = loadTjkCurrentBoundedCandidate();
const review = readJson(reviewPath);
const identities = readJson(identityReviewPath);

assert(review.review?.status === 'approved', 'TJK promotion review is not approved');
assert(review.review?.reviewer === 'badjoke-lab', 'TJK promotion reviewer differs');
assert(review.review?.reviewed_at === '2026-08-12T06:29:00Z', 'TJK reviewed_at differs');
assert(Date.parse(pending.generated_at) <= Date.parse(review.review.reviewed_at), 'TJK approval predates candidate generation');
assert(identities.review?.status === 'approved', 'TJK identity review is not approved');
assert(identities.review?.reviewer === review.review.reviewer, 'TJK identity reviewer differs');
assert(identities.review?.reviewed_at === review.review.reviewed_at, 'TJK identity reviewed_at differs');
assert(review.meeting_count === 2 && review.race_count === 18 && pending.records.length === 2, 'TJK approved scope must remain 2 meetings / 18 races');

const identityBySourceVenue = new Map(identities.records.map((record) => [record.source_venue_id, record]));
const reviewBySourceVenue = new Map(review.records.map((record) => [record.source_venue_id, record]));
assert(identityBySourceVenue.size === 2 && reviewBySourceVenue.size === 2, 'TJK approved identity/review scope differs');

const records = pending.records.map((record) => {
  const identity = identityBySourceVenue.get(record.source_venue_id);
  const approved = reviewBySourceVenue.get(record.source_venue_id);
  assert(identity && approved, `missing approved identity mapping for TJK venue ${record.source_venue_id}`);
  assert(identity.racecourse_id === approved.public_racecourse_id, `TJK racecourse mapping differs for venue ${record.source_venue_id}`);
  assert(approved.meeting_id === record.meeting_id, `TJK source meeting binding differs for venue ${record.source_venue_id}`);
  assert(approved.source_venue_label === record.source_venue_label, `TJK source venue label differs for venue ${record.source_venue_id}`);
  assert(approved.date === record.date, `TJK date differs for venue ${record.source_venue_id}`);
  assert(approved.first_race_time_local === record.first_race_time_local, `TJK first post differs for venue ${record.source_venue_id}`);
  assert(approved.last_race_time_local === record.last_race_time_local, `TJK last post differs for venue ${record.source_venue_id}`);
  assert(JSON.stringify(approved.race_schedule) === JSON.stringify(record.timetable_rows), `TJK Race 1-N schedule differs for venue ${record.source_venue_id}`);

  return {
    candidate_id: `candidate-${approved.canonical_meeting_id}`,
    meeting_id: approved.canonical_meeting_id,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racing_system_id: record.racing_system_id,
    racecourse_id: approved.public_racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: 'A',
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local,
    timetable_rows: record.timetable_rows.map((row) => ({ label: `Race ${row.race_number}`, post_time_local: row.post_time_local })),
    source: {
      source_id: record.source.source_id,
      official_url: record.source.landing_url,
      checked_at: normalizeDateTime(record.source.checked_at),
      extraction_method: 'adapter_candidate',
    },
    confidence: record.confidence,
    review_status: 'approved',
    notes: `Human-approved current TJK Rank A timetable for ${record.source_venue_label}. Public output is limited to meeting identity and Race 1-N post times; A+ technical source capability does not expand the public field set.`,
  };
});

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: pending.generated_at,
  adapter_id: 'tjk-current-2026-08-11-approved-v1',
  country_id: pending.country_id,
  authority_id: pending.authority_id,
  source_id: pending.source_id,
  technical_capability_rank: 'A+',
  publication_ceiling: 'A',
  candidate_window: pending.candidate_window,
  records,
  review: { status: 'approved', reviewed_at: review.review.reviewed_at, reviewer: review.review.reviewer, promotion_target: 'canonical-timetable-v0' },
  publication_effect: 'reviewed-promotion-unit',
};

const content = serialize(output);
const absoluteOutput = path.join(root, outputPath);
if (checkOnly) {
  assert(fs.existsSync(absoluteOutput), `missing generated approved candidate: ${outputPath}`);
  assert(fs.readFileSync(absoluteOutput, 'utf8') === content, `generated approved candidate is stale: ${outputPath}`);
  console.log('TJK_CURRENT_APPROVED_CANDIDATE: pass meetings=2 races=18');
  process.exit(0);
}
fs.writeFileSync(absoluteOutput, content);
console.log('TJK_CURRENT_APPROVED_CANDIDATE: wrote meetings=2 races=18');
