import { readFileSync, writeFileSync } from 'node:fs';

const file = 'scripts/check-calendar-operations-status.mjs';
let text = readFileSync(file, 'utf8');
const oldBlock = `const serialized = JSON.stringify(status).toLowerCase();
for (const forbidden of ['horse_name', 'jockey', 'trainer', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'sample_text', 'stream_url']) {
  if (serialized.includes(forbidden)) fail(\`operations status contains prohibited key fragment \${forbidden}.\`);
}`;
const newBlock = `const prohibitedKeyFragments = ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'sample_text', 'stream_url'];
function inspectKeys(value, location = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, location + '[' + index + ']'));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const fragment = prohibitedKeyFragments.find((item) => lower.includes(item));
    if (fragment) fail('operations status contains prohibited key ' + location + '.' + key + '.');
    inspectKeys(child, location + '.' + key);
  }
}
inspectKeys(status);`;
if (!text.includes(oldBlock)) throw new Error('Operations validator replacement marker missing.');
text = text.replace(oldBlock, newBlock);
writeFileSync(file, text);
console.log('CALENDAR_OPERATIONS_KEY_VALIDATION_FIX_APPLIED');
