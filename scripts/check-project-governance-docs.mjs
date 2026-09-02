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
  'docs/calendar/acquisition-registry.md',
  'data/static/calendar-acquisition-registry.schema.json',
  'data/static/calendar-acquisition-registry.json',
  'data/static/calendar-coverage-observation.schema.json',
  'data/static/calendar-validation-responsibilities-v1.json',
  'scripts/timetable/coverage-observation-validation.mjs',
  'scripts/timetable/nar-incremental-v2-core.mjs',
  'scripts/timetable/nar-incremental-v2-actions-core.mjs',
  'scripts/check-calendar-acquisition-registry.mjs',
  'scripts/check-calendar-coverage-observation-schema.mjs',
  'scripts/check-calendar-validation-responsibilities.mjs',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) errors.push(`missing current governance dependency: ${file}`);
}

const read = (file) => fs.readFileSync(file, 'utf8');
const requirePhrases = (file, phrases) => {
  const text = read(file);
  for (const phrase of phrases) {
    if (!text.includes(phrase)) errors.push(`${file} missing current contract marker: ${phrase}`);
  }
};

requirePhrases('docs/calendar/incremental-coverage-contract.md', [
  'partial',
  'C/B/B+/A/A+',
  'Rank-aware Retry Queue',
  'Absence is not deletion',
]);
requirePhrases('docs/calendar/acquisition-control-plane-contract.md', [
  'github_actions',
  'local',
  'reviewed_import',
  'Acquisition Registry',
  'Collection Plan',
  'Collection Job',
  'Review Queue',
]);
requirePhrases('docs/calendar/machine-readable-contracts.md', [
  'data/static/calendar-acquisition-registry.schema.json',
  'data/static/calendar-acquisition-registry.json',
  'Collection Result Manifest',
  'Review Queue',
]);
requirePhrases('docs/calendar/coverage-observation-schema.md', [
  'requested_scope',
  'observed_scope',
  'selected_meetings',
  'source_visible_horizon',
]);
requirePhrases('docs/calendar/validation-responsibility-contract.md', [
  'Batch Validation',
  'Promotion Validation',
  'Coverage Audit',
  'Completion Audit',
  'corrective_downgrade',
]);

const registry = JSON.parse(read('data/static/calendar-acquisition-registry.json'));
if (registry?.schema_version !== 'calendar-acquisition-registry-v1') errors.push('Acquisition Registry schema version differs.');
if (!Array.isArray(registry?.records) || registry.records.length === 0) errors.push('Acquisition Registry must contain current profiles.');
for (const record of registry?.records ?? []) {
  if (!record.system_id || !record.primary_runner) errors.push('Acquisition Registry profile missing system_id or primary_runner.');
  if (record.profile_status === 'active' && (record.schedule_adapter_id === null || record.detail_adapter_id === null)) {
    errors.push(`active profile has incomplete adapter route: ${record.system_id}`);
  }
}

const validationMap = JSON.parse(read('data/static/calendar-validation-responsibilities-v1.json'));
const serializedValidationMap = JSON.stringify(validationMap);
for (const marker of ['batch_validation', 'promotion_validation', 'coverage_audit', 'completion_audit']) {
  if (!serializedValidationMap.includes(marker)) errors.push(`validation responsibility map missing ${marker}`);
}

if (errors.length) {
  console.error(`PROJECT_GOVERNANCE_DOCS: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('PROJECT_GOVERNANCE_DOCS: pass');
console.log(`CURRENT_REQUIRED_FILES: ${requiredFiles.length}`);
console.log(`ACQUISITION_PROFILES: ${registry.records.length}`);
console.log('HISTORICAL_FIXED_COUNTS_REQUIRED: false');
console.log('COMPLETED_STAGE_TEXT_REQUIRED: false');
