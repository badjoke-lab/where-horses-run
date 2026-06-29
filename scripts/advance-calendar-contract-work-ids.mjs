import fs from 'node:fs';

const file = 'scripts/check-calendar-contracts.mjs';
let text = fs.readFileSync(file, 'utf8');
const replacements = [
  ['Current Work ID: `WHR-ST2-69-76`', 'Current Work ID: `WHR-NOTE-69-76`'],
  ['Next Work ID: `WHR-NOTE-69-76`', 'Next Work ID: `WHR-PROFILE-69-76`'],
  ['CURRENT_WORK_ID: WHR-ST2-69-76', 'CURRENT_WORK_ID: WHR-NOTE-69-76'],
  ['NEXT_WORK_ID: WHR-NOTE-69-76', 'NEXT_WORK_ID: WHR-PROFILE-69-76']
];
for (const [from, to] of replacements) {
  if (!text.includes(from)) throw new Error('Missing required Calendar contract text: ' + from);
  text = text.replace(from, to);
}
fs.writeFileSync(file, text, 'utf8');
