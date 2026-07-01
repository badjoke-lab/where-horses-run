import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(file + ' missing marker');
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('docs/calendar/README.md', [
  ['- [`operations-v1-release-gate.md`](operations-v1-release-gate.md) — Operations v1 completion and JRA pilot boundary.\n', '- [`operations-v1-release-gate.md`](operations-v1-release-gate.md) — Operations v1 completion and JRA pilot boundary.\n- [`jra-pilot-foundation.md`](jra-pilot-foundation.md) — current JRA fixture review, blocker, and no-write pilot boundary.\n'],
  ['data/static/calendar-operations-seasonal-policy.json\n', 'data/static/calendar-operations-seasonal-policy.json\ndata/static/jra-pilot-control.json\n'],
  ['data/generated/timetable/operations-review-package.json\n', 'data/generated/timetable/operations-review-package.json\ndata/generated/timetable/jra-pilot-review.json\n'],
  ['scripts/check-calendar-operations-v1-release-gate.mjs\n```', 'scripts/check-calendar-operations-v1-release-gate.mjs\nscripts/check-jra-pilot-foundation.mjs\n```']
]);

let authority = readFileSync('docs/governance/document-authority.md', 'utf8');
authority = authority
  .replace('- `docs/calendar/operations-v1-release-gate.md`\n', '- `docs/calendar/operations-v1-release-gate.md`\n- `docs/calendar/jra-pilot-foundation.md`\n')
  .replace('- `data/static/calendar-operations-seasonal-policy.json`\n', '- `data/static/calendar-operations-seasonal-policy.json`\n- `data/static/jra-pilot-control.json`\n')
  .replace('- `data/generated/timetable/operations-review-package.json`\n', '- `data/generated/timetable/operations-review-package.json`\n- `data/generated/timetable/jra-pilot-review.json`\n')
  .replace('- `scripts/check-calendar-operations-v1-release-gate.mjs`\n', '- `scripts/check-calendar-operations-v1-release-gate.mjs`\n- `scripts/check-jra-pilot-foundation.mjs`\n');
const seen = new Set();
const cleaned = [];
for (const line of authority.split('\n')) {
  if (line.startsWith('- `')) {
    if (seen.has(line)) continue;
    seen.add(line);
  }
  cleaned.push(line);
}
writeFileSync('docs/governance/document-authority.md', cleaned.join('\n'));
console.log('JRA_PILOT_DOC_INDEX_APPLIED');
