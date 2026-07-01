import { readFileSync, writeFileSync } from 'node:fs';

function replace(file, pairs) {
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!text.includes(from)) throw new Error(`${file} missing marker: ${from}`);
    text = text.replace(from, to);
  }
  writeFileSync(file, text);
}

replace('docs/calendar/README.md', [
  [
    '- [`jra-final-confirmation-contract.md`](jra-final-confirmation-contract.md) — final-program timing, comparison, review, and candidate-generation gate.\n',
    '- [`jra-final-confirmation-contract.md`](jra-final-confirmation-contract.md) — final-program timing, comparison, review, and candidate-generation gate.\n- [`jra-final-normalized-handoff.md`](jra-final-normalized-handoff.md) — approved-final to normalized meeting/detail review artifact.\n'
  ],
  [
    'scripts/check-jra-final-confirmation-contract.mjs\n```',
    'scripts/check-jra-final-confirmation-contract.mjs\nscripts/check-jra-final-normalized-handoff.mjs\n```'
  ]
]);

replace('docs/governance/document-authority.md', [
  [
    '- `docs/calendar/jra-final-confirmation-contract.md`\n',
    '- `docs/calendar/jra-final-confirmation-contract.md`\n- `docs/calendar/jra-final-normalized-handoff.md`\n'
  ],
  [
    '- `scripts/check-jra-final-confirmation-contract.mjs`\n',
    '- `scripts/check-jra-final-confirmation-contract.mjs`\n- `scripts/check-jra-final-normalized-handoff.mjs`\n'
  ]
]);

console.log('JRA_FINAL_HANDOFF_INDEX_APPLIED');
