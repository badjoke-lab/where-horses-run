import fs from 'node:fs';

const plan = fs.readFileSync('docs/calendar/nar-a-plus-pilot-plan.md', 'utf8');
const start = fs.readFileSync('START-HERE.md', 'utf8');
const incremental = fs.readFileSync('docs/calendar/incremental-coverage-contract.md', 'utf8');
const required = [
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'Status: source pilot publication complete; maintenance retries continue',
  'Current phase: Acquisition Control Plane integration and detail retries',
  'Reviewed NAR schedule coverage through 2026-07-31 is published',
  '71 C schedule records',
  'formal workflow_dispatch normal operation: active',
  'primary runner: github_actions',
  'fallback runner: local',
  'WHR-CAL-ACQUISITION-CONTROL-PLANE',
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
console.log('SOURCE_PILOT_PUBLICATION: complete');
console.log('PUBLISHED_SCHEDULE_COVERAGE_THROUGH: 2026-07-31');
console.log('PENDING_DETAIL_RETRIES: 71');
console.log('PRIMARY_RUNNER: github_actions');
console.log('FALLBACK_RUNNER: local');
console.log('CURRENT_WORK_ID: WHR-CAL-ACQUISITION-CONTROL-PLANE');
console.log('NEXT_SOURCE_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');
