import fs from 'node:fs';

const file = 'scripts/check-calendar-collection-plan.mjs';
let text = fs.readFileSync(file, 'utf8');
const from = `const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of [
  'Stage ACP-5 — Collection Plan schema',
  'one JRA local Job and one NAR Actions Job in the same Plan',
  'one NAR and one HKJC Actions Job with different date windows',
  'one selected-meeting retry and one regular refresh in the same Plan',
  'one source error does not invalidate unrelated valid Jobs',
]) if (!implementationPlan.includes(phrase)) fail(\`control-plane implementation plan missing \${phrase}.\`);`;
const to = `const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');
for (const phrase of [
  'Stage ACP-5 — Collection Plan schema',
  'JRA local + NAR Actions in one plan',
  'NAR and HKJC Actions jobs with different date windows',
  'one regular refresh plus one selected-meeting retry',
]) if (!implementationPlan.includes(phrase)) fail(\`control-plane implementation plan missing \${phrase}.\`);
const planContract = readText('docs/calendar/collection-plan.md');
for (const phrase of ['A source error in one Job does not rewrite another Job outcome.', 'lower target rank in one Job must not downgrade another Job']) {
  if (!planContract.includes(phrase)) fail(\`Collection Plan contract missing \${phrase}.\`);
}`;
if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('Collection Plan validator marker block not found.');
  text = text.replace(from, to);
  fs.writeFileSync(file, text);
}
console.log('COLLECTION_PLAN_VALIDATOR_MARKERS_FIXED');
