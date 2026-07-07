import fs from 'node:fs';

const errors = [];
const requiredFiles = [
  'START-HERE.md',
  'docs/project-roadmap.md',
  'docs/governance/document-authority.md',
  'docs/calendar/README.md',
  'docs/calendar/incremental-coverage-contract.md',
  'docs/calendar/coverage-observation-schema.md',
  'docs/calendar/validation-responsibility-contract.md',
  'docs/calendar/implementation-roadmap.md',
  'docs/calendar/nar-a-plus-pilot-plan.md',
  'docs/calendar/nar-monthly-collection-contract.md',
  'docs/calendar/banei-a-plus-full-month-plan.md',
  'data/static/calendar-coverage-observation.schema.json',
  'data/static/calendar-validation-responsibilities-v1.json',
  'data/static/calendar-readiness-registry.json',
  'data/static/calendar-readiness-japan-v2.json',
  'data/static/japan-a-plus-policy.json',
  'scripts/timetable/coverage-observation-validation.mjs',
  'scripts/timetable/pipeline-v1/promotion-core.mjs',
  'scripts/check-calendar-coverage-observation-schema.mjs',
  'scripts/check-calendar-validation-responsibilities.mjs',
  'scripts/check-calendar-pipeline-v1-promotion.mjs'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) errors.push(`missing: ${file}`);
}

const read = (file) => fs.readFileSync(file, 'utf8');
const start = read('START-HERE.md');
const roadmap = read('docs/project-roadmap.md');
const implementationRoadmap = read('docs/calendar/implementation-roadmap.md');
const incremental = read('docs/calendar/incremental-coverage-contract.md');
const coverageDoc = read('docs/calendar/coverage-observation-schema.md');
const validationDoc = read('docs/calendar/validation-responsibility-contract.md');
const validationMap = read('data/static/calendar-validation-responsibilities-v1.json');
const registry = read('data/static/calendar-readiness-registry.json');
const japanReadiness = read('data/static/calendar-readiness-japan-v2.json');
const japanPolicy = read('data/static/japan-a-plus-policy.json');

function requirePhrases(text, label, phrases) {
  for (const phrase of phrases) {
    if (!text.includes(phrase)) errors.push(`${label} missing ${phrase}`);
  }
}

requirePhrases(start, 'START-HERE', [
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'WHR-CAL-JAPAN-BANEI-A-PLUS',
  'docs/calendar/incremental-coverage-contract.md',
  'docs/calendar/coverage-observation-schema.md',
  'docs/calendar/validation-responsibility-contract.md',
  'data/static/calendar-validation-responsibilities-v1.json',
  'scripts/check-calendar-validation-responsibilities.mjs',
  'refactor NAR ordinary collection away from fixed July completion gating'
]);

requirePhrases(roadmap, 'project roadmap', [
  'Country-page programme: complete',
  'WHR-CAL-BASELINE-RECONCILE',
  'WHR-CAL-PIPELINE-V1',
  'WHR-CAL-DYNAMIC-DATES',
  'WHR-CAL-OPS-V1',
  'WHR-CAL-JAPAN-A-PLUS-RECONCILE',
  'Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`',
  'Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`',
  'Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',
  '98 EN + 98 JA = 196',
  'Meeting / Schedule Layer',
  'Coverage Observation',
  'Batch Validation',
  'Promotion Validation',
  'Coverage Audit',
  'Completion Audit',
  'normal promotion rank-regression guard',
  'NAR ordinary-operator refactoring'
]);

requirePhrases(implementationRoadmap, 'implementation roadmap', [
  'Pipeline v1 status: complete',
  'Dynamic Dates status: complete',
  'Operations v1 status: complete',
  'Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`',
  'Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`',
  'Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',
  'JRA central racing',
  'NAR and local-government racing',
  'Banei Tokachi',
  'Coverage Observation schema and validator foundation',
  'Batch / Promotion / Coverage / Completion responsibility split',
  'normal promotion rank-regression rejection',
  'refactor NAR ordinary collection away from fixed July Completion Audit gating'
]);

requirePhrases(incremental, 'incremental coverage contract', [
  'No country, authority, or racing system may require month-wide completeness',
  'partial` is a normal successful state',
  'Absence is not deletion',
  'Rank regression rule',
  'Batch validation',
  'Promotion validation',
  'Coverage audit',
  'Completion audit'
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
console.log('NORMAL_PROMOTION_RANK_REGRESSION_ALLOWED: false');
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR-A-PLUS');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');
