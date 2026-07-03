import fs from 'node:fs';
const plan = fs.readFileSync('docs/calendar/nar-a-plus-pilot-plan.md', 'utf8');
const start = fs.readFileSync('START-HERE.md', 'utf8');
const required = [
  'WHR-CAL-JAPAN-NAR-A-PLUS',
  'candidate-only adapter',
  'Current phase: complete-meeting fixture',
  'Next phase: candidate review',
  'WHR-CAL-JAPAN-BANEI-A-PLUS'
];
const errors = required.filter((value) => !plan.includes(value));
if (!start.includes('docs/calendar/nar-candidate-adapter.md')) errors.push('candidate adapter link');
if (errors.length) {
  errors.forEach((value) => console.error(`ERROR: ${value}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_PLAN_CURRENT: pass');
