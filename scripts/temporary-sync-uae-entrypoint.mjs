import fs from 'node:fs';

function replaceExact(file, before, after) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`${file}: expected source block not found`);
  fs.writeFileSync(file, original.replace(before, after));
}

replaceExact(
  'START-HERE.md',
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Current Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Next source-specific Work ID: \`WHR-CAL-UAE-ERA\``,
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Completed Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Current Work ID: \`WHR-CAL-UAE-ERA\`
Next programme Work ID: \`WHR-CAL-PUBLIC-V1\``
);

replaceExact(
  'START-HERE.md',
  `1. complete HKJC-PILOT-04 fixture route and parser resilience reconciliation
2. repeat bounded HKJC shared-Actions live evidence
3. explicitly review HKJC Registry activation boundary
4. keep HKJC detail-source/A+ programme-summary activation separate until evidence exists
5. hand off the source-specific sequence to WHR-CAL-UAE-ERA after HKJC review closure`,
  `1. confirm the reviewed UAE Calendar Readiness and official ERA season-calendar baseline
2. implement a bounded C-level UAE candidate generator with no-write artifact output
3. run source-specific fixture/parser evidence before any Acquisition Registry activation decision
4. explicitly review the UAE handoff boundary after bounded evidence
5. continue to WHR-CAL-PUBLIC-V1 only after the UAE source-specific boundary is reviewed`
);

replaceExact(
  'docs/project-roadmap.md',
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Current Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Next source-specific Work ID: \`WHR-CAL-UAE-ERA\`
Last reviewed: 2026-07-10`,
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Completed Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Current Work ID: \`WHR-CAL-UAE-ERA\`
Next programme Work ID: \`WHR-CAL-PUBLIC-V1\`
Last reviewed: 2026-07-11`
);

replaceExact(
  'docs/project-roadmap.md',
  'The NAR source pilot, Acquisition Control Plane foundation, and Banei bounded operational integration are complete. Banei handoff is accepted for manual reviewed steady-state operation. The current source-specific work is `WHR-CAL-HONG-KONG-HKJC`; `WHR-CAL-UAE-ERA` follows after the HKJC pilot handoff boundary is explicitly reviewed.',
  'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, and HKJC source-specific pilot handoff are complete. Banei and HKJC continue under their accepted reviewed operating boundaries. The current source-specific work is `WHR-CAL-UAE-ERA`; the next programme stage is `WHR-CAL-PUBLIC-V1` after the UAE source-specific handoff boundary is explicitly reviewed.'
);

replaceExact(
  'docs/calendar/implementation-roadmap.md',
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Current Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Next source-specific Work ID: \`WHR-CAL-UAE-ERA\``,
  `Completed Work ID: \`WHR-CAL-JAPAN-BANEI-A-PLUS\`
Completed Work ID: \`WHR-CAL-HONG-KONG-HKJC\`
Current Work ID: \`WHR-CAL-UAE-ERA\`
Next programme Work ID: \`WHR-CAL-PUBLIC-V1\``
);

console.log('UAE_ENTRYPOINT_SYNC: applied');
