import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const review = readJson('data/reviews/nar-current-window-a-plus-review-v1.json');
const result = readJson('data/audits/calendar-nar-current-window-retry-result-v1.json');
const canonicalMeetings = readJson('data/generated/timetable/canonical/meetings.json');
const canonicalDetails = readJson('data/generated/timetable/canonical/meeting-details.json');

if (review.schema_version !== 'calendar-nar-current-window-a-plus-review-v1') fail('NAR promotion review schema differs.');
if (review.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-PROMOTION-REVIEW' || review.implementation_unit !== 'NAR-CURRENT-WINDOW-PROMOTION-01') fail('NAR promotion review identity differs.');
if (review.source_artifact?.workflow_run_id !== 29233820152 || review.source_artifact?.artifact_id !== 8272633802) fail('NAR promotion evidence identity differs.');
if (review.review?.status !== 'approved' || review.review?.reviewer !== 'badjoke-lab' || review.review?.approval_scope !== 'exact_a_plus_subset_only') fail('NAR promotion approval differs.');
if (review.approved_rank_counts?.['A+'] !== 15 || review.excluded_rank_counts?.C !== 51) fail('NAR promotion rank counts differ.');
if (review.approved_meeting_ids?.length !== 15 || new Set(review.approved_meeting_ids).size !== 15) fail('NAR approved meeting set differs.');
if (!exact([...review.approved_meeting_ids].sort(), [...result.resolved_meeting_ids].sort())) fail('NAR approved IDs differ from retry result.');
if (review.review_checks?.meeting_count !== 15 || review.review_checks?.race_row_count !== 180) fail('NAR reviewed counts differ.');
for (const key of ['participant_fields_approved', 'betting_fields_approved', 'result_fields_approved', 'payout_fields_approved', 'raw_source_approved', 'stream_fields_approved']) {
  if (review.review_checks?.[key] !== false) fail(`NAR prohibited review boundary differs: ${key}`);
}
if (Object.values(review.side_effect_boundary ?? {}).some((value) => value !== false)) fail('NAR review side-effect boundary differs.');

const meetingById = new Map(canonicalMeetings.meetings.map((meeting) => [meeting.meeting_id, meeting]));
const detailById = new Map(canonicalDetails.details.map((detail) => [detail.meeting_id, detail]));
const observedRanks = new Set();
for (const id of review.approved_meeting_ids ?? []) {
  const meeting = meetingById.get(id);
  if (!meeting || meeting.authority_id !== 'nar-local-government-racing') {
    fail(`NAR approved meeting missing: ${id}`);
    continue;
  }
  observedRanks.add(meeting.capability_rank);
  if (!['C', 'A+'].includes(meeting.capability_rank)) fail(`${id}: unexpected Canonical rank ${meeting.capability_rank}.`);
  if (meeting.capability_rank === 'A+') {
    const detail = detailById.get(id);
    if (!detail || detail.capability_rank !== 'A+' || detail.timetable_rows?.length !== 12) fail(`${id}: applied A+ detail differs.`);
  }
}
if (observedRanks.size !== 1) fail(`NAR approved set must be entirely pre-apply C or applied A+; got ${[...observedRanks].join(',')}.`);
const state = observedRanks.has('A+') ? 'applied_a_plus_15' : 'reviewed_pre_apply_c_15';
if (state === 'applied_a_plus_15') {
  const totalRows = review.approved_meeting_ids.reduce((sum, id) => sum + (detailById.get(id)?.timetable_rows?.length ?? 0), 0);
  if (totalRows !== 180) fail(`Applied NAR race-row total differs: ${totalRows}.`);
}

for (const file of [
  'scripts/timetable/prepare-nar-current-window-promotion-proposal.mjs',
  '.github/workflows/calendar-nar-current-window-promotion-review.yml',
  'docs/calendar/nar-current-window-promotion-review.md',
]) if (!fs.existsSync(path.join(root, file))) fail(`NAR promotion component missing: ${file}`);

if (errors.length) {
  console.error(`CALENDAR_NAR_CURRENT_WINDOW_PROMOTION_REVIEW: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_CURRENT_WINDOW_PROMOTION_REVIEW: pass');
console.log(`PROMOTION_STATE: ${state}`);
console.log('APPROVED_A_PLUS_MEETINGS: 15');
console.log('APPROVED_RACE_ROWS: 180');
