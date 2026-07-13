import fs from 'node:fs';
import path from 'node:path';
import { buildJapanCurrentWindowAuditV1, validateJapanCurrentWindowAuditV1 } from './timetable/japan-current-window-audit-core.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const policy = readJson('data/static/calendar-japan-current-window-policy-v1.json');
const historicalDecision = readJson('data/audits/calendar-japan-current-window-decision-2026-07-13-v1.json');
const retryResult = readJson('data/audits/calendar-nar-current-window-retry-result-v1.json');
const applyDecision = readJson('data/audits/calendar-nar-current-window-promotion-apply-v1.json');
const approvedCandidate = readJson('data/candidates/nar-current-window-a-plus-approved.json');
const canonical = readJson('data/generated/timetable/canonical/meetings.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const compatibility = readJson('data/static/calendar-runner-compatibility-contract-v1.json');
const generatedAt = '2026-07-13T08:30:00Z';
let currentAudit = null;
try {
  currentAudit = buildJapanCurrentWindowAuditV1({
    policy,
    canonical,
    acquisitionRegistry: registry,
    runnerCompatibility: compatibility,
    generatedAt,
  });
} catch (error) {
  fail(`current audit build failed: ${error.message}`);
}

if (historicalDecision.schema_version !== 'calendar-japan-current-window-decision-v1') fail('historical decision schema differs');
if (historicalDecision.work_id !== 'WHR-CAL-JAPAN-CURRENT-WINDOW-OPERATIONS' || historicalDecision.implementation_unit !== 'JAPAN-CURRENT-WINDOW-01') fail('historical decision work identity differs');
if (historicalDecision.decision_id !== 'JAPAN-CURRENT-WINDOW-2026-07-13') fail('historical decision ID differs');
if (!exact(historicalDecision.window, policy.window)) fail('historical decision window differs');
if (historicalDecision.canonical_generated_at !== '2026-07-07T21:08:00Z') fail('historical decision Canonical timestamp differs');
if (historicalDecision.evidence?.workflow_run_id !== 29233108790 || historicalDecision.evidence?.artifact_id !== 8272301477) fail('historical decision evidence identity differs');
if (historicalDecision.evidence?.artifact_digest !== 'sha256:c0eff9582b8f606b6214ad2058a39890563f4c3e2fefe125ddc080ac00bb2e61') fail('historical decision artifact digest differs');
if (historicalDecision.summary?.system_count !== 3
  || historicalDecision.summary?.canonical_meeting_count !== 78
  || historicalDecision.summary?.target_ready_a_plus_count !== 12
  || historicalDecision.summary?.action_required_count !== 66) fail('historical decision summary differs');
const historicalBySystem = new Map((historicalDecision.systems ?? []).map((record) => [record.system_id, record]));
const historicalJra = historicalBySystem.get('japan-jra-system');
const historicalNar = historicalBySystem.get('japan-nar-system');
const historicalBanei = historicalBySystem.get('japan-banei-system');
if (!historicalJra || historicalJra.canonical_meeting_count !== 12 || !exact(historicalJra.rank_counts, { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 12 }) || historicalJra.operational_state !== 'current_window_at_target_rank') fail('historical JRA decision differs');
if (!historicalNar || historicalNar.canonical_meeting_count !== 66 || !exact(historicalNar.rank_counts, { C: 66, B: 0, 'B+': 0, A: 0, 'A+': 0 }) || historicalNar.operational_state !== 'selected_meeting_retry_required') fail('historical NAR decision differs');
if (!historicalBanei || historicalBanei.canonical_meeting_count !== 0 || !exact(historicalBanei.rank_counts, { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 0 }) || historicalBanei.operational_state !== 'no_canonical_meetings_in_window') fail('historical Banei decision differs');
if (historicalDecision.next_work?.[0]?.work_id !== 'WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY' || historicalDecision.next_work?.[0]?.priority !== 1) fail('historical NAR next work differs');
if (historicalDecision.next_work?.[1]?.work_id !== 'WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-ACQUISITION' || historicalDecision.next_work?.[1]?.priority !== 2) fail('historical Banei next work differs');
if (Object.values(historicalDecision.side_effect_boundary ?? {}).some((value) => value !== false)) fail('historical decision side-effect boundary differs');

if (currentAudit) {
  const validationErrors = validateJapanCurrentWindowAuditV1(currentAudit);
  if (validationErrors.length) fail(`current audit validation failed: ${validationErrors.join('; ')}`);
  if (!exact(currentAudit.window, policy.window)) fail('current audit window differs');
  if (currentAudit.systems.length !== 3) fail('current audit must contain exactly three Japan systems');
  const bySystem = new Map(currentAudit.systems.map((record) => [record.system_id, record]));
  const jra = bySystem.get('japan-jra-system');
  const nar = bySystem.get('japan-nar-system');
  const banei = bySystem.get('japan-banei-system');
  if (!jra || !nar || !banei) fail('one or more current Japan systems are missing');
  if (jra) {
    if (jra.primary_runner !== 'local' || jra.fallback_runner !== 'reviewed_import') fail('current JRA runner state differs');
    if (jra.executor_id !== 'jra-refresh-local' || !exact(jra.supported_collection_modes, ['date_window'])) fail('current JRA executor state differs');
    if (jra.canonical_meeting_count !== 12 || !exact(jra.rank_counts, { C: 0, B: 0, 'B+': 0, A: 0, 'A+': 12 })) fail('current JRA rank state differs');
    if (jra.target_ready_count !== 12 || jra.retry_required_count !== 0 || jra.operational_state !== 'current_window_at_target_rank') fail('current JRA operational state differs');
  }
  if (nar) {
    if (nar.primary_runner !== 'github_actions' || nar.fallback_runner !== 'local') fail('current NAR runner state differs');
    if (nar.executor_id !== 'nar-incremental-v2-actions' || !exact(nar.supported_collection_modes, ['date_window', 'selected_meetings'])) fail('current NAR executor state differs');
    if (nar.supports_selected_meetings !== true || nar.supports_rank_upgrade_retry !== true) fail('current NAR retry capability differs');
    if (nar.canonical_meeting_count !== 66 || !exact(nar.rank_counts, { C: 51, B: 0, 'B+': 0, A: 0, 'A+': 15 })) fail('current NAR rank state differs');
    if (nar.target_ready_count !== 15 || nar.retry_required_count !== 51 || nar.operational_state !== 'selected_meeting_retry_required') fail('current NAR operational state differs');
    if (!exact([...nar.target_ready_meeting_ids].sort(), [...retryResult.resolved_meeting_ids].sort())) fail('current NAR A+ set differs from reviewed retry result');
    if (!exact([...nar.retry_required_meeting_ids].sort(), [...retryResult.unresolved_meeting_ids].sort())) fail('current NAR C retry set differs from reviewed retry result');
  }
  if (banei) {
    if (banei.primary_runner !== 'github_actions' || banei.fallback_runner !== 'reviewed_import') fail('current Banei runner state differs');
    if (banei.executor_id !== 'banei-schedule-detail-actions' || !exact(banei.supported_collection_modes, ['date_window', 'selected_meetings'])) fail('current Banei executor state differs');
    if (banei.canonical_meeting_count !== 0 || banei.operational_state !== 'no_canonical_meetings_in_window') fail('current Banei empty-window state differs');
  }
  if (currentAudit.summary.system_count !== 3
    || currentAudit.summary.canonical_meeting_count !== 78
    || currentAudit.summary.target_ready_count !== 27
    || currentAudit.summary.retry_required_count !== 51) fail('current Japan window summary differs');
  if (!exact(currentAudit.summary.systems_without_canonical_meetings, ['japan-banei-system'])) fail('current empty-system summary differs');
  if (!exact(currentAudit.summary.systems_requiring_action, ['japan-nar-system', 'japan-banei-system'])) fail('current action-required systems differ');
  if (Object.values(currentAudit.side_effect_boundary).some((value) => value !== false)) fail('current audit side-effect boundary differs');
}

if (retryResult.schema_version !== 'calendar-nar-current-window-retry-result-v1'
  || retryResult.result?.a_plus_candidate_count !== 15
  || retryResult.result?.retry_target_count !== 51) fail('NAR retry result dependency differs');
if (approvedCandidate.schema_version !== 'timetable-candidate-v1'
  || approvedCandidate.review?.status !== 'approved'
  || approvedCandidate.records?.length !== 15) fail('approved NAR Candidate dependency differs');
if (!exact([...approvedCandidate.records.map((record) => record.meeting_id)].sort(), [...retryResult.resolved_meeting_ids].sort())) fail('approved Candidate meeting set differs');
if (applyDecision.schema_version !== 'calendar-nar-current-window-promotion-apply-v1'
  || applyDecision.decision !== 'apply_exact_reviewed_proposal_and_regenerate_public_projection'
  || applyDecision.apply_scope?.promoted_meeting_count !== 15
  || applyDecision.apply_scope?.retained_c_retry_target_count !== 51) fail('NAR promotion apply decision differs');

for (const file of policy.systems.map((record) => record.entry_point)) {
  if (!fs.existsSync(path.join(root, file))) fail(`operator entry point missing: ${file}`);
}
for (const file of [
  'data/audits/calendar-japan-current-window-decision-2026-07-13-v1.json',
  'data/audits/calendar-nar-current-window-retry-result-v1.json',
  'data/audits/calendar-nar-current-window-promotion-apply-v1.json',
  'data/candidates/nar-current-window-a-plus-approved.json',
  'scripts/timetable/japan-current-window-audit-core.mjs',
  'scripts/timetable/build-japan-current-window-audit.mjs',
  'docs/calendar/japan-current-window-operations.md',
  '.github/workflows/calendar-japan-current-window-operations.yml',
]) if (!fs.existsSync(path.join(root, file))) fail(`Japan current-window component missing: ${file}`);
const builder = readText('scripts/timetable/build-japan-current-window-audit.mjs');
for (const phrase of ['output must remain outside the repository', 'network_fetch: false', 'canonical_write: false', 'public_write: false']) {
  if (!builder.includes(phrase)) fail(`Japan current-window builder missing ${phrase}`);
}
const workflow = readText('.github/workflows/calendar-japan-current-window-operations.yml');
for (const phrase of ['contents: read', 'build-japan-current-window-audit.mjs', 'actions/upload-artifact@v4', 'Prove protected state unchanged']) {
  if (!workflow.includes(phrase)) fail(`Japan current-window workflow missing ${phrase}`);
}
if (/\bschedule\s*:|\bcron\s*:|contents:\s*write/.test(workflow)) fail('Japan current-window workflow enables scheduled or write operation');

const invalidPolicy = structuredClone(policy);
invalidPolicy.systems[1].supports_rank_upgrade_retry = false;
let invalidRejected = false;
try {
  buildJapanCurrentWindowAuditV1({ policy: invalidPolicy, canonical, acquisitionRegistry: registry, runnerCompatibility: compatibility, generatedAt });
} catch (error) {
  invalidRejected = error.message.includes('retry support differs');
}
if (!invalidRejected) fail('NAR retry-capability drift was not rejected');

if (errors.length) {
  console.error(`CALENDAR_JAPAN_CURRENT_WINDOW_OPERATIONS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_JAPAN_CURRENT_WINDOW_OPERATIONS: pass');
console.log('HISTORICAL_STATE: JRA A+=12 / NAR C=66 / Banei=0');
console.log('CURRENT_STATE: JRA A+=12 / NAR A+=15+C=51 / Banei=0');
console.log('CURRENT_TARGET_READY_A_PLUS: 27');
console.log('CURRENT_ACTION_REQUIRED: 51');
console.log('NEXT_PRIORITY: WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-ACQUISITION');
console.log('NETWORK_FETCH: false');
console.log('CANONICAL_PUBLIC_WRITE: false');
