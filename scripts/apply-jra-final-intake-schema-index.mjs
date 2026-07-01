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
    '- [`jra-final-confirmation-contract.md`](jra-final-confirmation-contract.md) — final-program timing, comparison, review, and candidate-generation gate.\n',
    '- [`jra-final-confirmation-contract.md`](jra-final-confirmation-contract.md) — final-program timing, comparison, review, and candidate-generation gate.\n- [`jra-final-program-intake-schema.md`](jra-final-program-intake-schema.md) — closed final-input keys, safety boundaries, and structural validation.\n'
  ],
  [
    'data/static/jra-pilot-control.json\n',
    'data/static/jra-pilot-control.json\ndata/static/jra-final-program-intake.schema.json\n'
  ],
  [
    'scripts/check-jra-final-confirmation-contract.mjs\n',
    'scripts/check-jra-final-confirmation-contract.mjs\nscripts/check-jra-final-program-intake-schema.mjs\n'
  ]
]);

replace('docs/governance/document-authority.md', [
  [
    '- `docs/calendar/jra-final-confirmation-contract.md`\n',
    '- `docs/calendar/jra-final-confirmation-contract.md`\n- `docs/calendar/jra-final-program-intake-schema.md`\n'
  ],
  [
    '- `data/static/jra-pilot-control.json`\n',
    '- `data/static/jra-pilot-control.json`\n- `data/static/jra-final-program-intake.schema.json`\n'
  ],
  [
    '- `scripts/check-jra-final-confirmation-contract.mjs`\n',
    '- `scripts/check-jra-final-confirmation-contract.mjs`\n- `scripts/check-jra-final-program-intake-schema.mjs`\n'
  ]
]);

replace('docs/calendar/machine-readable-contracts.md', [
  [
    'data/static/authority-source-inventory.json\n',
    'data/static/authority-source-inventory.json\ndata/static/jra-final-program-intake.schema.json\n'
  ],
  [
    'scripts/check-authority-source-inventory-schema.mjs\n',
    'scripts/check-authority-source-inventory-schema.mjs\nscripts/check-jra-final-program-intake-schema.mjs\n'
  ],
  [
    '## Stable references\n',
    '## JRA final-program intake\n\n`data/static/jra-final-program-intake.schema.json` defines the closed input accepted before JRA final confirmation. The companion validator rejects unknown keys, invalid identity/date/time structures, duplicate meetings, unreviewed approval metadata, prohibited detail fields, and any claimed candidate/canonical/public write. No actual final fixture is committed by the schema foundation.\n\n## Stable references\n'
  ],
  [
    'node scripts/check-authority-source-inventory-schema.mjs\n',
    'node scripts/check-authority-source-inventory-schema.mjs\nnode scripts/check-jra-final-program-intake-schema.mjs\n'
  ]
]);

console.log('JRA_FINAL_INTAKE_SCHEMA_INDEX_APPLIED');
