import fs from 'node:fs';

const file = 'scripts/final-audit-98/update-code.mjs';
const before = fs.readFileSync(file, 'utf8');
const after = before.replaceAll('\\\\`', '\\`');
if (after === before) throw new Error('Expected double-escaped backticks were not found.');
fs.writeFileSync(file, after);
console.log('FINAL_AUDIT_UPDATE_CODE_SOURCE_NORMALIZED');
