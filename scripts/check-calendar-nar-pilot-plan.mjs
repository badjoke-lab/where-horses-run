import fs from 'node:fs';

const errors = [];
const planPath = 'docs/calendar/nar-a-plus-pilot-plan.md';
const startPath = 'START-HERE.md';

if (!fs.existsSync(planPath)) errors.push(`missing ${planPath}`);
if (!fs.existsSync(startPath)) errors.push(`missing ${startPath}`);

if (errors.length === 0) {
  const plan = fs.readFileSync(planPath, 'utf8');
  const start = fs.readFileSync(startPath, 'utf8');
  for (const phrase of [
    'Status: active',
    'Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`',
    'Completed phases: source architecture; bounded fixture probe',
    'Current phase: candidate-only adapter',
    'Next phase: review and promotion',
    'Next Work ID after completion: `WHR-CAL-JAPAN-BANEI-A-PLUS`',
    'human-approved canonical promotion',
    'scheduling remains disabled',
  ]) {
    if (!plan.includes(phrase)) errors.push(`NAR pilot plan missing: ${phrase}`);
  }
  if (!start.includes('docs/calendar/nar-a-plus-pilot-plan.md')) errors.push('START-HERE does not link the NAR pilot plan.');
  if (!start.includes('docs/calendar/nar-fixture-probe.md')) errors.push('START-HERE does not link the NAR fixture probe.');
}

if (errors.length) {
  console.error(`CALENDAR_NAR_PILOT_PLAN: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_PILOT_PLAN: pass');
console.log('COMPLETED_PHASES: source_architecture,bounded_fixture_probe');
console.log('CURRENT_PHASE: candidate_only_adapter');
console.log('NEXT_PHASE: review_and_promotion');
