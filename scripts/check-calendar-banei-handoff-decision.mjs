import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const exactKeys = (value, keys) => JSON.stringify(Object.keys(value ?? {}).sort()) === JSON.stringify([...keys].sort());

const decision = readJson('data/static/calendar-banei-handoff-decision-v1.json');
const schema = readJson('data/static/calendar-banei-handoff-decision.schema.json');
const registry = readJson('data/static/calendar-acquisition-registry.json');
const readiness = loadCalendarReadinessV1(root);
const policies = readJson('src/data/publicationDisplayPolicies.json');

if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('handoff schema draft differs.');
if (schema.$id !== 'https://whr.badjoke-lab.com/schemas/calendar-banei-handoff-decision.schema.json') fail('handoff schema ID differs.');
if (schema.type !== 'object' || schema.additionalProperties !== false) fail('handoff schema must be closed.');
if (schema.properties?.schema_version?.const !== 'calendar-banei-handoff-decision-v1') fail('handoff schema version differs.');
if (schema.properties?.decision?.const !== 'accepted_for_manual_reviewed_steady_state') fail('handoff decision enum differs.');
if (schema.properties?.completion_claim?.const !== 'bounded_operational_integration_complete') fail('handoff completion claim differs.');
if (schema.properties?.next_work_id?.const !== 'WHR-CAL-HONG-KONG-HKJC') fail('handoff next Work ID schema differs.');

const topLevelKeys = [
  'schema_version',
  'decision_id',
  'work_id',
  'decided_at',
  'decision',
  'completion_claim',
  'july_full_month_completion_audit',
  'operational_state',
  'public_display_boundary',
  'evidence_refs',
  'next_work_id',
  'next_stage',
];
if (!exactKeys(decision, topLevelKeys)) fail('handoff decision top-level keys differ.');
if (decision.schema_version !== 'calendar-banei-handoff-decision-v1') fail('handoff decision schema version differs.');
if (decision.decision_id !== 'banei-operational-handoff-2026-07') fail('handoff decision ID differs.');
if (decision.work_id !== 'WHR-CAL-JAPAN-BANEI-A-PLUS') fail('handoff Work ID differs.');
if (Number.isNaN(Date.parse(decision.decided_at))) fail('handoff decided_at invalid.');
if (decision.decision !== 'accepted_for_manual_reviewed_steady_state') fail('handoff decision differs.');
if (decision.completion_claim !== 'bounded_operational_integration_complete') fail('handoff completion claim differs.');
if (decision.next_work_id !== 'WHR-CAL-HONG-KONG-HKJC') fail('next Work ID differs.');
if (decision.next_stage !== 'stage_10_additional_pilot') fail('next stage differs.');

const audit = decision.july_full_month_completion_audit;
if (!exactKeys(audit, ['required_for_handoff', 'performed', 'full_month_completeness_claim_made', 'trigger'])) fail('Completion Audit decision keys differ.');
if (audit.required_for_handoff !== false) fail('July Completion Audit must not be required for bounded handoff.');
if (audit.performed !== false) fail('handoff must not claim July Completion Audit was performed.');
if (audit.full_month_completeness_claim_made !== false) fail('handoff must not make July full-month completeness claim.');
if (audit.trigger !== 'Run the separate July whole-month Completion Audit before making an explicit July full-month completeness claim.') fail('Completion Audit trigger differs.');

const operational = decision.operational_state;
const expectedOperational = {
  primary_runner: 'github_actions',
  fallback_runner: 'reviewed_import',
  date_window_enabled: true,
  selected_meeting_enabled: true,
  rank_upgrade_retry_planning_enabled: true,
  regular_refresh_planning_enabled: false,
  coverage_gap_planning_enabled: false,
  source_revalidation_planning_enabled: false,
  scheduler_job_execution_enabled: false,
  automatic_approval_enabled: false,
  automatic_promotion_enabled: false,
  automatic_publication_enabled: false,
};
if (!exactKeys(operational, Object.keys(expectedOperational))) fail('operational state keys differ.');
for (const [key, expected] of Object.entries(expectedOperational)) {
  if (operational[key] !== expected) fail(`operational state ${key} differs.`);
}

const baneiRegistry = registry.records.find((record) => record.system_id === 'japan-banei-system');
if (!baneiRegistry) fail('Banei Acquisition Registry profile missing.');
else {
  if (baneiRegistry.profile_status !== 'active') fail('Banei Registry profile must be active.');
  if (baneiRegistry.primary_runner !== operational.primary_runner) fail('handoff primary runner differs from Registry.');
  if (baneiRegistry.fallback_runner !== operational.fallback_runner) fail('handoff fallback runner differs from Registry.');
  if (baneiRegistry.supports_date_window !== operational.date_window_enabled) fail('handoff date-window boundary differs from Registry.');
  if (baneiRegistry.supports_selected_meetings !== operational.selected_meeting_enabled) fail('handoff selected-meeting boundary differs from Registry.');
  if (baneiRegistry.supports_rank_upgrade_retry !== operational.rank_upgrade_retry_planning_enabled) fail('handoff rank-retry boundary differs from Registry.');
  if (baneiRegistry.supports_cross_month_window !== false) fail('Banei cross-month capability unexpectedly enabled.');
  if (baneiRegistry.supports_source_visible_horizon !== false) fail('Banei source-visible-horizon capability unexpectedly enabled.');
  if (baneiRegistry.detail_source_id !== 'nar-banei-race-list-deba-table') fail('Banei Registry detail source differs.');
}

const detailReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/banei-tokachi/nar-banei-race-list-deba-table');
const legacyReadiness = readiness.records.find((record) => record.authority_source_key === 'japan/banei-tokachi/banei-official-schedule');
if (!detailReadiness) fail('Banei detail-source Readiness missing.');
else {
  if (detailReadiness.technical_rank !== 'A+' || detailReadiness.public_ceiling !== 'A+') fail('Banei detail Readiness must remain A+ / A+.');
  if (detailReadiness.readiness !== 'prototype_ready') fail('Banei detail Readiness state differs.');
}
if (!legacyReadiness) fail('Banei legacy schedule Readiness missing.');
else {
  if (legacyReadiness.public_ceiling !== 'C' || legacyReadiness.readiness !== 'link_only') fail('Banei legacy schedule Readiness must remain C / link_only.');
}

const publicBoundary = decision.public_display_boundary;
const expectedBoundaryKeys = [
  'detail_source_public_ceiling',
  'legacy_schedule_source_public_ceiling',
  'legacy_schedule_source_readiness',
  'list_surface_rule',
  'a_plus_surface_rule',
  'forbidden_output_classes',
];
if (!exactKeys(publicBoundary, expectedBoundaryKeys)) fail('public display boundary keys differ.');
if (publicBoundary.detail_source_public_ceiling !== 'A+') fail('detail-source public ceiling differs.');
if (publicBoundary.legacy_schedule_source_public_ceiling !== 'C') fail('legacy schedule public ceiling differs.');
if (publicBoundary.legacy_schedule_source_readiness !== 'link_only') fail('legacy schedule readiness differs.');
if (publicBoundary.list_surface_rule !== 'one_meeting_per_row') fail('list surface rule differs.');
if (publicBoundary.a_plus_surface_rule !== 'meeting_detail_only') fail('A+ surface rule differs.');

const requiredForbidden = [
  'participants',
  'horse_names',
  'jockey_names',
  'trainer_names',
  'betting_data',
  'odds',
  'results',
  'payouts',
  'predictions',
  'raw_source_body',
  'embedded_video',
  'direct_stream_url',
];
for (const value of requiredForbidden) {
  if (!publicBoundary.forbidden_output_classes.includes(value)) fail(`forbidden output class missing: ${value}`);
}
if (new Set(publicBoundary.forbidden_output_classes).size !== publicBoundary.forbidden_output_classes.length) fail('forbidden output classes contain duplicates.');

const baneiPolicy = policies.policies.find((policy) => policy.id === 'banei-reviewed-a-plus');
if (!baneiPolicy) fail('Banei publication policy missing.');
else {
  if (baneiPolicy.max_public_rank !== 'A+') fail('Banei publication policy max rank differs.');
  if (baneiPolicy.include_in_public_list !== true) fail('Banei publication policy list inclusion differs.');
  for (const field of ['show_race_name', 'show_distance', 'show_surface', 'show_course']) {
    if (baneiPolicy.a_plus_fields?.[field] !== true) fail(`Banei publication policy ${field} differs.`);
  }
}

if (!Array.isArray(decision.evidence_refs) || decision.evidence_refs.length < 6) fail('handoff evidence reference set is too small.');
if (new Set(decision.evidence_refs).size !== decision.evidence_refs.length) fail('handoff evidence refs contain duplicates.');
for (const ref of decision.evidence_refs ?? []) {
  if (!/^(docs|data|scripts)\//.test(ref)) fail(`handoff evidence ref outside allowed repository roots: ${ref}`);
  if (!exists(ref)) fail(`handoff evidence ref missing: ${ref}`);
}

for (const requiredRef of [
  'docs/calendar/banei-retry-queue-state-apply.md',
  'docs/calendar/banei-freshness-rollback-operating-evidence.md',
  'docs/calendar/banei-bilingual-public-display-qa.md',
  'data/static/calendar-readiness-banei-detail-v1.json',
  'data/static/authority-source-inventory-banei-detail-v1.json',
]) {
  if (!decision.evidence_refs.includes(requiredRef)) fail(`required handoff evidence ref missing: ${requiredRef}`);
}

const handoffDoc = readText('docs/calendar/banei-handoff-decision.md');
for (const phrase of [
  'Status: accepted decision record',
  'accepted for manual reviewed steady-state operation',
  'This is not a July whole-month completeness claim.',
  'required_for_handoff: false',
  'performed: false',
  'full_month_completeness_claim_made: false',
  'WHR-CAL-HONG-KONG-HKJC',
  'one meeting per row',
  'meeting detail page only',
  'automatic approval: disabled',
  'automatic promotion: disabled',
  'automatic publication: disabled',
]) {
  if (!handoffDoc.includes(phrase)) fail(`handoff decision document missing ${phrase}.`);
}

const projectRoadmap = readText('docs/project-roadmap.md');
const implementationRoadmap = readText('docs/calendar/implementation-roadmap.md');
const acpPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const [label, text, phrases] of [
  ['project roadmap', projectRoadmap, ['Banei handoff accepted', 'WHR-CAL-HONG-KONG-HKJC', 'July whole-month Completion Audit']],
  ['implementation roadmap', implementationRoadmap, ['Banei handoff decision accepted', 'WHR-CAL-HONG-KONG-HKJC', 'Calendar Public v1 release-readiness']],
  ['ACP implementation plan', acpPlan, ['Banei handoff accepted', 'WHR-CAL-HONG-KONG-HKJC', 'unattended execution remains disabled']],
]) {
  for (const phrase of phrases) if (!text.includes(phrase)) fail(`${label} missing ${phrase}.`);
}

const calendarIndex = readText('docs/calendar/README.md');
if (!calendarIndex.includes('banei-handoff-decision.md')) fail('Calendar documentation index missing Banei handoff decision.');
const governance = readText('docs/governance/document-authority.md');
if (!governance.includes('docs/calendar/banei-handoff-decision.md')) fail('document authority missing Banei handoff decision.');
if (!governance.includes('data/static/calendar-banei-handoff-decision-v1.json')) fail('document authority missing machine-readable Banei handoff decision.');

const serialized = JSON.stringify(decision).toLowerCase();
for (const forbiddenKey of ['horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'payout_amount', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`"${forbiddenKey}"`)) fail(`handoff decision contains forbidden data key ${forbiddenKey}.`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_HANDOFF_DECISION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_HANDOFF_DECISION: pass');
console.log('DECISION: accepted_for_manual_reviewed_steady_state');
console.log('COMPLETION_CLAIM: bounded_operational_integration_complete');
console.log('JULY_FULL_MONTH_COMPLETION_AUDIT_REQUIRED: false');
console.log('JULY_FULL_MONTH_COMPLETENESS_CLAIM_MADE: false');
console.log('PRIMARY_RUNNER: github_actions');
console.log('FALLBACK_RUNNER: reviewed_import');
console.log('DETAIL_SOURCE_PUBLIC_CEILING: A+');
console.log('LEGACY_SCHEDULE_READINESS: C / link_only');
console.log('SCHEDULER_JOB_EXECUTION: false');
console.log('AUTOMATIC_APPROVAL_PROMOTION_PUBLICATION: false');
console.log('NEXT_WORK_ID: WHR-CAL-HONG-KONG-HKJC');
