import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from.slice(0, 100)}`);
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('docs/calendar/README.md', [
  [
    '- [`jra-pilot-foundation.md`](jra-pilot-foundation.md) — current JRA fixture review, blocker, and no-write pilot boundary.\n',
    '- [`jra-pilot-foundation.md`](jra-pilot-foundation.md) — current JRA fixture review, blocker, and no-write pilot boundary.\n- [`jra-planned-program-intake.md`](jra-planned-program-intake.md) — advance-program intake and final-confirmation boundary.\n- [`jra-final-confirmation-contract.md`](jra-final-confirmation-contract.md) — final-program timing, comparison, review, and candidate-generation gate.\n'
  ],
  [
    'data/generated/timetable/jra-pilot-review.json\n',
    'data/generated/timetable/jra-pilot-review.json\ndata/generated/timetable/jra-planned-program-intake.json\ndata/generated/timetable/jra-planned-program-review.json\n'
  ],
  [
    'scripts/check-jra-pilot-foundation.mjs\n```',
    'scripts/check-jra-pilot-foundation.mjs\nscripts/check-jra-planned-intake.mjs\nscripts/check-jra-final-confirmation-contract.mjs\n```'
  ]
]);

replace('docs/governance/document-authority.md', [
  [
    '- `docs/calendar/jra-pilot-foundation.md`\n',
    '- `docs/calendar/jra-pilot-foundation.md`\n- `docs/calendar/jra-planned-program-intake.md`\n- `docs/calendar/jra-final-confirmation-contract.md`\n'
  ],
  [
    '- `data/generated/timetable/jra-pilot-review.json`\n',
    '- `data/generated/timetable/jra-pilot-review.json`\n- `data/generated/timetable/jra-planned-program-intake.json`\n- `data/generated/timetable/jra-planned-program-review.json`\n'
  ],
  [
    '- `scripts/check-jra-pilot-foundation.mjs`\n',
    '- `scripts/check-jra-pilot-foundation.mjs`\n- `scripts/check-jra-planned-intake.mjs`\n- `scripts/check-jra-final-confirmation-contract.mjs`\n'
  ]
]);

console.log('JRA_FINAL_CONFIRMATION_INDEX_APPLIED');
