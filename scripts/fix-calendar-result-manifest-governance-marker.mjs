import fs from 'node:fs';

const file = 'docs/calendar/machine-readable-contracts.md';
const from = '## Implemented Collection Result Manifest\n\nEvery Collection Job result has a compact result summary containing:';
const to = '## Implemented Collection Result Manifest\n\nThe Collection Result Manifest schema, validation core, fixtures, validator, contract documentation, and dedicated CI are implemented.\n\nEvery Collection Job result has a compact result summary containing:';
const text = fs.readFileSync(file, 'utf8');
if (!text.includes(from)) throw new Error('Result Manifest governance marker anchor not found');
fs.writeFileSync(file, text.replace(from, to));
console.log('CALENDAR_RESULT_MANIFEST_GOVERNANCE_MARKER_FIXED');
