import fs from 'node:fs';

const file = 'scripts/check-project-governance-docs.mjs';
let text = fs.readFileSync(file, 'utf8');
const from = `  'Acquisition Registry schema + registry',`;
const to = `  'data/static/calendar-acquisition-registry.schema.json',\n  'data/static/calendar-acquisition-registry.json',`;
if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('governance Acquisition Registry planned marker not found');
  text = text.replace(from, to);
  fs.writeFileSync(file, text);
}
console.log('GOVERNANCE_ACQUISITION_REGISTRY_MARKERS_PATCHED');
