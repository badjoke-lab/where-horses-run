import fs from 'node:fs';

const errors = [];
const requiredFiles = [
  'START-HERE.md',
  'docs/project-roadmap.md',
  'docs/governance/document-authority.md',
  'docs/calendar/README.md',
  'docs/calendar/machine-readable-contracts.md',
  'docs/calendar/incremental-coverage-contract.md',
  'docs/calendar/coverage-observation-schema.md',
  'docs/calendar/validation-responsibility-contract.md',
  'docs/calendar/acquisition-control-plane-contract.md',
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  'docs/calendar/implementation-roadmap.md',
  'docs/calendar/nar-a-plus-pilot-plan.md',
  'docs/calendar/nar-monthly-collection-contract.md',
  'docs/calendar/manual-nar-incremental-collection.md',
  'docs/calendar/banei-a-plus-full-month-plan.md',
  'data/static/calendar-coverage-observation.schema.json',
  'data/static/calendar-validation-responsibilities-v1.json',
  'data/static/calendar-readiness-registry.json',
  'data/static/calendar-readiness-japan-v2.json',
  'data/static/japan-a-plus-policy.json',
  'scripts/timetable/coverage-observation-validation.mjs',
  'scripts/timetable/pipeline-v1/promotion-core.mjs',
  'scripts/timetable/nar-incremental-core.mjs',
  'scripts/timetable/collect-nar-incremental.mjs',
  'scripts/timetable/run-nar-incremental-local.mjs',
  'scripts/timetable/nar-incremental-v2-core.mjs',
  'scripts/timetable/nar-incremental-v2-reconcile.mjs',
  'scripts/timetable/normalize-nar-schedule-aware-month.mjs',
  'scripts/timetable/collect-nar-incremental-v2.mjs',
  'scripts/timetable/collect-nar-incremental-v2-reconciled.mjs',
  'scripts/timetable/run-nar-incremental-v2-local.mjs',
  'scripts/check-calendar-coverage-observation-schema.mjs',
  'scripts/check-calendar-validation-responsibilities.mjs',
  'scripts/check-calendar-pipeline-v1-promotion.mjs',
  'scripts/check-calendar-nar-incremental-core.mjs',
  'scripts/check-calendar-nar-incremental.mjs',
  'scripts/check-calendar-nar-incremental-v2-core.mjs',
  'scripts/check-calendar-nar-incremental-v2.mjs'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) errors.push(`missing: ${file}`);
}

const read = (file) => fs.readFileSync(file, 'utf8');
const start = read('START-HERE.md');
const roadmap = read('docs/project-roadmap.md');
const implementationRoadmap = read('docs/calendar/implementation-roadmap.md');
const incremental = read('docs/calendar/incremental-coverage-contract.md');
const controlPlane = read('docs/calendar/acquisition-control-plane-contract.md');
const controlPlan = read('docs/calendar/acquisition-control-plane-implementation-plan.md');
const machineContracts = read('docs/calendar/machine-readable-contracts.md');
const coverageDoc = read('docs/calendar/coverage-observation-schema.md');
const validationDoc = read('docs/calendar/validation-responsibility-contract.md');
const validationMap = read('data/static/calendar-validation-responsibilities-v1.json');
const registry = read('data/static/calendar-readiness-registry.json');
const japanReadiness = read('data/static/calendar-readiness-japan-v2.json');
const japanPolicy = read('data/static/japan-a-plus-policy.json');
const narRunbook = read('docs/calendar/manual-nar-incremental-collection.md');

function requirePhrases(text, label, phrases) {
  for (const phrase of phrases) {
    if (!text.includes(phrase)) errors.push(`${label} missing ${phrase}`);
  }
}

requirePhrases(start, 'START-HERE', [
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'WHR-CAL-ACQUISITION-CONTROL-PLANE',
  'WHR-CAL-JAPAN-BANEI-A-PLUS',
  'docs/calendar/acquisition-control-plane-contract.md',
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  'Collection Plan',
  'Review Queue',
  'Rank-aware Retry Queue',
  'C/B/B+/A/A+',
  'primary runner: local',
  'primary runner: github_actions'
]);

requirePhrases(roadmap, 'project roadmap', [
  'Country-page programme: complete',
  'Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`',
  'Current Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`',
  'Next source-specific Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',
  'schedule-confirmed meetings: 82',
  'A+ detail records:            11',
  'C schedule records:           71',
  'pending detail retries:       71',
  'Acquisition Control Plane',
  'Acquisition Registry',
  'Collection Job schema',
  'Collection Plan schema',
  'Review Queue foundation',
  'Rank-aware Retry Queue foundation',
  'C/B/B+/A/A+'
]);

requirePhrases(implementationRoadmap, 'implementation roadmap', [
  'Pipeline v1 status: complete',
  'Dynamic Dates status: complete',
  'Operations v1 status: complete',
  'Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`',
  'Current Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`',
  'ACP-1 — NAR formal workflow dispatch — complete',
  'Stage 7 — Acquisition Control Plane foundation',
  'ACP-2 — Acquisition Registry',
  'ACP-3 — Collection Job schema',
  'ACP-4 — Collection Plan schema',
  'ACP-5 — five-rank classifier contract',
  'ACP-7 — Review Queue',
  'ACP-8 — Rank-aware Retry Queue',
  'Banei handoff gate'
]);

requirePhrases(incremental, 'incremental coverage contract', [
  'No country, authority, or racing system may require month-wide completeness',
  '`partial` is a normal successful state',
  'Five-rank operational model',
  'Runner-neutral collection',
  'Multi-system Collection Plans',
  'Absence is not deletion',
  'Rank regression rule',
  'Rank-aware retry model',
  'Batch Validation',
  'Promotion Validation',
  'Coverage Audit',
  'Completion Audit'
]);

requirePhrases(controlPlane, 'control plane contract', [
  'what to collect',
  'where and how collection runs',
  'github_actions',
  'local',
  'reviewed_import',
  'Acquisition Registry',
  'Collection Plan',
  'Collection Job',
  'Five first-class timetable ranks',
  'C < B < B+ < A < A+',
  'Review Queue',
  'Rank-aware Retry Queue',
  'primary runner: github_actions',
  'fallback runner: local'
]);

requirePhrases(controlPlan, 'control plane implementation plan', [
  'ACP-0 — documentation and transition alignment',
  'ACP-1 — finish NAR July remainder publication',
  'ACP-2 — NAR formal workflow-dispatch operation',
  'ACP-3 — Acquisition Registry',
  'ACP-4 — Collection Job schema',
  'ACP-5 — Collection Plan schema',
  'ACP-6 — shared five-rank classifier contract',
  'ACP-8 — Review Queue',
  'ACP-9 — Rank-aware Retry Queue',
  'ACP-10 — Actions multi-job runner',
  'ACP-11 — local multi-job runner',
  'Banei handoff gate'
]);

requirePhrases(machineContracts, 'machine-readable contracts', [
  'Acquisition Registry schema + registry',
  'Collection Job schema',
  'Collection Plan schema',
  'Collection Result Manifest schema',
  'Review Queue schema',
  'Rank-aware Retry Queue schema',
  'Five-rank result contract'
]);

requirePhrases(coverageDoc, 'coverage observation contract', [
  'requested_scope',
  'observed_scope',
  '`partial` is a normal successful state',
  '`audited_complete`',
  'completion_audit_ref',
  'selected_meetings',
  'source_visible_horizon'
]);

requirePhrases(validationDoc, 'validation responsibility contract', [
  'Batch Validation',
  'Promotion Validation',
  'Coverage Audit',
  'Completion Audit',
  'Normal promotion is monotonic',
  'corrective_downgrade',
  'ordinary promotion CLI remains normal-mode only',
  'must not block unrelated valid partial promotions'
]);

requirePhrases(narRunbook, 'NAR runbook', [
  'primary runner: github_actions',
  'fallback runner: local',
  'formal workflow_dispatch operation: active',
  'immutable review artifact upload: active',
  'arbitrary date windows up to 93 days',
  'selected-meeting retries',
  'C\nB\nB+\nA\nA+',
  'scheduled_pending_details',
  'detail_retry_required',
  'Rank-aware Retry Queue',
  'schedule-confirmed meetings: 82',
  'A+ detail candidates:         11',
  'C schedule candidates:        71'
]);

requirePhrases(validationMap, 'validation responsibility map', [
  'calendar-validation-responsibilities-v1',
  'batch_validation',
  'promotion_validation',
  'coverage_audit',
  'completion_audit',
  'monotonic_rank',
  'normal_rank_regression_allowed',
  'corrective_downgrade',
  'official_correction',
  'rollback'
]);

requirePhrases(registry, 'readiness registry', [
  '"bootstrap_status": "complete"',
  '"countries_with_closed_decision": 98',
  '"readiness_records": 116',
  '"next_backfill_work_ids": []'
]);

for (const systemId of ['japan-jra-system', 'japan-nar-system', 'japan-banei-system']) {
  if (!japanReadiness.includes(`"system_id": "${systemId}"`)) errors.push(`Japan readiness missing ${systemId}`);
  if (!japanPolicy.includes(`"system_id":"${systemId}"`)) errors.push(`Japan policy missing ${systemId}`);
}

if ((japanReadiness.match(/"technical_rank": "A\+"/g) ?? []).length !== 3) errors.push('Japan readiness must contain three A+ technical ranks.');
if ((japanReadiness.match(/"public_ceiling": "A\+"/g) ?? []).length !== 3) errors.push('Japan readiness must contain three A+ public ceilings.');

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log('PROJECT_GOVERNANCE_DOCS_VALID');
console.log('COVERAGE_OBSERVATION_SCHEMA_FOUNDATION: active');
console.log('VALIDATION_RESPONSIBILITY_SPLIT: active');
console.log('ACQUISITION_CONTROL_PLANE_CONTRACT: adopted');
console.log('FIVE_RANK_OPERATIONAL_MODEL: C/B/B+/A/A+');
console.log('NAR_ACTIONS_OPERATOR: active');
console.log('NAR_RUNNER_PROFILE: github_actions primary / local fallback');
console.log('COMPLETED_WORK_ID: WHR-CAL-JAPAN-NAR-A-PLUS');
console.log('CURRENT_WORK_ID: WHR-CAL-ACQUISITION-CONTROL-PLANE');
console.log('NEXT_SOURCE_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');
