import fs from 'node:fs';

function replaceRequired(file, from, to, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(from)) throw new Error(`${label}: marker missing`);
  fs.writeFileSync(file, text.replace(from, to));
}

replaceRequired(
  'docs/project-roadmap.md',
  'Current Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`\nNext source-specific Work ID: `WHR-CAL-HONG-KONG-HKJC`\nLast reviewed: 2026-07-09',
  'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`\nCurrent Work ID: `WHR-CAL-HONG-KONG-HKJC`\nNext source-specific Work ID: `WHR-CAL-UAE-ERA`\nLast reviewed: 2026-07-10',
  'project roadmap Work ID header',
);
replaceRequired(
  'docs/project-roadmap.md',
  'The NAR source pilot and Acquisition Control Plane foundation are complete. Banei A+ is the current source-specific work, now in operational integration after source, adapter, runner, retry, operator-view, manual operator, and proposal-only Queue reconciliation foundations were validated.',
  'The NAR source pilot, Acquisition Control Plane foundation, and Banei bounded operational integration are complete. Banei handoff is accepted for manual reviewed steady-state operation. The current source-specific work is `WHR-CAL-HONG-KONG-HKJC`; `WHR-CAL-UAE-ERA` follows after the HKJC pilot handoff boundary is explicitly reviewed.',
  'project roadmap current position narrative',
);

replaceRequired(
  'docs/calendar/implementation-roadmap.md',
  'Completed Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`\nCurrent Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`\nNext source-specific Work ID: `WHR-CAL-HONG-KONG-HKJC`',
  'Completed Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`\nCompleted Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`\nCurrent Work ID: `WHR-CAL-HONG-KONG-HKJC`\nNext source-specific Work ID: `WHR-CAL-UAE-ERA`',
  'implementation roadmap Work ID header',
);

replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  '- the shared control-plane foundation is complete and Banei is the active source-specific operational integration work.',
  '- the shared control-plane foundation and Banei bounded operational integration are complete; Banei handoff is accepted for manual reviewed steady-state operation and HKJC is the active source-specific pilot.',
  'ACP starting point current work',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  'Completed source-specific work:\n\n```text\nWHR-CAL-JAPAN-NAR-A-PLUS\n```',
  'Completed source-specific work:\n\n```text\nWHR-CAL-JAPAN-NAR-A-PLUS\nWHR-CAL-JAPAN-BANEI-A-PLUS\n```',
  'ACP completed source Work IDs',
);
replaceRequired(
  'docs/calendar/acquisition-control-plane-implementation-plan.md',
  'Current source-specific work:\n\n```text\nWHR-CAL-JAPAN-BANEI-A-PLUS\n```\n\nNext source-specific work:\n\n```text\nWHR-CAL-HONG-KONG-HKJC\n```',
  'Current source-specific work:\n\n```text\nWHR-CAL-HONG-KONG-HKJC\n```\n\nNext source-specific work:\n\n```text\nWHR-CAL-UAE-ERA\n```',
  'ACP current and next source Work IDs',
);

replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "  'docs/calendar/banei-a-plus-full-month-plan.md',",
  "  'docs/calendar/banei-a-plus-full-month-plan.md',\n  'docs/calendar/banei-handoff-decision.md',\n  'data/static/calendar-banei-handoff-decision.schema.json',\n  'data/static/calendar-banei-handoff-decision-v1.json',\n  'scripts/check-calendar-banei-handoff-decision.mjs',",
  'governance required Banei handoff files',
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "  'Current Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Next source-specific Work ID: `WHR-CAL-HONG-KONG-HKJC`',",
  "  'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Current Work ID: `WHR-CAL-HONG-KONG-HKJC`',\n  'Next source-specific Work ID: `WHR-CAL-UAE-ERA`',",
  'governance project roadmap Work IDs',
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "  'Status: active operational integration.',",
  "  'Status: handoff accepted; manual reviewed steady-state operation.',\n  'Banei handoff accepted',",
  'governance Banei project status',
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "  'Current Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Next source Work ID: `WHR-CAL-HONG-KONG-HKJC`',",
  "  'Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`',\n  'Current Work ID: `WHR-CAL-HONG-KONG-HKJC`',\n  'Next source-specific Work ID: `WHR-CAL-UAE-ERA`',",
  'governance implementation roadmap Work IDs',
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "  'Banei A+ — active operational integration',",
  "  'Banei handoff decision accepted',\n  'WHR-CAL-HONG-KONG-HKJC',",
  'governance implementation Banei handoff marker',
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "  'Current source-specific work:',\n  'WHR-CAL-JAPAN-BANEI-A-PLUS'",
  "  'Current source-specific work:',\n  'WHR-CAL-HONG-KONG-HKJC',\n  'WHR-CAL-UAE-ERA'",
  'governance ACP current source work',
);
replaceRequired(
  'scripts/check-project-governance-docs.mjs',
  "console.log('CURRENT_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');\nconsole.log('NEXT_SOURCE_WORK_ID: WHR-CAL-HONG-KONG-HKJC');",
  "console.log('COMPLETED_WORK_ID: WHR-CAL-JAPAN-BANEI-A-PLUS');\nconsole.log('CURRENT_WORK_ID: WHR-CAL-HONG-KONG-HKJC');\nconsole.log('NEXT_SOURCE_WORK_ID: WHR-CAL-UAE-ERA');",
  'governance checker output Work IDs',
);

console.log('BANEI_HANDOFF_WORK_ID_TRANSITION_UPDATED');
