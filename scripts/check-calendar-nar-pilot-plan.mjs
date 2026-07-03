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
    'Next Work ID after completion: `WHR-CAL-JAPAN-BANEI-A-PLUS`',
    'bounded Urawa/Funabashi fixture probe',
    'candidate-only venue-aware adapter',
    'human promotion to canonical data',
    'scheduling remains disabled',
  ]) {
    if (!plan.includes(phrase)) errors.push(`NAR pilot plan missing: ${phrase}`);
  }
  if (!start.includes('docs/calendar/nar-a-plus-pilot-plan.md')) errors.push('START-HERE does not link the NAR pilot plan.');
}

if (errors.length) {
  console.error(`CALENDAR_NAR_PILOT_PLAN: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_PILOT_PLAN: pass');
console.log('CURRENT_PHASE: source_architecture');
console.log('NEXT_PHASE: bounded_fixture_probe');
