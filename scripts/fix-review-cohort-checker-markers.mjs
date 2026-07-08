import fs from 'node:fs';

const file = 'scripts/check-calendar-review-cohort-planner.mjs';
let text = fs.readFileSync(file, 'utf8');
const replacements = [
  ["'source failure isolation'", "'Source failure isolation'"],
  ["'one campaign may produce several review proposals'", "'One campaign may produce several review proposals'"],
];
for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error(`required checker marker not found: ${from}`);
  text = text.replace(from, to);
}
fs.writeFileSync(file, text);
console.log('REVIEW_COHORT_CHECKER_MARKERS_FIXED');
