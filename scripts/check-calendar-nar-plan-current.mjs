import fs from 'node:fs';

const plan = fs.readFileSync('docs/calendar/nar-a-plus-pilot-plan.md', 'utf8');
const start = fs.readFileSync('START-HERE.md', 'utf8');
const incremental = fs.readFileSync('docs/calendar/incremental-coverage-contract.md', 'utf8');
const required = [
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'Current phase: shared incremental coverage implementation and NAR operator refactor',
  'first reviewed A+ promotion through 2026-07-04',
  'valid partial data',
  'arbitrary and overlapping windows',
  'selected-meeting retries',
  'July completion audit',
  'WHR-CAL-JAPAN-BANEI-A-PLUS',
];
const errors = required.filter((value) => !plan.includes(value));
for (const phrase of [
  'No country, authority, or racing system may require month-wide completeness',
  'partial` is a normal successful state',
  'Absence is not deletion',
  'Validation split',
]) {
  if (!incremental.includes(phrase)) errors.push(`incremental contract missing ${phrase}`);
}
for (const link of [
  'docs/calendar/incremental-coverage-contract.md',
  'docs/calendar/nar-a-plus-pilot-plan.md',
  'docs/calendar/nar-14-racecourse-compatibility-audit.md',
  'docs/calendar/nar-monthly-collection-contract.md',
  'docs/calendar/banei-a-plus-full-month-plan.md',
  'data/static/nar-flat-racecourse-compatibility-v1.json',
  'scripts/timetable/parse-nar-monthly-schedule-grid.mjs',
  'scripts/timetable/manual-collect-nar-full-month.mjs',
]) {
  if (!start.includes(link)) errors.push(`START-HERE missing ${link}`);
}
if (errors.length) {
  errors.forEach((value) => console.error(`ERROR: ${value}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_PLAN_CURRENT: pass');
console.log('CURRENT_PHASE: incremental_coverage_implementation_and_operator_refactor');
console.log('ORDINARY_PARTIAL_PROMOTION_ALLOWED: true');
console.log('JULY_COMPLETION_AUDIT_SEPARATE: true');
console.log('PARTIAL_PROMOTION_THROUGH_2026_07_04: valid_not_complete');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');
