import fs from 'node:fs';

const plan = fs.readFileSync('docs/calendar/nar-a-plus-pilot-plan.md', 'utf8');
const start = fs.readFileSync('START-HERE.md', 'utf8');
const required = [
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'Required boundary: 2026-07-01 through 2026-07-31 inclusive',
  'Current phase: full-month schedule coverage and month-wide detail completion',
  'first reviewed A+ promotion through 2026-07-04',
  'valid partial data',
  'every July schedule date',
  'future scheduled meetings',
  'partial cutoff output never treated as monthly completion',
  'WHR-CAL-JAPAN-BANEI-A-PLUS',
];
const errors = required.filter((value) => !plan.includes(value));
for (const link of [
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
console.log('CURRENT_PHASE: full_month_schedule_and_detail_completion');
console.log('MONTH_BOUNDARY: 2026-07-01..2026-07-31');
console.log('PARTIAL_PROMOTION_THROUGH_2026_07_04: valid_not_complete');
console.log('NEXT_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');
