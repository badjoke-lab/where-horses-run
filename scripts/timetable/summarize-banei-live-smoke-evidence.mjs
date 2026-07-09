import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const inputRoot = args.get('--input-root');
const outputPath = args.get('--output');
if (!inputRoot || !outputPath) throw new Error('--input-root and --output are required');

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.resolve(root, inputRoot, filename), 'utf8'));
}

function digest(filename) {
  const buffer = fs.readFileSync(path.resolve(root, inputRoot, filename));
  return createHash('sha256').update(buffer).digest('hex');
}

const candidate = readJson('candidate.json');
const coverage = readJson('coverage-observation.json');
const report = readJson('collection-report.json');
if (candidate.schema_version !== 'timetable-candidate-v1') throw new Error('candidate schema mismatch');
if (candidate.records.length !== 1) throw new Error(`expected one candidate, got ${candidate.records.length}`);
const record = candidate.records[0];
if (record.capability_rank !== 'A+') throw new Error(`expected A+, got ${record.capability_rank}`);
if (!Array.isArray(record.timetable_rows) || record.timetable_rows.length === 0) throw new Error('A+ candidate has no timetable rows');
if (!record.timetable_rows.every((row) => row.surface === 'Dirt' && row.course_label === 'Banei Straight Course')) {
  throw new Error('Banei row metadata differs');
}
if (coverage.coverage_claim !== 'source_window_complete' || coverage.unresolved_meeting_ids.length !== 0 || coverage.source_errors.length !== 0) {
  throw new Error('live smoke coverage is incomplete');
}
if (report.publication_effect !== 'none'
  || report.promotion_eligible_candidates !== 0
  || report.canonical_write !== 'disabled'
  || report.public_write !== 'disabled'
  || report.raw_source_storage !== 'disabled') {
  throw new Error('live smoke side-effect boundary differs');
}

const evidence = {
  schema_version: 'calendar-banei-live-smoke-evidence-v1',
  generated_at: report.generated_at,
  work_id: 'WHR-CAL-JAPAN-BANEI-A-PLUS',
  system_id: 'japan-banei-system',
  meeting_id: record.meeting_id,
  meeting_date: record.date,
  source_id: candidate.source_id,
  adapter_id: candidate.adapter_id,
  source_url: record.source.official_url,
  observed_rank: record.capability_rank,
  race_row_count: record.timetable_rows.length,
  first_race_time_local: record.first_race_time_local,
  last_race_time_local: record.last_race_time_local,
  row_semantics: {
    all_rows_have_post_time: record.timetable_rows.every((row) => typeof row.post_time_local === 'string'),
    all_rows_have_race_name: record.timetable_rows.every((row) => typeof row.race_name === 'string' && row.race_name.length > 0),
    all_rows_distance_200m: record.timetable_rows.every((row) => row.distance_m === 200),
    all_rows_surface_dirt: record.timetable_rows.every((row) => row.surface === 'Dirt'),
    all_rows_course_banei_straight: record.timetable_rows.every((row) => row.course_label === 'Banei Straight Course')
  },
  coverage: {
    claim: coverage.coverage_claim,
    records_discovered: coverage.records_discovered,
    records_updated: coverage.records_updated,
    unresolved_date_count: coverage.unresolved_dates.length,
    unresolved_meeting_count: coverage.unresolved_meeting_ids.length,
    source_error_count: coverage.source_errors.length
  },
  runner_evidence: {
    environment: 'github_actions',
    scope_mode: report.collection_mode,
    meetings_targeted: report.meetings_targeted,
    complete_a_plus_candidates: report.complete_a_plus_candidates,
    blocked_meetings: report.blocked_meetings
  },
  artifact_digests_sha256: {
    candidate: digest('candidate.json'),
    coverage_observation: digest('coverage-observation.json'),
    collection_report: digest('collection-report.json')
  },
  review_boundary: {
    candidate_review_status: candidate.review.status,
    promotion_eligible_candidates: report.promotion_eligible_candidates,
    publication_effect: report.publication_effect,
    canonical_write: report.canonical_write,
    public_write: report.public_write,
    raw_source_storage: report.raw_source_storage
  }
};

const serialized = JSON.stringify(evidence).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`\"${forbidden}\"`)) throw new Error(`forbidden evidence key: ${forbidden}`);
}

const output = path.resolve(root, outputPath);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(root, output),
  meeting_id: evidence.meeting_id,
  observed_rank: evidence.observed_rank,
  race_row_count: evidence.race_row_count,
  coverage_claim: evidence.coverage.claim,
  source_error_count: evidence.coverage.source_error_count,
  publication_effect: evidence.review_boundary.publication_effect
}));
