import fs from 'node:fs';

function replaceRequired(file, before, after) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${file}: required sync anchor missing`);
  fs.writeFileSync(file, current.replace(before, after));
}

replaceRequired(
  'docs/project-roadmap.md',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCompleted Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`'
);
replaceRequired(
  'docs/project-roadmap.md',
  'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, and HKJC source-specific pilot handoff are complete. Banei and HKJC continue under their accepted reviewed operating boundaries. The current source-specific work is `WHR-CAL-UAE-ERA`; the next programme stage is `WHR-CAL-PUBLIC-V1` after the UAE source-specific handoff boundary is explicitly reviewed.',
  'The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, HKJC source-specific pilot handoff, and UAE ERA source-specific sequence are complete. Banei, HKJC, and UAE continue under their accepted reviewed operating boundaries. UAE ERA handoff accepted for bounded manual reviewed steady-state operation. The next programme stage is `WHR-CAL-PUBLIC-V1`; the global Current Work ID switch remains a separate entrypoint synchronization step.'
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCompleted Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`'
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational handoff accepted; HKJC pilot current',
  'Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei, HKJC, and UAE ERA handoffs accepted; Calendar Public v1 entrypoint synchronization next'
);
replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Current Work ID: `WHR-CAL-HONG-KONG-HKJC`\nNext source Work ID: `WHR-CAL-UAE-ERA`',
  'Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`\nCompleted Work ID: `WHR-CAL-UAE-ERA`\nCurrent Work ID: `WHR-CAL-UAE-ERA`\nNext programme Work ID: `WHR-CAL-PUBLIC-V1`'
);
const implementation = fs.readFileSync('docs/calendar/implementation-roadmap.md', 'utf8');
if (!implementation.includes('## UAE ERA handoff gate')) {
  fs.appendFileSync('docs/calendar/implementation-roadmap.md', `\n\n## UAE ERA handoff gate\n\nUAE ERA handoff accepted for bounded manual reviewed steady-state operation.\n\nAccepted state:\n\n- provisional Acquisition Registry profile;\n- five approved venue identities;\n- C-only source-visible-horizon schedule path through GitHub Actions;\n- 64-record review-only evidence with source-window closure;\n- detail route, fallback runner, arbitrary date-window mode, selected-meeting mode, retry automation, automatic execution, approval, promotion, publication, canonical write, and public write remain disabled.\n\nNext programme Work ID: \`WHR-CAL-PUBLIC-V1\`. The global Current Work ID switch remains a separate entrypoint synchronization step.\n`);
}

replaceRequired(
  'docs/calendar/README.md',
  '- [`hkjc-handoff-decision.md`](hkjc-handoff-decision.md) — accepted bounded manual reviewed steady-state HKJC handoff, explicit non-claims, and next Work ID `WHR-CAL-UAE-ERA`.',
  '- [`hkjc-handoff-decision.md`](hkjc-handoff-decision.md) — accepted bounded manual reviewed steady-state HKJC handoff, explicit non-claims, and next Work ID `WHR-CAL-UAE-ERA`.\n- [`uae-era-handoff-decision.md`](uae-era-handoff-decision.md) — accepted bounded manual reviewed steady-state UAE ERA handoff, provisional C-only boundaries, and next Work ID `WHR-CAL-PUBLIC-V1`.'
);
replaceRequired(
  'docs/calendar/README.md',
  'data/audits/calendar-hkjc-handoff-decision-v1.json',
  'data/audits/calendar-hkjc-handoff-decision-v1.json\ndata/audits/calendar-uae-era-handoff-decision-v1.json'
);

console.log('UAE_HANDOFF_DOC_SYNC: applied');
