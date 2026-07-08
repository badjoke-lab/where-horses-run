import fs from 'node:fs';

const file = 'scripts/check-calendar-acquisition-registry.mjs';
let text = fs.readFileSync(file, 'utf8');
const from = `[machineContractPath, machineContract, ['Acquisition Registry schema + registry', 'japan-jra-system', 'japan-nar-system', 'japan-banei-system']]`;
const to = `[machineContractPath, machineContract, ['data/static/calendar-acquisition-registry.schema.json', 'data/static/calendar-acquisition-registry.json', 'japan-jra-system', 'japan-nar-system', 'japan-banei-system']]`;
if (!text.includes(to)) {
  if (!text.includes(from)) throw new Error('Acquisition Registry validator machine-contract marker not found.');
  text = text.replace(from, to);
  fs.writeFileSync(file, text);
}
console.log('ACQUISITION_REGISTRY_VALIDATOR_DOC_MARKERS_PATCHED');
