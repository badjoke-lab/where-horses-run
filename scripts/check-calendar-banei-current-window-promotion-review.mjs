import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const review = readJson('data/reviews/banei-current-window-promotion-review-v1.json');
const activation = readJson('data/reviews/banei-current-window-schedule-readiness-activation-v1.json');
const result = readJson('data/audits/calendar-banei-current-window-acquisition-result-v1.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');

if (review.schema_version !== 'calendar-banei-current-window-promotion-review-v1') fail('Banei promotion review schema differs');
if (review.work_id !== 'WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-PROMOTION-REVIEW' || review.implementation_unit !== 'BANEI-CURRENT-WINDOW-PROMOTION-01') fail('Banei promotion review identity differs');
if (review.source_result_ref !== 'data/audits/calendar-banei-current-window-acquisition-result-v1.json') fail('Banei promotion review result reference differs');
if (review.source_artifact?.workflow_run_id !== 29275669482 || review.source_artifact?.artifact_id !== 8289240383) fail('Banei promotion review artifact identity differs');
if (review.source_artifact?.artifact_digest !== 'sha256:b1021380e6223c8a4dc7c2719a0d4c451a72de14e58784f4264bc7c91de38d3e') fail('Banei promotion review artifact digest differs');
if (review.source_artifact?.campaign_result_sha256 !== 'f6161d6269fad0a6d25efb881df317ac5151ea49ef2b3522fef78bb1dc338b67') fail('Banei promotion review campaign digest differs');
if (review.review?.status !== 'approved' || review.review?.reviewer !== 'badjoke-lab' || review.review?.promotion_target !== 'canonical-timetable-v0' || review.review?.approval_scope !== 'exact_split_source_candidate_sets') fail('Banei promotion approval state differs');
if (Number.isNaN(Date.parse(review.review?.reviewed_at))) fail('Banei promotion review timestamp differs');
if (!Array.isArray(review.approved_sets) || review.approved_sets.length !== 2) fail('Banei promotion approved set count differs');
const cSet = review.approved_sets.find((set) => set.capability_rank === 'C');
const aPlusSet = review.approved_sets.find((set) => set.capability_rank === 'A+');
if (!cSet || cSet.source_id !== 'banei-official-schedule' || cSet.meeting_count !== 12 || cSet.race_row_count !== 0) fail('Banei approved C set differs');
if (!aPlusSet || aPlusSet.source_id !== 'nar-banei-race-list-deba-table' || aPlusSet.meeting_count !== 1 || aPlusSet.race_row_count !== 12) fail('Banei approved A+ set differs');
if (!exact([...(cSet?.meeting_ids ?? [])].sort(), [...result.lower_rank_meeting_ids].sort())) fail('Banei approved C IDs differ from acquisition result');
if (!exact([...(aPlusSet?.meeting_ids ?? [])].sort(), [...result.a_plus_meeting_ids].sort())) fail('Banei approved A+ IDs differ from acquisition result');
if (new Set([...(cSet?.meeting_ids ?? []), ...(aPlusSet?.meeting_ids ?? [])]).size !== 13) fail('Banei approved ID closure differs');
if (review.review_checks?.total_meeting_count !== 13
  || review.review_checks?.c_meeting_count !== 12
  || review.review_checks?.a_plus_meeting_count !== 1
  || review.review_checks?.a_plus_race_row_count !== 12) fail('Banei promotion review counts differ');
for (const key of [
  'c_records_have_no_times', 'c_records_have_no_timetable_rows',
  'a_plus_continuous_race_numbers', 'a_plus_all_post_times_complete',
  'a_plus_all_race_names_complete', 'a_plus_all_distances_complete',
  'a_plus_all_surfaces_complete', 'a_plus_all_course_labels_complete',
  'official_source_hosts_only',
]) if (review.review_checks?.[key] !== true) fail(`Banei positive review check differs: ${key}`);
for (const key of [
  'participant_fields_approved', 'betting_fields_approved', 'result_fields_approved',
  'payout_fields_approved', 'raw_source_approved', 'stream_fields_approved',
]) if (review.review_checks?.[key] !== false) fail(`Banei prohibited review boundary differs: ${key}`);
if (Object.values(review.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Banei promotion review side-effect boundary differs');

if (activation.schema_version !== 'calendar-banei-current-window-schedule-readiness-activation-v1') fail('Banei readiness activation schema differs');
if (activation.work_id !== review.work_id || activation.implementation_unit !== review.implementation_unit) fail('Banei readiness activation identity differs');
if (activation.source_result_ref !== review.source_result_ref) fail('Banei readiness activation result reference differs');
if (activation.authority_source_key !== 'japan/banei-tokachi/banei-official-schedule'
  || activation.system_id !== 'japan-banei-system'
  || activation.source_id !== 'banei-official-schedule') fail('Banei readiness activation source identity differs');
if (activation.reviewed_transition?.from_automation_mode !== 'link_only'
  || activation.reviewed_transition?.to_automation_mode !== 'semi_automatic'
  || !exact(activation.reviewed_transition?.canonical_rank_scope, ['C'])) fail('Banei readiness activation transition differs');
if (activation.reviewed_transition?.confirmed_fields_required?.meeting_date !== true
  || activation.reviewed_transition?.confirmed_fields_required?.racecourse !== true) fail('Banei readiness activation confirmed fields differ');
if (activation.evidence?.workflow_run_id !== 29275669482
  || activation.evidence?.artifact_id !== 8289240383
  || activation.evidence?.reviewed_schedule_meeting_count !== 13
  || activation.evidence?.reviewed_c_schedule_meeting_count !== 12
  || activation.evidence?.raw_source_storage !== false) fail('Banei readiness activation evidence differs');
if (Object.values(activation.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Banei readiness activation side-effect boundary differs');

if (result.result?.records_discovered !== 13 || result.result?.a_plus_candidate_count !== 1 || result.result?.lower_rank_candidate_count !== 12) fail('Banei acquisition result dependency differs');
if (!exact(result.result?.rank_counts, { C: 12, B: 0, 'B+': 0, A: 0, 'A+': 1 })) fail('Banei acquisition result ranks differ');
const currentWindowBanei = canonical.meetings.filter((meeting) => meeting.authority_id === 'banei-tokachi' && meeting.date >= '2026-07-13' && meeting.date < '2026-08-12');
if (currentWindowBanei.length !== 0) fail(`Banei promotion baseline must remain zero before proposal application, got ${currentWindowBanei.length}`);

for (const file of [
  'data/reviews/banei-current-window-schedule-readiness-activation-v1.json',
  'scripts/timetable/prepare-banei-current-window-promotion-proposal.mjs',
  'docs/calendar/banei-current-window-promotion-review.md',
  '.github/workflows/calendar-banei-current-window-promotion-review.yml',
]) if (!fs.existsSync(path.join(root, file))) fail(`Banei promotion component missing: ${file}`);
const builder = readText('scripts/timetable/prepare-banei-current-window-promotion-proposal.mjs');
for (const phrase of [
  'exact_split_source_candidate_sets',
  "source_id: 'banei-official-schedule'",
  "source_id: 'nar-banei-race-list-deba-table'",
  'promoteApprovedCandidateV1',
  "sequential_promotion_order: ['C_schedule_set', 'A_plus_detail_set']",
  'calendar-banei-current-window-readiness-activation-proposal-v1',
  'readiness_registry_write: false',
  'human_merge_required: true',
  'existingWindowBanei.length === 0',
]) if (!builder.includes(phrase)) fail(`Banei promotion builder missing ${phrase}`);
const workflow = readText('.github/workflows/calendar-banei-current-window-promotion-review.yml');
for (const phrase of [
  'actions: read',
  'run-id: 29275669482',
  'prepare-banei-current-window-promotion-proposal.mjs',
  'actions/upload-artifact@v4',
  'reviewed-readiness-activation.json',
  'Prove protected state unchanged',
]) if (!workflow.includes(phrase)) fail(`Banei promotion workflow missing ${phrase}`);
if (/\bschedule\s*:|\bcron\s*:|contents:\s*write/.test(workflow)) fail('Banei promotion workflow enables scheduled or content-write operation');
for (const forbidden of ['build-public-timetable-view.mjs', 'wrangler pages deploy', 'npm run deploy']) {
  if (workflow.includes(forbidden)) fail(`Banei promotion workflow contains forbidden direct action ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_CURRENT_WINDOW_PROMOTION_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_BANEI_CURRENT_WINDOW_PROMOTION_REVIEW: pass');
console.log('APPROVED_C_MEETINGS: 12');
console.log('APPROVED_A_PLUS_MEETINGS: 1');
console.log('APPROVED_A_PLUS_RACE_ROWS: 12');
console.log('READINESS_ACTIVATION: link_only -> semi_automatic / Rank C only');
console.log('SOURCE_SETS: banei-official-schedule,nar-banei-race-list-deba-table');
console.log('CANONICAL_PUBLIC_WRITE: false');
