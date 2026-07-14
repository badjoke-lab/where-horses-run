import fs from 'node:fs';

const block = (...lines) => lines.join('\n');

const replaceOnce = (text, search, replacement, label) => {
  if (!text.includes(search)) throw new Error(`${label}: expected source text not found`);
  return text.replace(search, replacement);
};

const update = (file, transform) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${file}: no change produced`);
  fs.writeFileSync(file, after);
};

update('scripts/check-calendar-public-v1-surface-audit.mjs', (input) => replaceOnce(
  input,
  block(
    'for (const marker of [',
    "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
    "  'audit Calendar, Today, and Tomorrow',",
    "]) requireIncludes(startHere, marker, 'START-HERE.md');",
    'for (const marker of [',
    "  '## Stage 11 — Calendar public v1',",
    "  'Status: active current programme work',",
    "  'Work ID: `WHR-CAL-PUBLIC-V1`',",
    "]) requireIncludes(roadmap, marker, 'implementation-roadmap.md');",
  ),
  block(
    'const activePublicV1Entrypoint =',
    "  startHere.includes('Current Work ID: `WHR-CAL-PUBLIC-V1`') &&",
    "  startHere.includes('audit Calendar, Today, and Tomorrow');",
    'const completedPublicV1Entrypoint =',
    "  startHere.includes('Completed Work ID: `WHR-CAL-PUBLIC-V1`') &&",
    "  startHere.includes('Current Work ID: `WHR-RACECOURSE-PAGES-V1`') &&",
    "  startHere.includes('Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`');",
    "if (!activePublicV1Entrypoint && !completedPublicV1Entrypoint) fail('START-HERE.md does not retain an active or completed Public v1 entrypoint.');",
    '',
    'const activePublicV1Roadmap =',
    "  roadmap.includes('## Stage 11 — Calendar public v1') &&",
    "  roadmap.includes('Status: active current programme work') &&",
    "  roadmap.includes('Work ID: `WHR-CAL-PUBLIC-V1`');",
    'const completedPublicV1Roadmap =',
    "  roadmap.includes('## Stage 11 — Calendar public v1') &&",
    "  roadmap.includes('Status: complete') &&",
    "  roadmap.includes('Completed Work ID: `WHR-CAL-PUBLIC-V1`') &&",
    "  roadmap.includes('Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`') &&",
    "  roadmap.includes('Current Work ID: `WHR-RACECOURSE-PAGES-V1`');",
    "if (!activePublicV1Roadmap && !completedPublicV1Roadmap) fail('implementation-roadmap.md does not retain an active or completed Public v1 stage.');",
  ),
  'surface-audit lifecycle compatibility',
));

update('scripts/check-calendar-public-v1-operations-presentation.mjs', (input) => replaceOnce(
  input,
  block(
    'for (const marker of [',
    "  'Current Work ID: `WHR-CAL-PUBLIC-V1`',",
    "  'Completed implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`',",
    "  'Current implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01`',",
    "]) requireIncludes(roadmap, marker, 'implementation-roadmap.md');",
  ),
  block(
    'const activeOperationsPresentationStage =',
    "  roadmap.includes('Current Work ID: `WHR-CAL-PUBLIC-V1`') &&",
    "  roadmap.includes('Completed implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`') &&",
    "  roadmap.includes('Current implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01`');",
    'const completedOperationsPresentationStage =',
    "  roadmap.includes('Completed Work ID: `WHR-CAL-PUBLIC-V1`') &&",
    "  roadmap.includes('Completed implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01`') &&",
    "  roadmap.includes('Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`') &&",
    "  roadmap.includes('Current Work ID: `WHR-RACECOURSE-PAGES-V1`');",
    "if (!activeOperationsPresentationStage && !completedOperationsPresentationStage) fail('implementation-roadmap.md does not retain an active or completed operations-presentation stage.');",
  ),
  'operations-presentation lifecycle compatibility',
));

console.log('CALENDAR_PUBLIC_V1_VALIDATOR_TRANSITION_APPLIED');
