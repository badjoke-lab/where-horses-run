import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const review = readJson('data/reviews/nar-current-window-a-plus-review-v1.json');
const result = readJson('data/audits/calendar-nar-current-window-retry-result-v1.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');

if (review.schema_version !== 'calendar-nar-current-window-a-plus-review-v1') fail('NAR promotion review schema differs');
if (review.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-PROMOTION-REVIEW' || review.implementation_unit !== 'NAR-CURRENT-WINDOW-PROMOTION-01') fail('NAR promotion review identity differs');
if (review.source_result_ref !== 'data/audits/calendar-nar-current-window-retry-result-v1.json') fail('NAR promotion review source result reference differs');
if (review.source_artifact?.workflow_run_id !== 29233820152 || review.source_artifact?.artifact_id !== 8272633802) fail('NAR promotion review source evidence identity differs');
if (review.source_artifact?.artifact_digest !== 'sha256:304e980b2d011383fae62fc69d3b3708784aa4b49ef02e94c267862300e94421') fail('NAR promotion review artifact digest differs');
if (review.source_artifact?.batch_id !== 'nar-current-window-selected-retry-2026-07-batch-001' || review.source_artifact?.generated_at !== '2026-07-13T07:58:52Z') fail('NAR promotion review batch identity differs');
for (const [key, expected] of Object.entries({
  batch_json: '1010c1dbefec4f8971036db90d7160fcd770e43db81866adb5f331c2792e000a',
  collection_report_json: 'c41392c0b121c6cb26d74b802140789b9eb4c788f5583a271ce2c3f6f1f7fa3c',
  coverage_observation_json: 'bcb97525f0a062f9a462474ad9c36988648040fc43392d52a4067ff7befdc3d3',
  retry_targets_json: 'e91675db70af017722037faf96ff6b4e24082aebdeecd8714f9604d6e2bc140f',
})) if (review.source_artifact?.file_sha256?.[key] !== expected) fail(`NAR promotion review file SHA differs: ${key}`);
if (review.review?.status !== 'approved' || review.review?.reviewer !== 'badjoke-lab' || review.review?.promotion_target !== 'canonical-timetable-v0' || review.review?.approval_scope !== 'exact_a_plus_subset_only') fail('NAR promotion review approval state differs');
if (Number.isNaN(Date.parse(review.review?.reviewed_at)) || Date.parse(review.review.reviewed_at) < Date.parse(review.source_artifact.generated_at)) fail('NAR promotion review timestamp differs');
if (review.approved_rank_counts?.['A+'] !== 15 || review.approved_rank_counts?.C !== 0 || review.excluded_rank_counts?.C !== 51) fail('NAR promotion review rank counts differ');
if (review.approved_meeting_ids.length !== 15 || new Set(review.approved_meeting_ids).size !== 15) fail('NAR promotion approved meeting set differs');
if (!exact([...review.approved_meeting_ids].sort(), [...result.resolved_meeting_ids].sort())) fail('NAR promotion approved IDs differ from live result');
if (review.approved_meeting_ids.some((id) => result.unresolved_meeting_ids.includes(id))) fail('NAR promotion approved set overlaps unresolved set');
if (review.review_checks?.meeting_count !== 15 || review.review_checks?.race_row_count !== 180) fail('NAR promotion review checked counts differ');
for (const key of ['continuous_race_numbers', 'all_post_times_complete', 'all_race_names_complete', 'all_distances_complete', 'all_surfaces_complete', 'all_course_labels_complete', 'official_hostname_only']) {
  if (review.review_checks?.[key] !== true) fail(`NAR promotion positive review check differs: ${key}`);
}
for (const key of ['participant_fields_approved', 'betting_fields_approved', 'result_fields_approved', 'payout_fields_approved', 'raw_source_approved', 'stream_fields_approved']) {
  if (review.review_checks?.[key] !== false) fail(`NAR promotion prohibited-field boundary differs: ${key}`);
}
if (Object.values(review.side_effect_boundary ?? {}).some((value) => value !== false)) fail('NAR promotion review side-effect boundary differs');

const canonicalById = new Map(canonical.meetings.map((meeting) => [meeting.meeting_id, meeting]));
for (const id of review.approved_meeting_ids) {
  const meeting = canonicalById.get(id);
  if (!meeting || meeting.authority_id !== 'nar-local-government-racing' || meeting.capability_rank !== 'C') fail(`NAR approved source meeting is not current Canonical C: ${id}`);
}

for (const file of [
  'scripts/timetable/prepare-nar-current-window-promotion-proposal.mjs',
  '.github/workflows/calendar-nar-current-window-promotion-review.yml',
  'docs/calendar/nar-current-window-promotion-review.md',
]) if (!fs.existsSync(path.join(root, file))) fail(`NAR promotion component missing: ${file}`);
const builder = readText('scripts/timetable/prepare-nar-current-window-promotion-proposal.mjs');
for (const phrase of [
  'exact_a_plus_subset_only',
  'source batch must use selected_meetings',
  'approved meeting IDs differ from source A+ candidates',
  'totalRaceRows === 180',
  "source_id: 'nar-race-list-deba-table'",
  "extraction_method: 'adapter_candidate'",
  'promoteApprovedCandidateV1',
  'human_merge_required: true',
]) if (!builder.includes(phrase)) fail(`NAR promotion builder missing ${phrase}`);
const workflow = readText('.github/workflows/calendar-nar-current-window-promotion-review.yml');
for (const phrase of ['actions: read', 'run-id: 29233820152', 'prepare-nar-current-window-promotion-proposal.mjs', 'actions/upload-artifact@v4', 'Prove protected state unchanged']) {
  if (!workflow.includes(phrase)) fail(`NAR promotion workflow missing ${phrase}`);
}
if (/\bschedule\s*:|\bcron\s*:|contents:\s*write/.test(workflow)) fail('NAR promotion workflow enables scheduled or content-write operation');
for (const forbidden of ['promote:timetable', 'build-public-timetable-view.mjs', 'wrangler pages deploy']) {
  if (workflow.includes(forbidden)) fail(`NAR promotion workflow contains forbidden direct action ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_NAR_CURRENT_WINDOW_PROMOTION_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_CURRENT_WINDOW_PROMOTION_REVIEW: pass');
console.log('APPROVED_A_PLUS_MEETINGS: 15');
console.log('APPROVED_RACE_ROWS: 180');
console.log('EXCLUDED_C_RETRY_TARGETS: 51');
console.log('SOURCE_ARTIFACT: pinned_by_artifact_and_file_sha256');
console.log('CANONICAL_PUBLIC_WRITE: false');
