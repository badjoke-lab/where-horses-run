import fs from 'node:fs';

const file = 'scripts/check-project-governance-docs.mjs';
let text = fs.readFileSync(file, 'utf8');
const from = `  'Collection Job schema',`;
const to = `  'data/static/calendar-collection-job.schema.json',`;
if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('governance Collection Job planned marker not found');
  text = text.replace(from, to);
  fs.writeFileSync(file, text);
}
console.log('GOVERNANCE_COLLECTION_JOB_MARKER_PATCHED');
