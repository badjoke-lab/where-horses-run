import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const mapPath = 'data/static/calendar-validation-responsibilities-v1.json';
const contractPath = 'docs/calendar/validation-responsibility-contract.md';
const map = parse(mapPath);
const contract = read(contractPath);

if (map.schema_version !== 'calendar-validation-responsibilities-v1') fail('unexpected responsibility-map schema.');
if (map.status !== 'active') fail('responsibility map must be active.');
if (map.work_id !== 'WHR-CAL-JAPAN-NAR-A-PLUS') fail('responsibility map Work ID differs.');

const expectedRoles = ['batch_validation', 'promotion_validation', 'coverage_audit', 'completion_audit'];
const roles = Array.isArray(map.roles) ? map.roles : [];
if (JSON.stringify(roles.map((role) => role.role)) !== JSON.stringify(expectedRoles)) fail('validation roles or order differ.');

for (const role of roles) {
  if (typeof role.question !== 'string' || !role.question.trim()) fail(`${role.role} question is required.`);
  if (role.may_block_unrelated_valid_batch !== false) fail(`${role.role} must not block unrelated valid batches.`);
  if (role.may_write_canonical !== false || role.may_write_public !== false) fail(`${role.role} validators must be read-only.`);
  if (!Array.isArray(role.canonical_validators) || role.canonical_validators.length === 0) fail(`${role.role} must have canonical validators.`);
  for (const validator of role.canonical_validators ?? []) {
    if (!existsSync(path.join(root, validator))) fail(`${role.role} missing validator ${validator}.`);
  }
}

const batchRole = roles.find((role) => role.role === 'batch_validation');
const promotionRole = roles.find((role) => role.role === 'promotion_validation');
const coverageRole = roles.find((role) => role.role === 'coverage_audit');
const completionRole = roles.find((role) => role.role === 'completion_audit');

if (batchRole?.may_block_current_batch !== true || batchRole?.may_require_declared_scope_completeness !== false) fail('batch blocking semantics differ.');
if (promotionRole?.may_block_current_batch !== true || promotionRole?.may_require_declared_scope_completeness !== false) fail('promotion blocking semantics differ.');
if (coverageRole?.may_block_current_batch !== false || coverageRole?.may_require_declared_scope_completeness !== false) fail('coverage semantics differ.');
if (completionRole?.may_block_current_batch !== false || completionRole?.may_require_declared_scope_completeness !== true) fail('completion semantics differ.');

if (map.promotion_policy?.normal_mode !== 'monotonic_rank') fail('normal promotion policy must be monotonic_rank.');
if (map.promotion_policy?.normal_rank_regression_allowed !== false) fail('normal rank regression must be false.');
if (map.promotion_policy?.corrective_mode !== 'corrective_downgrade') fail('corrective mode differs.');
if (map.promotion_policy?.corrective_downgrade_requires_explicit_reason !== true) fail('corrective downgrade must require explicit reason.');
if (map.promotion_policy?.ordinary_cli_exposes_corrective_mode !== false) fail('ordinary CLI must not expose corrective mode.');
if (map.promotion_policy?.corrective_public_projection_write !== false) fail('corrective core must remain canonical-only.');

const expectedReasons = [
  'official_correction',
  'discovered_data_error',
  'source_invalidation',
  'publication_policy_change',
  'rollback'
];
if (JSON.stringify(map.promotion_policy?.allowed_corrective_reasons) !== JSON.stringify(expectedReasons)) fail('corrective downgrade reasons differ.');

for (const [key, expected] of Object.entries({
  partial_is_valid_state: true,
  requested_and_observed_scope_may_differ: true,
  absence_is_deletion: false,
  coverage_incompleteness_blocks_unrelated_promotion: false,
})) {
  if (map.coverage_policy?.[key] !== expected) fail(`coverage_policy.${key} differs.`);
}
for (const [key, expected] of Object.entries({
  completion_is_explicit_claim: true,
  completion_failure_invalidates_existing_valid_promotions: false,
  source_specific_completion_auditors_allowed: true,
})) {
  if (map.completion_policy?.[key] !== expected) fail(`completion_policy.${key} differs.`);
}

for (const marker of [
  'Batch Validation',
  'Promotion Validation',
  'Coverage Audit',
  'Completion Audit',
  'Normal promotion is monotonic',
  'corrective_downgrade',
  'ordinary promotion CLI remains normal-mode only',
  'must not block unrelated valid partial promotions',
]) {
  if (!contract.includes(marker)) fail(`responsibility contract missing ${marker}.`);
}

const batchValidator = read('scripts/check-calendar-pipeline-v1-candidate-contract.mjs');
for (const forbidden of ['promoteApprovedCandidateV1', 'canonical/meetings.json', 'canonical/meeting-details.json', 'public/meeting-list.json']) {
  if (batchValidator.includes(forbidden)) fail(`batch validator crosses responsibility boundary with ${forbidden}.`);
}

const promotionValidator = read('scripts/check-calendar-pipeline-v1-promotion.mjs');
for (const marker of [
  'normal rank regression',
  'not allowed in normal promotion',
  'corrective_downgrade',
  'official_correction',
  'ordinary promotion CLI must not expose corrective downgrade mode',
]) {
  if (!promotionValidator.includes(marker)) fail(`promotion validator missing ${marker}.`);
}

const promotionCore = read('scripts/timetable/pipeline-v1/promotion-core.mjs');
for (const marker of [
  "'normal'",
  "'corrective_downgrade'",
  'CORRECTIVE_DOWNGRADE_REASONS',
  'rank regression',
  'requires at least one actual rank regression',
  'downgraded_meeting_ids',
]) {
  if (!promotionCore.includes(marker)) fail(`promotion core missing ${marker}.`);
}
if (promotionCore.includes('writeFileSync') || promotionCore.includes('renameSync')) fail('promotion core must remain pure.');

const ordinaryCli = read('scripts/timetable/promote-approved-candidate-v1.mjs');
if (ordinaryCli.includes('corrective_downgrade') || ordinaryCli.includes('downgradeReason')) fail('ordinary promotion CLI exposes corrective downgrade mode.');

const coverageValidator = read('scripts/check-calendar-coverage-observation-schema.mjs');
for (const marker of ['PARTIAL_SHORTER_THAN_REQUESTED: valid', 'IRREGULAR_SELECTED_MEETING_RETRY: valid', 'AUDITED_COMPLETE_REQUIRES_AUDIT_REF: enforced']) {
  if (!coverageValidator.includes(marker)) fail(`coverage validator missing ${marker}.`);
}
for (const forbidden of ['canonical/meetings.json', 'canonical/meeting-details.json', 'writeFileSync']) {
  if (coverageValidator.includes(forbidden)) fail(`coverage validator crosses responsibility boundary with ${forbidden}.`);
}

const completionValidator = read('scripts/check-calendar-nar-full-month-candidate-set.mjs');
for (const marker of ['MONTH_BOUNDARY: 2026-07-01..2026-07-31', 'PARTIAL_CUTOFF_COMPLETION_ALLOWED: false', 'scheduled meeting detail-state coverage is incomplete']) {
  if (!completionValidator.includes(marker)) fail(`completion validator missing ${marker}.`);
}
for (const forbidden of ['promoteApprovedCandidateV1', 'canonical/meetings.json', 'public/meeting-list.json', 'writeFileSync']) {
  if (completionValidator.includes(forbidden)) fail(`completion validator crosses responsibility boundary with ${forbidden}.`);
}

const ordinaryNarOperator = read('scripts/timetable/manual-collect-nar-monthly.mjs');
if (ordinaryNarOperator.includes('check-calendar-nar-full-month-candidate-set.mjs')) fail('ordinary NAR operator must not invoke July completion validator.');

for (const validator of [
  'scripts/check-calendar-pipeline-v1-candidate-contract.mjs',
  'scripts/check-calendar-pipeline-v1-promotion.mjs',
  'scripts/check-calendar-coverage-observation-schema.mjs',
  'scripts/check-project-governance-docs.mjs',
]) {
  const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) fail(`role anchor validator failed: ${validator}`);
}

if (errors.length) {
  console.error(`CALENDAR_VALIDATION_RESPONSIBILITIES: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_VALIDATION_RESPONSIBILITIES: pass');
console.log('BATCH_SCOPE_COMPLETENESS_REQUIRED: false');
console.log('PROMOTION_NORMAL_RANK_REGRESSION_ALLOWED: false');
console.log('COVERAGE_INCOMPLETENESS_BLOCKS_UNRELATED_PROMOTION: false');
console.log('COMPLETION_AUDIT_SCOPE_SPECIFIC: true');
console.log('ORDINARY_NAR_OPERATOR_USES_COMPLETION_GATE: false');
