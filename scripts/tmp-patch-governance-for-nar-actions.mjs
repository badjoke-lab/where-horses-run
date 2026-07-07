import fs from 'node:fs';

const file = 'scripts/check-project-governance-docs.mjs';
let text = fs.readFileSync(file, 'utf8');

const replacements = [
  [
`  'Current Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`',
  'Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`',
  'Subsequent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`',
  'schedule-confirmed meetings: 82',
  'A+ detail candidates:         11',
  'C schedule candidates:        71',`,
`  'Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`',
  'Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`',
  'Next source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`',
  'schedule-confirmed meetings: 82',
  'A+ detail records:            11',
  'C schedule records:           71',
  'pending detail retries:       71',`,
  ],
  [
`  'Next Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`',
  'Subsequent Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`',`,
`  'Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`',
  'Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`',
  'ACP-1 — NAR formal workflow dispatch — complete',`,
  ],
  [
`  'formal workflow_dispatch operation: not yet canonical',`,
`  'formal workflow_dispatch operation: active',
  'immutable review artifact upload: active',`,
  ],
  [
`console.log('NAR_RUNNER_TARGET: github_actions primary / local fallback');
console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-NAR-A-PLUS');
console.log('NEXT_WORK_ID: WHR-CAL-ACQUISITION-CONTROL-PLANE');
console.log('SUBSEQUENT_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');`,
`console.log('NAR_ACTIONS_OPERATOR: active');
console.log('NAR_RUNNER_PROFILE: github_actions primary / local fallback');
console.log('COMPLETED_WORK_ID: WHR-CAL-JAPAN-NAR-A-PLUS');
console.log('CURRENT_WORK_ID: WHR-CAL-ACQUISITION-CONTROL-PLANE');
console.log('NEXT_SOURCE_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');`,
  ],
];

for (const [from, to] of replacements) {
  if (text.includes(to)) continue;
  if (!text.includes(from)) throw new Error(`governance validator source marker not found: ${from.slice(0, 80)}`);
  text = text.replace(from, to);
}

fs.writeFileSync(file, text);
console.log('GOVERNANCE_VALIDATOR_NAR_ACTIONS_STATE_PATCHED');
