import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const policy = readJson('data/static/calendar-banei-current-window-policy-v1.json');
const sourceDecision = readJson(policy.source_decision_ref);
const resultAudit = readJson('data/audits/calendar-banei-current-window-acquisition-result-v1.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');

if (policy.schema_version !== 'calendar-banei-current-window-policy-v1') fail('Banei current-window policy schema differs.');
if (policy.work_id !== 'WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-ACQUISITION' || policy.implementation_unit !== 'BANEI-CURRENT-WINDOW-01') fail('Banei policy identity differs.');
if (!exact(policy.window, { start_date: '2026-07-13', end_date_exclusive: '2026-08-12', timezone: 'Asia/Tokyo' })) fail('Banei acquisition window differs.');
if (!exact(policy.month_jobs.map((entry) => entry.target_month), ['2026-07', '2026-08'])) fail('Banei month split differs.');
if (Object.values(policy.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Banei acquisition policy side-effect boundary differs.');

const historical = sourceDecision.systems?.find((record) => record.system_id === 'japan-banei-system');
if (!historical || historical.canonical_meeting_count !== 0 || historical.decision !== 'acquire_schedule_before_detail_retry') fail('Banei historical source decision differs.');

if (resultAudit.schema_version !== 'calendar-banei-current-window-acquisition-result-v1') fail('Banei acquisition result schema differs.');
if (resultAudit.decision !== 'accept_review_only_current_window_result') fail('Banei acquisition result decision differs.');
if (resultAudit.evidence?.workflow_run_id !== 29275669482 || resultAudit.evidence?.artifact_id !== 8289240383) fail('Banei acquisition evidence identity differs.');
if (resultAudit.evidence?.artifact_digest !== 'sha256:b1021380e6223c8a4dc7c2719a0d4c451a72de14e58784f4264bc7c91de38d3e') fail('Banei acquisition artifact digest differs.');
if (resultAudit.result?.records_discovered !== 13 || resultAudit.result?.a_plus_candidate_count !== 1 || resultAudit.result?.lower_rank_candidate_count !== 12) fail('Banei acquisition result counts differ.');
if (!exact(resultAudit.result?.rank_counts, { C: 12, B: 0, 'B+': 0, A: 0, 'A+': 1 })) fail('Banei acquisition observed ranks differ.');
if (resultAudit.result?.review_state !== 'needs_review' || resultAudit.result?.promotion_eligible !== false || resultAudit.result?.publication_effect !== 'none') fail('Banei acquisition review-only boundary differs.');
if (Object.values(resultAudit.side_effect_boundary ?? {}).some((value) => value !== false)) fail('Banei acquisition result side-effect boundary differs.');

const approvedIds = new Set([...(resultAudit.a_plus_meeting_ids ?? []), ...(resultAudit.lower_rank_meeting_ids ?? [])]);
if (approvedIds.size !== 13) fail('Banei acquisition meeting ID closure differs.');
const current = canonical.meetings.filter((meeting) => meeting.authority_id === 'banei-tokachi' && meeting.date >= policy.window.start_date && meeting.date < policy.window.end_date_exclusive);
if (![0, 13].includes(current.length)) fail(`Banei current-window state must be pre-apply 0 or applied 13; got ${current.length}.`);
if (current.length === 13) {
  const currentIds = new Set(current.map((meeting) => meeting.meeting_id));
  for (const id of approvedIds) if (!currentIds.has(id)) fail(`Applied Banei meeting missing: ${id}`);
  const ranks = current.reduce((counts, meeting) => ({ ...counts, [meeting.capability_rank]: (counts[meeting.capability_rank] ?? 0) + 1 }), {});
  if (ranks.C !== 12 || ranks['A+'] !== 1) fail(`Applied Banei ranks differ: ${JSON.stringify(ranks)}`);
  for (const file of ['data/candidates/banei-current-window-c-schedule-approved.json', 'data/candidates/banei-current-window-a-plus-approved.json']) {
    if (!fs.existsSync(path.join(root, file))) fail(`Applied Banei candidate file missing: ${file}`);
  }
}

for (const file of [
  'scripts/timetable/build-banei-current-window-spec.mjs',
  'docs/calendar/banei-current-window-acquisition.md',
  '.github/workflows/calendar-banei-current-window-acquisition.yml',
]) if (!fs.existsSync(path.join(root, file))) fail(`Banei acquisition component missing: ${file}`);

if (errors.length) {
  console.error(`CALENDAR_BANEI_CURRENT_WINDOW_ACQUISITION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_BANEI_CURRENT_WINDOW_ACQUISITION: pass');
console.log(`CURRENT_WINDOW_STATE: ${current.length === 13 ? 'applied_13' : 'historical_pre_apply_0'}`);
console.log('HISTORICAL_ACQUISITION_RESULT: A+=1,C=12');
