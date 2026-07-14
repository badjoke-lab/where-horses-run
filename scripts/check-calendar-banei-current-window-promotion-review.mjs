import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const review = readJson('data/reviews/banei-current-window-promotion-review-v1.json');
const activation = readJson('data/reviews/banei-current-window-schedule-readiness-activation-v1.json');
const result = readJson('data/audits/calendar-banei-current-window-acquisition-result-v1.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');

if (review.schema_version !== 'calendar-banei-current-window-promotion-review-v1') fail('Banei promotion review schema differs.');
if (review.work_id !== 'WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-PROMOTION-REVIEW' || review.implementation_unit !== 'BANEI-CURRENT-WINDOW-PROMOTION-01') fail('Banei promotion review identity differs.');
if (review.source_artifact?.workflow_run_id !== 29275669482 || review.source_artifact?.artifact_id !== 8289240383) fail('Banei promotion review artifact identity differs.');
if (review.review?.status !== 'approved' || review.review?.reviewer !== 'badjoke-lab' || review.review?.approval_scope !== 'exact_split_source_candidate_sets') fail('Banei promotion approval differs.');
const cSet = review.approved_sets?.find((set) => set.capability_rank === 'C');
const aPlusSet = review.approved_sets?.find((set) => set.capability_rank === 'A+');
if (!cSet || cSet.source_id !== 'banei-official-schedule' || cSet.meeting_count !== 12 || cSet.race_row_count !== 0) fail('Banei approved C set differs.');
if (!aPlusSet || aPlusSet.source_id !== 'nar-banei-race-list-deba-table' || aPlusSet.meeting_count !== 1 || aPlusSet.race_row_count !== 12) fail('Banei approved A+ set differs.');
if (!exact([...(cSet?.meeting_ids ?? [])].sort(), [...result.lower_rank_meeting_ids].sort())) fail('Banei approved C IDs differ from acquisition result.');
if (!exact([...(aPlusSet?.meeting_ids ?? [])].sort(), [...result.a_plus_meeting_ids].sort())) fail('Banei approved A+ IDs differ from acquisition result.');
for (const key of ['participant_fields_approved', 'betting_fields_approved', 'result_fields_approved', 'payout_fields_approved', 'raw_source_approved', 'stream_fields_approved']) {
  if (review.review_checks?.[key] !== false) fail(`Banei prohibited review boundary differs: ${key}`);
}
if (Object.values(review.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Banei review side-effect boundary differs.');

if (activation.schema_version !== 'calendar-banei-current-window-schedule-readiness-activation-v1') fail('Banei readiness activation schema differs.');
if (activation.reviewed_transition?.from_automation_mode !== 'link_only' || activation.reviewed_transition?.to_automation_mode !== 'semi_automatic' || !exact(activation.reviewed_transition?.canonical_rank_scope, ['C'])) fail('Banei readiness activation transition differs.');
if (Object.values(activation.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Banei readiness activation review boundary differs.');

const approvedIds = new Set([...(cSet?.meeting_ids ?? []), ...(aPlusSet?.meeting_ids ?? [])]);
const current = canonical.meetings.filter((meeting) => meeting.authority_id === 'banei-tokachi' && meeting.date >= '2026-07-13' && meeting.date < '2026-08-12');
if (![0, 13].includes(current.length)) fail(`Banei promotion state must be pre-apply 0 or applied 13; got ${current.length}.`);
if (current.length === 13) {
  const currentById = new Map(current.map((meeting) => [meeting.meeting_id, meeting]));
  for (const id of approvedIds) if (!currentById.has(id)) fail(`Applied Banei meeting missing: ${id}`);
  for (const id of cSet.meeting_ids) if (currentById.get(id)?.capability_rank !== 'C') fail(`${id}: applied C rank differs.`);
  for (const id of aPlusSet.meeting_ids) if (currentById.get(id)?.capability_rank !== 'A+') fail(`${id}: applied A+ rank differs.`);
  const appliedReadiness = readiness.records.find((record) => record.authority_source_key === activation.authority_source_key);
  if (!appliedReadiness || appliedReadiness.readiness !== 'prototype_ready' || appliedReadiness.automation_mode !== 'semi_automatic' || appliedReadiness.technical_rank !== 'C') fail('Applied Banei schedule Readiness differs.');
  for (const file of ['data/candidates/banei-current-window-c-schedule-approved.json', 'data/candidates/banei-current-window-a-plus-approved.json']) {
    if (!fs.existsSync(path.join(root, file))) fail(`Applied Banei candidate missing: ${file}`);
  }
}

for (const file of [
  'scripts/timetable/prepare-banei-current-window-promotion-proposal.mjs',
  'docs/calendar/banei-current-window-promotion-review.md',
  '.github/workflows/calendar-banei-current-window-promotion-review.yml',
]) if (!fs.existsSync(path.join(root, file))) fail(`Banei promotion component missing: ${file}`);

if (errors.length) {
  console.error(`CALENDAR_BANEI_CURRENT_WINDOW_PROMOTION_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_BANEI_CURRENT_WINDOW_PROMOTION_REVIEW: pass');
console.log(`PROMOTION_STATE: ${current.length === 13 ? 'applied_exact_review' : 'reviewed_pre_apply'}`);
console.log('APPROVED_C_MEETINGS: 12');
console.log('APPROVED_A_PLUS_MEETINGS: 1');
