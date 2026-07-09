import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const evidencePath = path.join(root, 'data/fixtures/calendar-banei-live-smoke-evidence-v1.json');
if (!fs.existsSync(evidencePath)) {
  console.error('BANEI_LIVE_SMOKE_EVIDENCE: missing evidence file');
  process.exit(1);
}
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);

if (evidence.schema_version !== 'calendar-banei-live-smoke-evidence-v1') fail('schema_version differs');
if (evidence.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') fail('work_id differs');
if (evidence.system_id !== 'japan-banei-system') fail('system_id differs');
if (evidence.source_id !== 'nar-banei-race-list-deba-table') fail('source_id differs');
if (evidence.adapter_id !== 'banei-nar-race-list-detail-v1') fail('adapter_id differs');
if (evidence.observed_rank !== 'A+') fail('observed_rank must be A+');
if (!Number.isInteger(evidence.race_row_count) || evidence.race_row_count < 1) fail('race_row_count invalid');
if (typeof evidence.first_race_time_local !== 'string' || typeof evidence.last_race_time_local !== 'string') fail('first/last race times missing');
if (!evidence.source_url?.startsWith('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?')) fail('source_url is not official NAR RaceList');

for (const [key, value] of Object.entries(evidence.row_semantics ?? {})) {
  if (value !== true) fail(`row_semantics.${key} must be true`);
}
if (Object.keys(evidence.row_semantics ?? {}).length !== 5) fail('row_semantics key count differs');

if (evidence.coverage?.claim !== 'source_window_complete') fail('coverage claim differs');
if (evidence.coverage?.records_discovered !== 1 || evidence.coverage?.records_updated !== 1) fail('coverage record counts differ');
if (evidence.coverage?.unresolved_date_count !== 0) fail('unresolved_date_count must be zero');
if (evidence.coverage?.unresolved_meeting_count !== 0) fail('unresolved_meeting_count must be zero');
if (evidence.coverage?.source_error_count !== 0) fail('source_error_count must be zero');

if (evidence.runner_evidence?.environment !== 'github_actions') fail('runner evidence environment differs');
if (evidence.runner_evidence?.scope_mode !== 'date_window') fail('scope_mode differs');
if (evidence.runner_evidence?.meetings_targeted !== 1) fail('meetings_targeted differs');
if (evidence.runner_evidence?.complete_a_plus_candidates !== 1) fail('complete_a_plus_candidates differs');
if (evidence.runner_evidence?.blocked_meetings !== 0) fail('blocked_meetings must be zero');

for (const [key, digest] of Object.entries(evidence.artifact_digests_sha256 ?? {})) {
  if (!/^[0-9a-f]{64}$/.test(digest)) fail(`artifact digest invalid for ${key}`);
}
if (Object.keys(evidence.artifact_digests_sha256 ?? {}).length !== 3) fail('artifact digest count differs');

if (evidence.review_boundary?.candidate_review_status !== 'needs_review') fail('candidate review status differs');
if (evidence.review_boundary?.promotion_eligible_candidates !== 0) fail('promotion eligible count must be zero');
if (evidence.review_boundary?.publication_effect !== 'none') fail('publication effect differs');
if (evidence.review_boundary?.canonical_write !== 'disabled') fail('canonical write boundary differs');
if (evidence.review_boundary?.public_write !== 'disabled') fail('public write boundary differs');
if (evidence.review_boundary?.raw_source_storage !== 'disabled') fail('raw source storage boundary differs');

const serialized = JSON.stringify(evidence).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`\"${forbidden}\"`)) fail(`forbidden evidence key present: ${forbidden}`);
}

if (errors.length) {
  console.error(`BANEI_LIVE_SMOKE_EVIDENCE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('BANEI_LIVE_SMOKE_EVIDENCE: pass');
console.log(`MEETING_ID: ${evidence.meeting_id}`);
console.log(`OBSERVED_RANK: ${evidence.observed_rank}`);
console.log(`RACE_ROWS: ${evidence.race_row_count}`);
console.log(`COVERAGE: ${evidence.coverage.claim}`);
console.log(`RUNNER_ENVIRONMENT: ${evidence.runner_evidence.environment}`);
console.log(`PUBLICATION_EFFECT: ${evidence.review_boundary.publication_effect}`);
