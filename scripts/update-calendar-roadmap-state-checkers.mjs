import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'scripts/check-calendar-runner-compatibility.mjs',
  `const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');\nfor (const phrase of ['Runner-neutral compatibility foundation: complete.', 'Stage ACP-10 — Actions multi-job runner', 'Status: current.']) {\n  if (!implementationPlan.includes(phrase)) fail(\`control-plane implementation plan missing \${phrase}.\`);\n}`,
  `const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');\nfor (const phrase of ['Runner-neutral compatibility foundation: complete.', 'Stage ACP-10 — Actions multi-job runner']) {\n  if (!implementationPlan.includes(phrase)) fail(\`control-plane implementation plan missing \${phrase}.\`);\n}\nconst acp10Section = implementationPlan.split('## Stage ACP-10 — Actions multi-job runner')[1]?.split('## Stage ACP-11 — local multi-job runner')[0] ?? '';\nif (!acp10Section.includes('Status: complete.')) fail('control-plane implementation plan must mark ACP-10 complete.');`,
  'runner compatibility stage status',
);

replaceRequired(
  'scripts/check-calendar-local-multi-job.mjs',
  `const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');\nfor (const phrase of [\n  'Stage ACP-11 — local multi-job runner',\n  'Status: complete.',\n  'Stage ACP-12 — review cohort planner',\n  'Status: current.',\n]) {\n  if (!implementationPlan.includes(phrase)) fail(\`control-plane implementation plan missing \${phrase}.\`);\n}`,
  `const implementationPlan = readText('docs/calendar/acquisition-control-plane-implementation-plan.md');\nfor (const heading of [\n  'Stage ACP-11 — local multi-job runner',\n  'Stage ACP-12 — review cohort planner',\n]) {\n  if (!implementationPlan.includes(heading)) fail(\`control-plane implementation plan missing \${heading}.\`);\n}\nconst acp11Section = implementationPlan.split('## Stage ACP-11 — local multi-job runner')[1]?.split('## Stage ACP-12 — review cohort planner')[0] ?? '';\nconst acp12Section = implementationPlan.split('## Stage ACP-12 — review cohort planner')[1]?.split('## Stage ACP-13 — automatic review PR preparation')[0] ?? '';\nif (!acp11Section.includes('Status: complete.')) fail('control-plane implementation plan must mark ACP-11 complete.');\nif (!acp12Section.includes('Status: complete.')) fail('control-plane implementation plan must mark ACP-12 complete.');`,
  'local multi-job stage status',
);

replaceRequired(
  'scripts/check-calendar-operations-v1-release-gate.mjs',
  `  ['docs/project-roadmap.md', roadmap, ['Completed Work ID: \`WHR-CAL-OPS-V1\`', 'Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`', 'Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`', 'Next source-specific Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`', 'Incremental maintenance is normal']],\n  ['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Operations v1 status: complete', 'Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`', 'Current Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`', 'Next source Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`', 'Coverage Observation']]`,
  `  ['docs/project-roadmap.md', roadmap, ['Completed Work ID: \`WHR-CAL-OPS-V1\`', 'Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`', 'Completed Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`', 'Current Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`', 'Next source-specific Work ID: \`WHR-CAL-HONG-KONG-HKJC\`', 'Incremental maintenance is normal']],\n  ['docs/calendar/implementation-roadmap.md', implementationRoadmap, ['Operations v1 status: complete', 'Completed Work ID: \`WHR-CAL-JAPAN-NAR-A-PLUS\`', 'Completed Work ID: \`WHR-CAL-ACQUISITION-CONTROL-PLANE\`', 'Current Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`', 'Next source Work ID: \`WHR-CAL-HONG-KONG-HKJC\`', 'Coverage Observation']]`,
  'operations v1 roadmap markers',
);
replaceRequired(
  'scripts/check-calendar-operations-v1-release-gate.mjs',
  `console.log('COMPLETED_SOURCE_WORK_ID: WHR-CAL-JAPAN-NAR-A-PLUS');\nconsole.log('CURRENT_WORK_ID: WHR-CAL-ACQUISITION-CONTROL-PLANE');\nconsole.log('NEXT_SOURCE_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');`,
  `console.log('COMPLETED_SOURCE_WORK_ID: WHR-CAL-ACQUISITION-CONTROL-PLANE');\nconsole.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');\nconsole.log('NEXT_SOURCE_WORK_ID: WHR-CAL-HONG-KONG-HKJC');`,
  'operations v1 summary work IDs',
);

console.log('CALENDAR_ROADMAP_STATE_CHECKERS_UPDATED');
