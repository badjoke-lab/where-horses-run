import fs from 'node:fs';

const file = 'scripts/check-calendar-banei-bilingual-public-display-qa.mjs';
let text = fs.readFileSync(file, 'utf8');
const from = 'japan-banei-a-plus';
const to = 'banei-reviewed-a-plus';
if (!text.includes(from)) throw new Error(`policy marker missing: ${from}`);
text = text.replaceAll(from, to);
fs.writeFileSync(file, text);
console.log('BANEI_BILINGUAL_QA_POLICY_ID_UPDATED');
