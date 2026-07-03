import fs from 'node:fs';

const plan = fs.readFileSync('docs/calendar/nar-a-plus-pilot-plan.md', 'utf8');
const start = fs.readFileSync('START-HERE.md', 'utf8');
const required = [
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'all-14 racecourse compatibility audit',
  'Current phase: all-14 complete-meeting fixture collection',
  'Next phase: selected-month all-meeting collection and candidate review',
  'complete-meeting fixture coverage reaches 14/14',
  'WHR-CAL-JAPAN-BANEI-A-PLUS',
];
const errors = required.filter((value) => !plan.includes(value));
for (const link of [
  'docs/calendar/nar-a-plus-pilot-plan.md',
  'docs/calendar/nar-14-racecourse-compatibility-audit.md',
  'data/static/nar-flat-racecourse-compatibility-v1.json',
  'scripts/timetable/collect-nar-complete-fixtures.mjs',
]) {
  if (!start.includes(link)) errors.push(`START-HERE missing ${link}`);
}
if (errors.length) {
  errors.forEach((value) => console.error(`ERROR: ${value}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_PLAN_CURRENT: pass');
console.log('CURRENT_PHASE: all_14_complete_meeting_fixture_collection');
console.log('NEXT_PHASE: selected_month_all_meeting_collection');
