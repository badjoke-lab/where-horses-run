import fs from 'node:fs';

function replacePattern(file, pattern, after, label) {
  const original = fs.readFileSync(file, 'utf8');
  if (!pattern.test(original)) throw new Error(`${file}: expected ${label} block not found`);
  fs.writeFileSync(file, original.replace(pattern, after));
}

replacePattern(
  'START-HERE.md',
  /Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`\r?\nCurrent Work ID: `WHR-CAL-HONG-KONG-HKJC`\r?\nNext source-specific Work ID: `WHR-CAL-UAE-ERA`/,
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Completed Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Current Work ID: \`WHR-CAL-UAE-ERA\`
Next programme Work ID: \`WHR-CAL-PUBLIC-V1\``,
  'current work'
);

replacePattern(
  'START-HERE.md',
  /## Active sequence\r?\n\r?\n```text\r?\n[\s\S]*?\r?\n```/,
  `## Active sequence

\`\`\`text
1. confirm the reviewed UAE Calendar Readiness and official ERA season-calendar baseline
2. implement a bounded C-level UAE candidate generator with no-write artifact output
3. run source-specific fixture/parser evidence before any Acquisition Registry activation decision
4. explicitly review the UAE handoff boundary after bounded evidence
5. continue to WHR-CAL-PUBLIC-V1 only after the UAE source-specific boundary is reviewed
\`\`\``,
  'active sequence'
);

replacePattern(
  'docs/project-roadmap.md',
  /Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`\r?\nCurrent Work ID: `WHR-CAL-HONG-KONG-HKJC`\r?\nNext source-specific Work ID: `WHR-CAL-UAE-ERA`\r?\nLast reviewed: 2026-07-10/,
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Completed Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Current Work ID: \`WHR-CAL-UAE-ERA\`
Next programme Work ID: \`WHR-CAL-PUBLIC-V1\`
Last reviewed: 2026-07-11`,
  'project roadmap entrypoint'
);

replacePattern(
  'docs/project-roadmap.md',
  /The NAR source pilot, Acquisition Control Plane foundation, and Banei bounded operational integration are complete\.[^\n]*HKJC[^\n]*UAE[^\n]*\./,
  'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, and HKJC source-specific pilot handoff are complete. Banei and HKJC continue under their accepted reviewed operating boundaries. The current source-specific work is `WHR-CAL-UAE-ERA`; the next programme stage is `WHR-CAL-PUBLIC-V1` after the UAE source-specific handoff boundary is explicitly reviewed.',
  'project roadmap current-position sentence'
);

replacePattern(
  'docs/calendar/implementation-roadmap.md',
  /Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`\r?\nCurrent Work ID: `WHR-CAL-HONG-KONG-HKJC`\r?\nNext source-specific Work ID: `WHR-CAL-UAE-ERA`/,
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Completed Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Current Work ID: \`WHR-CAL-UAE-ERA\`
Next programme Work ID: \`WHR-CAL-PUBLIC-V1\``,
  'implementation roadmap entrypoint'
);

console.log('UAE_ENTRYPOINT_SYNC: applied');
